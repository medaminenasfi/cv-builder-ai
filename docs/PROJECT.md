# CV Builder (ResumeAI) — Project Overview

## Vision

A full-stack **AI-powered CV/resume builder** that lets users create, import, enhance, and export professional resumes in **English, French, and Arabic**, with **LaTeX-quality PDF output**, **ATS job matching**, and **shareable links**.

## Product name

- **Codebase / repo:** CV Builder
- **Marketing name (QA docs):** ResumeAI

## Target users

| Role | Description |
|------|-------------|
| **User (free)** | Job seekers; up to 3 CVs, daily AI quota (25 calls) |
| **User (pro)** | Paid tier (planned); higher limits (500 AI calls/day) |
| **Admin** | Platform operator; template management, user/plan control |

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, TanStack Query, Tailwind 4, TipTap, Sonner |
| Backend | NestJS 11, TypeORM, PostgreSQL 16, BullMQ + Redis 7 |
| AI | OpenRouter (default: `google/gemini-2.5-flash-lite`) |
| PDF | LaTeX via isolated Docker sandbox (Tectonic) |
| DOCX | Programmatic generation (no Word template) |
| Auth | JWT access + httpOnly refresh cookies |
| Storage | Local filesystem (`LOCAL_STORAGE_PATH`); S3 planned but not wired |

## Repository structure

```
cv Builder/
├── PLAN.md                    # Legacy status summary (superseded by docs/TASKS.md)
├── docker-compose.yml         # postgres, redis, latex-sandbox
├── docs/                      # Canonical documentation (this folder)
├── backend/                   # NestJS API (port 3002)
├── frontend/                  # Next.js app (port 3000)
├── templates/                 # Bundled LaTeX templates (main.tex per slug)
├── packages/shared/           # Shared CV schema types (partial sync with backend)
└── latex-sandbox/             # Docker LaTeX compile service (port 8081)
```

## Local development ports

| Service | Port |
|---------|------|
| Frontend | `3000` |
| Backend API | `3002` (`/api` prefix) |
| PostgreSQL (Docker) | `55432` → container `5432` |
| Redis | `6379` |
| LaTeX sandbox | `8081` |
| Swagger | `http://localhost:3002/api/docs` |

## Module roadmap (M01–M12)

| Module | Name | Status |
|--------|------|--------|
| M01 | Auth (JWT, register, login, refresh) | ✅ Done |
| M01-Admin | Admin bootstrap, dashboard, stats | ✅ Done |
| M02 | Templates (seed, admin CRUD, LaTeX, AI import partial) | ✅ Done |
| M03 | Multi-CV (3 free limit, versioning, auto-save) | ✅ Done |
| M04 | Manual builder (sections, live preview, section visibility) | ✅ Done |
| M05 | Parser (PDF/DOCX sync + async queue, OCR, AI) | ✅ Done |
| M06 | PDF export (LaTeX) + DOCX export | ✅ Done |
| M07 | AI enhancer (9 actions, 5 tones, apply/undo flow) | ✅ Done (recent token-limit fix) |
| M08 | Job match + ATS (AI + keyword fallback; history persisted) | 🟨 Partial (charts/UI gaps) |
| M09 | i18n AR/FR/EN (CV locale + template headings) | 🟨 Partial (UI strings English-only) |
| M10 | Cover letter (+ interview coach stub) | 🟨 Partial (cover letter done; interview stub) |
| M11 | Sharing (+ LinkedIn import) | 🟨 Partial (sharing done; LinkedIn not started) |
| M12 | Stripe billing + admin user management | ❌ Not started (stubs only) |

## User journeys

1. **Manual** — Register → Dashboard → Templates or blank → Editor → Export PDF
2. **Import** — Upload PDF/DOCX → AI parse → Review wizard → Editor
3. **Job Match** — Paste job description → ATS score → Keyword enhance → Apply → Cover letter
4. **Share** — Generate 7-day link → Public PDF view + download

See [CV-FLOWS-AND-AI.md](./CV-FLOWS-AND-AI.md) for flow diagrams and API quick reference.

## Related legacy docs (still valid, being consolidated)

| File | Content |
|------|---------|
| [CV-FLOWS-AND-AI.md](./CV-FLOWS-AND-AI.md) | User flows, AI endpoints, QA checklist |
| [LATEX-TEMPLATES.md](./LATEX-TEMPLATES.md) | LaTeX placeholders, bundled templates, troubleshooting |
| [QA-SPRINT-1.md](./QA-SPRINT-1.md) | Sprint 6 MVP verification (mostly complete) |
| [QA-SPRINT-2.md](./QA-SPRINT-2.md) | Sprint 2 checklist (partially outdated) |
| [QA-PRODUCTION.md](./QA-PRODUCTION.md) | Production QA checklist |
| [../PLAN.md](../PLAN.md) | Original module status table |

## Known inconsistencies (resolved in docs/)

| Topic | Source A | Source B | Resolution |
|-------|----------|----------|------------|
| Auto-save debounce | QA-Sprint-1: 30s | QA-Production: 5s | **5 seconds** (`use-auto-save.ts`) |
| AI tones count | PLAN.md: 4 tones | UI: 9 actions | **9 actions**, **5 tones** (professional, executive, technical, academic, creative via job-match) |
| `OPENROUTER_MAX_TOKENS` | CV-FLOWS: 2048 | `.env.example`: 192 | **192 default chat**; parse=1024, enhance=1536, template=2048 |
| Backend port fallback | `.env.example`: 3002 | `main.ts` fallback | Use **3002** in `.env` |
| HTML templates | Entity supports `html` engine | Export uses LaTeX only | HTML engine **not wired to export** |
| Core DB tables | Migrations | Dev `synchronize: true` | **Production needs missing migrations** (see DATABASE.md) |
| ShareLinks migration | References `cvs` FK | No migration creates `cvs` | Run sync or add migration before ShareLinks in prod |

## Documentation index

| Document | Purpose |
|----------|---------|
| [PROJECT.md](./PROJECT.md) | This file — overview and status |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, modules, data flow |
| [FEATURES.md](./FEATURES.md) | Complete feature inventory |
| [DATABASE.md](./DATABASE.md) | Tables, entities, migrations |
| [API.md](./API.md) | All REST endpoints |
| [UI.md](./UI.md) | Pages, components, UX flows |
| [BUSINESS_RULES.md](./BUSINESS_RULES.md) | Plans, limits, validation, roles |
| [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) | Roadmap from dev to deployment |
| [TASKS.md](./TASKS.md) | Living task tracker with IDs and checkpoints |
| [RULES.md](./RULES.md) | Coding standards, security, testing |

## Success criteria (MVP — largely met)

- [x] User can register, create CV, edit all sections, export PDF
- [x] User can import PDF/DOCX with AI parse and review
- [x] User can run AI enhance with preview + apply
- [x] User can score CV against job description and apply keyword enhancements
- [x] Admin can manage LaTeX templates
- [x] Public share links work with PDF
- [ ] Full UI i18n (EN/FR/AR)
- [ ] Stripe billing live
- [ ] Production-grade migrations (no `synchronize`)
- [ ] E2E test suite in CI

## Approval gate

**No new application code** should be written until this documentation set is reviewed and approved. After approval, work proceeds **one TASKS.md item at a time** with checkpoint updates.
