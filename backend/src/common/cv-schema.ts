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

export const FREE_CV_LIMIT = 3;
