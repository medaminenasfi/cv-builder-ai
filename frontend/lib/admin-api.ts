import { apiFetchAdmin, apiFetchPublic } from './api';

export interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalCvs: number;
  activeTemplates: number;
  timestamp: string;
}

export interface PlanStats {
  totalUsers: number;
  freeUsers: number;
  proUsers: number;
  payingUsers: number;
  nonPayingUsers: number;
  conversionRate: number;
  estimatedMrr: number;
  currency: string;
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
  return apiFetchAdmin<AdminStats>('/admin/stats');
}

export function getPlanStats() {
  return apiFetchAdmin<PlanStats>('/admin/plans/stats');
}

export function listUsers(page = 1, limit = 20, plan?: 'free' | 'pro') {
  const planQuery = plan ? `&plan=${plan}` : '';
  return apiFetchAdmin<{ items: AdminUser[]; total: number; page: number; limit: number }>(
    `/admin/users?page=${page}&limit=${limit}${planQuery}`,
  );
}

export function updateUserPlan(id: string, plan: 'free' | 'pro') {
  return apiFetchAdmin(`/admin/users/${id}/plan`, {
    method: 'PATCH',
    body: JSON.stringify({ plan }),
  });
}

export function updateUserRole(id: string, role: 'user' | 'admin') {
  return apiFetchAdmin(`/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export function updateUserBlock(id: string, isBlocked: boolean) {
  return apiFetchAdmin(`/admin/users/${id}/block`, {
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
