import type { CVData } from '../../common/cv-schema';
import { SECTION_TITLES, sectionTitle } from '../section-titles';
import { escapeLatex } from './latex-escape';
import { sanitizeLatexForTectonic } from './latex-sanitize';
import {
  detectLatexSectionStyle,
  renderLatexCertifications,
  renderLatexContactLine,
  renderLatexEducation,
  renderLatexExperience,
  renderLatexLanguages,
  renderLatexProjects,
  renderLatexSkills,
  renderLatexTechnologies,
} from './latex-sections';

export interface LatexRenderOptions {
  direction?: 'ltr' | 'rtl';
  locale?: string;
}

export const SAMPLE_CV: CVData = {
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

const DEFAULT_LATEX = `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[french]{babel}
\\usepackage[margin=2cm]{geometry}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\begin{document}
\\begin{center}
  {\\LARGE\\textbf{{{fullName}}}}\\\\[4pt]
  {{title}}\\\\[2pt]
  {{contactLine}}
\\end{center}
\\section*{{{summaryTitle}}}
{{summary}}
\\section*{{{experienceTitle}}}
{{experience}}
\\section*{{{educationTitle}}}
{{education}}
\\section*{{{skillsTitle}}}
{{skills}}
\\end{document}`;

export function renderLatex(
  latexSource: string,
  cvData: CVData = SAMPLE_CV,
  options: LatexRenderOptions = {},
): string {
  const locale = (options.locale ?? cvData.meta.locale ?? 'en') as string;
  const source = sanitizeLatexForTectonic((latexSource.trim() || DEFAULT_LATEX));
  const sectionStyle = detectLatexSectionStyle(source);

  let body = source
    .replace(/\{\{fullName\}\}/g, escapeLatex(cvData.personal.fullName))
    .replace(/\{\{title\}\}/g, escapeLatex(cvData.personal.title))
    .replace(/\{\{email\}\}/g, escapeLatex(cvData.personal.email))
    .replace(/\{\{phone\}\}/g, escapeLatex(cvData.personal.phone ?? ''))
    .replace(/\{\{location\}\}/g, escapeLatex(cvData.personal.location ?? ''))
    .replace(/\{\{linkedin\}\}/g, escapeLatex(cvData.personal.linkedin ?? ''))
    .replace(/\{\{website\}\}/g, escapeLatex(cvData.personal.website ?? ''))
    .replace(/\{\{contactLine\}\}/g, renderLatexContactLine(cvData))
    .replace(/\{\{summary\}\}/g, escapeLatex(cvData.summary ?? ''))
    .replace(/\{\{education\}\}/g, renderLatexEducation(cvData, sectionStyle))
    .replace(/\{\{experience\}\}/g, renderLatexExperience(cvData, sectionStyle))
    .replace(/\{\{skills\}\}/g, renderLatexSkills(cvData, sectionStyle))
    .replace(/\{\{languages\}\}/g, renderLatexLanguages(cvData, sectionStyle))
    .replace(/\{\{technologies\}\}/g, renderLatexTechnologies(cvData, sectionStyle))
    .replace(/\{\{certifications\}\}/g, renderLatexCertifications(cvData, sectionStyle))
    .replace(/\{\{projects\}\}/g, renderLatexProjects(cvData, sectionStyle));

  for (const key of Object.keys(SECTION_TITLES)) {
    body = body.replace(
      new RegExp(`\\{\\{${key}Title\\}\\}`, 'g'),
      escapeLatex(sectionTitle(key, locale)),
    );
  }

  return sanitizeLatexForTectonic(body);
}
