import type { CVData } from './cv-schema';

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one',
  'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see',
  'two', 'way', 'who', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'with', 'from', 'this',
  'that', 'will', 'your', 'have', 'been', 'more', 'when', 'what', 'there', 'their', 'would',
  'about', 'which', 'could', 'other', 'into', 'than', 'then', 'them', 'these', 'some', 'such',
  'only', 'also', 'very', 'just', 'over', 'after', 'most', 'make', 'like', 'work', 'team',
  'role', 'looking', 'grow', 'main', 'key', 'well', 'must', 'need', 'able', 'both', 'each',
  'during', 'within', 'strong', 'years', 'skills', 'requirements', 'responsibilities', 'benefits',
  'bonus', 'degree', 'similar', 'global', 'remote', 'platform', 'application', 'version',
  'depending', 'priorities', 'develop', 'maintain', 'deploy', 'production', 'closely',
  'deliver', 'meet', 'international', 'environment', 'multiple', 'time', 'zones', 'think',
  'unique', 'problems', 'attention', 'detail', 'core', 'special', 'ability', 'communicate',
  'clearly', 'efficiently', 'members', 'written', 'spoken', 'computer', 'science', 'successful',
  'dynamic', 'small', 'growing', 'availability', 'business', 'hours', 'opportunities', 'future',
  'backend', 'frontend', 'developer', 'full', 'stack', 'talented', 'versatile', 'implement',
  'features', 'testers', 'expectations', 'box', 'solve', 'respond', 'incidents', 'live',
]);

/** Known multi-word / special tech terms to pull from job descriptions */
const TECH_PHRASE_PATTERNS: RegExp[] = [
  /\bC#\b/gi,
  /\.NET\s+Core\b/gi,
  /\.NET\s+Framework\b/gi,
  /\bASP\.NET\s+Core\b/gi,
  /\bASP\.NET\b/gi,
  /\bASPX\b/gi,
  /\bSQL\s+Server\b/gi,
  /\bEntity\s+Framework\b/gi,
  /\bEF\s+Core\b/gi,
  /\bWCF\b/gi,
  /\bRabbitMQ\b/gi,
  /\bMongoDB\b/gi,
  /\bAzure\s+DevOps\b/gi,
  /\bTFS\b/gi,
  /\bReact(?:\.js)?\b/gi,
  /\bNode\.js\b/gi,
  /\bNestJS\b/gi,
  /\bNext\.js\b/gi,
  /\bTypeScript\b/gi,
  /\bJavaScript\b/gi,
  /\bPostgreSQL\b/gi,
  /\bMySQL\b/gi,
  /\bDocker\b/gi,
  /\bKubernetes\b/gi,
  /\bCI\/CD\b/gi,
  /\bPython\b/gi,
  /\bHTML\b/gi,
  /\bCSS\b/gi,
  /\bjQuery\b/gi,
  /\bSolr\b/gi,
  /\bJQuery\b/gi,
  /\bDevOps\b/gi,
  /\bVPS\b/gi,
  /\bNginx\b/gi,
];

function normalizeKeyword(keyword: string): string {
  return keyword.toLowerCase().replace(/\s+/g, ' ').trim();
}

function isUsefulKeyword(word: string): boolean {
  const n = normalizeKeyword(word);
  if (n.length < 2) return false;
  if (STOP_WORDS.has(n)) return false;
  if (/^\d+$/.test(n)) return false;
  return true;
}

/** Extract meaningful ATS keywords from a job description (no stop words). */
export function extractJobKeywords(jobDescription: string): string[] {
  const found = new Map<string, string>();

  for (const pattern of TECH_PHRASE_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(jobDescription)) !== null) {
      const raw = m[0].trim();
      const key = normalizeKeyword(raw);
      if (isUsefulKeyword(key) || raw.includes('#') || raw.includes('.')) {
        found.set(key, raw);
      }
    }
  }

  const wordMatches =
    jobDescription.match(/\b[A-Za-z][A-Za-z0-9+#/.-]{1,30}\b/g) ?? [];
  for (const raw of wordMatches) {
    const key = normalizeKeyword(raw);
    if (!isUsefulKeyword(key)) continue;
    if (key.length >= 4 || /[#./]/.test(raw)) {
      found.set(key, raw);
    }
  }

  return [...found.values()].slice(0, 30);
}

export function cvTextBlob(cvData: CVData): string {
  const parts: string[] = [
    cvData.summary ?? '',
    cvData.personal.title ?? '',
    ...cvData.skills.map((s) => s.name),
    ...cvData.experience.flatMap((e) => [
      e.role,
      e.company,
      ...(e.bullets ?? []),
    ]),
    ...cvData.education.flatMap((e) => [e.degree, e.institution]),
  ];
  return parts.join(' ').toLowerCase();
}

export function keywordPresentInCv(cvBlob: string, keyword: string): boolean {
  const n = normalizeKeyword(keyword);
  if (cvBlob.includes(n)) return true;
  const alt = n.replace(/\./g, '').replace(/\s+/g, '');
  if (alt.length >= 3 && cvBlob.replace(/\./g, '').replace(/\s+/g, '').includes(alt)) {
    return true;
  }
  return false;
}

export function matchKeywordsToCv(
  cvData: CVData,
  keywords: string[],
): { matched: string[]; missing: string[] } {
  const blob = cvTextBlob(cvData);
  const matched: string[] = [];
  const missing: string[] = [];

  for (const kw of keywords) {
    if (keywordPresentInCv(blob, kw)) matched.push(kw);
    else missing.push(kw);
  }

  return { matched, missing };
}

export function computeKeywordScore(matchedCount: number, totalCount: number): number {
  if (totalCount === 0) return 50;
  const ratio = matchedCount / totalCount;
  return Math.min(100, Math.max(0, Math.round(ratio * 100)));
}

export function computeSectionScore(cvData: CVData): number {
  let points = 0;
  if ((cvData.summary ?? '').trim().length > 40) points += 25;
  if (cvData.experience.length > 0) points += 25;
  if (cvData.skills.length >= 3) points += 25;
  if (cvData.education.length > 0) points += 25;
  return points;
}

export function isEnhanceableKeyword(keyword: string): boolean {
  const n = normalizeKeyword(keyword);
  if (n.length < 2) return false;
  if (STOP_WORDS.has(n)) return false;
  if (/^\d+$/.test(n)) return false;
  return true;
}

export function formatSkillName(keyword: string): string {
  const trimmed = keyword.trim();
  if (/^c#$/i.test(trimmed)) return 'C#';
  if (/^\.net/i.test(trimmed)) return trimmed.replace(/^\.net/i, '.NET');
  if (/^react$/i.test(trimmed)) return 'React';
  if (/^nodejs$/i.test(trimmed.replace(/\./g, ''))) return 'Node.js';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
