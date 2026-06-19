export type CVLocale = 'en' | 'fr' | 'ar';

export interface CVExperience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate?: string | 'present';
  bullets: string[];
}

export interface CVEducation {
  id: string;
  institution: string;
  degree: string;
  startDate: string;
  endDate?: string;
}

export interface CVSkill {
  id: string;
  name: string;
  level?: string;
}

export interface CVData {
  meta: {
    locale: CVLocale;
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
  experience: CVExperience[];
  education: CVEducation[];
  skills: CVSkill[];
}
