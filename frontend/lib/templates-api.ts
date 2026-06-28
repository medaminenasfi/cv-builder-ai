import { apiFetch, apiFetchAdmin, apiFetchBlob, apiFetchAdminBlob } from './api';
import { ensurePdfBlob } from './pdf-blob';

export interface Template {
  id: string;
  slug: string;
  name: string;
  engine: 'latex' | 'html';
  latexSource: string | null;
  thumbnailUrl: string | null;
  isActive: boolean;
  supportsRtl: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BundledTemplateResult {
  name: string;
  slug: string;
  latexSource: string;
  supportsRtl: boolean;
  notes: string;
}

export const LATEX_PLACEHOLDERS = [
  '{{fullName}}',
  '{{title}}',
  '{{email}}',
  '{{phone}}',
  '{{location}}',
  '{{linkedin}}',
  '{{website}}',
  '{{contactLine}}',
  '{{summary}}',
  '{{experience}}',
  '{{education}}',
  '{{skills}}',
  '{{languages}}',
  '{{technologies}}',
  '{{certifications}}',
  '{{projects}}',
  '{{summaryTitle}}',
  '{{experienceTitle}}',
  '{{educationTitle}}',
  '{{skillsTitle}}',
  '{{languagesTitle}}',
  '{{technologiesTitle}}',
  '{{certificationsTitle}}',
  '{{projectsTitle}}',
] as const;

export const DEFAULT_LATEX_TEMPLATE = String.raw`\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[french]{babel}
\usepackage[margin=2cm]{geometry}
\usepackage{hyperref}
\usepackage{enumitem}
\begin{document}
\begin{center}
  {\LARGE\textbf{{{fullName}}}}\\[4pt]
  {{title}}\\[2pt]
  {{contactLine}}
\end{center}
\section*{{{summaryTitle}}}
{{summary}}
\section*{{{experienceTitle}}}
{{experience}}
\section*{{{skillsTitle}}}
{{skills}}
\end{document}`;

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

export async function previewActiveTemplatePdf(id: string, rtl = false): Promise<Blob> {
  const blob = await apiFetchBlob(`/templates/${id}/preview.pdf?rtl=${rtl}`);
  return ensurePdfBlob(blob);
}

export async function previewTemplatePdf(id: string, rtl = false): Promise<Blob> {
  const blob = await apiFetchAdminBlob(`/admin/templates/${id}/preview.pdf?rtl=${rtl}`);
  return ensurePdfBlob(blob);
}

export async function compileLatex(tex: string): Promise<Blob> {
  const blob = await apiFetchAdminBlob('/admin/templates/latex/compile', {
    method: 'POST',
    body: JSON.stringify({ tex }),
  });
  return ensurePdfBlob(blob);
}

export function listBundledTemplates() {
  return apiFetchAdmin<{ slug: string; name: string; supportsRtl: boolean }[]>(
    '/admin/templates/bundled',
  );
}

export function loadBundledTemplate(slug: string) {
  return apiFetchAdmin<BundledTemplateResult>(`/admin/templates/bundled/${slug}/load`, {
    method: 'POST',
  });
}
