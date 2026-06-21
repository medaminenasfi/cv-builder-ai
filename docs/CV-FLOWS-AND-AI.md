# CV Flows & AI — User Guide & API Reference

## Overview

Three main user paths:

1. **Manual** — pick template or blank → editor
2. **Import** — upload PDF/DOCX → AI parse → review → editor
3. **Job Match** — paste job description → ATS score → AI keyword enhance → apply

All AI features are **free** for now (no plan gating until Stripe M12).

---

## User flows

```
Dashboard → New CV (/dashboard/cvs/new)
  ├── Choose template → /templates → editor
  ├── Start from scratch → /cv/{id}/edit
  └── Import PDF/Word → AI parse → /cv/{id}/review → editor or /job-match

Editor → Job Match button → /job-match?cvId=...
Review → Check job match → /job-match?cvId=...
```

---

## Routes

| Route | Purpose |
|-------|---------|
| `/dashboard/cvs/new` | Creation wizard (template / blank / import) |
| `/cv/[id]/review` | Step-by-step review after import |
| `/cv/[id]/edit` | Full CV editor + AI enhance |
| `/job-match` | ATS hub (score, enhance, cover letter) |
| `/templates` | Template gallery |

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/cvs/import` | Import from raw text JSON `{ title, rawText }` |
| POST | `/cvs/import/file` | Multipart upload PDF/DOCX |
| GET | `/cvs/:id` | CV metadata + latest `data` |
| PATCH | `/cvs/:id/data` | Save new version |
| POST | `/cvs/:id/enhance` | AI enhance `{ sections, tone }` |
| POST | `/cvs/:id/enhance/apply` | Apply enhanced data |
| POST | `/cvs/:id/jobs/match` | ATS score `{ jobDescription, jobTitle? }` |
| POST | `/cvs/:id/jobs/enhance` | Job-tailored keyword enhance |
| POST | `/cvs/:id/jobs/enhance/apply` | Apply job enhancement |
| POST | `/cvs/:id/jobs/cover-letter` | Generate cover letter |

Requires `OPENROUTER_API_KEY` in `backend/.env`.

---

## AI prompts

Prompts live in `backend/src/modules/ai/prompts/cv-ai.prompts.ts`:

1. **Parse resume** — raw text → structured `CVData` JSON
2. **ATS match** — CV vs job description → score, keywords, suggestions
3. **Keyword enhance** — rewrite sections to include missing JD keywords
4. **Cover letter** — CV facts + JD → letter in CV locale

---

## Free vs Pro

| Feature | Current |
|---------|---------|
| Import PDF/DOCX | Free |
| ATS scoring | Free |
| Job keyword enhance | Free |
| AI tone enhance | Free |
| Cover letter | Free |

Future Pro limits (M12): TBD when Stripe is wired.

---

## QA checklist

- [ ] `/dashboard/cvs/new` — all three options work
- [ ] PDF import → `/cv/{id}/review` with filled fields
- [ ] Review stepper → save → editor
- [ ] `/job-match` — ATS score + keyword chips
- [ ] Enhance for job → diff → apply → score increases
- [ ] Editor AI enhance with 4 tones
- [ ] Cover letter generation
- [ ] LinkedIn import shows "Coming soon" only

---

## Environment

```env
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=anthropic/claude-sonnet-4
OPENROUTER_MAX_TOKENS=2048
```
