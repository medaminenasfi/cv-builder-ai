import { newCvId, normalizeCVData, type CVData } from './cv-schema';
import { parseAiJson } from '../modules/ai/ai-json.util';

type LooseRecord = Record<string, unknown>;

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return [];
}

function pickString(...values: unknown[]): string {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function coerceBullets(entry: LooseRecord): string[] {
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
  return {
    id: pickString(e.id) || newCvId(),
    company: pickString(e.company, e.employer, e.organization, e.organisation),
    role: pickString(e.role, e.position, e.jobTitle, e.title, e.job),
    startDate: pickString(e.startDate, e.start, e.from, e.dateStart),
    endDate: pickString(e.endDate, e.end, e.to, e.dateEnd) || 'present',
    bullets: coerceBullets(e),
  };
}

function coerceEducationEntry(raw: unknown) {
  const e = (raw && typeof raw === 'object' ? raw : {}) as LooseRecord;
  return {
    id: pickString(e.id) || newCvId(),
    institution: pickString(e.institution, e.school, e.university, e.college),
    degree: pickString(e.degree, e.diploma, e.qualification, e.field),
    startDate: pickString(e.startDate, e.start, e.from, e.year),
    endDate: pickString(e.endDate, e.end, e.to),
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

function coerceNamedList(raw: unknown, withLevel = false): Array<{ id: string; name: string; level?: string }> {
  return coerceSkills(raw).map((s) => ({
    id: s.id,
    name: s.name,
    level: withLevel ? s.level : undefined,
  }));
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
      projects.push({
        id: pickString(o.id) || newCvId(),
        name,
        description: pickString(o.description, o.summary) || undefined,
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
  const personalRaw = (o.personal ?? o.contact ?? o.header ?? {}) as LooseRecord;

  const personal = {
    fullName: pickString(personalRaw.fullName, personalRaw.name, o.fullName, o.name),
    title: pickString(personalRaw.title, personalRaw.jobTitle, personalRaw.headline, o.title),
    email: pickString(personalRaw.email, o.email),
    phone: pickString(personalRaw.phone, personalRaw.telephone, personalRaw.mobile, o.phone),
    location: pickString(personalRaw.location, personalRaw.address, personalRaw.city, o.location),
    linkedin: pickString(personalRaw.linkedin, personalRaw.linkedIn, o.linkedin),
    website: pickString(personalRaw.website, personalRaw.portfolio, personalRaw.url, o.website),
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

  return {
    personal,
    summary: summary || undefined,
    experience: experienceRaw.map(coerceExperienceEntry),
    education: educationRaw.map(coerceEducationEntry),
    skills: coerceSkills(
      asArray(skillsRaw).length ? skillsRaw : o.competences ?? o.competencies,
    ),
    languages: coerceNamedList(languagesRaw, true),
    technologies: coerceNamedList(
      asArray(technologiesRaw).length
        ? technologiesRaw
        : o.technicalSkills ?? o.technical_skills,
    ).map(({ id, name }) => ({ id, name })),
    certifications: coerceCertifications(certificationsRaw),
    projects: coerceProjects(projectsRaw),
  };
}

export function parseAndCoerceAiCV(raw: string, locale: 'en' | 'fr' | 'ar'): CVData {
  const json = parseAiJson<unknown>(raw);
  const coerced = coerceAiParseResult(json);
  return normalizeCVData(coerced, locale);
}
