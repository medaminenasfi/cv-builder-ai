import { dedupeExperienceList } from '../src/common/experience-dedupe.util';
import { enrichCVFromRawText, extractExperienceFromText } from '../src/common/resume-text.util';
import { emptyCVData, newCvId } from '../src/common/cv-schema';
import { validateAndRepairCVData } from '../src/common/cv-parse-validate.util';

const sampleCv = `
Mohamed Amine Nasfi
Développeur Full-Stack

Profil
Diplômé en Business Information Systems.

Expérience
Développeur Full-Stack Janvier 2026 – Présent
Freelance · À distance
Livraison de projets clients déployés en production avec Docker et VPS.

Développeur Full-Stack Septembre 2025 – Décembre 2025
Alterance · Tunis
Développement d'applications web avec React et Node.js.

Stagiaire Développeur Juin 2025 – Août 2025
ESSAT Gabès
Stage de fin d'études sur une application de gestion.
`;

const extracted = extractExperienceFromText(sampleCv);
console.log('Heuristic extract count:', extracted.length, extracted.map((e) => `${e.role} @ ${e.company}`));

const aiLike = emptyCVData('fr');
aiLike.experience = [
  {
    id: newCvId(),
    role: 'Développeur Full-Stack',
    company: 'Freelance · À distance',
    startDate: 'Janvier 2026',
    endDate: 'present',
    bullets: ['Livraison de projets clients déployés en production avec Docker et VPS.'],
  },
  {
    id: newCvId(),
    role: 'Développeur Full-Stack',
    company: 'Alterance · Tunis',
    startDate: 'Septembre 2025',
    endDate: 'Décembre 2025',
    bullets: ["Développement d'applications web avec React et Node.js."],
  },
  {
    id: newCvId(),
    role: 'Stagiaire Développeur',
    company: 'ESSAT Gabès',
    startDate: 'Juin 2025',
    endDate: 'Août 2025',
    bullets: ["Stage de fin d'études sur une application de gestion."],
  },
];

let enriched = enrichCVFromRawText(aiLike, sampleCv);
enriched = validateAndRepairCVData(enriched);

console.log('After enrich+validate (should stay 3):', enriched.experience.length);
enriched.experience.forEach((e, i) => {
  console.log(`${i + 1}. ${e.role} | ${e.company} | ${e.startDate} – ${e.endDate}`);
});

const dupes = dedupeExperienceList([
  ...aiLike.experience,
  {
    id: newCvId(),
    role: 'Développeur Full-Stack',
    company: 'Freelance',
    startDate: 'Janvier 2026',
    endDate: 'present',
    bullets: ['Duplicate bullet'],
  },
]);
console.log('Dedupe 4->3:', dupes.length === 3 ? 'OK' : `FAIL (${dupes.length})`);
