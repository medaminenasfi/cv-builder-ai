export interface CVData {
  meta: {
    locale: 'en' | 'fr' | 'ar';
    direction: 'ltr' | 'rtl';
    tone?: 'professional' | 'creative' | 'technical' | 'academic';
    sections: string[];
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
}

export function newCvId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyCVData(locale: 'en' | 'fr' | 'ar' = 'en'): CVData {
  return {
    meta: {
      locale,
      direction: locale === 'ar' ? 'rtl' : 'ltr',
      sections: ['summary', 'experience', 'education', 'skills'],
    },
    personal: { fullName: '', title: '', email: '' },
    experience: [],
    education: [],
    skills: [],
  };
}

type ExperienceEntry = CVData['experience'][number];
type EducationEntry = CVData['education'][number];
type SkillEntry = CVData['skills'][number];

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
  if (typeof raw === 'string') {
    return { id: newCvId(), name: raw.trim() };
  }
  const s = (raw && typeof raw === 'object' ? raw : {}) as Partial<SkillEntry>;
  const name =
    typeof s.name === 'string'
      ? s.name
      : typeof (s as { skill?: string }).skill === 'string'
        ? (s as { skill: string }).skill
        : '';
  return {
    id: s.id || newCvId(),
    name,
    level: s.level,
  };
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
    meta: { ...base.meta, ...(partial.meta ?? {}) },
    personal,
    summary: partial.summary ?? '',
    experience: Array.isArray(partial.experience)
      ? partial.experience.map(normalizeExperience)
      : [],
    education: Array.isArray(partial.education)
      ? partial.education.map(normalizeEducation)
      : [],
    skills: Array.isArray(partial.skills)
      ? partial.skills.map(normalizeSkill).filter((s) => s.name.trim())
      : [],
  };
}

export const FREE_CV_LIMIT = 3;
