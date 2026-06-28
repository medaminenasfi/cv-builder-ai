import type { CVData } from '../../common/cv-schema';
import { normalizeCVData } from '../../common/cv-schema';

/** Build a smaller JSON payload — only sections being enhanced. */
export function buildEnhancePayload(before: CVData, sections: string[]): string {
  const payload: Record<string, unknown> = {};
  const wantsSkills = sections.some((s) => s === 'skills' || s === 'technologies');

  if (sections.includes('summary')) {
    payload.summary = before.summary ?? '';
  }
  if (sections.includes('experience')) {
    payload.experience = before.experience;
  }
  if (wantsSkills) {
    payload.skills = before.skills;
    payload.technologies = before.technologies;
  }

  return JSON.stringify(payload);
}

export function mergeEnhancement(
  before: CVData,
  parsed: Partial<CVData>,
  sections: string[],
): CVData {
  let after: CVData = { ...before };

  if (sections.includes('summary') && typeof parsed.summary === 'string') {
    after = { ...after, summary: parsed.summary };
  }

  if (sections.includes('experience') && Array.isArray(parsed.experience) && parsed.experience.length) {
    const byId = new Map(parsed.experience.map((e) => [e.id, e]));
    after = {
      ...after,
      experience: (before.experience ?? []).map((job) => {
        const updated = byId.get(job.id);
        return updated ? { ...job, ...updated, id: job.id } : job;
      }),
    };
  }

  if (sections.some((s) => s === 'skills' || s === 'technologies')) {
    if (Array.isArray(parsed.skills) && parsed.skills.length) {
      after = { ...after, skills: parsed.skills as CVData['skills'] };
    }
    if (Array.isArray(parsed.technologies) && parsed.technologies.length) {
      after = { ...after, technologies: parsed.technologies as CVData['technologies'] };
    }
  }

  return normalizeCVData(after, before.meta.locale);
}

export function enhancementHasChanges(
  before: CVData,
  after: CVData,
  sections: string[],
): boolean {
  if (sections.includes('summary') && (before.summary ?? '') !== (after.summary ?? '')) {
    return true;
  }
  if (sections.includes('experience')) {
    if (JSON.stringify(before.experience) !== JSON.stringify(after.experience)) return true;
  }
  if (sections.some((s) => s === 'skills' || s === 'technologies')) {
    if (JSON.stringify(before.skills) !== JSON.stringify(after.skills)) return true;
    if (JSON.stringify(before.technologies) !== JSON.stringify(after.technologies)) return true;
  }
  return false;
}
