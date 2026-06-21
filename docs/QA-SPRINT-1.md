# QA Sprint 1 Checklist

Sprint 6 MVP verification (manual + build smoke tests).

## Auth & admin
- [x] Auth: register, login, logout, protected routes (JWT + refresh)
- [x] Admin: bootstrap via Swagger, dashboard, stats

## Templates & CVs
- [x] Templates: seed, admin CRUD, user gallery, RTL preview
- [x] CVs: create, edit, duplicate, delete, free plan limit (3)
- [x] Builder: personal, summary, experience, education, skills, **languages**, **technologies**
- [x] Section picker toggles visibility in editor
- [x] Auto-save: 30s debounce, status in editor top bar
- [x] Version cap: max 20 versions per CV

## Import & export
- [x] Parser: PDF/DOCX import (FR CV with Langues/Compétences sections)
- [x] Export HTML: `GET /cvs/:id/export/html`
- [x] Export PDF: `GET /cvs/:id/export/pdf` (Puppeteer A4)
- [x] Frontend: Download PDF on edit + preview pages

## Job match & sharing
- [x] Job match: `POST /cvs/:id/jobs/match` returns score
- [x] Share link: persisted in DB, works in incognito (`/cv/share/:token`)

## Build smoke tests

Run backend build:
```bash
cd backend && npm run build
curl http://localhost:3002/api/health
```

Run frontend build:
```bash
cd frontend && npm run build
```

Run share_links migration (production / non-sync env):
```bash
cd backend && npm run migration:run
```

## Deferred (post-MVP)
- Google OAuth, OCR/Tesseract, BullMQ async parse
- next-intl full UI (M09)
- Stripe billing (M12)
- LinkedIn import (M11)
- ATS DB persistence + charts
- Playwright CI E2E suite
