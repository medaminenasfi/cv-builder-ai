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

export function isCvResumeJson(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const o = data as Record<string, unknown>;
  if (typeof o.htmlStructure === 'string' && typeof o.css === 'string') return false;
  return Boolean(
    o.personal_info ||
      o.profile ||
      (Array.isArray(o.experience) && o.experience.length > 0) ||
      (o.personal && typeof o.personal === 'object'),
  );
}

export function listBundledTemplates() {
  return apiFetchAdmin<{ slug: string; name: string; supportsRtl: boolean }[]>(
    '/admin/templates/bundled',
  );
}

export function loadBundledTemplate(slug: string) {
  return apiFetchAdmin<TemplateImportResult>(`/admin/templates/bundled/${slug}/load`, {
    method: 'POST',
  });
}

export async function importTemplateFromJson(file: File) {
  const text = await file.text();
  return importTemplateJsonText(text);
}

export function importTemplateJsonText(text: string) {
  return apiFetchAdmin<TemplateImportResult>('/admin/templates/import/json/text', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export function importTemplateFromHtmlCss(htmlFile: File, cssFile: File, name?: string) {
  const form = new FormData();
  form.append('html', htmlFile);
  form.append('css', cssFile);
  if (name?.trim()) form.append('name', name.trim());
  return apiFetchAdmin<TemplateImportResult>('/admin/templates/import/package', {
    method: 'POST',
    body: form,
  });
}

export const TEMPLATE_JSON_EXAMPLE = {
  name: 'My Template',
  slug: 'my-template',
  htmlStructure: `<div class="cv-root">
  <h1>{{fullName}}</h1>
  <p>{{contactLine}}</p>
  <section>{{summary}}</section>
  <section>{{experience}}</section>
  <section>{{skills}}</section>
</div>`,
  css: `.cv-root { font-family: sans-serif; max-width: 800px; margin: 0 auto; }`,
  supportsRtl: false,
} as const;
