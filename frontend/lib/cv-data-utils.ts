import type { CVData, CVExperience, CVEducation, CVSkill, CVLocale } from './types/cv-data';

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
      sections: ['summary', 'experience', 'education', 'skills'],
    },
    personal: { fullName: '', title: '', email: '' },
    experience: [],
    education: [],
    skills: [],
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

function normalizeSkill(raw: unknown): CVSkill {
  if (typeof raw === 'string') {
    return { id: newId(), name: raw.trim() };
  }
  const s = (raw && typeof raw === 'object' ? raw : {}) as Partial<CVSkill>;
  const name =
    typeof s.name === 'string'
      ? s.name
      : typeof (s as { skill?: string }).skill === 'string'
        ? (s as { skill: string }).skill
        : '';
  return {
    id: s.id || newId(),
    name,
    level: s.level,
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

export function parseSkillsInput(text: string): CVData['skills'] {
  return text
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({ id: newId(), name }));
}

export function skillsToInput(skills: CVData['skills'] | undefined): string {
  return (skills ?? []).map((s) => s.name).join(', ');
}
