import { apiFetch } from './api';

export interface Template {
  id: string;
  slug: string;
  name: string;
  htmlStructure: string;
  css: string;
  thumbnailUrl: string | null;
  isActive: boolean;
  supportsRtl: boolean;
  createdAt: string;
  updatedAt: string;
}

export function listActiveTemplates() {
  return apiFetch<Template[]>('/templates');
}

export function listAllTemplates() {
  return apiFetch<Template[]>('/admin/templates');
}

export function createTemplate(data: Partial<Template>) {
  return apiFetch<Template>('/admin/templates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateTemplate(id: string, data: Partial<Template>) {
  return apiFetch<Template>(`/admin/templates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function toggleTemplate(id: string) {
  return apiFetch<Template>(`/admin/templates/${id}/toggle`, { method: 'PATCH' });
}

export function deleteTemplate(id: string) {
  return apiFetch<void>(`/admin/templates/${id}`, { method: 'DELETE' });
}

export function previewTemplate(id: string, rtl = false) {
  return apiFetch<{ html: string }>(`/admin/templates/${id}/preview?rtl=${rtl}`);
}
