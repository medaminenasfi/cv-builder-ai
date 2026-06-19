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

/** Merge stored/partial data with defaults so placeholders always render */
export function normalizeCVData(
  raw: unknown,
  locale: 'en' | 'fr' | 'ar' = 'en',
): CVData {
  const base = emptyCVData(locale);
  if (!raw || typeof raw !== 'object') return base;

  const partial = raw as Partial<CVData>;
  return {
    meta: { ...base.meta, ...(partial.meta ?? {}) },
    personal: { ...base.personal, ...(partial.personal ?? {}) },
    summary: partial.summary ?? base.summary,
    experience: Array.isArray(partial.experience) ? partial.experience : base.experience,
    education: Array.isArray(partial.education) ? partial.education : base.education,
    skills: Array.isArray(partial.skills) ? partial.skills : base.skills,
  };
}

export const FREE_CV_LIMIT = 3;
