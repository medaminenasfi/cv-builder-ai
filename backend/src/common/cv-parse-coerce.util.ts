import { newCvId, normalizeCVData, type CVData } from './cv-schema';
import { parseAiJson } from '../modules/ai/ai-json.util';

type LooseRecord = Record<string, unknown>;

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return [];
}

function sanitizePlainText(value: string): string {
  let s = value.trim();
  const mdLink = s.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (mdLink) {
    const label = mdLink[1].trim();
    const href = mdLink[2].trim();
    if (/^mailto:/i.test(href)) return href.replace(/^mailto:/i, '').trim();
    if (/^https?:\/\//i.test(href)) return href;
    return label;
  }
  return s.replace(/^mailto:/i, '').trim();
}

const PLACEHOLDER_LINKS = new Set(
  ['linkedin', 'github', 'portfolio', 'website', 'link', 'url', 'n/a', 'na', '-'].map(
    (s) => s.toLowerCase(),
  ),
);

function sanitizeContactField(value: string, kind: 'email' | 'url' | 'text'): string {
  const cleaned = sanitizePlainText(value);
  if (!cleaned) return '';

  if (kind === 'email') {
    const emailMatch = cleaned.match(/[\w.+-]+@[\w.-]+\.\w+/);
    return emailMatch?.[0] ?? cleaned;
  }

  if (kind === 'url') {
    const lower = cleaned.toLowerCase();
    if (PLACEHOLDER_LINKS.has(lower)) return '';
    if (/^https?:\/\//i.test(cleaned)) return cleaned;
    if (cleaned.includes('.') && !/\s/.test(cleaned)) {
      return cleaned.startsWith('www.') ? `https://${cleaned}` : `https://${cleaned}`;
    }
    return '';
  }

  return cleaned;
}
function pickString(...values: unknown[]): string {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function coerceBullets(entry: LooseRecord): string[] {
  if (Array.isArray(entry.description)) {
    return entry.description.map(String).map((b) => b.trim()).filter(Boolean);
  }
  const candidates = [
    entry.bullets,
    entry.responsibilities,
    entry.highlights,
    entry.achievements,
    entry.tasks,
    entry.descriptions,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) {
      return c.map(String).map((b) => b.trim()).filter(Boolean);
    }
    if (typeof c === 'string' && c.trim()) {
      return c.split(/\n|•|·|- /).map((b) => b.trim()).filter(Boolean);
    }
  }
  if (typeof entry.description === 'string' && entry.description.trim()) {
    return [entry.description.trim()];
  }
  return [];
}

function coerceExperienceEntry(raw: unknown) {
  const e = (raw && typeof raw === 'object' ? raw : {}) as LooseRecord;
  const endRaw = pickString(e.endDate, e.end_date, e.end, e.to, e.dateEnd);
  return {
    id: pickString(e.id) || newCvId(),
    company: pickString(e.company, e.employer, e.organization, e.organisation),
    role: pickString(e.role, e.position, e.jobTitle, e.title, e.job),
    startDate: pickString(e.startDate, e.start_date, e.start, e.from, e.dateStart),
    endDate:
      endRaw && /^present$/i.test(endRaw) ? 'present' : endRaw || 'present',
    bullets: coerceBullets(e),
  };
}

function coerceEducationEntry(raw: unknown) {
  const e = (raw && typeof raw === 'object' ? raw : {}) as LooseRecord;
  const degree = pickString(e.degree, e.diploma, e.qualification, e.field);
  const grade = pickString(e.grade, e.honors, e.honours);
  const location = pickString(e.location, e.city);
  const degreeWithMeta = [degree, grade ? `(${grade})` : '', location ? `— ${location}` : '']
    .filter(Boolean)
    .join(' ')
    .trim();
  return {
    id: pickString(e.id) || newCvId(),
    institution: pickString(e.institution, e.school, e.university, e.college),
    degree: degreeWithMeta || degree,
    startDate: pickString(
      e.startDate,
      e.start_date,
      e.start,
      e.from,
      e.year,
      e.start_year != null ? String(e.start_year) : undefined,
    ),
    endDate: pickString(
      e.endDate,
      e.end_date,
      e.end,
      e.to,
      e.end_year != null ? String(e.end_year) : undefined,
    ),
  };
}

function coerceSkills(raw: unknown): CVData['skills'] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === 'string') {
          return { id: newCvId(), name: item.trim() };
        }
        if (item && typeof item === 'object') {
          const o = item as LooseRecord;
          const name = pickString(o.name, o.skill, o.label, o.title);
          return name
            ? {
                id: pickString(o.id) || newCvId(),
                name,
                level: pickString(o.level) || undefined,
              }
            : null;
        }
        return null;
      })
      .filter((s): s is CVData['skills'][number] => Boolean(s?.name));
  }
  if (typeof raw === 'object') {
    const o = raw as LooseRecord;
    const flat: string[] = [];
    for (const val of Object.values(o)) {
      if (typeof val === 'string') flat.push(val);
      else if (Array.isArray(val)) flat.push(...val.map(String));
    }
    return flat
      .map((name) => ({ id: newCvId(), name: name.trim() }))
      .filter((s) => s.name);
  }
  return [];
}

function coerceLanguages(raw: unknown): CVData['languages'] {
  if (!Array.isArray(raw)) return [];
  const out: CVData['languages'] = [];
  for (const item of raw) {
    if (typeof item === 'string' && item.trim()) {
      out.push({ id: newCvId(), name: item.trim() });
      continue;
    }
    if (item && typeof item === 'object') {
      const o = item as LooseRecord;
      const name = pickString(o.name, o.language, o.lang, o.label);
      if (!name) continue;
      const level = pickString(o.level, o.proficiency, o.fluency);
      out.push({
        id: pickString(o.id) || newCvId(),
        name,
        ...(level ? { level } : {}),
      });
    }
  }
  return out;
}

function collectTechnologies(...sources: unknown[]): CVData['technologies'] {
  const names = new Set<string>();
  for (const source of sources) {
    if (Array.isArray(source)) {
      for (const item of source) {
        if (typeof item === 'string' && item.trim()) names.add(item.trim());
        else if (item && typeof item === 'object') {
          const n = pickString(
            (item as LooseRecord).name,
            (item as LooseRecord).skill,
            (item as LooseRecord).label,
          );
          if (n) names.add(n);
        }
      }
    } else if (source && typeof source === 'object') {
      for (const val of Object.values(source as LooseRecord)) {
        if (typeof val === 'string' && val.trim()) names.add(val.trim());
        else if (Array.isArray(val)) {
          for (const s of val) {
            if (typeof s === 'string' && s.trim()) names.add(s.trim());
          }
        }
      }
    }
  }
  return [...names].map((name) => ({ id: newCvId(), name }));
}

function coerceCertifications(raw: unknown): CVData['certifications'] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === 'string') {
          return { id: newCvId(), name: item.trim() };
        }
        if (item && typeof item === 'object') {
          const o = item as LooseRecord;
          const name = pickString(o.name, o.title, o.certification);
          return name
            ? {
                id: pickString(o.id) || newCvId(),
                name,
                issuer: pickString(o.issuer, o.organization) || undefined,
                date: pickString(o.date, o.year) || undefined,
              }
            : null;
        }
        return null;
      })
      .filter((c): c is CVData['certifications'][number] => Boolean(c?.name));
  }
  return [];
}

function coerceProjects(raw: unknown): CVData['projects'] {
  if (!Array.isArray(raw)) return [];
  const projects: CVData['projects'] = [];
  for (const item of raw) {
    if (typeof item === 'string') {
      const name = item.trim();
      if (name) projects.push({ id: newCvId(), name, bullets: [] });
      continue;
    }
    if (item && typeof item === 'object') {
      const o = item as LooseRecord;
      const name = pickString(o.name, o.title, o.project);
      if (!name) continue;
      const techLine = Array.isArray(o.technologies)
        ? o.technologies.map(String).filter(Boolean).join(', ')
        : '';
      const typeLine = pickString(o.type);
      projects.push({
        id: pickString(o.id) || newCvId(),
        name,
        description:
          [pickString(o.description, o.summary), typeLine, techLine ? `Tech: ${techLine}` : '']
            .filter(Boolean)
            .join(' — ') || undefined,
        bullets: coerceBullets(o),
      });
    }
  }
  return projects;
}

/** Map varied AI / legacy JSON shapes into CVData partial before normalizeCVData. */
export function coerceAiParseResult(raw: unknown): Partial<CVData> {
  if (!raw || typeof raw !== 'object') return {};

  const o = raw as LooseRecord;
  const personalInfo =
    o.personal_info && typeof o.personal_info === 'object'
      ? (o.personal_info as LooseRecord)
      : undefined;
  const personalRaw = (
    o.personal ?? o.contact ?? o.header ?? personalInfo ?? {}
  ) as LooseRecord;

  const personal = {
    fullName: pickString(
      personalRaw.fullName,
      personalRaw.full_name,
      personalRaw.name,
      personalInfo?.full_name,
      o.fullName,
      o.full_name,
      o.name,
    ),
    title: pickString(
      personalRaw.title,
      personalRaw.jobTitle,
      personalRaw.headline,
      o.title,
      o.job_title,
    ),
    email: sanitizeContactField(
      pickString(personalRaw.email, personalInfo?.email, o.email),
      'email',
    ),
    phone: sanitizePlainText(
      pickString(
        personalRaw.phone,
        personalRaw.telephone,
        personalRaw.mobile,
        personalInfo?.phone,
        o.phone,
      ),
    ),
    location: pickString(
      personalRaw.location,
      personalRaw.address,
      personalRaw.city,
      o.location,
    ),
    linkedin: sanitizeContactField(
      pickString(
        personalRaw.linkedin,
        personalRaw.linkedIn,
        personalInfo?.linkedin,
        o.linkedin,
      ),
      'url',
    ),
    website: sanitizeContactField(
      pickString(
        personalRaw.website,
        personalRaw.portfolio,
        personalInfo?.portfolio,
        o.website,
        o.portfolio,
      ),
      'url',
    ) ||
      sanitizeContactField(
        pickString(personalInfo?.github, personalRaw.github, o.github),
        'url',
      ),
  };

  const summary = pickString(
    o.summary,
    o.profil,
    o.profile,
    o.objective,
    o.about,
    o.bio,
    o.professionalSummary,
  );

  const experienceRaw = asArray(
    o.experience ??
      o.workExperience ??
      o.work_experience ??
      o.employment ??
      o.jobs ??
      o.positions,
  );

  const educationRaw = asArray(
    o.education ?? o.formations ?? o.educationHistory ?? o.studies ?? o.academic,
  );

  const skillsRaw =
    o.skills ?? o.softSkills ?? o.soft_skills;

  const technologiesRaw =
    o.technologies ??
      o.tools ??
      o.techStack ??
      o.tech_stack ??
      o.competencesTechniques ??
      o.competences_techniques;

  const languagesRaw = o.languages ?? o.langues ?? o.languageSkills;

  const certificationsRaw = o.certifications ?? o.certificats ?? o.certificates;

  const projectsRaw = o.projects ?? o.projets ?? o.personalProjects;

  const jobTechnologies = experienceRaw.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const tech = (item as LooseRecord).technologies;
    return Array.isArray(tech) ? tech.map(String) : [];
  });

  return {
    personal,
    summary: summary || undefined,
    experience: experienceRaw.map(coerceExperienceEntry),
    education: educationRaw.map(coerceEducationEntry),
    skills: coerceSkills(
      asArray(skillsRaw).length ? skillsRaw : o.competences ?? o.competencies,
    ),
    languages: coerceLanguages(languagesRaw),
    technologies: collectTechnologies(
      technologiesRaw,
      o.technicalSkills,
      o.technical_skills,
      jobTechnologies,
    ),
    certifications: coerceCertifications(certificationsRaw),
    projects: coerceProjects(projectsRaw),
  };
}

export function parseAndCoerceAiCV(raw: string, locale: 'en' | 'fr' | 'ar'): CVData {
  const json = parseAiJson<unknown>(raw);
  const coerced = coerceAiParseResult(json);
  return normalizeCVData(coerced, locale);
}
