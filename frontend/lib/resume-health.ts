import type { CVData } from './types/cv-data';

export interface ResumeHealth {
  score: number;
  issues: string[];
}

export function computeResumeHealth(data: CVData): ResumeHealth {
  const issues: string[] = [];
  let score = 100;

  if (!data.personal.fullName?.trim()) {
    issues.push('Missing full name');
    score -= 15;
  }
  if (!data.personal.email?.trim() && !data.personal.phone?.trim()) {
    issues.push('Missing email or phone');
    score -= 15;
  }
  if (!data.summary?.trim() || data.summary.trim().length < 40) {
    issues.push('Summary is missing or too short');
    score -= 12;
  }
  if (!data.experience.length) {
    issues.push('No experience entries');
    score -= 20;
  }
  if (data.skills.length < 3 && data.technologies.length < 3) {
    issues.push('Skills section is weak');
    score -= 10;
  }
  if (!data.personal.linkedin?.trim() && !data.personal.website?.trim()) {
    issues.push('Add LinkedIn or portfolio URL for ATS');
    score -= 5;
  }

  return { score: Math.max(0, score), issues };
}
