import type { CVData, CVLocale } from './types/cv-data';

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

export function normalizeCVData(raw: unknown, locale: CVLocale = 'en'): CVData {
  const base = emptyCVData(locale);
  if (!raw || typeof raw !== 'object') return base;

  const partial = raw as Partial<CVData>;
  return {
    meta: { ...base.meta, ...(partial.meta ?? {}) },
    personal: { ...base.personal, ...(partial.personal ?? {}) },
    summary: partial.summary ?? '',
    experience: Array.isArray(partial.experience) ? partial.experience : [],
    education: Array.isArray(partial.education) ? partial.education : [],
    skills: Array.isArray(partial.skills) ? partial.skills : [],
  };
}

export function parseSkillsInput(text: string): CVData['skills'] {
  return text
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({ id: newId(), name }));
}

export function skillsToInput(skills: CVData['skills']): string {
  return skills.map((s) => s.name).join(', ');
}
