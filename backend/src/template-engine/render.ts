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
  ],
  languages: [{ id: '1', name: 'Français', level: 'Courant' }],
  technologies: [
    { id: '1', name: 'Node.js' },
    { id: '2', name: 'Docker' },
  ],
  certifications: [],
  projects: [],
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Upgrade legacy templates that only show email so location/phone appear in preview. */
function normalizeTemplateContactPlaceholders(html: string): string {
  return html
    .replace(
      /<p class="subtitle">\{\{title\}\}\s*·\s*\{\{email\}\}<\/p>/gi,
      '<p class="subtitle">{{title}}</p><p class="contact">{{contactLine}}</p>',
    )
    .replace(
      /<p>\{\{title\}\}<\/p>\s*<p>\{\{email\}\}<\/p>/gi,
      '<p>{{title}}</p><p>{{contactLine}}</p>',
    )
    .replace(/<p class="email">\{\{email\}\}<\/p>/gi, '<p class="contact">{{contactLine}}</p>');
}

function formatDateRange(start: string, end?: string | 'present'): string {
  const endLabel = end === 'present' ? 'Présent' : (end ?? '');
  return endLabel ? `${start} – ${endLabel}` : start;
}

function renderContactLine(data: CVData): string {
  const { personal } = data;
  const parts: string[] = [];
  if (personal.location) parts.push(escapeHtml(personal.location));
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

function renderTechnologies(data: CVData): string {
  return data.technologies
    .map((t) => `<span class="skill tech">${escapeHtml(t.name)}</span>`)
    .join('');
}

function renderLanguages(data: CVData): string {
  return data.languages
    .map((l) => {
      const label = l.level ? `${l.name} — ${l.level}` : l.name;
      return `<span class="language">${escapeHtml(label)}</span>`;
    })
    .join('');
}

function renderCertifications(data: CVData): string {
  if (!data.certifications.length) return '';
  return data.certifications
    .map((c) => {
      const meta = [c.issuer, c.date].filter(Boolean).join(' · ');
      return `<div class="cert-item"><strong>${escapeHtml(c.name)}</strong>${meta ? `<span class="cert-meta"> — ${escapeHtml(meta)}</span>` : ''}</div>`;
    })
    .join('');
}

function renderProjects(data: CVData): string {
  if (!data.projects.length) return '';
  return data.projects
    .map((p) => {
      const bullets =
        p.bullets && p.bullets.length
          ? `<ul>${p.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`
          : '';
      const desc = p.description ? `<p>${escapeHtml(p.description)}</p>` : '';
      return `<div class="project-item"><strong>${escapeHtml(p.name)}</strong>${desc}${bullets}</div>`;
    })
    .join('');
}

const SECTION_TITLES: Record<string, Record<'en' | 'fr' | 'ar', string>> = {
  summary: { en: 'Summary', fr: 'Profil', ar: 'الملخص' },
  experience: { en: 'Experience', fr: 'Expérience', ar: 'الخبرة' },
  education: { en: 'Education', fr: 'Formation', ar: 'التعليم' },
  skills: { en: 'Skills', fr: 'Compétences', ar: 'المهارات' },
  languages: { en: 'Languages', fr: 'Langues', ar: 'اللغات' },
  technologies: { en: 'Technologies', fr: 'Technologies', ar: 'التقنيات' },
  certifications: { en: 'Certifications', fr: 'Certifications', ar: 'الشهادات' },
  projects: { en: 'Projects', fr: 'Projets', ar: 'المشاريع' },
};

function sectionTitle(key: string, locale: string): string {
  const loc = (locale === 'fr' || locale === 'ar' ? locale : 'en') as 'en' | 'fr' | 'ar';
  return SECTION_TITLES[key]?.[loc] ?? SECTION_TITLES[key]?.en ?? key;
}

function isSectionVisible(data: CVData, key: string): boolean {
  const sections = data.meta?.sections;
  if (!sections?.length) return true;
  return sections.includes(key);
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

  const locale = (options.locale ?? cvData.meta.locale ?? 'en') as string;

  let body = normalizeTemplateContactPlaceholders(htmlStructure)
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
    .replace(/\{\{skills\}\}/g, renderSkills(cvData))
    .replace(/\{\{languages\}\}/g, renderLanguages(cvData))
    .replace(/\{\{technologies\}\}/g, renderTechnologies(cvData))
    .replace(/\{\{certifications\}\}/g, renderCertifications(cvData))
    .replace(/\{\{projects\}\}/g, renderProjects(cvData));

  for (const key of Object.keys(SECTION_TITLES)) {
    body = body.replace(
      new RegExp(`\\{\\{${key}Title\\}\\}`, 'g'),
      sectionTitle(key, locale),
    );
  }

  if (useFallback) {
    const loc = locale;
    const educationBlock = cvData.education.length
      ? `<section><h2>${sectionTitle('education', loc)}</h2>${renderEducation(cvData)}</section>`
      : '';
    const langBlock =
      cvData.languages.length && isSectionVisible(cvData, 'languages')
        ? `<section><h2>${sectionTitle('languages', loc)}</h2>${renderLanguages(cvData)}</section>`
        : '';
    const techBlock =
      cvData.technologies.length && isSectionVisible(cvData, 'technologies')
        ? `<section><h2>${sectionTitle('technologies', loc)}</h2>${renderTechnologies(cvData)}</section>`
        : '';
    body = `
      <div class="cv-root">
        <header><h1>${escapeHtml(cvData.personal.fullName)}</h1><p>${escapeHtml(cvData.personal.title)}</p><p>${renderContactLine(cvData)}</p></header>
        ${cvData.summary ? `<section><h2>${sectionTitle('summary', loc)}</h2><p>${escapeHtml(cvData.summary)}</p></section>` : ''}
        ${educationBlock}
        <section><h2>${sectionTitle('experience', loc)}</h2>${renderExperience(cvData)}</section>
        ${langBlock}
        ${techBlock}
        <section><h2>${sectionTitle('skills', loc)}</h2>${renderSkills(cvData)}</section>
      </div>`;
  }

  const rtlCss =
    direction === 'rtl'
      ? `[dir="rtl"] { direction: rtl; text-align: right; } [dir="rtl"] .sidebar { order: 2; }`
      : '';

  const previewBase = `
html,body{margin:0;padding:0;background:#ffffff;color:#111;min-height:100%;}
@page{size:A4;margin:12mm;}
@media screen{
  body{background:#e8eaed;}
  .cv-page{
    width:210mm;
    min-height:297mm;
    margin:16px auto;
    padding:12mm 15mm;
    background:#fff;
    box-shadow:0 2px 16px rgba(0,0,0,.1);
    box-sizing:border-box;
  }
}
@media print{
  body{background:#fff;}
  .cv-page{width:auto;min-height:auto;margin:0;padding:0;box-shadow:none;}
}
`;

  const wrappedBody = `<div class="cv-page">${body}</div>`;

  return `<!DOCTYPE html>
<html lang="${options.locale ?? cvData.meta.locale}" dir="${direction}">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(cvData.personal.fullName || 'CV')} — Preview</title>
  <style>${previewBase}\n${css}\n${rtlCss}</style>
</head>
<body>${wrappedBody}</body>
</html>`;
}
