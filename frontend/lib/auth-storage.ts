/** Dual sessions — admin and user can be logged in at the same time */

export type SessionScope = 'user' | 'admin';

const SESSION = {
  user: {
    access: 'cv_user_access_token',
    refresh: 'cv_user_refresh_token',
    cookie: 'cv_user_access_token',
    role: 'cv_user_role',
  },
  admin: {
    access: 'cv_admin_access_token',
    refresh: 'cv_admin_refresh_token',
    cookie: 'cv_admin_access_token',
    role: 'cv_admin_role',
  },
} as const;

const LEGACY_ACCESS = 'cv_access_token';
const LEGACY_REFRESH = 'cv_refresh_token';
const LEGACY_COOKIE = 'cv_access_token';

function cookieSet(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function cookieClear(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

/** One-time cleanup of old single-session storage */
export function migrateLegacySession(): void {
  if (typeof window === 'undefined') return;
  const legacy = localStorage.getItem(LEGACY_ACCESS);
  if (!legacy) return;
  if (!localStorage.getItem(SESSION.user.access) && !localStorage.getItem(SESSION.admin.access)) {
    localStorage.removeItem(LEGACY_ACCESS);
    localStorage.removeItem(LEGACY_REFRESH);
  }
  cookieClear(LEGACY_COOKIE);
  cookieClear('cv_user_role');
  cookieClear('cv_portal');
}

export function getAccessToken(scope: SessionScope): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION[scope].access);
}

export function getRefreshToken(scope: SessionScope): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION[scope].refresh);
}

export function hasSession(scope: SessionScope): boolean {
  return Boolean(getAccessToken(scope) || getRefreshToken(scope));
}

export function setSession(
  scope: SessionScope,
  accessToken: string,
  refreshToken: string,
  role: string,
): void {
  localStorage.setItem(SESSION[scope].access, accessToken);
  localStorage.setItem(SESSION[scope].refresh, refreshToken);
  cookieSet(SESSION[scope].cookie, accessToken, 15 * 60);
  cookieSet(SESSION[scope].role, role, 7 * 24 * 60 * 60);
}

export function clearSession(scope: SessionScope): void {
  localStorage.removeItem(SESSION[scope].access);
  localStorage.removeItem(SESSION[scope].refresh);
  cookieClear(SESSION[scope].cookie);
  cookieClear(SESSION[scope].role);
}

export function clearAllSessions(): void {
  clearSession('user');
  clearSession('admin');
  localStorage.removeItem(LEGACY_ACCESS);
  localStorage.removeItem(LEGACY_REFRESH);
  cookieClear(LEGACY_COOKIE);
  cookieClear('cv_portal');
}

/** @deprecated use getAccessToken(scope) */
export function getAccessTokenLegacy(): string | null {
  return getAccessToken('user') ?? getAccessToken('admin');
}
