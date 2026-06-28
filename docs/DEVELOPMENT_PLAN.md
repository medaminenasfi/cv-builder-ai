# Development Plan

Step-by-step roadmap from local development through production deployment.

---

## Phase 0 — Environment setup ✅

| Step | Action | Status |
|------|--------|--------|
| 0.1 | Clone repo, install Node 20+ | ✅ |
| 0.2 | `docker compose up -d postgres redis latex-sandbox` | ✅ |
| 0.3 | Copy `backend/.env.example` → `backend/.env` | ✅ |
| 0.4 | Set `OPENROUTER_API_KEY`, JWT secrets | User-dependent |
| 0.5 | `cd backend && npm install && npm run start:dev` | ✅ |
| 0.6 | `cd frontend && npm install && npm run dev` | ✅ |
| 0.7 | Bootstrap admin via `POST /api/admin/bootstrap` | ✅ |
| 0.8 | `npm run seed:templates` | ✅ |

---

## Phase 1 — Core platform ✅

| Step | Deliverable | Status |
|------|-------------|--------|
| 1.1 | Auth (register, login, JWT, refresh) | ✅ |
| 1.2 | User + admin roles | ✅ |
| 1.3 | CV CRUD + versioning | ✅ |
| 1.4 | Manual editor (all sections) | ✅ |
| 1.5 | Auto-save + health score | ✅ |
| 1.6 | Dashboard + KPIs | ✅ |

---

## Phase 2 — Templates & export ✅

| Step | Deliverable | Status |
|------|-------------|--------|
| 2.1 | LaTeX sandbox Docker service | ✅ |
| 2.2 | Template engine + placeholders | ✅ |
| 2.3 | Bundled templates (6+) | ✅ |
| 2.4 | Admin template CRUD + compile | ✅ |
| 2.5 | Live preview in editor | ✅ |
| 2.6 | PDF export | ✅ |
| 2.7 | DOCX export | ✅ |
| 2.8 | Section visibility in LaTeX | ✅ |

---

## Phase 3 — Import & parse ✅

| Step | Deliverable | Status |
|------|-------------|--------|
| 3.1 | PDF text extraction | ✅ |
| 3.2 | DOCX extraction | ✅ |
| 3.3 | AI structured parse | ✅ |
| 3.4 | Heuristic + OCR fallback | ✅ |
| 3.5 | Experience deduplication | ✅ |
| 3.6 | Parse quality UI | ✅ |
| 3.7 | Import into existing CV | ✅ |
| 3.8 | Async parse queue (BullMQ) | 🟨 API only |

---

## Phase 4 — AI features ✅ / 🟨

| Step | Deliverable | Status |
|------|-------------|--------|
| 4.1 | Editor AI enhance (9 actions) | ✅ |
| 4.2 | Enhance token budget fix | ✅ |
| 4.3 | Before/after diff UI | ✅ |
| 4.4 | Apply / undo flow | ✅ |
| 4.5 | AI quota on enhance endpoint | ❌ |
| 4.6 | Job match ATS scoring | ✅ |
| 4.7 | Job keyword enhance | ✅ |
| 4.8 | Cover letter generation | ✅ |
| 4.9 | AI interview questions | 🔧 Stub |

---

## Phase 5 — Sharing & collaboration ✅

| Step | Deliverable | Status |
|------|-------------|--------|
| 5.1 | Share link generation | ✅ |
| 5.2 | Public PDF share page | ✅ |
| 5.3 | View count + expiry | ✅ |
| 5.4 | Custom share display name | ❌ |

---

## Phase 6 — Admin & operations ✅

| Step | Deliverable | Status |
|------|-------------|--------|
| 6.1 | Admin dashboard + stats | ✅ |
| 6.2 | User management | ✅ |
| 6.3 | Plan stats | ✅ |
| 6.4 | Parse analytics | ✅ |
| 6.5 | Export logging | ✅ |

---

## Phase 7 — i18n ❌ / 🟨

| Step | Deliverable | Status |
|------|-------------|--------|
| 7.1 | CV locale + RTL | ✅ |
| 7.2 | Localized LaTeX headings | ✅ |
| 7.3 | next-intl integration | ❌ |
| 7.4 | Translate UI (en/fr/ar) | ❌ |
| 7.5 | Locale routing | ❌ |

---

## Phase 8 — Billing (M12) ❌

| Step | Deliverable | Status |
|------|-------------|--------|
| 8.1 | Stripe checkout session | 🔧 Stub |
| 8.2 | Webhook → plan upgrade | 🔧 Stub |
| 8.3 | Pro feature gating in UI | 🟨 |
| 8.4 | Settings upgrade flow | 🔧 |

---

## Phase 9 — Production hardening 🟨

| Step | Deliverable | Status |
|------|-------------|--------|
| 9.1 | Complete DB migrations (no sync) | ❌ Critical |
| 9.2 | S3 storage migration | ❌ |
| 9.3 | E2E test suite + CI | 🟨 |
| 9.4 | Remove `ignoreBuildErrors` | ❌ |
| 9.5 | Orphan component cleanup | ❌ |
| 9.6 | Security audit | ❌ |
| 9.7 | Performance profiling | ❌ |
| 9.8 | Monitoring / logging (Sentry, etc.) | ❌ |

---

## Phase 10 — Deployment

### 10.1 Pre-deploy checklist

- [ ] All migrations run on staging DB
- [ ] `NODE_ENV=production`, `synchronize=false`
- [ ] Secrets in vault (not `.env` in image)
- [ ] LaTeX sandbox deployed with resource limits
- [ ] Redis for BullMQ (if async parse enabled)
- [ ] `FRONTEND_URL` + CORS configured
- [ ] `API_PUBLIC_URL` points to public API
- [ ] SSL/TLS on all public endpoints
- [ ] Run [QA-PRODUCTION.md](./QA-PRODUCTION.md) checklist

### 10.2 Recommended infrastructure

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Vercel     │────▶│  NestJS API │────▶│  PostgreSQL  │
│  (Frontend) │     │  (Container)│     │  (Managed)   │
└─────────────┘     └──────┬──────┘     └──────────────┘
                           │
                    ┌──────┴──────┐
                    │ Redis       │
                    │ LaTeX box   │
                    │ S3 storage  │
                    └─────────────┘
```

### 10.3 Deploy sequence

1. Provision PostgreSQL → run migrations
2. Deploy LaTeX sandbox container
3. Deploy API with env vars
4. Seed templates (`npm run seed:templates`)
5. Bootstrap admin (one-time)
6. Deploy frontend with `NEXT_PUBLIC_API_URL`
7. Smoke test health + login + create CV + export PDF
8. Enable monitoring

### 10.4 Post-deploy

- Monitor OpenRouter credit usage
- Monitor LaTeX compile latency / failures
- Review parse_analytics for quality regressions
- Set up backup for PostgreSQL

---

## Milestone summary

| Milestone | Target | Status |
|-----------|--------|--------|
| M1 MVP (auth + editor + export) | Sprint 6 | ✅ |
| M2 AI + import | Sprint 7 | ✅ |
| M3 Job match + sharing | Sprint 8 | ✅ |
| M4 Production ready | TBD | 🟨 |
| M5 Billing + i18n | TBD | ❌ |

---

## Next recommended work (priority order)

1. **T101** — Add core CV migrations (production blocker)
2. **T102** — Enforce AI quota on enhance endpoint
3. **T103** — Wire next-intl for UI i18n
4. **T104** — Stripe checkout + webhook
5. **T105** — Version history UI
6. **T106** — E2E CI pipeline

See [TASKS.md](./TASKS.md) for full task list with IDs and checkpoints.

---

## Work protocol (AI-assisted development)

1. Pick **one** task from TASKS.md (lowest ID with open dependencies)
2. Implement → build → lint → test
3. Mark task ✅ in TASKS.md + add checkpoint
4. **Stop and wait for user approval** before next task
5. Never mark ✅ if build/lint/tests fail
