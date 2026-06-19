# CV Builder — Plan Master (unique)

> Single source of truth. Supersedes `cv_builder_full_plan` and `cv_builder_plan_v2`.

## Current status

| Module | Status |
|--------|--------|
| M01 Auth | Done |
| M01-Admin | In progress |
| M02 Templates | Pending |
| M03 Multi-CV | Pending |
| M04–M12 | See roadmap below |

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

See `.cursor/plans/cv_builder_master_plan_0ec6f075.plan.md` for full detailed specification.
