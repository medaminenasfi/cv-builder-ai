'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import * as authApi from '@/lib/auth-api';
import {
  hasSession,
  migrateLegacySession,
  type SessionScope,
} from '@/lib/auth-storage';
import type { LoginPayload, RegisterPayload, User } from '@/lib/types/auth';

interface AuthContextValue {
  /** User-portal account (separate session) */
  user: User | null;
  /** Admin-portal account (separate session) */
  adminUser: User | null;
  isLoading: boolean;
  hasUserSession: boolean;
  hasAdminSession: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  loginAsAdmin: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  logoutAdmin: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  /** Client-only — avoids hydration mismatch (localStorage unavailable on server) */
  const [hasUserSession, setHasUserSession] = useState(false);
  const [hasAdminSession, setHasAdminSession] = useState(false);
  const router = useRouter();

  const syncSessionFlags = useCallback(() => {
    setHasUserSession(hasSession('user'));
    setHasAdminSession(hasSession('admin'));
  }, []);

  const refreshUser = useCallback(async () => {
    if (!hasSession('user')) {
      setUser(null);
      setHasUserSession(false);
      return;
    }
    try {
      setUser(await authApi.getMeUser());
      setHasUserSession(true);
    } catch {
      setUser(null);
      setHasUserSession(false);
    }
  }, []);

  const refreshAdmin = useCallback(async () => {
    if (!hasSession('admin')) {
      setAdminUser(null);
      setHasAdminSession(false);
      return;
    }
    try {
      setAdminUser(await authApi.getMeAdmin());
      setHasAdminSession(true);
    } catch {
      setAdminUser(null);
      setHasAdminSession(false);
    }
  }, []);

  useEffect(() => {
    migrateLegacySession();
    syncSessionFlags();
    Promise.all([refreshUser(), refreshAdmin()]).finally(() => setIsLoading(false));
  }, [refreshUser, refreshAdmin, syncSessionFlags]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      try {
        const data = await authApi.loginUser(payload);
        setUser(data.user);
        setHasUserSession(true);
        router.push('/dashboard');
      } catch (e) {
        if (e instanceof Error) throw e;
        throw new Error('Login failed');
      }
    },
    [router],
  );

  const loginAsAdmin = useCallback(
    async (payload: LoginPayload) => {
      const data = await authApi.loginAdmin(payload);
      setAdminUser(data.user);
      setHasAdminSession(true);
      router.push('/admin');
    },
    [router],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const data = await authApi.registerUser(payload);
      setUser(data.user);
      setHasUserSession(true);
      router.push('/dashboard');
    },
    [router],
  );

  const logout = useCallback(async () => {
    await authApi.logoutUser();
    setUser(null);
    setHasUserSession(false);
    router.push('/login');
  }, [router]);

  const logoutAdmin = useCallback(async () => {
    await authApi.logoutAdmin();
    setAdminUser(null);
    setHasAdminSession(false);
    router.push('/admin/login');
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      adminUser,
      isLoading,
      hasUserSession,
      hasAdminSession,
      login,
      loginAsAdmin,
      register,
      logout,
      logoutAdmin,
      refreshUser,
      refreshAdmin,
    }),
    [
      user,
      adminUser,
      isLoading,
      hasUserSession,
      hasAdminSession,
      login,
      loginAsAdmin,
      register,
      logout,
      logoutAdmin,
      refreshUser,
      refreshAdmin,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

/** Active account on user pages */
export function useDisplayPlan(): 'free' | 'pro' {
  const { user } = useAuth();
  return user?.plan ?? 'free';
}

/** Which session the current route uses */
export function useActiveScope(): SessionScope {
  const pathname = usePathname();
  return pathname.startsWith('/admin') ? 'admin' : 'user';
}
