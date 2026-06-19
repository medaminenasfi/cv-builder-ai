import type { CVData } from '../common/cv-schema';

export interface RenderOptions {
  direction?: 'ltr' | 'rtl';
  locale?: string;
}

const SAMPLE: CVData = {
  meta: { locale: 'en', direction: 'ltr', sections: [] },
  personal: {
    fullName: 'John Doe',
    title: 'Software Engineer',
    email: 'john@example.com',
  },
  summary: 'Experienced developer.',
  experience: [
    {
      id: '1',
      company: 'TechCorp',
      role: 'Developer',
      startDate: '2022-01',
      endDate: 'present',
      bullets: ['Built scalable APIs', 'Led team of 3'],
    },
  ],
  education: [],
  skills: [{ id: '1', name: 'TypeScript' }],
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderExperience(data: CVData): string {
  return data.experience
    .map(
      (exp) => `
    <div class="experience-item">
      <h3>${escapeHtml(exp.role)} — ${escapeHtml(exp.company)}</h3>
      <p class="dates">${escapeHtml(exp.startDate)} – ${escapeHtml(exp.endDate ?? '')}</p>
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

  let body = htmlStructure
    .replace(/\{\{fullName\}\}/g, escapeHtml(cvData.personal.fullName))
    .replace(/\{\{title\}\}/g, escapeHtml(cvData.personal.title))
    .replace(/\{\{email\}\}/g, escapeHtml(cvData.personal.email))
    .replace(/\{\{summary\}\}/g, escapeHtml(cvData.summary ?? ''))
    .replace(/\{\{experience\}\}/g, renderExperience(cvData))
    .replace(/\{\{skills\}\}/g, renderSkills(cvData));

  if (!body.includes('{{')) {
    body = `
      <div class="cv-root">
        <header><h1>${escapeHtml(cvData.personal.fullName)}</h1><p>${escapeHtml(cvData.personal.title)}</p></header>
        ${cvData.summary ? `<section><h2>Summary</h2><p>${escapeHtml(cvData.summary)}</p></section>` : ''}
        <section><h2>Experience</h2>${renderExperience(cvData)}</section>
        <section><h2>Skills</h2>${renderSkills(cvData)}</section>
      </div>`;
  }

  const rtlCss =
    direction === 'rtl'
      ? `[dir="rtl"] { direction: rtl; text-align: right; } [dir="rtl"] .sidebar { order: 2; }`
      : '';

  return `<!DOCTYPE html>
<html lang="${options.locale ?? cvData.meta.locale}" dir="${direction}">
<head>
  <meta charset="UTF-8"/>
  <style>${css}\n${rtlCss}</style>
</head>
<body>${body}</body>
</html>`;
}
