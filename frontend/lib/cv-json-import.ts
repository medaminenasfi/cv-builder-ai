/**
 * Professional prompt for ChatGPT / Claude — attach your CV PDF first.
 * Note: JSON = CONTENT only. Fonts, colors, layout = choose a template in the app (/templates).
 */
export const CHATGPT_CV_JSON_PROMPT = `You are a resume data extractor. Convert the attached CV/resume into ONE valid JSON object.

IMPORTANT — content only (no design):
- Do NOT include fonts, colors, margins, or layout — the app applies those via templates.
- Output plain text values only — NO markdown, NO [links](url), NO bold/italic.

Schema (use exactly these keys):
{
  "personal_info": {
    "full_name": "",
    "phone": "",
    "email": "",
    "linkedin": "",
    "github": "",
    "portfolio": ""
  },
  "profile": "",
  "education": [
    {
      "institution": "",
      "location": "",
      "degree": "",
      "grade": "",
      "start_year": 2022,
      "end_year": 2025
    }
  ],
  "experience": [
    {
      "title": "",
      "company": "",
      "location": "",
      "start_date": "YYYY-MM",
      "end_date": "Present",
      "description": ["bullet 1", "bullet 2"],
      "technologies": ["React", "Node.js"]
    }
  ],
  "projects": [
    {
      "name": "",
      "description": "",
      "technologies": []
    }
  ],
  "skills": {
    "frontend": [],
    "backend": [],
    "mobile": [],
    "databases": [],
    "devops": [],
    "security": [],
    "tools": []
  },
  "languages": [
    { "language": "", "level": "" }
  ]
}

Strict rules:
1. Extract EVERY job, school, project, skill, and language — never skip sections.
2. email = plain address only (example: user@domain.com) — never markdown mailto links.
3. linkedin, github, portfolio = full https:// URLs copied from the CV, or "" if not visible.
   Never use placeholder words like "LinkedIn", "GitHub", or "Portfolio" as values.
4. description = array of achievement bullets (strings), one per line of the CV.
5. technologies = tools/frameworks per job or project (not spoken languages).
6. skills = group into frontend, backend, mobile, databases, devops, security, tools.
7. Keep French/Arabic/English text exactly as written in the CV.
8. Dates: experience use YYYY-MM; education use start_year/end_year as numbers.
9. Use "" for missing fields — do not invent employers, URLs, or dates.
10. Output ONLY the JSON object — no code fences, no explanation.`;

export function downloadCvJsonExample(filename = 'my-cv.json') {
  const blob = new Blob([JSON.stringify(CV_JSON_EXAMPLE, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyChatGptPrompt() {
  await navigator.clipboard.writeText(CHATGPT_CV_JSON_PROMPT);
}

/** Minimal example — replace with your ChatGPT output */
export const CV_JSON_EXAMPLE = {
  personal_info: {
    full_name: 'Mohamed Amine Nasfi',
    phone: '+21627711810',
    email: 'medaminenasfy@gmail.com',
    linkedin: 'https://linkedin.com/in/your-profile',
    github: 'https://github.com/your-username',
    portfolio: '',
  },
  profile:
    'Développeur Full-Stack spécialisé en React/Next.js et Node.js/NestJS…',
  education: [
    {
      institution: 'ESSAT Gabès',
      location: 'Gabès, Tunisie',
      degree: 'Licence en Systèmes d’Information de Gestion',
      grade: 'Mention Excellent',
      start_year: 2022,
      end_year: 2025,
    },
  ],
  experience: [
    {
      title: 'Développeur Full-Stack',
      company: 'Freelance',
      location: 'À distance',
      start_date: '2026-01',
      end_date: 'Present',
      description: [
        'Livraison de 4 projets clients déployés en production avec Docker et VPS.',
      ],
      technologies: ['Next.js', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
    },
  ],
  projects: [
    {
      name: 'Eventify',
      description: 'Plateforme de gestion d’événements web et mobile.',
      technologies: ['Node.js', 'React.js', 'Flutter', 'Stripe'],
    },
  ],
  skills: {
    frontend: ['React.js', 'Next.js', 'TypeScript'],
    backend: ['Node.js', 'NestJS'],
    mobile: ['Flutter'],
    databases: ['PostgreSQL', 'MongoDB'],
    devops: ['Docker', 'CI/CD', 'Nginx'],
    security: ['JWT'],
    tools: ['Git', 'VS Code', 'Figma'],
  },
  languages: [
    { language: 'Arabe', level: 'Langue maternelle' },
    { language: 'Français', level: 'Professionnel' },
    { language: 'Anglais', level: 'Professionnel' },
  ],
} as const;
