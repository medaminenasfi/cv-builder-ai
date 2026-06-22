import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  setSession,
  type SessionScope,
} from './auth-storage';
import type { AuthResponse } from './types/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api';

function parseJsonBody<T>(text: string, status: number): T {
  const trimmed = text.trim();
  if (!trimmed) {
    return undefined as T;
  }
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    throw new ApiError(`Invalid JSON response (${status})`, status);
  }
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  return parseJsonBody<T>(text, response.status);
}

function formatApiErrorMessage(data: unknown, status: number): string {
  if (typeof data === 'object' && data !== null && 'message' in data) {
    const msg = (data as { message: unknown }).message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
  }
  return `Request failed (${status})`;
}

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

const refreshPromises: Partial<Record<SessionScope, Promise<string | null>>> = {};

async function refreshAccessToken(scope: SessionScope): Promise<string | null> {
  const refreshToken = getRefreshToken(scope);
  if (!refreshToken) return null;

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearSession(scope);
    return null;
  }

  const data = await readJsonResponse<AuthResponse>(response);
  if (!data?.accessToken) {
    clearSession(scope);
    return null;
  }
  setSession(scope, data.accessToken, data.refreshToken, data.user.role);
  return data.accessToken;
}

async function getValidAccessToken(scope: SessionScope): Promise<string | null> {
  const token = getAccessToken(scope);
  if (token) return token;

  if (!refreshPromises[scope]) {
    refreshPromises[scope] = refreshAccessToken(scope).finally(() => {
      delete refreshPromises[scope];
    });
  }

  return refreshPromises[scope] ?? null;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  scope: SessionScope = 'user',
  retry = true,
): Promise<T> {
  const token = await getValidAccessToken(scope);

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
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

  if (response.status === 401 && retry && getRefreshToken(scope)) {
    const newToken = await refreshAccessToken(scope);
    if (newToken) {
      return apiFetch<T>(path, options, scope, false);
    }
  }

  if (!response.ok) {
    let data: unknown;
    try {
      const text = await response.text();
      data = text.trim() ? parseJsonBody(text, response.status) : undefined;
    } catch {
      data = undefined;
    }
    const message = formatApiErrorMessage(data, response.status);
    throw new ApiError(message, response.status, data);
  }

  return readJsonResponse<T>(response);
}

export async function apiFetchBlob(
  path: string,
  options: RequestInit = {},
  scope: SessionScope = 'user',
  retry = true,
): Promise<Blob> {
  const token = await getValidAccessToken(scope);

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
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

  if (response.status === 401 && retry && getRefreshToken(scope)) {
    const newToken = await refreshAccessToken(scope);
    if (newToken) {
      return apiFetchBlob(path, options, scope, false);
    }
  }

  if (!response.ok) {
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = undefined;
    }
    const message = formatApiErrorMessage(data, response.status);
    throw new ApiError(message, response.status, data);
  }

  return response.blob();
}

/** Admin API calls — uses admin session only */
export function apiFetchAdmin<T>(path: string, options: RequestInit = {}, retry = true) {
  return apiFetch<T>(path, options, 'admin', retry);
}

export function apiFetchAdminBlob(path: string, options: RequestInit = {}, retry = true) {
  return apiFetchBlob(path, options, 'admin', retry);
}

export async function apiFetchPublic<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
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
      const text = await response.text();
      data = text.trim() ? parseJsonBody(text, response.status) : undefined;
    } catch {
      data = undefined;
    }
    const message = formatApiErrorMessage(data, response.status);
    throw new ApiError(message, response.status, data);
  }

  return readJsonResponse<T>(response);
}
