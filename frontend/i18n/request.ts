import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

const locales = ['en', 'fr', 'ar'] as const;
type AppLocale = (typeof locales)[number];

function isAppLocale(value: string | undefined): value is AppLocale {
  return locales.includes(value as AppLocale);
}

export default getRequestConfig(async () => {
  const jar = await cookies();
  const fromCookie = jar.get('resumeai-locale')?.value;
  const locale: AppLocale = isAppLocale(fromCookie) ? fromCookie : 'en';
  const messages = (await import(`../messages/${locale}.json`)).default;
  return { locale, messages };
});
