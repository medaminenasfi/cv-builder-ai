import type { CVData } from './cv-schema';
import { newCvId } from './cv-schema';

const EMAIL_RE = /^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i;

function dedupeByKey<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const k = key(item).toLowerCase().trim();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function normalizeDate(d: string): string {
  const t = d.trim();
  if (/aujourd|present|présent|الآن|now/i.test(t)) return 'present';
  if (/^\d{4}$/.test(t)) return t;
  return t.slice(0, 20);
}

const LANG_ALIASES: Record<string, string> = {
  french: 'Français',
  francais: 'Français',
  fr: 'Français',
  english: 'English',
  anglais: 'English',
  en: 'English',
  arabic: 'Arabic',
  arabe: 'Arabic',
  ar: 'Arabic',
};

export function validateAndRepairCVData(data: CVData): CVData {
  const personal = { ...data.personal };
  if (personal.email && !EMAIL_RE.test(personal.email)) {
    personal.email = personal.email.match(EMAIL_RE)?.[0] ?? personal.email;
  }
  if (personal.fullName) {
    personal.fullName = personal.fullName.replace(/\s+/g, ' ').trim().slice(0, 80);
  }

  let experience = data.experience
    .map((e) => ({
      ...e,
      company: e.company?.trim() ?? '',
      role: e.role?.trim() ?? '',
      startDate: normalizeDate(e.startDate ?? ''),
      endDate: normalizeDate(e.endDate ?? ''),
      bullets: (e.bullets ?? []).map((b) => b.trim()).filter(Boolean).slice(0, 12),
    }))
    .filter((e) => e.company || e.role || e.bullets.length > 0);

  experience = dedupeByKey(
    experience,
    (e) => `${e.company}|${e.role}|${e.startDate}`,
  );

  let education = data.education
    .map((e) => ({
      ...e,
      institution: e.institution?.trim() ?? '',
      degree: e.degree?.trim() ?? '',
      startDate: normalizeDate(e.startDate ?? ''),
      endDate: normalizeDate(e.endDate ?? ''),
    }))
    .filter((e) => e.institution || e.degree);

  education = dedupeByKey(education, (e) => `${e.institution}|${e.degree}`);

  const languages = data.languages.map((l) => {
    const raw = l.name.trim();
    const normalized = LANG_ALIASES[raw.toLowerCase()] ?? raw;
    return { ...l, id: l.id || newCvId(), name: normalized, level: l.level?.trim() };
  });

  const techKeywords = new Set([
    'react', 'node', 'python', 'java', 'docker', 'aws', 'typescript', 'javascript',
    'sql', 'mongodb', 'postgresql', 'kubernetes', 'git', 'html', 'css', 'vue', 'angular',
    'next.js', 'nestjs', 'spring', 'flutter', 'android', 'ios', 'linux', 'azure', 'gcp',
  ]);

  let skills = [...data.skills];
  let technologies = [...data.technologies];

  for (const skill of [...skills]) {
    const key = skill.name.toLowerCase();
    if (techKeywords.has(key) || /\.(js|ts|py|net)$/.test(key)) {
      if (!technologies.some((t) => t.name.toLowerCase() === key)) {
        technologies.push({ id: newCvId(), name: skill.name });
      }
      skills = skills.filter((s) => s.id !== skill.id);
    }
  }

  skills = dedupeByKey(skills, (s) => s.name).slice(0, 40);
  technologies = dedupeByKey(technologies, (t) => t.name).slice(0, 40);

  return {
    ...data,
    personal,
    experience,
    education,
    skills,
    languages,
    technologies,
    summary: data.summary?.trim() ?? '',
  };
}
