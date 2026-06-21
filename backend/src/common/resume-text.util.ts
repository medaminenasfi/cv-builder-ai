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

export function extractSectionBlock(
  text: string,
  headerPattern: RegExp,
  maxLen = 1200,
): string | undefined {
  const match = text.match(
    new RegExp(
      headerPattern.source +
        '\\s*[\\n:]\\s*([\\s\\S]{5,' +
        maxLen +
        '}?)(?=\\n\\s*(?:expérience|experience|formation|education|langues|languages|compétences|competences|skills|technologies|projets|projects|certifications|$))',
      headerPattern.flags.includes('i') ? 'i' : undefined,
    ),
  );
  return match?.[1]?.trim();
}

function parseListFromBlock(block: string): string[] {
  const parts = block.split(/[,;|•\n·]/).map((s) => s.trim()).filter(Boolean);
  return [...new Set(parts.filter((p) => p.length >= 2 && p.length <= 50))].slice(0, 40);
}

export function extractLanguagesFromText(text: string): Array<{ name: string; level?: string }> {
  const block =
    extractSectionBlock(text, /langues|languages/i) ??
    extractSectionBlock(text, /language skills/i);
  if (!block) return [];
  return block
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const dash = entry.match(/^(.+?)\s*[—–-]\s*(.+)$/);
      if (dash) return { name: dash[1].trim(), level: dash[2].trim() };
      const paren = entry.match(/^(.+?)\s*\(([^)]+)\)$/);
      if (paren) return { name: paren[1].trim(), level: paren[2].trim() };
      return { name: entry };
    })
    .slice(0, 15);
}

export function extractTechnologiesFromText(text: string): string[] {
  const block =
    extractSectionBlock(
      text,
      /compétences techniques|competences techniques|technologies|technical skills|stack|outils|tools/i,
    ) ?? extractSectionBlock(text, /compétences|competences|skills/i);
  if (!block) return [];
  return parseListFromBlock(block);
}

export function extractSkillsFromText(text: string): string[] {
  const block =
    extractSectionBlock(text, /soft skills|aptitudes|qualités/i) ??
    extractSectionBlock(text, /compétences|competences|skills/i);
  if (!block) return [];
  return parseListFromBlock(block);
}

/** Parse experience blocks from FR/EN CV section headers. */
export function extractExperienceFromText(
  text: string,
): Array<{ company: string; role: string; startDate: string; endDate: string; bullets: string[] }> {
  const block = extractSectionBlock(
    text,
    /expérience professionnelle|expérience|experience|work experience|employment history|parcours professionnel/i,
    8000,
  );
  if (!block) return [];

  const chunks = block.split(/\n(?=\d{4}\s*[-–—])/);
  const results: Array<{
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }> = [];

  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (trimmed.length < 8) continue;

    const headerMatch = trimmed.match(
      /^(\d{4})\s*[-–—]\s*(Aujourd'hui|Today|Present|Présent|presént|\d{4})\s*(.*)$/i,
    );
    if (!headerMatch) continue;

    const [, startDate, endRaw, restLine] = headerMatch;
    const endDate = /aujourd|present|présent/i.test(endRaw) ? 'present' : endRaw;
    const rest = restLine.trim();

    let role = rest;
    let company = '';
    const atMatch = rest.match(/^(.+?)\s+(?:chez|at|@)\s+(.+)$/i);
    const dashMatch = rest.match(/^(.+?)\s*[—–-]\s*(.+)$/);
    if (atMatch) {
      role = atMatch[1].trim();
      company = atMatch[2].trim();
    } else if (dashMatch) {
      role = dashMatch[1].trim();
      company = dashMatch[2].trim();
    }

    const bodyLines = trimmed
      .split('\n')
      .slice(1)
      .map((l) => l.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean);

    results.push({
      company: company.slice(0, 120),
      role: role.slice(0, 120),
      startDate,
      endDate,
      bullets: bodyLines.slice(0, 8),
    });
  }

  return results.slice(0, 12);
}

export function extractEducationFromText(
  text: string,
): Array<{ institution: string; degree: string; startDate: string; endDate: string }> {
  const block = extractSectionBlock(
    text,
    /formation|education|études|studies|diplômes|diplomes/i,
    4000,
  );
  if (!block) return [];

  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
  const results: Array<{
    institution: string;
    degree: string;
    startDate: string;
    endDate: string;
  }> = [];

  for (const line of lines) {
    const dateMatch = line.match(
      /^(\d{4})\s*[-–—]\s*(\d{4}|Aujourd'hui|Present|Présent)\s*(.+)$/i,
    );
    if (dateMatch) {
      const [, startDate, endRaw, rest] = dateMatch;
      const endDate = /aujourd|present|présent/i.test(endRaw) ? endRaw : endRaw;
      const dash = rest.match(/^(.+?)\s*[—–-]\s*(.+)$/);
      results.push({
        degree: dash ? dash[1].trim() : rest.trim(),
        institution: dash ? dash[2].trim() : '',
        startDate,
        endDate,
      });
      continue;
    }

    if (line.length >= 6 && line.length <= 120) {
      results.push({
        degree: line,
        institution: '',
        startDate: '',
        endDate: '',
      });
    }
  }

  return results.slice(0, 8);
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
  let languages = [...data.languages];
  let technologies = [...data.technologies];

  if (languages.length < 1) {
    for (const lang of extractLanguagesFromText(rawText)) {
      if (!languages.some((l) => l.name.toLowerCase() === lang.name.toLowerCase())) {
        languages.push({ id: newCvId(), name: lang.name, level: lang.level });
      }
    }
  }

  if (technologies.length < 3) {
    const existing = new Set(technologies.map((t) => t.name.toLowerCase()));
    for (const name of extractTechnologiesFromText(rawText)) {
      const key = name.toLowerCase();
      if (!existing.has(key)) {
        technologies.push({ id: newCvId(), name });
        existing.add(key);
      }
    }
  }

  if (skills.length < 3) {
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

  let experience = [...data.experience];
  if (experience.length < 1) {
    for (const exp of extractExperienceFromText(rawText)) {
      experience.push({
        id: newCvId(),
        company: exp.company,
        role: exp.role,
        startDate: exp.startDate,
        endDate: exp.endDate,
        bullets: exp.bullets,
      });
    }
  }

  let education = [...data.education];
  if (education.length < 1) {
    for (const edu of extractEducationFromText(rawText)) {
      education.push({
        id: newCvId(),
        institution: edu.institution,
        degree: edu.degree,
        startDate: edu.startDate,
        endDate: edu.endDate,
      });
    }
  }

  return { ...data, personal, skills, languages, technologies, experience, education };
}
