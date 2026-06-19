---
name: CV Builder Full Plan
overview: Plan détaillé pour construire l'AI Resume Builder & Enhancer from scratch avec Next.js 14, NestJS, PostgreSQL/TypeORM, en suivant l'ordre M01→M12, le schéma CV canonique, et le support RTL dès le départ.
todos:
  - id: m01-backend-setup
    content: "M01 Step 1 — Créer dossier backend/, init NestJS, installer toutes les dépendances backend, docker-compose PostgreSQL, .env.example"
    status: pending
  - id: m01-auth
    content: "M01 Step 2 — Auth module (UserEntity, JWT, refresh tokens, RolesGuard, migrations) + frontend login/register minimal"
    status: pending
  - id: bootstrap-frontend
    content: "Scaffold frontend/ Next.js 14 + packages/shared (types User + CV schema Zod)"
    status: pending
  - id: m02-templates
    content: M02 — TemplateEntity, admin CRUD, template-engine avec RTL, galerie user
    status: pending
  - id: m03-multicv
    content: M03 — CVEntity, CVVersionEntity, dashboard cards, plan limits (3 free / illimité pro)
    status: pending
  - id: m04-m05-builder-parser
    content: M04+M05 — Manual builder + section picker + upload/parse pipeline (PDF/DOCX/OCR) + review/edit step
    status: pending
  - id: m06-export
    content: M06 — Puppeteer PDF export, S3 storage, rate limits
    status: pending
  - id: qa-sprint-1
    content: "QA Sprint #1 — E2E Playwright, auth/CV/template/import/export/RTL tests"
    status: pending
  - id: m07-ai-enhancer
    content: M07 — Claude enhancer service, 4 tones, diff preview accept/reject
    status: pending
  - id: m08-job-match
    content: M08 — Job matcher, ATS score, skill radar, score history, ATS simulator
    status: pending
  - id: m09-m10-i18n-growth
    content: M09+M10 — next-intl AR/FR/EN RTL + cover letter + interview coach
    status: pending
  - id: qa-sprint-2
    content: "QA Sprint #2 — Flow C, i18n, AI quality, performance"
    status: pending
  - id: m11-m12-final
    content: M11+M12 — LinkedIn import, collaboration links, Stripe billing, Phase 3 extras
    status: pending
isProject: false
---

# Plan détaillé — AI Resume Builder & Enhancer

## Contexte

Le dossier [`cv Builder`](c:\Users\Medam\Desktop\Project Web &tools\Profitable APP\cv Builder) est **vide** (greenfield). Ce plan part de zéro et suit votre ordre final confirmé : **M01 → M02 → M03 → M04+M05 → M06 → QA → M07 → M08 → M09+M10 → QA → M11+M12**.

---

## Architecture cible

```mermaid
flowchart TB
  subgraph client [Next.js 14 Frontend]
    Pages[App Router Pages]
    UI[shadcn/ui + Tailwind]
    Intl[next-intl AR/FR/EN]
    Preview[CV Preview + RTL Renderer]
  end

  subgraph api [NestJS API]
    AuthMod[M01 Auth]
    TemplatesMod[M02 Templates]
    CVsMod[M03 CVs]
    BuilderMod[M04 Builder]
    ParserMod[M05 Parser]
    ExportMod[M06 Export]
    AIMod[M07-M08 AI Services]
    GrowthMod[M09-M12 Growth]
  end

  subgraph data [PostgreSQL]
    Users[(users)]
    Templates[(templates)]
    CVs[(cvs)]
    CVVersions[(cv_versions)]
    Jobs[(job_descriptions)]
    Scores[(ats_scores)]
  end

  subgraph external [External]
    Claude[Claude API]
    Storage[S3-compatible Storage]
  end

  Pages --> api
  Preview --> TemplatesMod
  AuthMod --> Users
  CVsMod --> CVs
  CVsMod --> CVVersions
  AIMod --> Claude
  TemplatesMod --> Storage
  ExportMod --> Storage
```

### Structure projet recommandée

```
cv-builder/
├── backend/                 # NestJS — créé en M01 (priorité #1)
│   ├── src/
│   ├── package.json
│   ├── nest-cli.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/                # Next.js 14 (App Router) — après backend auth
├── packages/
│   ├── shared/              # Types, CV schema Zod, constants
│   └── template-engine/     # HTML/CSS renderer + RTL (M02)
├── docker-compose.yml       # PostgreSQL + (optionnel) MinIO
├── pnpm-workspace.yaml      # optionnel — ou npm dans backend/ seul au départ
└── README.md
```

**Choix techniques verrouillés :**
- **Auth** : JWT access + refresh, bcrypt, `@nestjs/passport`
- **ORM** : TypeORM + migrations (pas de `synchronize: true` en prod)
- **Validation** : Zod côté shared, `class-validator` côté NestJS
- **Export PDF** : **Puppeteer** (meilleur rendu HTML/CSS des templates admin) — `react-pdf` en fallback Phase 3 si besoin
- **Storage** : MinIO local / S3 prod pour thumbnails, uploads, PDFs générés
- **Queue** : BullMQ + Redis pour parsing OCR et jobs IA longs (Phase 2)

---

## Décision critique #1 — Schéma CV canonique (Semaine 1, jour 1)

Tout module lit/écrit ce JSON. **Ne pas le modifier** après M04 sans migration explicite.

```typescript
// packages/shared/src/cv-schema.ts
interface CVData {
  meta: {
    locale: 'en' | 'fr' | 'ar';
    direction: 'ltr' | 'rtl';
    tone?: 'professional' | 'creative' | 'technical' | 'academic';
    sections: SectionKey[];  // section picker (Flow B)
  };
  personal: {
    fullName: string;
    title: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    website?: string;
    photoUrl?: string;
    anonymous?: boolean;       // Phase 3
  };
  summary?: string;
  experience: Array<{
    id: string;
    company: string;
    role: string;
    location?: string;
    startDate: string;       // ISO YYYY-MM
    endDate?: string | 'present';
    bullets: string[];
  }>;
  education: Array<{ id: string; institution: string; degree: string; field?: string; startDate: string; endDate?: string; gpa?: string }>;
  skills: Array<{ id: string; name: string; level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'; category?: string }>;
  projects?: Array<{ id: string; name: string; url?: string; description: string; techStack?: string[] }>;
  certifications?: Array<{ id: string; name: string; issuer: string; date?: string }>;
  languages?: Array<{ id: string; name: string; level: string }>;
  customSections?: Array<{ id: string; title: string; content: string }>;
}
```

---

## Décision critique #2 — RTL dès M02

Le renderer (`packages/template-engine`) accepte `direction: 'rtl'` et :
- injecte `dir="rtl"` sur le root
- inverse l'ordre des colonnes sidebar/main
- force `text-align: right` sur les blocs texte
- utilise des polices compatibles arabe (Noto Sans Arabic)

Les templates admin stockent **une seule structure HTML** ; le CSS gère LTR/RTL via classes `[dir="rtl"]`.

---

## Schéma base de données (PostgreSQL)

```mermaid
erDiagram
  users ||--o{ cvs : owns
  users ||--o{ refresh_tokens : has
  templates ||--o{ cvs : uses
  cvs ||--o{ cv_versions : has
  cvs ||--o{ job_attachments : has
  job_attachments ||--o{ ats_scores : tracks
  users {
    uuid id PK
    email UK
    password_hash
    role enum
    plan enum
    locale
    created_at
  }
  templates {
    uuid id PK
    slug UK
    name
    html_structure
    css
    thumbnail_url
    is_active
    supports_rtl
    created_by FK
  }
  cvs {
    uuid id PK
    user_id FK
    template_id FK
    title
    locale
    current_version_id FK
    job_title_target
    created_at
    updated_at
  }
  cv_versions {
    uuid id PK
    cv_id FK
    version_number
    data jsonb
    source enum
    created_at
  }
  job_attachments {
    uuid id PK
    cv_id FK
    raw_text
    source_url
    parsed_requirements jsonb
  }
  ats_scores {
    uuid id PK
    job_attachment_id FK
    cv_version_id FK
    score int
    breakdown jsonb
    simulator enum
    created_at
  }
```

**Limites plan :**
- `free` : max 3 CVs actifs
- `pro` : illimité
- Guard NestJS `@PlanLimit('cvs')` sur `POST /cvs`

---

## Modules — détail complet

### M01 — Backend setup + Auth + Rôles (Semaine 1) — PRIORITÉ ABSOLUE

M01 se découpe en **2 étapes obligatoires dans cet ordre** :

#### M01 Step 1 — Créer le dossier `backend/` + installer toutes les dépendances

**Actions (première session de code) :**

1. Créer la structure racine :
   ```
   backend/
   ├── src/
   │   ├── main.ts
   │   ├── app.module.ts
   │   ├── config/
   │   ├── common/
   │   └── modules/
   ├── test/
   ├── package.json
   ├── nest-cli.json
   ├── tsconfig.json
   ├── tsconfig.build.json
   └── .env.example
   ```

2. Initialiser NestJS dans `backend/` :
   ```bash
   cd backend
   npx @nestjs/cli new . --package-manager npm --skip-git
   ```

3. **Installer toutes les dépendances backend** (M01 + futures modules — une seule fois) :

   **Production (`dependencies`) :**
   | Package | Usage |
   |---------|-------|
   | `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` | Core NestJS |
   | `@nestjs/config` | Variables `.env` |
   | `@nestjs/typeorm`, `typeorm`, `pg` | PostgreSQL ORM |
   | `@nestjs/passport`, `passport`, `passport-jwt` | Auth JWT |
   | `@nestjs/jwt` | Sign/verify tokens |
   | `bcrypt` | Hash passwords |
   | `class-validator`, `class-transformer` | DTO validation |
   | `@nestjs/swagger`, `swagger-ui-express` | API docs (dev) |
   | `@nestjs/throttler` | Rate limiting |
   | `@nestjs/bullmq`, `bullmq`, `ioredis` | Queues async (M05+) |
   | `@aws-sdk/client-s3` | File storage (M02+) |
   | `@anthropic-ai/sdk` | Claude API (M07+) |
   | `cheerio` | Job scraping (M08+) |
   | `pdf-parse`, `mammoth`, `tesseract.js` | CV parsing (M05+) |
   | `puppeteer` | PDF export (M06+) |
   | `dompurify`, `jsdom` | Sanitize HTML templates (M02+) |
   | `uuid` | IDs |

   **Dev (`devDependencies`) :**
   | Package | Usage |
   |---------|-------|
   | `@nestjs/cli`, `@nestjs/schematics`, `@nestjs/testing` | CLI + tests |
   | `@types/bcrypt`, `@types/passport-jwt`, `@types/node` | Types |
   | `typescript`, `ts-node`, `tsconfig-paths` | TS runtime |
   | `eslint`, `@typescript-eslint/*`, `prettier` | Lint/format |
   | `jest`, `ts-jest`, `@types/jest`, `supertest`, `@types/supertest` | Tests |

   **Commande unique d'installation :**
   ```bash
   cd backend
   npm install @nestjs/config @nestjs/typeorm typeorm pg \
     @nestjs/passport passport passport-jwt @nestjs/jwt bcrypt \
     class-validator class-transformer @nestjs/swagger swagger-ui-express \
     @nestjs/throttler @nestjs/bullmq bullmq ioredis \
     @aws-sdk/client-s3 @anthropic-ai/sdk cheerio \
     pdf-parse mammoth tesseract.js puppeteer dompurify jsdom uuid

   npm install -D @types/bcrypt @types/passport-jwt @types/supertest
   ```

4. Ajouter `docker-compose.yml` à la racine (PostgreSQL 16) :
   ```yaml
   services:
     postgres:
       image: postgres:16
       ports: ["5432:5432"]
       environment:
         POSTGRES_USER: cvbuilder
         POSTGRES_PASSWORD: cvbuilder
         POSTGRES_DB: cvbuilder
     redis:
       image: redis:7
       ports: ["6379:6379"]
   ```

5. Créer `backend/.env.example` :
   ```
   PORT=3001
   DATABASE_URL=postgresql://cvbuilder:cvbuilder@localhost:5432/cvbuilder
   JWT_SECRET=change-me
   JWT_REFRESH_SECRET=change-me-too
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   REDIS_URL=redis://localhost:6379
   ```

6. Configurer TypeORM dans `app.module.ts` (connection PostgreSQL, `synchronize: false`, migrations folder).

7. Vérifier : `npm run start:dev` → API répond sur `http://localhost:3001`.

**Livrable Step 1 :** dossier `backend/` opérationnel, toutes deps installées, DB connectée, serveur NestJS démarre.

---

#### M01 Step 2 — Module Auth + Rôles

**Backend (`backend/src/modules/auth/`)**
- `UserEntity` : email, passwordHash, role (`user` | `admin`), plan (`free` | `pro`), locale
- `RefreshTokenEntity` (rotation, révocation)
- Endpoints : `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
- `JwtStrategy` + `JwtAuthGuard`
- `RolesGuard` + décorateur `@Roles('admin')`
- Migration initiale : tables `users`, `refresh_tokens`

**Frontend (`frontend/`) — minimal dans M01**
- Pages : `/login`, `/register`
- Middleware Next.js : redirect si non authentifié sur routes `/dashboard/*`
- HTTP client avec intercepteur refresh token (cookie httpOnly)

**Livrables M01 complets :** backend folder + deps installées + auth fonctionnelle + frontend login/register.

---

### M02 — Templates + Admin (Semaine 2)

**Backend**
- `TemplateEntity` + CRUD admin : `POST/PUT/DELETE /admin/templates`
- Upload thumbnail + validation HTML/CSS (sanitize avec DOMPurify côté serveur)
- `GET /templates` (public, filtre `is_active = true`)
- Désactivation soft : `is_active = false` — les CVs existants gardent leur `template_id`

**Frontend**
- Admin : `/admin/templates` — liste, upload, preview, toggle actif
- User : galerie templates dans le builder

**Package `template-engine`**
- `renderTemplate(html, css, cvData, { direction, locale })` → HTML string
- Tests snapshot LTR + RTL

**Livrables :** admin gère templates ; user voit uniquement les actifs ; preview fonctionne.

---

### M03 — Multi-CV Manager (Semaine 3)

**Backend**
- `CVEntity` + `CVVersionEntity`
- Endpoints :
  - `GET /cvs` — liste avec pagination
  - `POST /cvs` — créer (vérifie limite plan)
  - `GET /cvs/:id`, `PATCH /cvs/:id`, `DELETE /cvs/:id`
  - `POST /cvs/:id/duplicate`
  - `GET /cvs/:id/versions` — historique

**Frontend — Dashboard (`/dashboard`)**
- Grille de cards : titre, date MAJ, thumbnail template, badge score ATS (si job attaché)
- Actions : ouvrir, dupliquer, supprimer, renommer
- Empty state → CTA "Créer un CV"

**Livrables :** un user free ne peut pas créer un 4e CV ; dashboard opérationnel.

---

### M04 + M05 — Builder manuel + Parser (Semaines 4–5, en parallèle)

#### M04 — Flow B : Build from Scratch

**Parcours utilisateur :**
1. Choisir template (M02)
2. **Section picker** — cocher Summary, Skills, Projects, Certifications, etc.
3. Remplir sections (formulaires dynamiques)
4. Preview live (debounced)
5. Sauvegarde auto → nouvelle `cv_version`

**Frontend (`/dashboard/cvs/[id]/edit`)**
- Stepper ou sidebar navigation par section
- Validation Zod par section
- Preview split-pane (desktop) / toggle (mobile)

**Backend**
- `PATCH /cvs/:id/data` — merge partiel du JSON
- Chaque save crée une version (ou debounce 30s → 1 version)

#### M05 — Flow A : Upload & Parse

**Parcours utilisateur :**
1. Upload PDF / DOCX / image scannée
2. Parsing async (BullMQ job)
3. **Review Data** — afficher champs extraits
4. **Edit & correct** — corriger erreurs OCR/parsing
5. Continuer vers builder ou IA

**Backend (`backend/src/modules/parser/`)**
- `pdf-parse` → texte structuré
- `mammoth.js` → DOCX
- `tesseract.js` → images (OCR)
- Pipeline : extract → Claude structured output → map vers `CVData`
- `POST /cvs/import` → retourne `jobId` ; `GET /jobs/:id/status`

**Frontend**
- Upload drag-and-drop
- Progress bar polling
- Écran review avec champs éditables inline

**Livrables :** Flow A et Flow B aboutissent au même `CVData` dans `cv_versions`.

---

### M06 — Export PDF (Semaine 5–6)

**Backend**
- `POST /cvs/:id/export/pdf`
- Puppeteer headless : render HTML du template-engine → PDF A4
- Stockage S3 + URL signée (expiration 1h)
- Rate limit : 10 exports/heure (free), illimité (pro)

**Frontend**
- Bouton "Télécharger PDF" dans editor + dashboard
- Preview print CSS

**Livrables :** PDF pixel-perfect identique au preview, LTR et RTL.

---

### QA Sprint #1 (Fin semaine 6)

Checklist :
- Auth flows (register, login, refresh, logout)
- CRUD CVs + limites plan
- 3 templates actifs, 1 inactif invisible
- Builder complet + section picker
- Import PDF/DOCX (5 fichiers test)
- Export PDF LTR + RTL
- Tests E2E Playwright : happy path Flow B

---

### M07 — AI Enhancer + Tone Selector (Semaines 7–8)

**Backend (`backend/src/modules/ai/`)**
- `POST /cvs/:id/enhance`
- Body : `{ sections: ['summary', 'experience'], tone: 'professional' | 'creative' | 'technical' | 'academic' }`
- Prompt Claude : rewrite bullets, quantifier résultats, mots-clés ATS-friendly
- Retourne diff preview (avant/après) — user accepte ou rejette par section

**Frontend**
- Panel "Améliorer avec IA"
- Toggle tone (4 options)
- Diff view section par section
- "Appliquer" → nouvelle `cv_version` source=`ai_enhanced`

**Livrables :** enhancement contrôlé, pas de remplacement aveugle.

---

### M08 — Job Match Mode + ATS (Semaines 9–10)

**Flow C — Parcours :**
1. Coller URL job (LinkedIn/Indeed) ou texte JD
2. Scraping Cheerio + fallback paste manuel
3. Analyse IA : requirements vs CV skills
4. Score ATS global + breakdown (keywords, format, sections)
5. Rewrite suggestions ciblées
6. **Score history** — graphique évolution après chaque rewrite

**Backend**
- `JobAttachmentEntity` + `ATSScoreEntity`
- `POST /cvs/:id/jobs` — attach JD
- `POST /cvs/:id/jobs/:jobId/match` — score + gaps
- `POST /cvs/:id/jobs/:jobId/rewrite` — suggestions
- `GET /cvs/:id/jobs/:jobId/scores` — historique

**Frontend**
- `/dashboard/cvs/[id]/job-match`
- Score gauge + breakdown cards
- **Skill gap radar chart** (Recharts) — skills requis vs possédés
- Timeline score history

**ATS Simulator (M08 subset)**
- Simuler parsing Greenhouse / Workday / Lever (règles différentes par `simulator` enum)
- Afficher "ce que l'ATS verrait" vs CV humain

**Livrables :** Flow C complet avec historique de scores.

---

### M09 + M10 — i18n/RTL + Cover Letter & Interview Coach (Semaines 11–12, parallèle)

#### M09 — Internationalisation

- `next-intl` : routes `/[locale]/...` (en, fr, ar)
- Fichiers messages : `messages/en.json`, `fr.json`, `ar.json`
- UI traduite ; contenu CV = locale du CV (pas de l'UI)
- RTL layout global quand `locale === 'ar'`
- Dates/nombres localisés

#### M10 — Cover Letter + Interview Coach

**Cover letter**
- `POST /cvs/:id/jobs/:jobId/cover-letter`
- Génère lettre dans la langue du CV
- Editor + export PDF

**Interview coach**
- `POST /cvs/:id/jobs/:jobId/interview-questions`
- 5 questions basées sur gaps JD/CV + réponses suggérées

**Livrables :** app trilingue ; cover letter + prep entretien par job attaché.

---

### QA Sprint #2 (Fin semaine 12)

- Flow C end-to-end avec 3 JD réels
- RTL Arabic : UI + CV + PDF
- AI enhance 4 tones
- Cover letter qualité
- Performance : export PDF < 5s

---

### M11 + M12 — Growth Features (Semaines 13–16, parallèle)

#### M11 — LinkedIn Import + Collaboration

**LinkedIn import**
- Paste URL profil → scrape public (ou import manuel JSON si blocage)
- Map vers `CVData` → pre-fill builder

**Collaboration / feedback**
- `ShareLinkEntity` : token unique, expiration, read-only + comments
- `/share/[token]` — viewer externe, commentaires inline par section
- Notifications email (optionnel)

#### M12 — Billing + Phase 3 nice-to-haves

**Billing (Stripe)**
- Checkout pro plan
- Webhook → update `user.plan`
- Portal client

**Nice-to-have intégrés si temps :**
- Anonymous CV toggle (`personal.anonymous`)
- Salary insights (API externe ou Claude estimate — disclaimer)
- Direct apply (liens deep-link LinkedIn/Indeed, pas d'API officielle)

---

## Flows utilisateur — récapitulatif

```mermaid
flowchart LR
  subgraph flowA [Flow A Upload Parse]
    A1[Upload] --> A2[Parse async]
    A2 --> A3[Review Data]
    A3 --> A4[Edit correct]
    A4 --> A5[Builder ou IA]
  end

  subgraph flowB [Flow B Build Scratch]
    B1[Choose template] --> B2[Section picker]
    B2 --> B3[Fill sections]
    B3 --> B4[Preview save]
  end

  subgraph flowC [Flow C Job Match]
    C1[Attach JD] --> C2[ATS score]
    C2 --> C3[Rewrite]
    C3 --> C4[Score history]
    C4 --> C5[Cover letter]
  end

  flowA --> Export[Export PDF]
  flowB --> Export
  flowC --> Export
```

---

## API — structure NestJS

```
backend/src/
├── main.ts
├── app.module.ts
├── common/
│   ├── guards/        # JwtAuthGuard, RolesGuard, PlanLimitGuard
│   ├── decorators/    # @CurrentUser(), @Roles()
│   └── filters/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── templates/
│   ├── cvs/
│   ├── parser/
│   ├── export/
│   ├── ai/
│   ├── jobs/
│   ├── cover-letter/
│   ├── sharing/
│   └── billing/
└── config/
```

---

## Frontend — pages clés

| Route | Module | Description |
|-------|--------|-------------|
| `/[locale]/login` | M01 | Auth |
| `/[locale]/dashboard` | M03 | Grille CVs |
| `/[locale]/dashboard/cvs/new` | M04 | Création Flow B |
| `/[locale]/dashboard/cvs/[id]/edit` | M04 | Editor |
| `/[locale]/dashboard/cvs/[id]/import` | M05 | Flow A |
| `/[locale]/dashboard/cvs/[id]/job-match` | M08 | Flow C |
| `/[locale]/admin/templates` | M02 | Admin templates |
| `/[locale]/share/[token]` | M11 | Feedback externe |

---

## Variables d'environnement

**API (`backend/.env`)**
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
ANTHROPIC_API_KEY=...
REDIS_URL=...
S3_ENDPOINT=...
S3_BUCKET=...
STRIPE_SECRET_KEY=...        # M12
```

**Web (`frontend/.env.local`)**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Ordre d'exécution — Gantt simplifié

| Semaine | Modules | Focus |
|---------|---------|-------|
| 1 | M01 | **backend/ folder + install deps**, auth, users, guards |
| 2 | M02 | Templates admin + renderer RTL |
| 3 | M03 | Multi-CV dashboard |
| 4–5 | M04 + M05 | Builder + Parser (parallèle) |
| 5–6 | M06 | Export PDF |
| 6 | QA #1 | Tests foundation |
| 7–8 | M07 | AI Enhancer + tones |
| 9–10 | M08 | Job match + ATS + radar |
| 11–12 | M09 + M10 | i18n + cover letter + coach |
| 12 | QA #2 | Tests AI + i18n |
| 13–16 | M11 + M12 | LinkedIn, sharing, billing |

---

## Première session de code (M01 bootstrap)

Quand vous passerez en mode Agent, la première PR suivra **exactement cet ordre** :

**Step 1 — Backend folder + dependencies (jour 1)**
1. Créer dossier `backend/` à la racine du projet
2. `npx @nestjs/cli new backend` — scaffold NestJS
3. `npm install` — **toutes** les dépendances backend (liste complète ci-dessus M01 Step 1)
4. `docker-compose.yml` — PostgreSQL 16 + Redis
5. `backend/.env.example` + config TypeORM
6. `npm run start:dev` — vérifier que l'API démarre sur port 3001

**Step 2 — Auth module (jour 2–3)**
7. Module Auth : `UserEntity`, `RefreshTokenEntity`, JWT, guards
8. Migration initiale TypeORM (`users`, `refresh_tokens`)
9. Endpoints register/login/refresh/logout/me testés via Swagger

**Step 3 — Frontend minimal (jour 3)**
10. Scaffold `frontend/` Next.js 14 (login/register pages)
11. README : `docker compose up -d && cd backend && npm install && npm run start:dev`

**Estimation M01 complet :** 2–3 jours dev solo (Step 1 = ~2–4h).

---

## Risques et mitigations

| Risque | Mitigation |
|--------|------------|
| Scraping LinkedIn/Indeed bloqué | Fallback paste manuel JD ; LinkedIn import via export PDF user |
| OCR qualité variable | Étape "Edit & correct" obligatoire (Flow A) |
| RTL retrofit coûteux | Flag `direction` dans renderer dès M02 |
| Schéma CV instable | Package `shared` versionné ; migrations JSONB si changement |
| Coût API Claude | Cache réponses, debounce, limites par plan |

---

## Critères de succès MVP (fin QA #1, semaine 6)

- User s'inscrit, crée 3 CVs max (free), choisit template, remplit sections, exporte PDF
- Admin upload/active/désactive templates
- Import PDF basique → review → edit → save
- Preview RTL Arabic fonctionnel

## Critères de succès v1 (fin QA #2, semaine 12)

- Flow C complet avec score history et skill radar
- AI enhance 4 tones
- App trilingue AR/FR/EN
- Cover letter générée par job
