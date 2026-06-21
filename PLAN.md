# CV Builder — Plan Master (unique)

> Single source of truth. Supersedes `cv_builder_full_plan` and `cv_builder_plan_v2`.

## Current status

| Module | Status |
|--------|--------|
| M01 Auth | Done |
| M01-Admin | Done |
| M02 Templates | Partial |
| M03 Multi-CV | Partial |
| M04 Builder | In progress |
| M05 Parser | In progress |
| M07 AI enhancer | In progress |
| M08 Job match + ATS | In progress |

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
