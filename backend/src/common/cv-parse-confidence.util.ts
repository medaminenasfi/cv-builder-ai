import type { CVData } from './cv-schema';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface FieldConfidence {
  value: string;
  confidence: ConfidenceLevel;
}

export interface ParseConfidence {
  overall: number;
  qualityLabel: 'excellent' | 'good' | 'review_recommended' | 'manual_review';
  fields: {
    personal: {
      fullName: ConfidenceLevel;
      email: ConfidenceLevel;
      phone: ConfidenceLevel;
    };
    summary: ConfidenceLevel;
    experience: ConfidenceLevel;
    education: ConfidenceLevel;
    skills: ConfidenceLevel;
    languages: ConfidenceLevel;
    technologies: ConfidenceLevel;
  };
  warnings: string[];
}

function fieldLevel(present: boolean, strong: boolean): ConfidenceLevel {
  if (strong) return 'high';
  if (present) return 'medium';
  return 'low';
}

export function scoreParseConfidence(data: CVData, rawTextLength: number): ParseConfidence {
  const warnings: string[] = [];

  const hasName = Boolean(data.personal.fullName?.trim());
  const hasEmail = Boolean(data.personal.email?.trim());
  const hasPhone = Boolean(data.personal.phone?.trim());
  const hasSummary = Boolean(data.summary?.trim() && data.summary.trim().length > 20);
  const expCount = data.experience.length;
  const eduCount = data.education.length;
  const skillCount = data.skills.length;
  const langCount = data.languages.length;
  const techCount = data.technologies.length;

  if (!hasName) warnings.push('Name could not be detected — please verify.');
  if (!hasEmail && !hasPhone) warnings.push('Missing contact information (email or phone).');
  if (expCount === 0) warnings.push('Experience section may be incomplete.');
  if (eduCount === 0) warnings.push('Education section may be incomplete.');
  if (skillCount < 2 && techCount < 2) warnings.push('Skills or technologies look sparse.');
  if (rawTextLength > 500 && expCount === 0) {
    warnings.push('Document has content but no jobs were extracted — review experience manually.');
  }

  const fields = {
    personal: {
      fullName: fieldLevel(hasName, hasName && data.personal.fullName!.length >= 4),
      email: fieldLevel(hasEmail, hasEmail && data.personal.email!.includes('@')),
      phone: fieldLevel(hasPhone, hasPhone && data.personal.phone!.replace(/\D/g, '').length >= 8),
    },
    summary: fieldLevel(hasSummary, hasSummary && data.summary!.length > 80),
    experience: fieldLevel(expCount > 0, expCount >= 2),
    education: fieldLevel(eduCount > 0, eduCount >= 1 && Boolean(data.education[0]?.institution)),
    skills: fieldLevel(skillCount >= 2, skillCount >= 5),
    languages: fieldLevel(langCount >= 1, langCount >= 2),
    technologies: fieldLevel(techCount >= 2, techCount >= 5),
  };

  let score = 0;
  if (hasName) score += 15;
  if (hasEmail || hasPhone) score += 15;
  if (hasSummary) score += 10;
  score += Math.min(25, expCount * 8);
  score += Math.min(15, eduCount * 7);
  score += Math.min(10, skillCount * 2);
  score += Math.min(5, langCount * 2);
  score += Math.min(5, techCount);
  score = Math.min(100, score);

  let qualityLabel: ParseConfidence['qualityLabel'] = 'manual_review';
  if (score >= 95) qualityLabel = 'excellent';
  else if (score >= 80) qualityLabel = 'good';
  else if (score >= 60) qualityLabel = 'review_recommended';

  return { overall: score, qualityLabel, fields, warnings };
}
