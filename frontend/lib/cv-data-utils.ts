import type {
  CVData,
  CVExperience,
  CVEducation,
  CVSkill,
  CVLanguage,
  CVTechnology,
  CVCertification,
  CVProject,
  CVLocale,
} from './types/cv-data';

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

export function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyCVData(locale: CVLocale = 'en'): CVData {
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

function normalizeExperience(raw: unknown): CVExperience {
  const e = (raw && typeof raw === 'object' ? raw : {}) as Partial<CVExperience> & {
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
  const bulletSources = [e.bullets, e.responsibilities, e.highlights, e.achievements];
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
    id: e.id || newId(),
    company: e.company ?? e.employer ?? e.organization ?? '',
    role: e.role ?? e.position ?? e.jobTitle ?? '',
    startDate: e.startDate ?? '',
    endDate: e.endDate ?? 'present',
    bullets,
  };
}

function normalizeEducation(raw: unknown): CVEducation {
  const e = (raw && typeof raw === 'object' ? raw : {}) as Partial<CVEducation> & {
    school?: string;
    university?: string;
    diploma?: string;
  };
  return {
    id: e.id || newId(),
    institution: e.institution ?? e.school ?? e.university ?? '',
    degree: e.degree ?? e.diploma ?? '',
    startDate: e.startDate ?? '',
    endDate: e.endDate ?? '',
  };
}

function normalizeNamed(raw: unknown, withLevel = false): { id: string; name: string; level?: string } {
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (withLevel && trimmed.includes('—')) {
      const [name, level] = trimmed.split('—').map((s) => s.trim());
      return { id: newId(), name: name || trimmed, level: level || undefined };
    }
    return { id: newId(), name: trimmed };
  }
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const name =
    typeof o.name === 'string'
      ? o.name
      : typeof o.language === 'string'
        ? o.language
        : '';
  return {
    id: typeof o.id === 'string' ? o.id : newId(),
    name: String(name).trim(),
    level: typeof o.level === 'string' ? o.level : undefined,
  };
}

function normalizeSkill(raw: unknown): CVSkill {
  const item = normalizeNamed(raw, true);
  return { id: item.id, name: item.name, level: item.level };
}

function normalizeLanguage(raw: unknown): CVLanguage {
  const item = normalizeNamed(raw, true);
  return { id: item.id, name: item.name, level: item.level };
}

function normalizeTechnology(raw: unknown): CVTechnology {
  const item = normalizeNamed(raw);
  return { id: item.id, name: item.name };
}

function normalizeCertification(raw: unknown): CVCertification {
  if (typeof raw === 'string') return { id: newId(), name: raw.trim() };
  const e = (raw && typeof raw === 'object' ? raw : {}) as Partial<CVCertification>;
  return {
    id: e.id || newId(),
    name: e.name ?? '',
    issuer: e.issuer,
    date: e.date,
  };
}

function normalizeProject(raw: unknown): CVProject {
  const e = (raw && typeof raw === 'object' ? raw : {}) as Partial<CVProject> & { title?: string };
  return {
    id: e.id || newId(),
    name: e.name ?? e.title ?? '',
    description: e.description,
    bullets: Array.isArray(e.bullets) ? e.bullets.map(String).filter(Boolean) : [],
  };
}

/** Merge stored/partial/AI-parsed data with safe defaults for the editor. */
export function normalizeCVData(raw: unknown, locale: CVLocale = 'en'): CVData {
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
      sections: partial.meta?.sections?.length ? partial.meta.sections : base.meta.sections,
    },
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
    languages: Array.isArray(partial.languages)
      ? partial.languages.map(normalizeLanguage).filter((l) => l.name.trim())
      : [],
    technologies: Array.isArray(partial.technologies)
      ? partial.technologies.map(normalizeTechnology).filter((t) => t.name.trim())
      : [],
    certifications: Array.isArray(partial.certifications)
      ? partial.certifications.map(normalizeCertification).filter((c) => c.name.trim())
      : [],
    projects: Array.isArray(partial.projects)
      ? partial.projects.map(normalizeProject).filter((p) => p.name.trim())
      : [],
  };
}

export function parseTagInput(text: string): Array<{ id: string; name: string }> {
  return text
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({ id: newId(), name }));
}

export function parseSkillsInput(text: string): CVData['skills'] {
  return parseTagInput(text);
}

export function skillsToInput(skills: CVData['skills'] | undefined): string {
  return (skills ?? []).map((s) => s.name).join(', ');
}

export function parseTechnologiesInput(text: string): CVData['technologies'] {
  return parseTagInput(text);
}

export function technologiesToInput(technologies: CVData['technologies'] | undefined): string {
  return (technologies ?? []).map((t) => t.name).join(', ');
}

/** Format: "French — Fluent" one per line or comma */
export function parseLanguagesInput(text: string): CVLanguage[] {
  return text
    .split(/\n/)
    .flatMap((line) => line.split(/,(?![^(]*\))/))
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const dash = entry.match(/^(.+?)\s*[—–-]\s*(.+)$/);
      if (dash) {
        return { id: newId(), name: dash[1].trim(), level: dash[2].trim() };
      }
      return { id: newId(), name: entry };
    });
}

export function languagesToInput(languages: CVData['languages'] | undefined): string {
  return (languages ?? [])
    .map((l) => (l.level ? `${l.name} — ${l.level}` : l.name))
    .join('\n');
}

/** Format: "AWS Solutions Architect — Amazon — 2023" one per line */
export function parseCertificationsInput(text: string): CVCertification[] {
  return text
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s*[—–|]\s*/).map((p) => p.trim());
      return {
        id: newId(),
        name: parts[0] ?? line,
        issuer: parts[1] || undefined,
        date: parts[2] || undefined,
      };
    });
}

export function certificationsToInput(certs: CVData['certifications'] | undefined): string {
  return (certs ?? [])
    .map((c) => [c.name, c.issuer, c.date].filter(Boolean).join(' — '))
    .join('\n');
}

/** Format: "Project name | description" then bullet lines prefixed with "- " */
export function parseProjectsInput(text: string): CVProject[] {
  const blocks = text.split(/\n(?=[^\s-])/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((block) => {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const header = lines[0] ?? '';
    const pipe = header.match(/^(.+?)\s*[|—–-]\s*(.+)$/);
    const bullets = lines
      .slice(1)
      .map((l) => l.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean);
    return {
      id: newId(),
      name: pipe ? pipe[1].trim() : header,
      description: pipe ? pipe[2].trim() : undefined,
      bullets,
    };
  }).filter((p) => p.name);
}

export function projectsToInput(projects: CVData['projects'] | undefined): string {
  return (projects ?? [])
    .map((p) => {
      const header = p.description ? `${p.name} — ${p.description}` : p.name;
      const bullets = (p.bullets ?? []).map((b) => `- ${b}`).join('\n');
      return bullets ? `${header}\n${bullets}` : header;
    })
    .join('\n\n');
}
