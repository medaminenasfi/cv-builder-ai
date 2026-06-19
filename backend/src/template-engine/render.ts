import type { CVData } from '../common/cv-schema';

export interface RenderOptions {
  direction?: 'ltr' | 'rtl';
  locale?: string;
}

const SAMPLE: CVData = {
  meta: { locale: 'fr', direction: 'ltr', sections: [] },
  personal: {
    fullName: 'Mohamed Amine Nasfi',
    title: 'Développeur Full-Stack',
    email: 'medaminenasfy@gmail.com',
    phone: '+216 27 711 810',
    location: 'Gabès, Tunisie',
    linkedin: 'https://linkedin.com/in/example',
    website: 'https://portfolio.example.com',
  },
  summary:
    'Diplômé en Business Information Systems avec expérience en Python, Pandas, analyse de données et automatisation.',
  experience: [
    {
      id: '1',
      company: 'Freelance · À distance',
      role: 'Développeur Full-Stack',
      startDate: 'Janvier 2026',
      endDate: 'present',
      bullets: [
        'Livraison de projets clients déployés en production avec Docker et VPS.',
        'Technologies : Next.js, React, Node.js, PostgreSQL, Docker, CI/CD.',
      ],
    },
  ],
  education: [
    {
      id: '1',
      institution: 'ESSAT Gabès',
      degree: "Licence en Systèmes d'Information de Gestion — Mention Excellent",
      startDate: '2022',
      endDate: '2025',
    },
  ],
  skills: [
    { id: '1', name: 'React.js' },
    { id: '2', name: 'Next.js' },
    { id: '3', name: 'Node.js' },
    { id: '4', name: 'PostgreSQL' },
    { id: '5', name: 'Docker' },
  ],
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDateRange(start: string, end?: string | 'present'): string {
  const endLabel = end === 'present' ? 'Présent' : (end ?? '');
  return endLabel ? `${start} – ${endLabel}` : start;
}

function renderContactLine(data: CVData): string {
  const { personal } = data;
  const parts: string[] = [];
  if (personal.phone) parts.push(escapeHtml(personal.phone));
  if (personal.email) {
    parts.push(
      `<a href="mailto:${escapeHtml(personal.email)}">${escapeHtml(personal.email)}</a>`,
    );
  }
  if (personal.linkedin) {
    parts.push(
      `<a href="${escapeHtml(personal.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>`,
    );
  }
  if (personal.website) {
    parts.push(
      `<a href="${escapeHtml(personal.website)}" target="_blank" rel="noopener">Portfolio</a>`,
    );
  }
  return parts.join(' <span class="sep">|</span> ');
}

function renderEducation(data: CVData): string {
  if (!data.education.length) return '';
  return data.education
    .map(
      (edu) => `
    <div class="education-item">
      <div class="edu-row">
        <span class="edu-institution">${escapeHtml(edu.institution)}</span>
        ${data.personal.location ? `<span class="edu-location">${escapeHtml(data.personal.location)}</span>` : ''}
      </div>
      <p class="edu-degree">
        ${escapeHtml(edu.degree)}
        <span class="edu-dates">${escapeHtml(formatDateRange(edu.startDate, edu.endDate))}</span>
      </p>
    </div>`,
    )
    .join('');
}

function renderExperience(data: CVData): string {
  return data.experience
    .map(
      (exp) => `
    <div class="experience-item">
      <div class="exp-row">
        <span class="exp-role">${escapeHtml(exp.role)}</span>
        <span class="exp-dates">${escapeHtml(formatDateRange(exp.startDate, exp.endDate))}</span>
      </div>
      <p class="exp-meta">${escapeHtml(exp.company)}</p>
      <ul>${exp.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
    </div>`,
    )
    .join('');
}

function renderSkills(data: CVData): string {
  return data.skills
    .map((s) => `<span class="skill">${escapeHtml(s.name)}</span>`)
    .join('');
}

export function renderTemplate(
  htmlStructure: string,
  css: string,
  cvData: CVData = SAMPLE,
  options: RenderOptions = {},
): string {
  const direction =
    options.direction ?? cvData.meta.direction ?? 'ltr';

  const useFallback = !htmlStructure.trim() || !htmlStructure.includes('{{');

  let body = htmlStructure
    .replace(/\{\{fullName\}\}/g, escapeHtml(cvData.personal.fullName))
    .replace(/\{\{title\}\}/g, escapeHtml(cvData.personal.title))
    .replace(/\{\{email\}\}/g, escapeHtml(cvData.personal.email))
    .replace(/\{\{phone\}\}/g, escapeHtml(cvData.personal.phone ?? ''))
    .replace(/\{\{location\}\}/g, escapeHtml(cvData.personal.location ?? ''))
    .replace(/\{\{linkedin\}\}/g, escapeHtml(cvData.personal.linkedin ?? ''))
    .replace(/\{\{website\}\}/g, escapeHtml(cvData.personal.website ?? ''))
    .replace(/\{\{contactLine\}\}/g, renderContactLine(cvData))
    .replace(/\{\{summary\}\}/g, escapeHtml(cvData.summary ?? ''))
    .replace(/\{\{education\}\}/g, renderEducation(cvData))
    .replace(/\{\{experience\}\}/g, renderExperience(cvData))
    .replace(/\{\{skills\}\}/g, renderSkills(cvData));

  if (useFallback) {
    const educationBlock = cvData.education.length
      ? `<section><h2>Education</h2>${renderEducation(cvData)}</section>`
      : '';
    body = `
      <div class="cv-root">
        <header><h1>${escapeHtml(cvData.personal.fullName)}</h1><p>${escapeHtml(cvData.personal.title)}</p></header>
        ${cvData.summary ? `<section><h2>Summary</h2><p>${escapeHtml(cvData.summary)}</p></section>` : ''}
        ${educationBlock}
        <section><h2>Experience</h2>${renderExperience(cvData)}</section>
        <section><h2>Skills</h2>${renderSkills(cvData)}</section>
      </div>`;
  }

  const rtlCss =
    direction === 'rtl'
      ? `[dir="rtl"] { direction: rtl; text-align: right; } [dir="rtl"] .sidebar { order: 2; }`
      : '';

  const previewBase =
    'html,body{margin:0;padding:0;background:#ffffff;color:#111;min-height:100%;}';

  return `<!DOCTYPE html>
<html lang="${options.locale ?? cvData.meta.locale}" dir="${direction}">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>${previewBase}\n${css}\n${rtlCss}</style>
</head>
<body>${body}</body>
</html>`;
}
