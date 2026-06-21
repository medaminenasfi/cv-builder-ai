import { apiFetch, apiFetchAdmin } from './api';

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
  return apiFetchAdmin<Template[]>('/admin/templates');
}

export function createTemplate(data: Partial<Template>) {
  return apiFetchAdmin<Template>('/admin/templates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateTemplate(id: string, data: Partial<Template>) {
  return apiFetchAdmin<Template>(`/admin/templates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function toggleTemplate(id: string) {
  return apiFetchAdmin<Template>(`/admin/templates/${id}/toggle`, { method: 'PATCH' });
}

export function deleteTemplate(id: string) {
  return apiFetchAdmin<void>(`/admin/templates/${id}`, { method: 'DELETE' });
}

export function previewActiveTemplate(id: string, rtl = false) {
  return apiFetch<{ html: string }>(`/templates/${id}/preview?rtl=${rtl}`);
}

export function previewTemplate(id: string, rtl = false) {
  return apiFetchAdmin<{ html: string }>(`/admin/templates/${id}/preview?rtl=${rtl}`);
}

export interface TemplateImportResult {
  name: string;
  slug?: string;
  htmlStructure: string;
  css: string;
  supportsRtl: boolean;
  confidence: { overall: number; layout: number; styling: number };
  notes?: string;
}

export function importTemplateFromFile(file: File) {
  const form = new FormData();
  form.append('file', file);
  return apiFetchAdmin<TemplateImportResult>('/admin/templates/import', {
    method: 'POST',
    body: form,
  });
}
