export const DEMO_USER = {
  email: 'demo@resumeai.com',
  password: 'Demo1234!',
  name: 'Karim Mansouri',
  plan: 'free',
  lang: 'en',
}

export const ADMIN_USER = {
  email: 'admin@resumeai.com',
  password: 'Admin1234!',
  name: 'Admin',
  role: 'admin',
}

export interface Bullet {
  id: string
  text: string
}

export interface Experience {
  id: string
  title: string
  company: string
  start: string
  end: string
  bullets: Bullet[]
}

export interface CV {
  id: string
  title: string
  template: string
  lang: string
  ats_score: number
  last_edited: string
  experience: Experience[]
  skills: string[]
  summary?: string
  education?: any[]
}

export const MOCK_CVS: CV[] = [
  {
    id: '1',
    title: 'Software Engineer CV',
    template: 'Modern',
    lang: 'EN',
    ats_score: 72,
    last_edited: '2 hours ago',
    experience: [
      {
        id: 'exp-1',
        title: 'Frontend Developer',
        company: 'TechCorp',
        start: 'Jan 2022',
        end: 'Present',
        bullets: [
          {
            id: 'bullet-1',
            text: 'Built a React dashboard used by 50,000 users',
          },
          {
            id: 'bullet-2',
            text: 'Reduced page load time by 40% through code splitting',
          },
        ],
      },
      {
        id: 'exp-2',
        title: 'Junior Developer',
        company: 'StartupABC',
        start: 'Jun 2020',
        end: 'Dec 2021',
        bullets: [
          {
            id: 'bullet-3',
            text: 'Implemented responsive UI components using React and Tailwind CSS',
          },
          {
            id: 'bullet-4',
            text: 'Collaborated with backend team to integrate REST APIs',
          },
        ],
      },
    ],
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
    summary:
      'Experienced frontend developer with 3+ years building scalable web applications.',
  },
  {
    id: '2',
    title: 'Product Manager CV',
    template: 'Classic',
    lang: 'FR',
    ats_score: 45,
    last_edited: 'Yesterday',
    experience: [
      {
        id: 'exp-3',
        title: 'Chef de Produit',
        company: 'StartupXYZ',
        start: 'Mar 2021',
        end: 'Dec 2023',
        bullets: [
          {
            id: 'bullet-5',
            text: 'Lancé 3 fonctionnalités clés avec une équipe de 8 développeurs',
          },
          {
            id: 'bullet-6',
            text: 'Augmenté le taux de rétention de 25%',
          },
        ],
      },
    ],
    skills: ['Figma', 'JIRA', 'SQL', 'Agile', 'Analytics', 'Roadmapping'],
    summary:
      'Product manager with experience launching features and driving user engagement.',
  },
]

export const TEMPLATES = [
  'Modern',
  'Classic',
  'Minimal',
  'Executive',
  'Creative',
]

export const PLAN_FEATURES = {
  free: {
    resumes: 3,
    ai_calls: 10,
  },
  pro: {
    resumes: 20,
    ai_calls: 100,
  },
}
