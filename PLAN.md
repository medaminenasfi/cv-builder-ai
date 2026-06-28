# CV Builder — Plan Master (unique)

> Single source of truth. Superseded by `cv_builder_full_plan` and `cv_builder_plan_v2`.
>
> **Updated:** Canonical documentation now lives in [`docs/`](docs/) — see [`docs/TASKS.md`](docs/TASKS.md) for living task tracker and [`docs/PROJECT.md`](docs/PROJECT.md) for current status.

## Current status

| Module | Status |
|--------|--------|
| M01 Auth | Done |
| M01-Admin | Done |
| M02 Templates | Done (seed + admin CRUD + RTL renderer + AI import) |
| M03 Multi-CV | Done (3 free limit, auto-save 30s, 20 version cap) |
| M04 Builder | Done (sections incl. languages/technologies, section picker, live preview) |
| M05 Parser | Done (PDF/DOCX sync parse, languages/technologies extraction) |
| M06 PDF Export | Done (Puppeteer server PDF + browser print fallback) |
| M07 AI enhancer | Done (4 tones; quotas deferred) |
| M08 Job match + ATS | Partial (AI + keyword fallback; DB/charts deferred) |
| M09 i18n | Partial (CV locale + template headings; full UI deferred) |
| M10 Cover letter | Partial (API stub) |
| M11 Sharing | Done (persisted share links) |
| M12 Stripe | Not started |

**Ports:** API `3002`, PostgreSQL Docker `55432`, Frontend `3000`

## Roadmap M01 → M12

| Module | Content |
|--------|---------|
| M01 | Auth JWT, frontend wired |
| M01-Admin | Bootstrap via Swagger, admin dashboard, stats |
| M02 | Templates + admin CRUD + RTL renderer |
| M03 | Multi-CV, plan limits (3 free) |
| M04 | Manual builder + section picker |
| M05 | CV parser (PDF/DOCX) |
| M06 | PDF export |
| M07 | AI enhancer (4 tones) |
| M08 | Job match + ATS |
| M09 | i18n AR/FR/EN |
| M10 | Cover letter + interview coach |
| M11 | LinkedIn import, sharing |
| M12 | Stripe billing + admin user management |

## Admin module

- **Bootstrap:** `POST /api/admin/bootstrap` with `ADMIN_SETUP_SECRET` (once only)
- **Dashboard:** `/admin`, `/admin/stats`
- **Templates:** `/admin/templates` (M02)
- **Users:** `/admin/users` (M12)

## Project structure

```
cv Builder/
├── PLAN.md
├── backend/
├── frontend/
├── templates/
├── packages/shared/
└── docker-compose.yml
```

See [docs/CV-FLOWS-AND-AI.md](docs/CV-FLOWS-AND-AI.md) for import/review/job-match flows.
