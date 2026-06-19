import { apiFetch, apiFetchPublic } from './api';
import {
  clearSession,
  getRefreshToken,
  setSession,
  type SessionScope,
} from './auth-storage';
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from './types/auth';

async function authLogin(payload: LoginPayload): Promise<AuthResponse> {
  return apiFetchPublic<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function authLogout(scope: SessionScope): Promise<void> {
  const refreshToken = getRefreshToken(scope);
  try {
    await apiFetchPublic<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  } finally {
    clearSession(scope);
  }
}

/** User portal login — does NOT affect admin session */
export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const data = await authLogin(payload);
  if (data.user.role === 'admin') {
    throw new Error('Admin accounts must use /admin/login');
  }
  setSession('user', data.accessToken, data.refreshToken, data.user.role);
  return data;
}

/** Admin portal login — does NOT affect user session */
export async function loginAdmin(payload: LoginPayload): Promise<AuthResponse> {
  const data = await authLogin(payload);
  if (data.user.role !== 'admin') {
    throw new Error('This account is not an administrator');
  }
  setSession('admin', data.accessToken, data.refreshToken, data.user.role);
  return data;
}

export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  const data = await apiFetchPublic<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setSession('user', data.accessToken, data.refreshToken, data.user.role);
  return data;
}

export function logoutUser() {
  return authLogout('user');
}

export function logoutAdmin() {
  return authLogout('admin');
}

export function getMeUser() {
  return apiFetch<User>('/auth/me', {}, 'user');
}

export function getMeAdmin() {
  return apiFetch<User>('/auth/me', {}, 'admin');
}

/** @deprecated use loginUser */
export const login = loginUser;
/** @deprecated use registerUser */
export const register = registerUser;
/** @deprecated use logoutUser */
export const logout = logoutUser;
/** @deprecated use getMeUser */
export const getMe = getMeUser;
