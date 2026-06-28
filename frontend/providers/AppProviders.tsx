'use client';

import { AuthProvider } from './AuthProvider';
import { LocaleProvider } from './LocaleProvider';
import { QueryProvider } from './QueryProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <LocaleProvider>{children}</LocaleProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
