import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from './auth-storage';
import type { AuthResponse } from './types/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearTokens();
    return null;
  }

  const data = (await response.json()) as AuthResponse;
  setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

async function getValidAccessToken(): Promise<string | null> {
  const token = getAccessToken();
  if (token) return token;

  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = await getValidAccessToken();

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && retry && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch<T>(path, options, false);
    }
  }

  if (!response.ok) {
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = undefined;
    }
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : `Request failed (${response.status})`;
    throw new ApiError(message, response.status, data);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function apiFetchPublic<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = undefined;
    }
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      Array.isArray((data as { message: unknown }).message)
        ? ((data as { message: string[] }).message).join(', ')
        : typeof data === 'object' &&
            data !== null &&
            'message' in data &&
            typeof (data as { message: unknown }).message === 'string'
          ? (data as { message: string }).message
          : `Request failed (${response.status})`;
    throw new ApiError(message, response.status, data);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
