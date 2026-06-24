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
  github?: string;
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

  const github = text.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w.-]+/i,
  )?.[0];
  if (github) {
    hints.github = github.startsWith('http') ? github : `https://${github}`;
  }

  const website = text.match(
    /(?:https?:\/\/)?(?:www\.)?(?!linkedin|github|gmail|yahoo|hotmail|outlook)[\w.-]+\.(?:com|io|dev|net|org|tn|fr|me)[^\s,)>]*/i,
  )?.[0];
  if (
    website &&
    !website.includes('linkedin') &&
    !website.includes('github') &&
    !/@/.test(website) &&
    !/gmail|yahoo|hotmail|outlook|live\.com/i.test(website)
  ) {
    hints.website = website.startsWith('http') ? website : `https://${website}`;
  }

  const countryOrRegion =
    'Tunisia|Tunisie|France|Morocco|Maroc|Algeria|Algérie|Canada|Belgium|Belgique|Switzerland|Suisse|Gabès|Tunis|Sfax|Paris|Lyon|Marseille|Remote|distance';
  const isLikelyLocation = (value: string): boolean => {
    if (!value.includes(',')) return false;
    const [a, b] = value.split(',').map((s) => s.trim());
    if (!a || !b || a.length < 3 || b.length < 3) return false;
    if (/@|http|linkedin|github|\+?\d{8,}/i.test(value)) return false;
    const tech = /^(react|node|vue|angular|python|java|docker|aws|sql|html|css|next|nest|typescript|javascript)$/i;
    if (tech.test(a) || tech.test(b)) return false;
    if (new RegExp(countryOrRegion, 'i').test(`${a} ${b}`)) return true;
    return b.length >= 5 && /^[A-ZÀ-Ü]/.test(b) && a.length >= 4 && /\s/.test(a);
  };

  for (const line of text.split('\n').slice(0, 12)) {
    for (const seg of line.split(/[|•·]/).map((s) => s.trim())) {
      if (isLikelyLocation(seg)) {
        hints.location = seg;
        break;
      }
    }
    if (hints.location) break;
  }

  if (!hints.location) {
    const cityCountry = text.match(
      new RegExp(
        `(?:^|[\\n|,|•·])([A-ZÀ-Ü][a-zà-üéèê' -]+,\\s*(?:${countryOrRegion}|[A-ZÀ-Ü][a-zà-üéèê' -]{4,}))`,
        'm',
      ),
    )?.[1];
    if (cityCountry && isLikelyLocation(cityCountry.trim())) {
      hints.location = cityCountry.trim();
    }
  }

  return hints;
}

/** Common section boundary headers (EN / FR / AR) for regex lookahead. */
export const SECTION_BOUNDARY =
  'profil|profile|expérience|experience|formation|education|langues|languages|compétences|competences|skills|technologies|projets|projects|certifications|الخبرة|الخبرات|التعليم|اللغات|المهارات|التقنيات|الأدوات|المشاريع';

/** Next-section headers when scanning line-by-line (exclude generic "experience" — too broad). */
const SECTION_LINE_END =
  'expérience|experience|formation|education|études|studies|diplômes|diplomes|langues|languages|compétences techniques|compétences|competences|skills|technologies|projets|projects|certifications|profil|profile|التعليم|اللغات|المهارات';

function extractSectionBlockByLines(
  text: string,
  headerPattern: RegExp,
  maxLen = 1200,
): string | undefined {
  const headerRe = new RegExp(
    `^(?:${headerPattern.source})$`,
    headerPattern.flags.includes('i') ? 'i' : undefined,
  );
  const endRe = new RegExp(`^(?:${SECTION_LINE_END})$`, 'i');
  const lines = text.split('\n');
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    if (headerRe.test(trimmed)) {
      start = i + 1;
      break;
    }
  }
  if (start < 0) return undefined;

  const out: string[] = [];
  for (let i = start; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed && endRe.test(trimmed)) break;
    out.push(lines[i]);
    if (out.join('\n').length > maxLen) break;
  }
  const block = out.join('\n').trim();
  return block.length >= 5 ? block : undefined;
}

export function extractSectionBlock(
  text: string,
  headerPattern: RegExp,
  maxLen = 1200,
): string | undefined {
  const fromLines = extractSectionBlockByLines(text, headerPattern, maxLen);
  if (fromLines) return fromLines;

  const headerSource = headerPattern.source.startsWith('(?:')
    ? headerPattern.source
    : `(?:${headerPattern.source})`;
  const flags = headerPattern.flags.includes('i') ? 'im' : 'm';
  const match = text.match(
    new RegExp(
      `(?:^|\\n)\\s*${headerSource}\\s*(?:\\n|:)\\s*([\\s\\S]{5,${maxLen}}?)(?=\\n\\s*(?:${SECTION_BOUNDARY})\\s*(?:\\n|:)|$)`,
      flags,
    ),
  );
  const fromRegex = match?.[1]?.trim();
  return fromRegex && fromRegex.length >= 5 ? fromRegex : undefined;
}

function parseListFromBlock(block: string): string[] {
  const parts = block.split(/[,;|•\n·]/).map((s) => s.trim()).filter(Boolean);
  return [...new Set(parts.filter((p) => p.length >= 2 && p.length <= 50))].slice(0, 40);
}

export function extractLanguagesFromText(text: string): Array<{ name: string; level?: string }> {
  const block =
    extractSectionBlock(text, /langues|languages|اللغات/i) ??
    extractSectionBlock(text, /language skills/i);
  if (!block) return [];
  return block
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const dash = entry.match(/^(.+?)\s*[—–-]\s*(.+)$/);
      if (dash) return { name: dash[1].trim(), level: dash[2].trim() };
      const prof = entry.match(
        /^(.+?)\s+(Professionnel(?:le)?|Courant|Native|Natif|Bilingue|Intermédiaire|Avancé|Langue maternelle|Fluent|C\d)$/i,
      );
      if (prof) return { name: prof[1].trim(), level: prof[2].trim() };
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
      /compétences techniques|competences techniques|technologies|technical skills|stack|outils|tools|التقنيات|الأدوات/i,
    ) ?? extractSectionBlock(text, /compétences|competences|skills|المهارات/i);
  if (!block) return [];
  const names = new Set<string>();
  for (const line of block.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || /^langues?\b/i.test(trimmed)) continue;
    const labeled = trimmed.match(/^[^:]+:\s*(.+)$/);
    const payload = labeled ? labeled[1] : trimmed;
    for (const part of payload.split(/[,;|•·]/)) {
      const name = part.trim();
      if (name.length >= 2 && name.length <= 50) names.add(name);
    }
  }
  return [...names].slice(0, 40);
}

export function extractSkillsFromText(text: string): string[] {
  const block =
    extractSectionBlock(text, /soft skills|aptitudes|qualités|الكفاءات/i) ??
    extractSectionBlock(text, /compétences|competences|skills|المهارات/i);
  if (!block) return [];
  return parseListFromBlock(block);
}

/** FR/EN month token for date matching. */
const MONTH_TOKEN =
  '(?:jan(?:vier)?|fév(?:rier)?|fev(?:rier)?|mar(?:s)?|avr(?:il)?|mai|juin|juil(?:let)?|ao[uû]t|sep(?:t(?:embre)?)?|oct(?:obre)?|nov(?:embre)?|déc(?:embre)?|dec(?:embre)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|oct(?:ober)?)';

const YEAR_TOKEN = '(?:\\d{1,2}\\/\\d{4}|' + MONTH_TOKEN + '[a-zéû.\\s]*\\d{4}|\\d{4})';

const DATE_RANGE_RE = new RegExp(
  `(${YEAR_TOKEN})\\s*[-–—]\\s*(Aujourd'hui|Today|Present|Présent|presént|الآن|Now|${YEAR_TOKEN})`,
  'i',
);

/** Role + date range on one line (common in FR PDFs): "Développeur Full-Stack Janvier 2026 – Présent" */
const ROLE_WITH_DATES_RE = new RegExp(
  `^(.+?)\\s+((${MONTH_TOKEN})\\s+\\d{4}|\\d{1,2}/\\d{4}|\\d{4})\\s*[-–—]\\s*(Aujourd'hui|Today|Present|Présent|presént|(?:${MONTH_TOKEN})\\s+\\d{4}|\\d{1,2}/\\d{4}|\\d{4})$`,
  'i',
);

const LINE_START_DATE_RE = new RegExp(
  `^(?:(?:${MONTH_TOKEN})[a-zéû.\\s]*)?\\d{4}\\s*[-–—]|^\\d{1,2}\\/\\d{4}\\s*[-–—]`,
  'im',
);

function normalizeEndDate(endRaw: string): string {
  return /aujourd|present|présent|today|now|الآن/i.test(endRaw.trim()) ? 'present' : endRaw.trim();
}

function parseRoleDateLine(line: string): { role: string; startDate: string; endDate: string } | null {
  const m = line.match(ROLE_WITH_DATES_RE);
  if (!m) return null;
  return {
    role: m[1].trim(),
    startDate: m[2].trim(),
    endDate: normalizeEndDate(m[4] ?? m[3] ?? ''),
  };
}

function parseDateRange(line: string): { startDate: string; endDate: string } | null {
  const roleDate = parseRoleDateLine(line);
  if (roleDate) return { startDate: roleDate.startDate, endDate: roleDate.endDate };
  const m = line.match(DATE_RANGE_RE);
  if (!m) return null;
  return { startDate: m[1].trim(), endDate: normalizeEndDate(m[2]) };
}

function splitRoleCompany(line: string): { role: string; company: string } {
  const atMatch = line.match(/^(.+?)\s+(?:chez|at|@)\s+(.+)$/i);
  if (atMatch) return { role: atMatch[1].trim(), company: atMatch[2].trim() };
  const dashMatch = line.match(/^(.+?)\s*[—–-]\s*(.+)$/);
  if (dashMatch) return { role: dashMatch[1].trim(), company: dashMatch[2].trim() };
  const pipeMatch = line.match(/^(.+?)\s*\|\s*(.+)$/);
  if (pipeMatch) return { role: pipeMatch[1].trim(), company: pipeMatch[2].trim() };
  return { role: line.trim(), company: '' };
}

function parseExperienceParagraph(paragraph: string): {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  bullets: string[];
} | null {
  const lines = paragraph.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 1) return null;

  const roleDateFirst = parseRoleDateLine(lines[0]);
  if (roleDateFirst) {
    let company = '';
    const bullets: string[] = [];
    let bodyStart = 1;
    if (
      lines.length > 1 &&
      !parseRoleDateLine(lines[1]) &&
      !/^technologies?\s*:/i.test(lines[1]) &&
      lines[1].length <= 120
    ) {
      company = lines[1];
      bodyStart = 2;
    }
    for (const line of lines.slice(bodyStart)) {
      if (parseRoleDateLine(line)) break;
      if (/^technologies?\s*:/i.test(line)) continue;
      if (/^[-•*▪·]\s*/.test(line) || line.length > 12) {
        bullets.push(line.replace(/^[-•*▪·]\s*/, '').trim());
      }
    }
    return {
      company: company.slice(0, 120),
      role: roleDateFirst.role.slice(0, 120),
      startDate: roleDateFirst.startDate,
      endDate: roleDateFirst.endDate,
      bullets: bullets.slice(0, 8),
    };
  }

  const dateIdx = lines.findIndex((l) => DATE_RANGE_RE.test(l) || LINE_START_DATE_RE.test(l));
  let startDate = '';
  let endDate = 'present';
  let role = '';
  let company = '';
  const bullets: string[] = [];

  if (dateIdx >= 0) {
    const parsed = parseDateRange(lines[dateIdx]);
    if (parsed) {
      startDate = parsed.startDate;
      endDate = parsed.endDate;
    }
    const headerLines = lines.slice(0, dateIdx);
    const bodyLines = lines.slice(dateIdx + 1);

    if (headerLines.length >= 2) {
      role = headerLines[0];
      company = headerLines[1];
    } else if (headerLines.length === 1) {
      const rc = splitRoleCompany(headerLines[0]);
      role = rc.role;
      company = rc.company;
    } else {
      const restOnDateLine = lines[dateIdx].replace(DATE_RANGE_RE, '').trim();
      if (restOnDateLine) {
        const rc = splitRoleCompany(restOnDateLine);
        role = rc.role;
        company = rc.company;
      }
    }

    for (const line of bodyLines) {
      if (/^technologies?\s*:/i.test(line)) continue;
      if (/^[-•*▪·]\s*/.test(line) || line.length > 15) {
        bullets.push(line.replace(/^[-•*▪·]\s*/, '').trim());
      }
    }
  } else {
    if (lines.length < 2) return null;
    role = lines[0];
    company = lines[1];
    for (const line of lines.slice(2)) {
      if (/^[-•*▪·]\s*/.test(line) || line.length > 12) {
        bullets.push(line.replace(/^[-•*▪·]\s*/, '').trim());
      }
    }
  }

  if (!role && !company && bullets.length === 0) return null;
  return {
    company: company.slice(0, 120),
    role: role.slice(0, 120),
    startDate,
    endDate,
    bullets: bullets.slice(0, 8),
  };
}

function experienceKey(item: {
  role: string;
  company: string;
  startDate: string;
}): string {
  return `${item.role}|${item.company}|${item.startDate}`.toLowerCase().trim();
}

/** Scan job header lines (role + dates) and pair with company + bullets — FR PDF layout. */
function extractExperienceByDateScan(
  block: string,
): Array<{ company: string; role: string; startDate: string; endDate: string; bullets: string[] }> {
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
  const headerIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (parseRoleDateLine(lines[i])) headerIndices.push(i);
  }
  if (headerIndices.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      if (DATE_RANGE_RE.test(lines[i]) && !/^technologies?\s*:/i.test(lines[i])) {
        headerIndices.push(i);
      }
    }
  }
  if (headerIndices.length === 0) return [];

  const results: Array<{
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }> = [];

  for (let hi = 0; hi < headerIndices.length; hi++) {
    const dateIdx = headerIndices[hi];
    const nextHeader = headerIndices[hi + 1] ?? lines.length;
    const parsedRoleDate = parseRoleDateLine(lines[dateIdx]);
    const parsed = parsedRoleDate ?? parseDateRange(lines[dateIdx]);
    const startDate = parsed?.startDate ?? '';
    const endDate = parsed?.endDate ?? 'present';

    let role = parsedRoleDate?.role ?? '';
    let company = '';
    let bulletStart = dateIdx + 1;

    if (!role) {
      const before: string[] = [];
      const prevHeader = hi > 0 ? headerIndices[hi - 1] : -1;
      for (let i = dateIdx - 1; i > prevHeader && before.length < 2; i--) {
        const line = lines[i];
        if (/^[-•*▪·]\s*/.test(line) || DATE_RANGE_RE.test(line)) continue;
        before.unshift(line);
      }
      if (before.length >= 2) {
        role = before[before.length - 2];
        company = before[before.length - 1];
      } else if (before.length === 1) {
        const rc = splitRoleCompany(before[0]);
        role = rc.role;
        company = rc.company;
      } else {
        const restOnDateLine = lines[dateIdx].replace(DATE_RANGE_RE, '').trim();
        if (restOnDateLine) {
          const rc = splitRoleCompany(restOnDateLine);
          role = rc.role;
          company = rc.company;
        }
      }
      bulletStart = dateIdx + 1;
    } else if (
      dateIdx + 1 < nextHeader &&
      !parseRoleDateLine(lines[dateIdx + 1]) &&
      !/^technologies?\s*:/i.test(lines[dateIdx + 1]) &&
      lines[dateIdx + 1].length <= 120
    ) {
      company = lines[dateIdx + 1];
      bulletStart = dateIdx + 2;
    }

    const bullets: string[] = [];
    for (let i = bulletStart; i < nextHeader; i++) {
      const line = lines[i];
      if (parseRoleDateLine(line) || DATE_RANGE_RE.test(line)) break;
      if (/^technologies?\s*:/i.test(line)) continue;
      if (/^[-•*▪·]\s*/.test(line) || line.length > 12) {
        bullets.push(line.replace(/^[-•*▪·]\s*/, '').trim());
      }
    }

    if (role || company || bullets.length > 0) {
      results.push({
        company: company.slice(0, 120),
        role: role.slice(0, 120),
        startDate,
        endDate,
        bullets: bullets.slice(0, 8),
      });
    }
  }

  return results;
}

/** Parse experience blocks from FR/EN CV section headers. */
export function extractExperienceFromText(
  text: string,
): Array<{ company: string; role: string; startDate: string; endDate: string; bullets: string[] }> {
  const block = extractSectionBlock(
    text,
    /expériences?\s*professionnelles?|expérience professionnelle|expérience|experience|work experience|employment history|parcours professionnel|professional experience|historique professionnel|الخبرة|الخبرات|الخبرة المهنية|السيرة المهنية/i,
    8000,
  );
  if (!block) return [];

  const results: Array<{
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }> = [];

  const pushParsed = (parsed: ReturnType<typeof parseExperienceParagraph>) => {
    if (!parsed) return;
    if (!parsed.role && !parsed.company && parsed.bullets.length === 0) return;
    const key = experienceKey(parsed);
    if (results.some((r) => experienceKey(r) === key)) return;
    results.push(parsed);
  };

  for (const item of extractExperienceByDateScan(block)) {
    pushParsed(item);
  }

  const paragraphs = block.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 10);
  for (const para of paragraphs) {
    pushParsed(parseExperienceParagraph(para));
  }

  if (results.length < 1) {
    const splitRe = new RegExp(
      `\\n(?=(?:${MONTH_TOKEN})[a-zéû.\\s]*\\d{4}\\s*[-–—]|\\d{4}\\s*[-–—]|\\d{1,2}\\/\\d{4}\\s*[-–—])`,
      'i',
    );
    const chunks = block.split(splitRe);
    let pendingRole = '';
    let pendingCompany = '';
    for (const chunk of chunks) {
      const parsed = parseExperienceParagraph(chunk);
      if (!parsed) continue;
      if (!parsed.role && !parsed.company && (pendingRole || pendingCompany)) {
        parsed.role = pendingRole;
        parsed.company = pendingCompany;
      }
      if (parsed.role) pendingRole = parsed.role;
      if (parsed.company) pendingCompany = parsed.company;
      pushParsed(parsed);
    }
  }

  if (results.length === 0) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    let buf: string[] = [];
    const flush = () => {
      if (buf.length < 2) {
        buf = [];
        return;
      }
      const parsed = parseExperienceParagraph(buf.join('\n'));
      if (parsed && (parsed.role || parsed.company)) results.push(parsed);
      buf = [];
    };
    for (const line of lines) {
      if (LINE_START_DATE_RE.test(line) && buf.length > 0) {
        flush();
      }
      buf.push(line);
      if (buf.length >= 6) flush();
    }
    flush();
  }

  return results.slice(0, 12);
}

export function extractEducationFromText(
  text: string,
): Array<{ institution: string; degree: string; startDate: string; endDate: string }> {
  const block = extractSectionBlock(
    text,
    /formation|education|études|studies|diplômes|diplomes|academic background|التعليم|المؤهلات|الدراسة/i,
    4000,
  );
  if (!block) return [];

  const results: Array<{
    institution: string;
    degree: string;
    startDate: string;
    endDate: string;
  }> = [];

  const pushEdu = (entry: {
    institution: string;
    degree: string;
    startDate: string;
    endDate: string;
  }) => {
    if (!entry.degree && !entry.institution) return;
    const key = `${entry.degree}|${entry.institution}`;
    if (results.some((r) => `${r.degree}|${r.institution}` === key)) return;
    results.push(entry);
  };

  const paragraphs = block.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 6);
  for (const para of paragraphs) {
    const lines = para.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length >= 2 && !DATE_RANGE_RE.test(lines[0])) {
      const last = lines[lines.length - 1];
      const trailingDates = last.match(
        new RegExp(`\\s+((${YEAR_TOKEN})\\s*[-–—]\\s*(?:${YEAR_TOKEN}|Present|Présent))\\s*$`, 'i'),
      );
      if (trailingDates) {
        const parsed = parseDateRange(trailingDates[1].trim());
        const degree = last.replace(trailingDates[0], '').trim();
        pushEdu({
          institution: lines[0],
          degree,
          startDate: parsed?.startDate ?? '',
          endDate: parsed?.endDate ?? '',
        });
        continue;
      }
    }

    const dateIdx = lines.findIndex((l) => DATE_RANGE_RE.test(l) || LINE_START_DATE_RE.test(l));
    if (dateIdx >= 0) {
      const parsed = parseDateRange(lines[dateIdx]);
      const startDate = parsed?.startDate ?? '';
      const endDate = parsed?.endDate ?? '';
      const header = lines.slice(0, dateIdx);
      let degree = '';
      let institution = '';
      if (header.length >= 2) {
        degree = header[0];
        institution = header[1];
      } else if (header.length === 1) {
        const dash = header[0].match(/^(.+?)\s*[—–-]\s*(.+)$/);
        if (dash) {
          degree = dash[1].trim();
          institution = dash[2].trim();
        } else {
          degree = header[0];
        }
      }
      pushEdu({ degree, institution, startDate, endDate });
      continue;
    }

    for (const line of lines) {
      const dateMatch = line.match(
        new RegExp(`^(${YEAR_TOKEN})\\s*[-–—]\\s*(${YEAR_TOKEN}|Aujourd'hui|Today|Present|Présent)`, 'i'),
      );
      if (dateMatch) {
        const startDate = dateMatch[1].trim();
        const endRaw = dateMatch[2].trim();
        const endDate = /aujourd|present|présent|today/i.test(endRaw) ? 'present' : endRaw;
        const rest = line.replace(dateMatch[0], '').trim();
        const dash = rest.match(/^(.+?)\s*[—–-]\s*(.+)$/);
        pushEdu({
          degree: dash ? dash[1].trim() : rest.trim(),
          institution: dash ? dash[2].trim() : '',
          startDate,
          endDate,
        });
        continue;
      }

      const yearOnly = line.match(/^(\d{4})\s*[-–—]\s*(\d{4})\s+(.+)$/);
      if (yearOnly) {
        const dash = yearOnly[3].match(/^(.+?)\s*[—–-]\s*(.+)$/);
        pushEdu({
          degree: dash ? dash[1].trim() : yearOnly[3].trim(),
          institution: dash ? dash[2].trim() : '',
          startDate: yearOnly[1],
          endDate: yearOnly[2],
        });
        continue;
      }

      if (line.length >= 6 && line.length <= 120) {
        pushEdu({ degree: line, institution: '', startDate: '', endDate: '' });
      }
    }
  }

  return results.slice(0, 8);
}

export function guessFullName(text: string): string | undefined {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 8)) {
    if (line.length < 3 || line.length > 60) continue;
    if (/@|https?:|linkedin|phone|tel|\+?\d{8,}/i.test(line)) continue;
    if (/^(cv|resume|curriculum|profil|profile|سيرة|السيرة)$/i.test(line)) continue;
    if (/^[\u0600-\u06FF\s]{4,55}$/.test(line)) return line;
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

/** Extract profile / professional summary from FR/EN CV text. */
export function extractSummaryFromText(text: string): string | undefined {
  const block = extractSectionBlock(
    text,
    /résumé\s*professionnel|profil\s*professionnel|profil|profile|summary|professional summary|about(?:\s+me)?|à propos|a propos|présentation|presentation|objectif(?:\s+professionnel)?|who am i|career objective|الملخص|نبذة/i,
    2800,
  );
  if (block) {
    const clean = block
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !/^[-•*▪·]\s*$/.test(l))
      .join(' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (clean.length >= 20) return clean.slice(0, 1500);
  }

  const sectionStart = text.search(
    new RegExp(`\\n\\s*(?:${SECTION_BOUNDARY})\\s*(?:\\n|:)`, 'i'),
  );
  const head = sectionStart > 40 ? text.slice(0, sectionStart) : text.slice(0, 1800);
  const headLines = head.split('\n').map((l) => l.trim()).filter(Boolean);
  const prose: string[] = [];

  for (const line of headLines.slice(1, 14)) {
    if (/@|linkedin|github|https?:|www\.|\+?\d[\d\s().-]{8,}/i.test(line)) continue;
    if (line.length < 35) continue;
    if (
      /^(expérience|experience|formation|education|compétences|competences|skills|langues|languages|certifications|projets|projects)\b/i.test(
        line,
      )
    ) {
      break;
    }
    if (/^[A-ZÀ-Ü][a-zà-ü]+(\s+[A-ZÀ-Ü][a-zà-ü'-]+){1,4}$/.test(line)) continue;
    prose.push(line);
    if (prose.join(' ').length > 100) break;
  }

  const fallback = prose.join(' ').replace(/\s{2,}/g, ' ').trim();
  return fallback.length >= 35 ? fallback.slice(0, 1500) : undefined;
}

function mergeExperienceEntries(
  existing: CVData['experience'],
  extracted: Array<{
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }>,
): CVData['experience'] {
  const out = [...existing];
  const keys = new Set(out.map((e) => experienceKey(e)));
  for (const exp of extracted) {
    if (!exp.role && !exp.company) continue;
    const key = experienceKey(exp);
    if (keys.has(key)) continue;
    out.push({
      id: newCvId(),
      company: exp.company,
      role: exp.role,
      startDate: exp.startDate,
      endDate: exp.endDate,
      bullets: exp.bullets,
    });
    keys.add(key);
  }
  return out;
}

function mergeEducationEntries(
  existing: CVData['education'],
  extracted: Array<{
    institution: string;
    degree: string;
    startDate: string;
    endDate: string;
  }>,
): CVData['education'] {
  const out = [...existing];
  const keys = new Set(out.map((e) => `${e.degree}|${e.institution}`.toLowerCase()));
  for (const edu of extracted) {
    if (!edu.degree && !edu.institution) continue;
    const key = `${edu.degree}|${edu.institution}`.toLowerCase();
    if (keys.has(key)) continue;
    out.push({
      id: newCvId(),
      institution: edu.institution,
      degree: edu.degree,
      startDate: edu.startDate,
      endDate: edu.endDate,
    });
    keys.add(key);
  }
  return out;
}

export function extractProjectsFromText(
  text: string,
): Array<{ name: string; description?: string; bullets: string[] }> {
  const block = extractSectionBlock(text, /projets|projects|المراجع/i, 6000);
  if (!block) return [];

  const projects: Array<{ name: string; description?: string; bullets: string[] }> = [];
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
  let current: { name: string; description?: string; bullets: string[] } | null = null;

  const flush = () => {
    if (current?.name) projects.push(current);
    current = null;
  };

  for (const line of lines) {
    if (/^(?:compétences techniques|compétences|langues|certifications)\b/i.test(line)) break;

    const looksLikeHeader =
      line.length >= 15 &&
      line.length <= 200 &&
      !/^[-•*▪·]\s*/.test(line) &&
      (/\|\s*\w/.test(line) ||
        /\(Freelance\)/i.test(line) ||
        /\(Projet de Fin/i.test(line) ||
        /Projet de Fin d['']Études/i.test(line));

    if (looksLikeHeader) {
      flush();
      const pipeParts = line.split(/\s*\|\s*/);
      const headerPart = pipeParts[0].trim();
      const techStack = pipeParts.slice(1).join(' | ').trim();
      const dashParts = headerPart.match(/^(.+?)\s*[—–-]\s*(.+)$/);
      const name = dashParts ? dashParts[1].trim() : headerPart;
      const description = [dashParts?.[2]?.trim(), techStack].filter(Boolean).join(' | ') || undefined;
      current = { name, description, bullets: [] };
      continue;
    }

    if (!current) continue;
    if (/^[-•*▪·]\s*/.test(line) || line.length > 20) {
      current.bullets.push(line.replace(/^[-•*▪·]\s*/, '').trim());
    } else if (!current.description && line.length > 15) {
      current.description = line;
    }
  }
  flush();
  return projects.slice(0, 10);
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
  if (!personal.website?.trim() && hints.github) personal.website = hints.github;
  if (!personal.location?.trim() && hints.location) personal.location = hints.location;
  if (!personal.fullName?.trim()) {
    const name = guessFullName(rawText);
    if (name) personal.fullName = name;
  }
  if (!personal.title?.trim()) {
    const title = guessJobTitle(rawText);
    if (title) personal.title = title;
  }

  let summary = data.summary?.trim() ?? '';
  if (summary.length < 20) {
    const extractedSummary = extractSummaryFromText(rawText);
    if (extractedSummary) summary = extractedSummary;
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

  let experience = mergeExperienceEntries(data.experience, extractExperienceFromText(rawText));

  let education = mergeEducationEntries(data.education, extractEducationFromText(rawText));

  let projects = [...data.projects];
  if (projects.length < 1) {
    for (const p of extractProjectsFromText(rawText)) {
      projects.push({
        id: newCvId(),
        name: p.name,
        description: p.description,
        bullets: p.bullets.slice(0, 6),
      });
    }
  }

  return { ...data, personal, summary, skills, languages, technologies, experience, education, projects };
}
