export type CvLocale = 'en' | 'fr' | 'ar';

const ARABIC_RE = /[\u0600-\u06FF]/;
const FRENCH_MARKERS =
  /\b(expérience|formation|compétences|langues|profil|diplôme|aujourd'hui|présent|études|parcours)\b/i;
const ENGLISH_MARKERS =
  /\b(experience|education|skills|languages|profile|employment|summary|present|university)\b/i;

export function detectLocaleFromText(text: string, fallback: CvLocale = 'en'): CvLocale {
  const sample = text.slice(0, 12000);
  const arabicChars = (sample.match(ARABIC_RE) ?? []).length;
  const latinChars = (sample.match(/[a-zA-ZÀ-ÿ]/g) ?? []).length;

  if (arabicChars > 40 && arabicChars > latinChars * 0.15) {
    return 'ar';
  }

  const frHits = (sample.match(FRENCH_MARKERS) ?? []).length;
  const enHits = (sample.match(ENGLISH_MARKERS) ?? []).length;

  if (frHits > enHits + 1) return 'fr';
  if (enHits > frHits + 1) return 'en';

  return fallback;
}

export function localeToDirection(locale: CvLocale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}
