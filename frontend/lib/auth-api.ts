import { apiFetch, apiFetchPublic } from './api';
import { clearTokens, setTokens } from './auth-storage';
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from './types/auth';

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const data = await apiFetchPublic<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const data = await apiFetchPublic<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function logout(): Promise<void> {
  const refreshToken =
    typeof window !== 'undefined'
      ? localStorage.getItem('cv_refresh_token')
      : null;

  try {
    await apiFetchPublic<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  } finally {
    clearTokens();
  }
}

export async function getMe(): Promise<User> {
  return apiFetch<User>('/auth/me');
}
