import { apiFetch } from './api';
import type { CVData } from './types/cv-data';

export interface CV {
  id: string;
  userId: string;
  templateId: string | null;
  title: string;
  locale: string;
  jobTitleTarget: string | null;
  createdAt: string;
  updatedAt: string;
  data?: Record<string, unknown>;
}

export interface CVVersion {
  id: string;
  cvId: string;
  versionNumber: number;
  data: Record<string, unknown>;
  source: string;
  createdAt: string;
}

export interface AtsMatchResult {
  score: number;
  breakdown: {
    keywords: number;
    format: number;
    sections: number;
    experience: number;
  };
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  gaps?: string[];
  analysisMode?: 'ai' | 'keyword';
}

export interface JobEnhanceResult {
  before: CVData;
  after: CVData;
  addedKeywords: string[];
  missingKeywords: string[];
}

export interface EnhanceResult {
  before: CVData;
  after: CVData;
  tone: string;
  sections: string[];
  message: string;
}

export function listCVs() {
  return apiFetch<CV[]>('/cvs');
}

export function createCV(data: { title: string; templateId?: string; locale?: string }) {
  return apiFetch<CV>('/cvs', { method: 'POST', body: JSON.stringify(data) });
}

export function getCV(id: string) {
  return apiFetch<CV>(`/cvs/${id}`);
}

export function updateCV(id: string, data: Partial<CV>) {
  return apiFetch<CV>(`/cvs/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function updateCVData(id: string, data: Record<string, unknown>) {
  return apiFetch<CVVersion>(`/cvs/${id}/data`, {
    method: 'PATCH',
    body: JSON.stringify({ data }),
  });
}

export function duplicateCV(id: string) {
  return apiFetch<CV>(`/cvs/${id}/duplicate`, { method: 'POST' });
}

export function deleteCV(id: string) {
  return apiFetch<void>(`/cvs/${id}`, { method: 'DELETE' });
}

export function getVersions(id: string) {
  return apiFetch<CVVersion[]>(`/cvs/${id}/versions`);
}

export function importCV(title: string, rawText: string) {
  return apiFetch<{ cvId: string; message: string }>('/cvs/import', {
    method: 'POST',
    body: JSON.stringify({ title, rawText }),
  });
}

export function importCVFile(file: File, title?: string) {
  const form = new FormData();
  form.append('file', file);
  if (title) form.append('title', title);
  return apiFetch<{ cvId: string; message: string }>('/cvs/import/file', {
    method: 'POST',
    body: form,
  });
}

/** Parse PDF/DOCX and replace content on an existing CV (editor import). */
export function importCVFileIntoExisting(cvId: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  return apiFetch<{ cvId: string; message: string }>(`/cvs/${cvId}/import/file`, {
    method: 'POST',
    body: form,
  });
}

export function enhanceCV(id: string, sections: string[], tone: string) {
  return apiFetch<EnhanceResult>(`/cvs/${id}/enhance`, {
    method: 'POST',
    body: JSON.stringify({ sections, tone }),
  });
}

export function applyEnhancement(id: string, data: Record<string, unknown>) {
  return apiFetch<{ applied: boolean }>(`/cvs/${id}/enhance/apply`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export function exportCVHtml(id: string) {
  return apiFetch<{ html: string }>(`/cvs/${id}/export/html`);
}

export function previewCV(
  id: string,
  payload?: { data?: Record<string, unknown>; templateId?: string | null },
) {
  return apiFetch<{ html: string }>(`/cvs/${id}/preview`, {
    method: 'POST',
    body: JSON.stringify(payload ?? {}),
  });
}

export function shareCV(id: string) {
  return apiFetch<{ token: string; url: string }>(`/cvs/${id}/share`, { method: 'POST' });
}

export function matchJob(id: string, jobDescription: string, jobTitle?: string) {
  return apiFetch<AtsMatchResult>(`/cvs/${id}/jobs/match`, {
    method: 'POST',
    body: JSON.stringify({ jobDescription, jobTitle }),
  });
}

export function enhanceForJob(
  id: string,
  jobDescription: string,
  sections?: string[],
  tone?: string,
) {
  return apiFetch<JobEnhanceResult>(`/cvs/${id}/jobs/enhance`, {
    method: 'POST',
    body: JSON.stringify({ jobDescription, sections, tone }),
  });
}

export function applyJobEnhancement(id: string, data: Record<string, unknown>) {
  return apiFetch<{ applied: boolean }>(`/cvs/${id}/jobs/enhance/apply`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export function coverLetter(id: string, jobDescription: string) {
  return apiFetch<{ content: string }>(`/cvs/${id}/jobs/cover-letter`, {
    method: 'POST',
    body: JSON.stringify({ jobDescription }),
  });
}
