'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import * as authApi from '@/lib/auth-api';
import { getAccessToken } from '@/lib/auth-storage';
import type { LoginPayload, RegisterPayload, User } from '@/lib/types/auth';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      return;
    }
    try {
      const me = await authApi.getMe();
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const data = await authApi.login(payload);
      setUser(data.user);
      router.push('/dashboard');
    },
    [router],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const data = await authApi.register(payload);
      setUser(data.user);
      router.push('/dashboard');
    },
    [router],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    router.push('/login');
  }, [router]);

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout, refreshUser }),
    [user, isLoading, login, register, logout, refreshUser],
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
