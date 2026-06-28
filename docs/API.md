# API Reference

**Base URL:** `http://localhost:3002/api`  
**Auth:** Bearer JWT (`Authorization: Bearer <access_token>`) unless marked Public  
**Swagger:** `GET /api/docs`  
**Rate limit:** 100 requests/minute (global throttler)

---

## Response conventions

| Code | Meaning |
|------|---------|
| 200/201 | Success |
| 400 | Validation error |
| 401 | Unauthorized / expired token |
| 403 | Forbidden (blocked, wrong role) |
| 404 | Not found |
| 422 | Unprocessable (e.g. AI no changes) |
| 429 | Rate limited |
| 502 | AI gateway error (OpenRouter) |
| 503 | Service unavailable (missing API key, LaTeX offline) |

Errors typically return `{ "statusCode", "message" }`.

---

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | Public | `{ status: "ok", timestamp }` |

---

## Auth (`/auth`)

| Method | Path | Auth | Body | Description |
|--------|------|------|------|-------------|
| POST | `/auth/register` | Public | `{ email, password, locale? }` | Register; sets refresh cookie |
| POST | `/auth/login` | Public | `{ email, password }` | Login; returns `{ accessToken, user }` |
| POST | `/auth/refresh` | Public | `{ refreshToken? }` or cookie | New access token |
| POST | `/auth/logout` | Public | — | Revoke refresh; clear cookie |
| GET | `/auth/me` | JWT | — | Current user profile |
| PATCH | `/auth/me` | JWT | `{ locale? }` | Update profile |
| PATCH | `/auth/password` | JWT | `{ currentPassword, newPassword }` | Change password |

---

## CVs (`/cvs`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/cvs` | JWT | List user's CVs |
| POST | `/cvs` | JWT | Create CV `{ title, templateId?, locale? }` — free max 3 |
| GET | `/cvs/:id` | JWT | CV + latest normalized `data` |
| PATCH | `/cvs/:id` | JWT | Update metadata `{ title?, templateId?, locale?, jobTitleTarget? }` |
| PATCH | `/cvs/:id/data` | JWT | Save content `{ data }` → new version |
| POST | `/cvs/:id/duplicate` | JWT | Duplicate CV |
| DELETE | `/cvs/:id` | JWT | Delete CV |
| GET | `/cvs/:id/versions` | JWT | Version history (max 20) |

---

## Import / Parse (`/cvs`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/cvs/import` | JWT | `{ title, rawText }` → new CV |
| POST | `/cvs/import/file` | JWT | Multipart `file` (PDF/DOCX) → new CV |
| POST | `/cvs/import/file/async` | JWT | Queue async parse → `{ jobId }` |
| GET | `/cvs/import/jobs/:jobId` | JWT | Poll parse job status |
| POST | `/cvs/:id/import/file` | JWT | Import into existing CV (replace content) |

**Parse response includes:** `parseMeta` with confidence, warnings, locale, OCR/AI flags.

---

## AI Enhance (`/cvs/:id`)

| Method | Path | Auth | Body | Description |
|--------|------|------|------|-------------|
| POST | `/cvs/:id/enhance` | JWT | `{ sections: string[], tone: string }` | Returns `{ before, after, tone, sections, message }` |
| POST | `/cvs/:id/enhance/apply` | JWT | `{ data: CVData }` | Persist enhanced data (source: ai_enhanced) |

**Sections:** `summary`, `experience`, `skills`, `technologies`  
**Tones:** `professional`, `executive`, `technical`, `academic`, `creative`

---

## Job Match (`/cvs/:id/jobs`)

| Method | Path | Auth | Body | Description |
|--------|------|------|------|-------------|
| POST | `/cvs/:id/jobs/match` | JWT | `{ jobDescription, jobTitle? }` | ATS score + keywords + suggestions |
| POST | `/cvs/:id/jobs/enhance` | JWT | `{ jobDescription, jobTitle?, sections?, tone? }` | Job-tailored rewrite |
| POST | `/cvs/:id/jobs/enhance/apply` | JWT | `{ data }` | Apply job enhancement |
| POST | `/cvs/:id/jobs/cover-letter` | JWT | `{ jobDescription, jobTitle?, tone? }` | Generate cover letter |
| GET | `/cvs/:id/jobs/matches` | JWT | — | Last 20 ATS matches |
| GET | `/cvs/:id/jobs/cover-letters` | JWT | — | Last 20 cover letters |
| POST | `/cvs/:id/jobs/interview-questions` | JWT | `{ jobDescription?, jobTitle? }` | **Stub** — static questions |

---

## Export & Preview (`/cvs/:id`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/cvs/:id/export/pdf` | JWT | Download PDF (LaTeX) |
| GET | `/cvs/:id/export/pdf/url` | JWT | Save PDF to storage; return URL |
| GET | `/cvs/:id/export/docx` | JWT | Download DOCX |
| GET | `/cvs/:id/export/docx/url` | JWT | Save DOCX; return URL |
| GET | `/cvs/:id/preview.pdf` | JWT | Inline PDF (saved data) |
| POST | `/cvs/:id/preview.pdf` | JWT | Live preview `{ data?, templateId? }` |

---

## Templates (user)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/templates` | JWT | Active templates list |
| GET | `/templates/:id/preview.pdf` | JWT | Sample PDF preview |

---

## Sharing

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/cvs/:id/share` | JWT | Create 7-day link `{ token, url, expiresAt }` |
| GET | `/share/:token` | Public | Shared CV data + PDF base64 |
| GET | `/share/:token/export/pdf` | Public | Download shared PDF |

---

## Dashboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard/stats` | JWT | KPIs + 30-day trends |
| GET | `/dashboard/cv-ats-scores` | JWT | Latest ATS score per CV |

---

## AI Usage

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/ai/usage` | JWT | `{ used, limit, remaining, plan }` |

---

## Files

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/files/exports/:userId/:filename` | JWT | Download export (owner or admin) |

---

## Admin (`/admin`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/admin/bootstrap` | Public | `{ secret, email, password }` — first admin only |
| GET | `/admin/ping` | Admin | Access check |
| GET | `/admin/stats` | Admin | Platform stats |
| GET | `/admin/plans/stats` | Admin | Free/pro counts + estimated MRR |
| GET | `/admin/users` | Admin | `?page=&limit=&plan=` |
| PATCH | `/admin/users/:id/plan` | Admin | `{ plan: free\|pro }` |
| PATCH | `/admin/users/:id/role` | Admin | `{ role: user\|admin }` |
| PATCH | `/admin/users/:id/block` | Admin | `{ blocked: boolean }` |

---

## Admin Templates (`/admin/templates`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/templates/bundled` | Admin | List bundled slugs from disk |
| POST | `/admin/templates/bundled/:slug/load` | Admin | Load bundled config |
| POST | `/admin/templates/latex/compile` | Admin | `{ tex }` → compile test |
| GET | `/admin/templates` | Admin | All templates |
| POST | `/admin/templates` | Admin | Create template |
| PATCH | `/admin/templates/:id` | Admin | Update template |
| PATCH | `/admin/templates/:id/toggle` | Admin | Toggle active |
| DELETE | `/admin/templates/:id` | Admin | Delete |
| GET | `/admin/templates/:id/preview.pdf` | Admin | Preview PDF |

---

## Billing (`/billing`) — STUB

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/billing/webhook` | Public | Stripe webhook (no plan upgrade) |
| POST | `/billing/checkout` | Public | Returns placeholder checkout URL |

---

## LaTeX Sandbox (internal)

Not exposed via NestJS publicly. Backend calls:

```
POST http://latex-sandbox:8081/compile
Body: { "tex": "..." }
Response: PDF bytes or error
GET  http://localhost:8081/health
```

---

## Environment variables (API-related)

See `backend/.env.example` and [PROJECT.md](./PROJECT.md).

Required for full functionality:
- `OPENROUTER_API_KEY` — parse, enhance, ATS, cover letter
- `LATEX_SANDBOX_URL` — PDF preview/export
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `DATABASE_*`
- `REDIS_URL` — async parse only

---

## Frontend API clients

| Module | File |
|--------|------|
| Core fetch | `frontend/lib/api.ts` |
| Auth | `frontend/lib/auth-api.ts` |
| CVs + AI + jobs | `frontend/lib/cvs-api.ts` |
| Dashboard | `frontend/lib/dashboard-api.ts` |
| Templates | `frontend/lib/templates-api.ts` |
| Admin | `frontend/lib/admin-api.ts` |
| Billing | `frontend/lib/billing-api.ts` |

See [UI.md](./UI.md) for which UI surfaces call which endpoints.
