'use client';

import { useEffect } from 'react';
import { useAuth } from './AuthProvider';
import type { UserLocale } from '@/lib/types/auth';

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.locale) return;
    document.documentElement.lang = user.locale;
    document.documentElement.dir = user.locale === 'ar' ? 'rtl' : 'ltr';
    document.cookie = `resumeai-locale=${user.locale};path=/;max-age=31536000;samesite=lax`;
  }, [user?.locale]);

  return <>{children}</>;
}

export function setLocaleCookie(locale: UserLocale) {
  document.cookie = `resumeai-locale=${locale};path=/;max-age=31536000;samesite=lax`;
}
