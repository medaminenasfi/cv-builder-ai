import { apiFetch, apiFetchPublic } from './api';

export interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalCvs: number;
  activeTemplates: number;
  timestamp: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  plan: string;
  locale: string;
  isBlocked: boolean;
  createdAt: string;
}

export function getStats() {
  return apiFetch<AdminStats>('/admin/stats');
}

export function listUsers(page = 1, limit = 20) {
  return apiFetch<{ items: AdminUser[]; total: number; page: number; limit: number }>(
    `/admin/users?page=${page}&limit=${limit}`,
  );
}

export function updateUserPlan(id: string, plan: 'free' | 'pro') {
  return apiFetch(`/admin/users/${id}/plan`, {
    method: 'PATCH',
    body: JSON.stringify({ plan }),
  });
}

export function updateUserRole(id: string, role: 'user' | 'admin') {
  return apiFetch(`/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export function updateUserBlock(id: string, isBlocked: boolean) {
  return apiFetch(`/admin/users/${id}/block`, {
    method: 'PATCH',
    body: JSON.stringify({ isBlocked }),
  });
}

export function bootstrapAdmin(data: {
  email: string;
  password: string;
  setupSecret: string;
}) {
  return apiFetchPublic('/admin/bootstrap', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
