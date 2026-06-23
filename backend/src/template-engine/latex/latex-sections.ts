import type { CVData } from '../../common/cv-schema';
import { escapeLatex } from './latex-escape';

function latexDateRange(start: string, end?: string | 'present'): string {
  const endLabel = end === 'present' ? 'Présent' : (end ?? '');
  const startEsc = escapeLatex(start);
  if (!endLabel) return startEsc;
  return `${startEsc} -- ${escapeLatex(endLabel)}`;
}

export type LatexSectionStyle = 'simple' | 'jake';

/** Header contact: phone | email | LinkedIn | Portfolio (Jake-style) */
export function renderLatexContactLine(data: CVData): string {
  const { personal } = data;
  const parts: string[] = [];
  if (personal.phone) parts.push(escapeLatex(personal.phone));
  if (personal.email) {
    parts.push(
      `\\href{mailto:${escapeLatex(personal.email)}}{\\underline{${escapeLatex(personal.email)}}}`,
    );
  }
  if (personal.linkedin) {
    parts.push(
      `\\href{${escapeLatex(personal.linkedin)}}{\\underline{LinkedIn}}`,
    );
  }
  if (personal.website) {
    parts.push(
      `\\href{${escapeLatex(personal.website)}}{\\underline{Portfolio}}`,
    );
  }
  return parts.join(' $\\quad|\\quad$ ');
}

function renderJakeEducation(data: CVData): string {
  if (!data.education.length) return '';
  const items = data.education
    .map((edu) => {
      const dates = latexDateRange(edu.startDate, edu.endDate);
      const loc = escapeLatex(data.personal.location ?? '');
      return `  \\resumeSubheading{${escapeLatex(edu.institution)}}{${loc}}{${escapeLatex(edu.degree)}}{${dates}}`;
    })
    .join('\n');
  return `\\resumeSubHeadingListStart\n${items}\n\\resumeSubHeadingListEnd`;
}

function renderSimpleEducation(data: CVData): string {
  if (!data.education.length) return '';
  return data.education
    .map((edu) => {
      const dates = latexDateRange(edu.startDate, edu.endDate);
      return `\\textbf{${escapeLatex(edu.degree)}} -- ${escapeLatex(edu.institution)} \\hfill ${dates}`;
    })
    .join('\n\n');
}

export function renderLatexEducation(
  data: CVData,
  style: LatexSectionStyle = 'simple',
): string {
  return style === 'jake'
    ? renderJakeEducation(data)
    : renderSimpleEducation(data);
}

function renderJakeExperience(data: CVData): string {
  if (!data.experience.length) return '';
  const items = data.experience
    .map((exp) => {
      const dates = latexDateRange(exp.startDate, exp.endDate);
      const bullets = exp.bullets
        .map((b) => `      \\resumeItem{${escapeLatex(b)}}`)
        .join('\n');
      const bulletBlock =
        bullets.length > 0
          ? `\n    \\resumeItemListStart\n${bullets}\n    \\resumeItemListEnd`
          : '';
      return `  \\resumeSubheading{${escapeLatex(exp.role)}}{${dates}}{${escapeLatex(exp.company)}}{}${bulletBlock}`;
    })
    .join('\n\n');
  return `\\resumeSubHeadingListStart\n${items}\n\\resumeSubHeadingListEnd`;
}

function renderSimpleExperience(data: CVData): string {
  if (!data.experience.length) return '';
  return data.experience
    .map((exp) => {
      const dates = latexDateRange(exp.startDate, exp.endDate);
      const bullets = exp.bullets
        .map((b) => `  \\item ${escapeLatex(b)}`)
        .join('\n');
      const list =
        bullets.length > 0
          ? `\n\\begin{itemize}[leftmargin=*]\n${bullets}\n\\end{itemize}`
          : '';
      return `\\textbf{${escapeLatex(exp.role)}} -- ${escapeLatex(exp.company)} \\hfill ${dates}\\\\[2pt]${list}`;
    })
    .join('\n\n');
}

export function renderLatexExperience(
  data: CVData,
  style: LatexSectionStyle = 'simple',
): string {
  return style === 'jake'
    ? renderJakeExperience(data)
    : renderSimpleExperience(data);
}

function renderJakeSkills(data: CVData): string {
  const parts: string[] = [];
  if (data.skills.length) {
    const names = data.skills.map((s) => escapeLatex(s.name)).join(', ');
    parts.push(`\\item \\textbf{Compétences :} ${names}.`);
  }
  if (data.technologies.length) {
    const names = data.technologies.map((t) => escapeLatex(t.name)).join(', ');
    parts.push(`\\item \\textbf{Technologies :} ${names}.`);
  }
  if (!parts.length) return '';
  return `\\begin{itemize}[leftmargin=0.18in, label={}, topsep=2pt, itemsep=1pt, parsep=0pt]\n\\footnotesize{\n${parts.join('\n')}\n}\n\\end{itemize}`;
}

function renderSimpleSkills(data: CVData): string {
  if (!data.skills.length) return '';
  return data.skills.map((s) => escapeLatex(s.name)).join(', ');
}

export function renderLatexSkills(
  data: CVData,
  style: LatexSectionStyle = 'simple',
): string {
  return style === 'jake' ? renderJakeSkills(data) : renderSimpleSkills(data);
}

function renderJakeTechnologies(_data: CVData): string {
  return '';
}

function renderSimpleTechnologies(data: CVData): string {
  if (!data.technologies.length) return '';
  return data.technologies.map((t) => escapeLatex(t.name)).join(', ');
}

export function renderLatexTechnologies(
  data: CVData,
  style: LatexSectionStyle = 'simple',
): string {
  return style === 'jake'
    ? renderJakeTechnologies(data)
    : renderSimpleTechnologies(data);
}

function renderJakeLanguages(data: CVData): string {
  if (!data.languages.length) return '';
  const items = data.languages
    .map(
      (l) =>
        `  \\resumeLangHeading{${escapeLatex(l.name)}}{${escapeLatex(l.level ?? '')}}`,
    )
    .join('\n');
  return `\\resumeSubHeadingListStart\n${items}\n\\resumeSubHeadingListEnd`;
}

function renderSimpleLanguages(data: CVData): string {
  if (!data.languages.length) return '';
  return data.languages
    .map((l) => {
      const level = l.level ? ` (${escapeLatex(l.level)})` : '';
      return `${escapeLatex(l.name)}${level}`;
    })
    .join(', ');
}

export function renderLatexLanguages(
  data: CVData,
  style: LatexSectionStyle = 'simple',
): string {
  return style === 'jake'
    ? renderJakeLanguages(data)
    : renderSimpleLanguages(data);
}

function renderJakeCertifications(data: CVData): string {
  if (!data.certifications.length) return '';
  return data.certifications
    .map((c) => {
      const meta = [c.issuer, c.date].filter(Boolean).join(' · ');
      return meta
        ? `  \\resumeItem{\\textbf{${escapeLatex(c.name)}} -- ${escapeLatex(meta)}}`
        : `  \\resumeItem{\\textbf{${escapeLatex(c.name)}}}`;
    })
    .join('\n');
}

function renderSimpleCertifications(data: CVData): string {
  if (!data.certifications.length) return '';
  return data.certifications
    .map((c) => {
      const meta = [c.issuer, c.date].filter(Boolean).join(' · ');
      return meta
        ? `\\textbf{${escapeLatex(c.name)}} -- ${escapeLatex(meta)}`
        : `\\textbf{${escapeLatex(c.name)}}`;
    })
    .join('\n\n');
}

export function renderLatexCertifications(
  data: CVData,
  style: LatexSectionStyle = 'simple',
): string {
  return style === 'jake'
    ? renderJakeCertifications(data)
    : renderSimpleCertifications(data);
}

function renderJakeProjects(data: CVData): string {
  if (!data.projects.length) return '';
  const items = data.projects
    .map((p) => {
      const bullets =
        p.bullets && p.bullets.length
          ? p.bullets.map((b) => `      \\resumeItem{${escapeLatex(b)}}`).join('\n')
          : p.description
            ? `      \\resumeItem{${escapeLatex(p.description)}}`
            : '';
      const bulletBlock =
        bullets.length > 0
          ? `\n    \\resumeProjectListStart\n${bullets}\n    \\resumeProjectListEnd`
          : '';
      return `  \\resumeProjectHeading{\\textbf{${escapeLatex(p.name)}}}{}${bulletBlock}`;
    })
    .join('\n\n');
  return `\\resumeSubHeadingListStart\n${items}\n\\resumeSubHeadingListEnd`;
}

function renderSimpleProjects(data: CVData): string {
  if (!data.projects.length) return '';
  return data.projects
    .map((p) => {
      const bullets =
        p.bullets && p.bullets.length
          ? p.bullets.map((b) => `  \\item ${escapeLatex(b)}`).join('\n')
          : p.description
            ? `  \\item ${escapeLatex(p.description)}`
            : '';
      const list =
        bullets.length > 0
          ? `\n\\begin{itemize}[leftmargin=*]\n${bullets}\n\\end{itemize}`
          : '';
      return `\\textbf{${escapeLatex(p.name)}}${list}`;
    })
    .join('\n\n');
}

export function renderLatexProjects(
  data: CVData,
  style: LatexSectionStyle = 'simple',
): string {
  return style === 'jake'
    ? renderJakeProjects(data)
    : renderSimpleProjects(data);
}

export function detectLatexSectionStyle(latexSource: string): LatexSectionStyle {
  return /\\newcommand\{\\resumeSubheading\}/.test(latexSource) ? 'jake' : 'simple';
}
