# ResumeAI — Production QA Checklist

Run after `npm run migration:run` in backend and with API (3002) + frontend (3000) running.

**Automated checks (dev):** Backend `npm run build` passes; frontend `node_modules/.bin/tsc --noEmit` passes.

## Auth

- [ ] Register new account
- [ ] Login / logout
- [ ] Protected routes redirect when logged out

## Dashboard

- [ ] KPI cards load real data (`GET /dashboard/stats`)
- [ ] CV cards: Edit, Duplicate, Share, Delete, Rename, Export PDF/DOCX, Job Match
- [ ] Empty state: Create / Import / Templates
- [ ] Mobile FAB opens create flow

## Create & import

- [ ] Manual builder → Templates → Editor
- [ ] Import PDF/DOCX → Review wizard with parse quality score
- [ ] French / Arabic PDFs populate or show low-confidence warnings

## Editor

- [ ] 3-column layout (sidebar + form + preview + AI panel on xl)
- [ ] Mobile tabs: Edit / Preview / AI
- [ ] Auto-save every 5s with Saved/Saving/Failed icons
- [ ] Resume health score in header
- [ ] AI panel: 9 actions with before/after Apply / Undo
- [ ] Job Match prominent button
- [ ] `?keywords=` from Job Match inserts into skills

## Templates

- [ ] LaTeX sandbox running (`docker compose up latex-sandbox`, health OK)
- [ ] Admin: paste `.tex`, Compile & Preview, save template
- [ ] `npm run seed:templates` loads `templates/*/main.tex`
- [ ] Use Template on cards and primary CTA
- [ ] Preview modal shows PDF (Desktop / Mobile / A4 tabs)

## Job Match

- [ ] Circular ATS score + breakdown
- [ ] Grouped AI recommendations
- [ ] Insert keywords → editor
- [ ] Cover letter: Professional / Creative / Technical tones

## Share

- [ ] Share link renders PDF (not HTML)
- [ ] Download PDF via `GET /share/:token/export/pdf`
- [ ] Print works
- [ ] Expired link shows clear message

## Settings

- [ ] Account password change
- [ ] Profile, Notifications, Resume defaults, Theme tabs
- [ ] Language EN/FR/AR saves to profile

## Exports

- [ ] PDF (LaTeX compile), DOCX from editor and dashboard card
- [ ] Export count increments in dashboard KPIs

## LaTeX compiler

- [ ] `curl http://localhost:8081/health` → `{ "ok": true }`
- [ ] `npm run test:latex` produces valid PDF
- [ ] Compiler offline shows clear UI message (not crash)

## Reliability

- [ ] Error boundary catches render errors
- [ ] Toasts replace `alert()` on dashboard share/export
- [ ] Parse succeeds when AI quota exhausted (regex fallback)

## Performance targets

- [ ] Dashboard first load < 1s (cached React Query after first visit)
- [ ] Editor interactive < 2s
- [ ] Parse completes < 15s for typical 2-page PDF

## Migrations

```bash
cd backend && npm run migration:run
```

Tables: `parse_analytics`, `export_logs`, `share_links.view_count`

## Env

- `OPENROUTER_API_KEY` — AI parse, enhance, ATS, cover letter
- `LOCAL_STORAGE_PATH` — `./storage`
- `REDIS_URL` — optional async parse only
