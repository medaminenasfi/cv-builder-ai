export type UserRole = 'user' | 'admin';
export type UserPlan = 'free' | 'pro';
export type UserLocale = 'en' | 'fr' | 'ar';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  plan: UserPlan;
  locale: UserLocale;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  locale?: UserLocale;
}
