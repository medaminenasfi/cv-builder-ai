import { newCvId, type CVData } from './cv-schema';

/** Extract and clean plain text from a PDF buffer (page-by-page for completeness). */
export async function extractPdfText(
  PDFParseClass: new (opts: { data: Buffer }) => {
    getText: () => Promise<{ text: string; pages?: Array<{ num: number; text: string }> }>;
    destroy?: () => Promise<void>;
  },
  buffer: Buffer,
): Promise<string> {
  const parser = new PDFParseClass({ data: buffer });
  try {
    const result = await parser.getText();
    const pageTexts =
      result.pages?.map((p) => p.text?.trim()).filter(Boolean) ?? [];
    const combined =
      pageTexts.length > 0 ? pageTexts.join('\n\n') : (result.text ?? '');
    return cleanResumeText(combined);
  } finally {
    await parser.destroy?.();
  }
}

export function cleanResumeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export interface ContactHints {
  email?: string;
  phone?: string;
  linkedin?: string;
  website?: string;
  location?: string;
}

export function extractContactHints(text: string): ContactHints {
  const hints: ContactHints = {};

  const email = text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0];
  if (email) hints.email = email;

  const phone = text.match(
    /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{2,3}[\s.-]?\d{3}[\s.-]?\d{2,4}/,
  )?.[0];
  if (phone) hints.phone = phone.trim();

  const linkedin = text.match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w%-]+/i,
  )?.[0];
  if (linkedin) {
    hints.linkedin = linkedin.startsWith('http') ? linkedin : `https://${linkedin}`;
  }

  const website = text.match(
    /(?:https?:\/\/)?(?:www\.)?(?!linkedin)[\w.-]+\.(?:com|io|dev|net|org|tn|fr)[^\s,)>]*/i,
  )?.[0];
  if (website && !website.includes('linkedin')) {
    hints.website = website.startsWith('http') ? website : `https://${website}`;
  }

  const location = text.match(
    /(?:^|\n)([A-ZÀ-Ü][a-zà-ü]+(?:[\s,-]+[A-ZÀ-Ü][a-zà-ü]+){0,3},\s*(?:Tunisia|Tunisie|France|Morocco|Maroc|Algeria|Algérie|[A-ZÀ-Ü][a-zà-ü]+))/m,
  )?.[1];
  if (location) hints.location = location.trim();

  return hints;
}

export function extractSkillsFromText(text: string): string[] {
  const skills: string[] = [];
  const sectionMatch = text.match(
    /(?:compétences|competences|skills|technical skills|stack|technologies)\s*[:\n]\s*([\s\S]{10,800}?)(?=\n\s*(?:expérience|experience|formation|education|langues|languages|projets|projects|certifications|$))/i,
  );
  if (sectionMatch?.[1]) {
    const block = sectionMatch[1];
    const parts = block.split(/[,;|•\n·]/).map((s) => s.trim()).filter(Boolean);
    for (const p of parts) {
      if (p.length >= 2 && p.length <= 40 && !/^\d+$/.test(p)) {
        skills.push(p);
      }
    }
  }
  return [...new Set(skills)].slice(0, 40);
}

export function guessFullName(text: string): string | undefined {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 8)) {
    if (line.length < 4 || line.length > 55) continue;
    if (/@|https?:|linkedin|phone|tel|\+?\d{8,}/i.test(line)) continue;
    if (/^(cv|resume|curriculum|profil|profile)$/i.test(line)) continue;
    if (/^[A-ZÀ-Ü][a-zà-ü]+(\s+[A-ZÀ-Ü][a-zà-ü'-]+){1,4}$/.test(line)) {
      return line;
    }
  }
  return undefined;
}

export function guessJobTitle(text: string): string | undefined {
  const titleMatch = text.match(
    /(?:^|\n)(D[ée]veloppeur[^.\n]{0,60}|Full[- ]Stack[^.\n]{0,40}|Software Engineer[^.\n]{0,40}|Ing[ée]nieur[^.\n]{0,60})/im,
  );
  return titleMatch?.[1]?.trim();
}

/** Keep start (contact) + end (skills/education) when text is long. */
export function buildParseTextPayload(rawText: string, maxLen = 14000): string {
  const cleaned = cleanResumeText(rawText);
  if (cleaned.length <= maxLen) return cleaned;
  const head = cleaned.slice(0, 8000);
  const tail = cleaned.slice(-5500);
  return `${head}\n\n[... content truncated for length — middle section ...]\n\n${tail}`;
}

export function enrichCVFromRawText(data: CVData, rawText: string): CVData {
  const hints = extractContactHints(rawText);
  const personal = { ...data.personal };

  if (!personal.email?.trim() && hints.email) personal.email = hints.email;
  if (!personal.phone?.trim() && hints.phone) personal.phone = hints.phone;
  if (!personal.linkedin?.trim() && hints.linkedin) personal.linkedin = hints.linkedin;
  if (!personal.website?.trim() && hints.website) personal.website = hints.website;
  if (!personal.location?.trim() && hints.location) personal.location = hints.location;
  if (!personal.fullName?.trim()) {
    const name = guessFullName(rawText);
    if (name) personal.fullName = name;
  }
  if (!personal.title?.trim()) {
    const title = guessJobTitle(rawText);
    if (title) personal.title = title;
  }

  let skills = [...data.skills];
  if (skills.length < 4) {
    const extracted = extractSkillsFromText(rawText);
    const existing = new Set(skills.map((s) => s.name.toLowerCase()));
    for (const name of extracted) {
      const key = name.toLowerCase();
      if (!existing.has(key)) {
        skills.push({ id: newCvId(), name });
        existing.add(key);
      }
    }
  }

  return { ...data, personal, skills };
}
