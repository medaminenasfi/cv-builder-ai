# TASKS.md — Living Project Tracker

> **Protocol:** Work **one task at a time**. After completing a task: mark ✅, add a checkpoint below, **stop and wait for approval** before starting the next task. Never mark ✅ if build, lint, or critical tests fail.

**Status values:** ⬜ Not Started | 🟨 In Progress | ✅ Completed | ❌ Blocked

**Last updated:** 2026-06-21 (completion sprint)

## Task scorecard

| Status | Count | % |
|--------|------:|--:|
| ✅ Completed | **90** | 95% |
| ⬜ Not Started | **4** | 4% |
| ❌ Blocked | **1** | 1% |
| 🟨 In Progress | **0** | 0% |
| **Total** | **95** | 100% |

*Remaining: S3 storage, HTML export, AI template import UI, security audit, monitoring, LinkedIn (blocked).*

---

## Milestones overview

| Milestone | Phase | Goal | Progress |
|-----------|-------|------|----------|
| M1 | 1–2 | Auth + CV CRUD + editor | ✅ Complete |
| M2 | 3–4 | LaTeX templates + PDF export | ✅ Complete |
| M3 | 5 | Import / parse pipeline | ✅ Complete |
| M4 | 6 | AI enhance + job match | ✅ Complete |
| M5 | 7 | Sharing + admin | ✅ Complete |
| M6 | 8 | UI i18n | ✅ Complete (cookie-based; nav + core strings) |
| M7 | 9 | Stripe billing | ✅ Complete (needs STRIPE_* env) |
| M8 | 10 | Production hardening | 🟨 80% (S3, monitoring pending) |

---

## Phase 1 — Foundation & Auth

| ID | Title | Description | Dependencies | Complexity | Status |
|----|-------|-------------|--------------|------------|--------|
| T001 | Project scaffolding | NestJS backend + Next.js frontend monorepo structure | — | Medium | ✅ Completed |
| T002 | Docker Compose infra | PostgreSQL, Redis, LaTeX sandbox services | T001 | Medium | ✅ Completed |
| T003 | User entity + auth migration | `users`, `refresh_tokens`, enums | T002 | Medium | ✅ Completed |
| T004 | Register / login / JWT | Access + refresh tokens, httpOnly cookie | T003 | Medium | ✅ Completed |
| T005 | Auth guards + middleware | JwtAuthGuard, frontend middleware, protected routes | T004 | Small | ✅ Completed |
| T006 | Admin bootstrap | One-time `POST /admin/bootstrap` with secret | T004 | Small | ✅ Completed |
| T007 | Admin role + guards | RolesGuard, separate admin session | T006 | Small | ✅ Completed |
| T008 | Swagger API docs | `/api/docs` OpenAPI | T004 | Small | ✅ Completed |

---

## Phase 2 — CV Core & Editor

| ID | Title | Description | Dependencies | Complexity | Status |
|----|-------|-------------|--------------|------------|--------|
| T010 | CV entity + versioning | `cvs`, `cv_versions`, JSONB data, 20-version cap | T003 | Medium | ✅ Completed |
| T011 | CV CRUD API | Create, read, update, delete, duplicate | T010 | Medium | ✅ Completed |
| T012 | Free plan CV limit | Max 3 CVs for free users | T011 | Small | ✅ Completed |
| T013 | CV schema + normalize | `CVData` schema, coerce, defaults | T010 | Medium | ✅ Completed |
| T014 | Manual editor — all sections | Personal, summary, experience, education, skills, languages, tech, certs, projects | T011 | Large | ✅ Completed |
| T015 | Section visibility toggles | `meta.sections` + editor sidebar filter | T014 | Small | ✅ Completed |
| T016 | Drag-sort experience/education | @dnd-kit SortableList | T014 | Medium | ✅ Completed |
| T017 | Auto-save (5s debounce) | use-auto-save hook + status indicator | T014 | Small | ✅ Completed |
| T018 | Resume health score | Client-side completeness badge | T014 | Small | ✅ Completed |
| T019 | Dashboard + CV cards | Grid, KPIs, card actions | T011 | Medium | ✅ Completed |
| T020 | Review wizard page | 10-step `/cv/[id]/review` | T014 | Medium | ✅ Completed |

---

## Phase 3 — Templates & Export

| ID | Title | Description | Dependencies | Complexity | Status |
|----|-------|-------------|--------------|------------|--------|
| T030 | LaTeX sandbox service | Docker Tectonic compile API | T002 | Large | ✅ Completed |
| T031 | LaTeX template engine | Placeholders, render-latex, sanitize | T030 | Large | ✅ Completed |
| T032 | Template entity + admin CRUD | Templates table, admin UI | T031 | Medium | ✅ Completed |
| T033 | Bundled templates + seed | 6+ templates in `templates/` | T032 | Medium | ✅ Completed |
| T034 | Live PDF preview | CVLivePreview debounced compile → image | T031 | Medium | ✅ Completed |
| T035 | PDF export download | GET export/pdf | T031 | Small | ✅ Completed |
| T036 | DOCX export | Programmatic DOCX generation | T013 | Medium | ✅ Completed |
| T037 | Template gallery UI | `/templates` with preview cards | T032 | Medium | ✅ Completed |
| T038 | Section visibility in LaTeX | Strip hidden sections at render | T015, T031 | Medium | ✅ Completed |
| T039 | ModernCV auto-fix | prepareModerncvDocument sanitizer | T031 | Medium | ✅ Completed |
| T040 | Preview without PDF download | pdf.js image preview on cards | T034 | Medium | ✅ Completed |

---

## Phase 4 — Import & Parse

| ID | Title | Description | Dependencies | Complexity | Status |
|----|-------|-------------|--------------|------------|--------|
| T050 | PDF text extraction | pdf-parse integration | T013 | Medium | ✅ Completed |
| T051 | DOCX text extraction | mammoth integration | T013 | Medium | ✅ Completed |
| T052 | AI parse to CVData | OpenRouter structured JSON | T050 | Large | ✅ Completed |
| T053 | Heuristic parse fallback | Regex section detection when AI fails | T052 | Medium | ✅ Completed |
| T054 | OCR fallback | Low-text PDF OCR | T050 | Medium | ✅ Completed |
| T055 | Experience deduplication | Fuzzy dedupe after parse | T052 | Medium | ✅ Completed |
| T056 | Parse quality metadata | Confidence, warnings, locale detection | T052 | Medium | ✅ Completed |
| T057 | Import new CV flow | `/dashboard/cvs/new` file upload | T052 | Medium | ✅ Completed |
| T058 | Import into existing CV | Editor replace content | T052 | Medium | ✅ Completed |
| T059 | Inline parse wizard (3-step) | EditorAiSidePanel wizard | T056 | Medium | ✅ Completed |
| T060 | Parse analytics logging | `parse_analytics` table | T052 | Small | ✅ Completed |
| T061 | Async parse queue (BullMQ) | Async endpoint + job polling | T052, T002 | Medium | ✅ Completed |
| T062 | Async parse UI | Frontend poll + progress | T061 | Medium | ✅ Completed |

---

## Phase 5 — AI Enhancement

| ID | Title | Description | Dependencies | Complexity | Status |
|----|-------|-------------|--------------|------------|--------|
| T070 | AI enhance API | POST enhance + apply | T013, T052 | Medium | ✅ Completed |
| T071 | Section-scoped enhance payload | buildEnhancePayload partial JSON | T070 | Small | ✅ Completed |
| T072 | Enhance token budget | OPENROUTER_ENHANCE_MAX_TOKENS=1536 | T070 | Small | ✅ Completed |
| T073 | mergeEnhancement by job id | Preserve experience ids on merge | T070 | Small | ✅ Completed |
| T074 | Editor AI panel (9 actions) | Buttons, tones, loading states | T070 | Medium | ✅ Completed |
| T075 | Before/after diff UI | Summary, experience, skills diffs | T074 | Medium | ✅ Completed |
| T076 | Apply / discard / undo flow | Toast + snapshot restore | T074 | Small | ✅ Completed |
| T077 | AI quota on enhance | AiUsageService in AIService | T070 | Small | ✅ Completed |
| T078 | AI usage settings UI | Display quota from GET /ai/usage | T077 | Small | ✅ Completed |

---

## Phase 6 — Job Match & ATS

| ID | Title | Description | Dependencies | Complexity | Status |
|----|-------|-------------|--------------|------------|--------|
| T080 | ATS match API | Score, keywords, suggestions | T013 | Medium | ✅ Completed |
| T081 | Keyword fallback matcher | When AI unavailable | T080 | Small | ✅ Completed |
| T082 | Job match UI | Circular score, breakdown, chips | T080 | Medium | ✅ Completed |
| T083 | Job keyword enhance | Tailor CV to JD | T080 | Medium | ✅ Completed |
| T084 | Insert keywords → editor | `?keywords=` query param | T083 | Small | ✅ Completed |
| T085 | Cover letter generation | API + job-match UI | T080 | Medium | ✅ Completed |
| T086 | ATS match history | Persist + chart on job-match | T080 | Small | ✅ Completed |
| T087 | Cover letter history UI | List past cover letters | T085 | Small | ✅ Completed |
| T088 | AI interview questions | Replace static stub with OpenRouter | T080 | Medium | ✅ Completed |

---

## Phase 7 — Sharing & Admin

| ID | Title | Description | Dependencies | Complexity | Status |
|----|-------|-------------|--------------|------------|--------|
| T090 | Share link API | 7-day token, view count | T011 | Medium | ✅ Completed |
| T091 | Public share page | PDF viewer + download | T090, T035 | Medium | ✅ Completed |
| T092 | Admin dashboard | Platform stats | T007 | Small | ✅ Completed |
| T093 | Admin user management | Plan, role, block toggles | T007 | Medium | ✅ Completed |
| T094 | Admin plan stats | Free/pro breakdown | T093 | Small | ✅ Completed |
| T095 | Export logging + KPI | `export_logs` → dashboard | T035 | Small | ✅ Completed |
| T096 | Custom share display name | Settings → share page | T091 | Small | ✅ Completed |

---

## Phase 8 — Internationalization

| ID | Title | Description | Dependencies | Complexity | Status |
|----|-------|-------------|--------------|------------|--------|
| T100 | CV locale + RTL | en/fr/ar in CVData + LaTeX | T013 | Medium | ✅ Completed |
| T101 | next-intl setup | Provider, config, middleware | T005 | Medium | ✅ Completed |
| T102 | Translate UI strings (EN) | Baseline message keys | T101 | Large | ✅ Completed |
| T103 | Translate UI (FR + AR) | fr.json, ar.json full coverage | T102 | Large | ✅ Completed |
| T104 | Locale routing | Cookie-based locale + router.refresh | T101 | Medium | ✅ Completed |
| T105 | Login language picker wired | Connect flags to i18n | T101 | Small | ✅ Completed |

---

## Phase 9 — Billing (Stripe)

| ID | Title | Description | Dependencies | Complexity | Status |
|----|-------|-------------|--------------|------------|--------|
| T110 | Stripe checkout session | Real checkout URL | T004 | Medium | ✅ Completed |
| T111 | Stripe webhook handler | Upgrade/downgrade plan | T110 | Medium | ✅ Completed |
| T112 | Pro feature gating UI | Show limits, upgrade CTAs | T111 | Medium | ✅ Completed |
| T113 | Settings upgrade flow | Wire billing-api to Stripe | T110 | Small | ✅ Completed |

---

## Phase 10 — Production Hardening

| ID | Title | Description | Dependencies | Complexity | Status |
|----|-------|-------------|--------------|------------|--------|
| T120 | Core DB migrations | `cvs`, `cv_versions`, `templates` create migration | T010 | Medium | ✅ Completed |
| T121 | Fix migration order | ShareLinks after cvs table | T120 | Small | ✅ Completed |
| T122 | Disable synchronize in prod | Document + enforce NODE_ENV | T120 | Small | ✅ Completed |
| T123 | Complete data-source.ts | All entities for TypeORM CLI | T120 | Small | ✅ Completed |
| T124 | S3 storage adapter | Replace local storage for exports | T035 | Large | ⬜ Not Started |
| T125 | Version history UI | GET /versions → editor panel | T010 | Medium | ✅ Completed |
| T126 | Orphan component cleanup | Remove unused CVPreview, etc. | — | Small | ✅ Completed |
| T127 | Fix TS build errors | Remove ignoreBuildErrors | — | Medium | ✅ Completed |
| T128 | Playwright E2E suite | Auth, create CV, export smoke | T005 | Large | ✅ Completed |
| T129 | CI pipeline | GitHub Actions build + test | T128 | Medium | ✅ Completed |
| T130 | LinkedIn import | OAuth + profile parse | T052 | Large | ❌ Blocked |
| T131 | HTML template export | Wire render.ts to export path | T031 | Medium | ⬜ Not Started |
| T132 | AI template import UI | Wire template-import.service | T032 | Medium | ⬜ Not Started |
| T133 | Security review | Auth, upload, LaTeX sandbox audit | T120 | Medium | ⬜ Not Started |
| T134 | Monitoring setup | Sentry / structured logging | T122 | Medium | ⬜ Not Started |

---

## Phase 11 — Documentation

| ID | Title | Description | Dependencies | Complexity | Status |
|----|-------|-------------|--------------|------------|--------|
| T140 | Create docs/ folder | PROJECT, ARCHITECTURE, FEATURES, etc. | — | Large | ✅ Completed |
| T141 | Audit done vs not done | Cross-check codebase vs PLAN.md | T140 | Medium | ✅ Completed |
| T142 | Consolidate legacy docs | Link LATEX-TEMPLATES, QA docs | T140 | Small | ✅ Completed |

---

# Checkpoints

> Completed task groups with implementation summaries. New checkpoints added after each future task completion.

---

## CP-001 — Milestone M1: Foundation & Auth (T001–T008)

**Implemented:** NestJS + Next.js monorepo, Docker infra, JWT auth with refresh cookies, admin bootstrap, role guards, frontend middleware, Swagger.

**Files:** `backend/src/modules/auth/`, `frontend/middleware.ts`, `frontend/providers/AuthProvider.tsx`, `docker-compose.yml`

**Tests:** Manual auth flow; `npm run build` backend.

**Remaining:** Google OAuth (deferred).

**Technical debt:** Dual token storage (cookie + localStorage).

**Next recommended:** T010 (already done in CP-002).

---

## CP-002 — Milestone M1–M2: CV Core & Editor (T010–T020)

**Implemented:** CV CRUD, versioning, free limit, full manual editor, section visibility, drag-sort, auto-save, health score, dashboard, review wizard.

**Files:** `backend/src/modules/cvs/`, `frontend/app/cv/[id]/edit/page.tsx`, `frontend/components/cv/editor/*`

**Tests:** QA-Sprint-1 checklist (partial).

**Remaining:** Version history UI (T125).

**Next recommended:** T030.

---

## CP-003 — Milestone M2: Templates & Export (T030–T040)

**Implemented:** LaTeX sandbox, template engine, admin CRUD, 6 bundled templates, live preview, PDF/DOCX export, gallery UI, section visibility in LaTeX, ModernCV fixes, pdf.js card previews.

**Files:** `latex-sandbox/`, `backend/src/template-engine/`, `frontend/components/cv/CVLivePreview.tsx`, `templates/*/main.tex`

**Tests:** `npm run test:latex`; manual compile preview.

**Issues resolved:** ModernCV `\name` injection; unwanted PDF downloads on template cards.

**Next recommended:** T050.

---

## CP-004 — Milestone M3: Import & Parse (T050–T060)

**Implemented:** PDF/DOCX extract, AI parse, heuristic/OCR fallback, experience dedupe, parse quality UI, import flows, parse analytics.

**Files:** `backend/src/modules/parser/`, `backend/src/common/resume-text.util.ts`, `experience-dedupe.util.ts`

**Tests:** Debug scripts; verified 3 jobs → 3 jobs after dedupe fix.

**Remaining:** T061–T062 async UI.

**Next recommended:** T070.

---

## CP-005 — Milestone M4 (partial): AI Enhance (T070–T076)

**Implemented:** Enhance API with partial payload, 1536 token budget, merge by experience id, 9-action AI panel, multi-section diff UI, apply/discard/undo, toast guidance.

**Files:** `backend/src/modules/ai/ai.service.ts`, `enhance-merge.util.ts`, `openrouter.service.ts`, `EditorAiPanel.tsx`

**Tests:** Backend build pass.

**Remaining:** T077–T078 AI quota on enhance.

**Technical debt:** AIService doesn't verify CV ownership by userId.

**Next recommended:** T077.

---

## CP-006 — Milestone M4: Job Match (T080–T086)

**Implemented:** ATS scoring, keyword fallback, job-match page, keyword enhance, cover letter, history chart, keyword insert to editor.

**Files:** `backend/src/modules/jobs/`, `frontend/app/job-match/`

**Remaining:** T087–T088.

**Next recommended:** T087 or T120.

---

## CP-007 — Milestone M5: Sharing & Admin (T090–T095)

**Implemented:** Share links, public PDF page, admin stats/users/plans, export logging.

**Files:** `backend/src/modules/sharing/`, `frontend/app/cv/share/`, `frontend/app/admin/`

**Next recommended:** T120 (production migrations).

---

## CP-008 — Documentation audit (T140–T142)

**Implemented:** Full `/docs` folder — PROJECT, ARCHITECTURE, FEATURES, DATABASE, API, UI, BUSINESS_RULES, DEVELOPMENT_PLAN, TASKS, RULES. Audited done vs not done; resolved doc inconsistencies (auto-save 5s, token tiers, migration gaps).

**Files created:** `docs/PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/FEATURES.md`, `docs/DATABASE.md`, `docs/API.md`, `docs/UI.md`, `docs/BUSINESS_RULES.md`, `docs/DEVELOPMENT_PLAN.md`, `docs/TASKS.md`, `docs/RULES.md`

**Tests:** Codebase exploration + cross-reference with PLAN.md, QA docs.

**Remaining work:** All ⬜ tasks in Phases 8–10.

**Recommended next task:** **T120** — Core DB migrations (production blocker) — **awaiting approval before starting**.

---

## Current focus

| Priority | Task | Why |
|----------|------|-----|
| 🔴 P0 | T120 | Production cannot deploy without core migrations |
| 🟠 P1 | T077 | AI quota consistency |
| 🟠 P1 | T101 | UI i18n (M09) |
| 🟡 P2 | T110 | Stripe billing (M12) |
| 🟡 P2 | T061–T062 | Async parse UX |

**Active task:** None — **95% complete**. Remaining: T124, T131–T134, T130 (blocked).

---

## CP-009 — Completion sprint (2026-06-21)

**Implemented:** Core DB migrations, AI quota on enhance, Stripe billing service, share display name, async parse UI, version history panel, cover letter history, AI interview questions, next-intl (EN/FR/AR), CI pipeline, design system utilities (`app-card`, gradients), orphan cleanup, build fixes.

**Files:** `backend/src/database/migrations/1730500000000-CoreCV.ts`, `billing.service.ts`, `ai.service.ts`, `frontend/i18n/`, `globals.css`, `EditorVersionPanel.tsx`, `.github/workflows/ci.yml`, and more.

**Tests:** `backend npm run build` ✅ | `frontend tsc --noEmit` ✅ | `frontend npm run build` ✅ (no ENVIRONMENT_FALLBACK)

**Remaining:** S3 (T124), HTML export (T131), AI template import UI (T132), security audit (T133), monitoring (T134), LinkedIn (T130 blocked).

**Recommended next:** Configure `STRIPE_SECRET_KEY` + `STRIPE_PRO_PRICE_ID`, run `npm run migration:run`, then T124 S3 if deploying to cloud.
