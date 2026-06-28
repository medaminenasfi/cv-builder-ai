import { buildParseTextPayload } from '../../../common/resume-text.util';

export const CV_PARSE_SYSTEM_PROMPT = `You extract ALL structured CV/resume data from raw text. Output ONLY valid JSON (no markdown).

Schema:
{
  "personal": { "fullName", "title", "email", "phone", "location", "linkedin", "website" },
  "summary": "professional summary or profil paragraph",
  "experience": [{ "id", "company", "role", "startDate", "endDate", "bullets": ["each achievement"] }],
  "education": [{ "id", "institution", "degree", "startDate", "endDate" }],
  "skills": [{ "id", "name" }],
  "languages": [{ "id", "name", "level" }],
  "technologies": [{ "id", "name" }],
  "certifications": [{ "id", "name", "issuer", "date" }],
  "projects": [{ "id", "name", "description", "bullets": [] }]
}

Rules:
- Extract EVERY job, school, language, technology, and skill — do not skip sections
- French CVs: Profil→summary, Expérience→experience, Formation→education, Langues→languages, Compétences techniques/Outils→technologies, Compétences→skills
- languages: spoken languages with level (e.g. Français — Courant, English — Fluent)
- technologies: frameworks, tools, languages (React, Docker, Python) — NOT spoken languages
- Put each bullet under a job into experience[].bullets
- ONE entry per job — never duplicate the same position/company/dates
- Copy dates and company names exactly; use "" if missing, never invent employers
- Generate short unique ids for array items
- Supports English, French, and Arabic resumes
- Arabic CVs: الخبرة→experience, التعليم→education, اللغات→languages, المهارات→skills, التقنيات→technologies`;

export function cvParseUserMessage(rawText: string): string {
  return `Extract complete CV JSON from this resume text. Include ALL experience entries, ALL education, ALL skills, contact info, and summary.

---
${buildParseTextPayload(rawText)}
---

Return full JSON with personal, summary, experience[], education[], skills[], languages[], technologies[], certifications[], projects[].`;
}

export const CV_ATS_SYSTEM_PROMPT = `ATS analyst. Compare CV to job. JSON only: {"score":0-100,"breakdown":{"keywords":0,"format":0,"sections":0,"experience":0},"matchedKeywords":[],"missingKeywords":[],"suggestions":[]}`;

export function compactCvForAts(cv: {
  summary?: string;
  skills: Array<{ name: string }>;
  experience: Array<{ role: string; company: string; bullets: string[] }>;
}): string {
  return JSON.stringify({
    summary: (cv.summary ?? '').slice(0, 400),
    skills: cv.skills.slice(0, 15).map((s) => s.name),
    experience: cv.experience.slice(0, 3).map((e) => ({
      role: e.role,
      company: e.company,
      bullets: e.bullets.slice(0, 2),
    })),
  });
}

export function cvAtsUserMessage(cvJson: string, jobDescription: string): string {
  return `CV:${cvJson}
JOB:${jobDescription.slice(0, 2500)}
Return JSON.`;
}

export function cvKeywordEnhanceSystemPrompt(tone: string): string {
  return `ATS CV tailor. Tone:${tone}. JSON only: {"summary":"...","experienceUpdates":[{"id":"...","bullets":["..."]}],"skillNames":["..."]}. No fake jobs. Max 3 bullets/role.`;
}

export function compactCvForEnhance(cv: {
  summary?: string;
  experience: Array<{ id: string; company: string; role: string; bullets: string[] }>;
  skills: Array<{ name: string }>;
}): string {
  return JSON.stringify({
    summary: (cv.summary ?? '').slice(0, 300),
    experience: cv.experience.slice(0, 3).map((e) => ({
      id: e.id,
      company: e.company,
      role: e.role,
      bullets: e.bullets.slice(0, 2),
    })),
    skills: cv.skills.slice(0, 15).map((s) => s.name),
  });
}

export function cvKeywordEnhanceUserMessage(
  cvJson: string,
  jobDescription: string,
  missingKeywords: string[],
  sections: string[],
): string {
  return `CV:${cvJson}
JOB:${jobDescription.slice(0, 2000)}
KEYWORDS:${missingKeywords.slice(0, 10).join(',')}
SECTIONS:${sections.join(',')}
JSON only.`;
}

export function cvEnhanceSystemPrompt(tone: string, sections: string[]): string {
  const keys = sections.includes('skills')
    ? [...new Set([...sections, 'technologies'])]
    : sections;
  return `You improve CV resume content. Tone: ${tone}.
Return ONLY valid JSON (no markdown) with ONLY these top-level keys: ${keys.join(', ')}.
Rules:
- summary: single string field
- experience: array of { id, company, role, startDate, endDate, bullets[] } — keep the same ids and employers, improve wording and add metrics where possible
- skills / technologies: arrays of { id, name }
- Do NOT invent fake jobs or employers
- Quantify achievements with numbers when reasonable
- Write in the same language as the input CV`;
}

export function cvEnhanceUserMessage(
  cvJson: string,
  sections: string[],
  tone: string,
): string {
  return `Improve ONLY these sections: ${sections.join(', ')}. Tone: ${tone}.

Input JSON (partial CV):
${cvJson}

Return JSON with only the improved section fields listed above.`;
}

export function cvCoverLetterSystemPrompt(locale: string): string {
  return `Write a professional cover letter in ${locale}. Use only facts from the CV. 3-4 paragraphs. Reference 2-3 job requirements. Return JSON: { content: string }. No markdown fences.`;
}

export function cvCoverLetterUserMessage(cvJson: string, jobDescription: string): string {
  return `CV:
${cvJson.slice(0, 6000)}

JOB:
${jobDescription.slice(0, 4000)}

Write the cover letter.`;
}

export function cvInterviewSystemPrompt(): string {
  return `You are an interview coach. Return ONLY valid JSON (no markdown):
{ "questions": [ { "q": "question text", "hint": "short prep tip" } ] }
Generate 6 tailored questions based on the CV and job description. Mix behavioral and role-specific questions.`;
}

export function cvInterviewUserMessage(cvJson: string, jobDescription: string, jobTitle?: string): string {
  return `Role: ${jobTitle ?? 'Not specified'}

CV:
${cvJson.slice(0, 5000)}

Job description:
${jobDescription.slice(0, 3000)}

Return 6 interview questions with hints.`;
}
