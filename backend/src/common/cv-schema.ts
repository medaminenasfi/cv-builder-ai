export interface CVLanguage {
  id: string;
  name: string;
  level?: string;
}

export interface CVTechnology {
  id: string;
  name: string;
}

export interface CVCertification {
  id: string;
  name: string;
  issuer?: string;
  date?: string;
}

export interface CVProject {
  id: string;
  name: string;
  description?: string;
  bullets?: string[];
}

export interface CVData {
  meta: {
    locale: 'en' | 'fr' | 'ar';
    direction: 'ltr' | 'rtl';
    tone?: 'professional' | 'creative' | 'technical' | 'academic';
    sections: string[];
    parseMeta?: Record<string, unknown>;
  };
  personal: {
    fullName: string;
    title: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    website?: string;
  };
  summary?: string;
  experience: Array<{
    id: string;
    company: string;
    role: string;
    startDate: string;
    endDate?: string | 'present';
    bullets: string[];
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    startDate: string;
    endDate?: string;
  }>;
  skills: Array<{ id: string; name: string; level?: string }>;
  languages: CVLanguage[];
  technologies: CVTechnology[];
  certifications: CVCertification[];
  projects: CVProject[];
}

export const DEFAULT_SECTIONS = [
  'summary',
  'experience',
  'education',
  'skills',
  'languages',
  'technologies',
  'certifications',
  'projects',
] as const;

export function newCvId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyCVData(locale: 'en' | 'fr' | 'ar' = 'en'): CVData {
  return {
    meta: {
      locale,
      direction: locale === 'ar' ? 'rtl' : 'ltr',
      sections: [...DEFAULT_SECTIONS],
    },
    personal: { fullName: '', title: '', email: '' },
    experience: [],
    education: [],
    skills: [],
    languages: [],
    technologies: [],
    certifications: [],
    projects: [],
  };
}

type ExperienceEntry = CVData['experience'][number];
type EducationEntry = CVData['education'][number];
type SkillEntry = CVData['skills'][number];

function normalizeNamedItem(
  raw: unknown,
  levelKey = false,
): { id: string; name: string; level?: string } {
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (levelKey && trimmed.includes('—')) {
      const [name, level] = trimmed.split('—').map((s) => s.trim());
      return { id: newCvId(), name: name || trimmed, level: level || undefined };
    }
    if (levelKey && trimmed.includes('-')) {
      const [name, level] = trimmed.split('-').map((s) => s.trim());
      if (level && level.length < 20) {
        return { id: newCvId(), name: name || trimmed, level };
      }
    }
    return { id: newCvId(), name: trimmed };
  }
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const name =
    typeof o.name === 'string'
      ? o.name
      : typeof o.language === 'string'
        ? o.language
        : typeof o.label === 'string'
          ? o.label
          : '';
  return {
    id: typeof o.id === 'string' ? o.id : newCvId(),
    name: name.trim(),
    level: typeof o.level === 'string' ? o.level : undefined,
  };
}

function normalizeExperience(raw: unknown): ExperienceEntry {
  const e = (raw && typeof raw === 'object' ? raw : {}) as Partial<ExperienceEntry> & {
    description?: string;
    employer?: string;
    organization?: string;
    position?: string;
    jobTitle?: string;
    responsibilities?: string[];
    highlights?: string[];
    achievements?: string[];
  };
  let bullets: string[] = [];
  const bulletSources = [
    e.bullets,
    e.responsibilities,
    e.highlights,
    e.achievements,
  ];
  for (const src of bulletSources) {
    if (Array.isArray(src) && src.length) {
      bullets = src.map(String).filter((b) => b.trim());
      break;
    }
  }
  if (!bullets.length && typeof e.description === 'string' && e.description.trim()) {
    bullets = [e.description.trim()];
  }
  return {
    id: e.id || newCvId(),
    company: e.company ?? e.employer ?? e.organization ?? '',
    role: e.role ?? e.position ?? e.jobTitle ?? '',
    startDate: e.startDate ?? '',
    endDate: e.endDate ?? 'present',
    bullets,
  };
}

function normalizeEducation(raw: unknown): EducationEntry {
  const e = (raw && typeof raw === 'object' ? raw : {}) as Partial<EducationEntry> & {
    school?: string;
    university?: string;
    diploma?: string;
  };
  return {
    id: e.id || newCvId(),
    institution: e.institution ?? e.school ?? e.university ?? '',
    degree: e.degree ?? e.diploma ?? '',
    startDate: e.startDate ?? '',
    endDate: e.endDate ?? '',
  };
}

function normalizeSkill(raw: unknown): SkillEntry {
  const item = normalizeNamedItem(raw, true);
  return { id: item.id, name: item.name, level: item.level };
}

function normalizeTechnology(raw: unknown): CVTechnology {
  const item = normalizeNamedItem(raw);
  return { id: item.id, name: item.name };
}

function normalizeLanguage(raw: unknown): CVLanguage {
  const item = normalizeNamedItem(raw, true);
  return { id: item.id, name: item.name, level: item.level };
}

function normalizeCertification(raw: unknown): CVCertification {
  const e = (raw && typeof raw === 'object' ? raw : {}) as Partial<CVCertification>;
  if (typeof raw === 'string') {
    return { id: newCvId(), name: raw.trim() };
  }
  return {
    id: e.id || newCvId(),
    name: e.name ?? '',
    issuer: e.issuer,
    date: e.date,
  };
}

function normalizeProject(raw: unknown): CVProject {
  const e = (raw && typeof raw === 'object' ? raw : {}) as Partial<CVProject> & {
    title?: string;
    responsibilities?: string[];
  };
  let bullets: string[] = [];
  if (Array.isArray(e.bullets)) {
    bullets = e.bullets.map(String).filter((b) => b.trim());
  } else if (Array.isArray(e.responsibilities)) {
    bullets = e.responsibilities.map(String).filter((b) => b.trim());
  }
  return {
    id: e.id || newCvId(),
    name: e.name ?? e.title ?? '',
    description: e.description,
    bullets,
  };
}

function normalizeArray<T>(
  raw: unknown,
  normalizer: (item: unknown) => T,
  filter: (item: T) => boolean,
): T[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizer).filter(filter);
}

/** Merge stored/partial/AI-parsed data with defaults so placeholders always render */
export function normalizeCVData(
  raw: unknown,
  locale: 'en' | 'fr' | 'ar' = 'en',
): CVData {
  const base = emptyCVData(locale);
  if (!raw || typeof raw !== 'object') return base;

  const partial = raw as Partial<CVData>;
  const personal =
    partial.personal && typeof partial.personal === 'object'
      ? {
          ...base.personal,
          ...partial.personal,
          fullName: partial.personal.fullName ?? '',
          title: partial.personal.title ?? '',
          email: partial.personal.email ?? '',
        }
      : base.personal;

  return {
    meta: {
      ...base.meta,
      ...(partial.meta ?? {}),
      sections: partial.meta?.sections?.length
        ? partial.meta.sections
        : base.meta.sections,
    },
    personal,
    summary: partial.summary ?? '',
    experience: normalizeArray(
      partial.experience,
      normalizeExperience,
      (e) => Boolean(e.role || e.company || e.bullets.length),
    ),
    education: normalizeArray(
      partial.education,
      normalizeEducation,
      (e) => Boolean(e.institution || e.degree),
    ),
    skills: normalizeArray(
      partial.skills,
      normalizeSkill,
      (s) => Boolean(s.name.trim()),
    ),
    languages: normalizeArray(
      partial.languages,
      normalizeLanguage,
      (l) => Boolean(l.name.trim()),
    ),
    technologies: normalizeArray(
      partial.technologies,
      normalizeTechnology,
      (t) => Boolean(t.name.trim()),
    ),
    certifications: normalizeArray(
      partial.certifications,
      normalizeCertification,
      (c) => Boolean(c.name.trim()),
    ),
    projects: normalizeArray(
      partial.projects,
      normalizeProject,
      (p) => Boolean(p.name.trim() || p.description || p.bullets?.length),
    ),
  };
}

export const FREE_CV_LIMIT = 3;
