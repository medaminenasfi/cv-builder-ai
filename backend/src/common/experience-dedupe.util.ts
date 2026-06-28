import type { CVData } from './cv-schema';

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '');
}

/** Normalize role/company for fuzzy duplicate detection. */
export function normalizeExperienceText(value: string): string {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/\s*[·•|]\s*/g, ' ')
    .replace(/\b(a distance|à distance|remote|en remote|freelance)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeExperienceStartDate(value: string): string {
  const t = stripDiacritics(value).toLowerCase().trim();
  if (!t) return '';
  if (/present|présent|aujourd|now|today/i.test(t)) return 'present';
  const year = t.match(/\b(19|20)\d{2}\b/)?.[0];
  const month =
    t.match(
      /\b(jan|janvier|feb|fev|fév|février|fevrier|mar|mars|apr|avril|may|mai|jun|juin|jul|juillet|aug|août|aout|sep|sept|oct|nov|déc|dec)\b/i,
    )?.[0] ?? '';
  return `${month} ${year ?? t}`.trim();
}

export function experienceFingerprint(item: {
  role: string;
  company: string;
  startDate: string;
}): string {
  return `${normalizeExperienceText(item.role)}|${normalizeExperienceText(item.company)}|${normalizeExperienceStartDate(item.startDate)}`;
}

function textsOverlap(a: string, b: string): boolean {
  const na = normalizeExperienceText(a);
  const nb = normalizeExperienceText(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length >= 4 && nb.length >= 4 && (na.includes(nb) || nb.includes(na))) return true;
  return false;
}

export function experiencesOverlap(
  a: { role: string; company: string; startDate: string },
  b: { role: string; company: string; startDate: string },
): boolean {
  if (experienceFingerprint(a) === experienceFingerprint(b)) return true;

  const sameStart =
    normalizeExperienceStartDate(a.startDate) === normalizeExperienceStartDate(b.startDate);
  const roleMatch = textsOverlap(a.role, b.role);
  const companyMatch = textsOverlap(a.company, b.company);

  if (roleMatch && companyMatch) return true;
  if (sameStart && roleMatch && (companyMatch || !a.company.trim() || !b.company.trim())) {
    return true;
  }
  if (sameStart && companyMatch && (roleMatch || !a.role.trim() || !b.role.trim())) {
    return true;
  }

  return false;
}

function mergeExperiencePair(
  a: CVData['experience'][number],
  b: CVData['experience'][number],
): CVData['experience'][number] {
  const bullets = [...a.bullets];
  const seen = new Set(bullets.map((x) => x.toLowerCase().trim()));
  for (const bullet of b.bullets) {
    const key = bullet.toLowerCase().trim();
    if (key && !seen.has(key)) {
      bullets.push(bullet);
      seen.add(key);
    }
  }

  return {
    ...a,
    role: a.role.length >= b.role.length ? a.role : b.role,
    company: a.company.length >= b.company.length ? a.company : b.company,
    startDate: a.startDate || b.startDate,
    endDate: a.endDate || b.endDate || '',
    bullets: bullets.slice(0, 12),
  };
}

export function dedupeExperienceList(
  items: CVData['experience'],
): CVData['experience'] {
  const out: CVData['experience'] = [];
  for (const item of items) {
    if (!item.role?.trim() && !item.company?.trim() && !(item.bullets?.length ?? 0)) {
      continue;
    }
    const dupIdx = out.findIndex((existing) => experiencesOverlap(existing, item));
    if (dupIdx >= 0) {
      out[dupIdx] = mergeExperiencePair(out[dupIdx], item);
    } else {
      out.push(item);
    }
  }
  return out;
}
