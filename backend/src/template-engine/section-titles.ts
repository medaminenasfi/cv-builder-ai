export const SECTION_TITLES: Record<string, Record<'en' | 'fr' | 'ar', string>> = {
  summary: { en: 'Summary', fr: 'Profil', ar: 'الملخص' },
  experience: { en: 'Experience', fr: 'Expérience', ar: 'الخبرة' },
  education: { en: 'Education', fr: 'Formation', ar: 'التعليم' },
  skills: { en: 'Skills', fr: 'Compétences', ar: 'المهارات' },
  languages: { en: 'Languages', fr: 'Langues', ar: 'اللغات' },
  technologies: { en: 'Technologies', fr: 'Technologies', ar: 'التقنيات' },
  certifications: { en: 'Certifications', fr: 'Certifications', ar: 'الشهادات' },
  projects: { en: 'Projects', fr: 'Projets', ar: 'المشاريع' },
};

export function sectionTitle(key: string, locale: string): string {
  const loc = (locale === 'fr' || locale === 'ar' ? locale : 'en') as 'en' | 'fr' | 'ar';
  return SECTION_TITLES[key]?.[loc] ?? SECTION_TITLES[key]?.en ?? key;
}

export function formatDateRange(start: string, end?: string | 'present'): string {
  const endLabel = end === 'present' ? 'Présent' : (end ?? '');
  return endLabel ? `${start} – ${endLabel}` : start;
}
