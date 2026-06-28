# Features — Complete Inventory

Status legend: ✅ Done | 🟨 Partial | ❌ Not started | 🔧 Stub

---

## F01 — Authentication & accounts

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| F01.1 | Email/password registration | ✅ | Locale choice at register |
| F01.2 | Login / logout | ✅ | |
| F01.3 | JWT access + refresh | ✅ | httpOnly refresh cookie |
| F01.4 | Protected routes (middleware) | ✅ | User + admin separation |
| F01.5 | Profile update (locale) | ✅ | Backend only; UI in settings |
| F01.6 | Password change | ✅ | |
| F01.7 | Google OAuth | ❌ | Deferred |
| F01.8 | Blocked user enforcement | ✅ | Backend; admin toggle |

---

## F02 — Dashboard

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| F02.1 | CV list grid | ✅ | |
| F02.2 | KPI cards (6 metrics) | ✅ | Stats + 30-day trends |
| F02.3 | CV card actions | ✅ | Edit, rename, duplicate, share, export, job match, AI |
| F02.4 | ATS score badge per CV | ✅ | From `/dashboard/cv-ats-scores` |
| F02.5 | Empty state CTAs | ✅ | |
| F02.6 | Mobile FAB (new CV) | ✅ | |

---

## F03 — CV creation & multi-CV

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| F03.1 | Create blank CV | ✅ | |
| F03.2 | Create from template | ✅ | Templates page → create |
| F03.3 | Free plan limit (3 CVs) | ✅ | Enforced backend |
| F03.4 | Duplicate CV | ✅ | |
| F03.5 | Delete CV | ✅ | Confirm dialog |
| F03.6 | Rename CV | ✅ | Prompt on dashboard |
| F03.7 | Version history (20 cap) | ✅ | API only; **no UI** |
| F03.8 | Auto-save | ✅ | 5s debounce |

---

## F04 — CV editor (manual)

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| F04.1 | Personal info section | ✅ | |
| F04.2 | Summary (TipTap rich text) | ✅ | |
| F04.3 | Experience (add/edit/reorder) | ✅ | Drag-and-drop |
| F04.4 | Education (add/edit/reorder) | ✅ | |
| F04.5 | Skills | ✅ | Comma / line input |
| F04.6 | Languages | ✅ | `Language — Level` format |
| F04.7 | Technologies | ✅ | |
| F04.8 | Certifications | ✅ | |
| F04.9 | Projects | ✅ | |
| F04.10 | Section visibility toggles | ✅ | `meta.sections`; LaTeX respects hidden |
| F04.11 | Template picker | ✅ | |
| F04.12 | Resume health score | ✅ | Client-side completeness |
| F04.13 | Manual / AI mode switch | ✅ | |
| F04.14 | Mobile Edit/Preview tabs | ✅ | Preview compiles in background |
| F04.15 | Review wizard (10-step page) | ✅ | `/cv/[id]/review` |
| F04.16 | Inline parse wizard (3-step) | ✅ | Post-import in editor |

---

## F05 — Live preview & export

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| F05.1 | LaTeX live preview | ✅ | Debounced compile → PDF image |
| F05.2 | Full-page preview | ✅ | `/cv/[id]/preview` |
| F05.3 | Export PDF (LaTeX) | ✅ | Download |
| F05.4 | Export DOCX | ✅ | Dashboard card + API |
| F05.5 | Browser print fallback | ✅ | |
| F05.6 | Export HTML | ✅ | API only (`GET /export/html` if exists) — verify |
| F05.7 | Signed export URLs | 🟨 | API exists; UI uses direct blob |

---

## F06 — Templates

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| F06.1 | Template gallery | ✅ | PDF preview cards (no download on click) |
| F06.2 | Bundled LaTeX templates (6+) | ✅ | `templates/*/main.tex` |
| F06.3 | Admin template CRUD | ✅ | |
| F06.4 | Admin LaTeX compile test | ✅ | |
| F06.5 | Load bundled template | ✅ | Admin |
| F06.6 | RTL template support | ✅ | `supports_rtl` flag |
| F06.7 | AI template import | 🟨 | Service exists; limited UI |
| F06.8 | HTML templates | 🟨 | Entity field; not used in export |
| F06.9 | Template seed script | ✅ | `npm run seed:templates` |

Bundled slugs: `modern-fr`, `classic`, `minimal`, `jake-resume`, `jake-resume-12pt`, `moderncv-banking`

---

## F07 — Import & parse

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| F07.1 | Import PDF (new CV) | ✅ | |
| F07.2 | Import DOCX (new CV) | ✅ | |
| F07.3 | Import into existing CV | ✅ | Editor replace content |
| F07.4 | AI structured parse | ✅ | OpenRouter |
| F07.5 | Heuristic fallback | ✅ | When AI fails/quota |
| F07.6 | OCR fallback | ✅ | Low-text PDFs |
| F07.7 | Experience deduplication | ✅ | Fuzzy dedupe util |
| F07.8 | Parse quality score + warnings | ✅ | UI badges |
| F07.9 | Async parse queue | 🟨 | API + BullMQ; UI uses sync |
| F07.10 | Raw text import | 🟨 | API only |
| F07.11 | LinkedIn import | ❌ | "Coming soon" UI |
| F07.12 | Parse analytics logging | ✅ | `parse_analytics` table |

---

## F08 — AI enhancement (editor)

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| F08.1 | Improve Summary | ✅ | |
| F08.2 | Rewrite Experience | ✅ | |
| F08.3 | Quantify Achievements | ✅ | |
| F08.4 | Improve Skills | ✅ | skills + technologies |
| F08.5 | ATS Optimize | ✅ | multi-section |
| F08.6 | Professional Tone | ✅ | |
| F08.7 | Executive Tone | ✅ | |
| F08.8 | Technical Tone | ✅ | |
| F08.9 | Academic Tone | ✅ | |
| F08.10 | Before/after diff UI | ✅ | summary, experience, skills |
| F08.11 | Apply / Discard / Undo | ✅ | |
| F08.12 | AI quota on enhance | 🟨 | Not enforced in AIService |
| F08.13 | Auto-apply (no preview) | ❌ | By design — preview required |

---

## F09 — Job match & ATS

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| F09.1 | ATS score (0–100) | ✅ | Circular UI |
| F09.2 | Score breakdown | ✅ | |
| F09.3 | Matched / missing keywords | ✅ | |
| F09.4 | AI suggestions (grouped) | ✅ | |
| F09.5 | Keyword enhance for job | ✅ | Diff + apply |
| F09.6 | Insert keywords → editor | ✅ | `?keywords=` query param |
| F09.7 | Match history (persisted) | ✅ | API; chart on job-match page |
| F09.8 | Cover letter generation | ✅ | Multiple tones |
| F09.9 | Cover letter history | 🟨 | API only |
| F09.10 | Interview questions | 🔧 | Static 5 questions; no AI |
| F09.11 | ATS charts on dashboard | 🟨 | Partial |

---

## F10 — Sharing

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| F10.1 | Generate share link (7 days) | ✅ | |
| F10.2 | Public share page (PDF view) | ✅ | |
| F10.3 | Public PDF download | ✅ | |
| F10.4 | View count | ✅ | |
| F10.5 | Expired link message | ✅ | |
| F10.6 | Custom display name on share | ❌ | Settings stub |

---

## F11 — Admin

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| F11.1 | Admin bootstrap (secret) | ✅ | Swagger / API |
| F11.2 | Admin login (separate session) | ✅ | |
| F11.3 | Platform stats | ✅ | |
| F11.4 | Plan stats + estimated MRR | 🔧 | Placeholder $9.99/user |
| F11.5 | User list + pagination | ✅ | |
| F11.6 | Change user plan | ✅ | Manual until Stripe |
| F11.7 | Change user role | ✅ | |
| F11.8 | Block/unblock user | ✅ | |

---

## F12 — Settings & account

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| F12.1 | Account email display | ✅ | |
| F12.2 | Password change | ✅ | |
| F12.3 | CV locale preference | ✅ | EN/FR/AR → backend |
| F12.4 | UI language (i18n) | ❌ | Cosmetic login flags only |
| F12.5 | Notifications prefs | 🔧 | localStorage only |
| F12.6 | Theme (dark mode) | 🔧 | Toggle without full theme |
| F12.7 | AI usage display | 🔧 | "Coming soon" |
| F12.8 | Upgrade to Pro | 🔧 | Stripe placeholder |

---

## F13 — Billing (M12)

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| F13.1 | Stripe checkout session | 🔧 | Returns placeholder URL |
| F13.2 | Stripe webhook → plan upgrade | 🔧 | Acknowledges only |
| F13.3 | Pro feature gating | 🟨 | Limits coded; all AI free now |

---

## F14 — Internationalization (M09)

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| F14.1 | CV content locale (en/fr/ar) | ✅ | |
| F14.2 | RTL direction for Arabic CV | ✅ | |
| F14.3 | Localized LaTeX section titles | ✅ | |
| F14.4 | UI strings i18n (next-intl) | ❌ | Stub message files |
| F14.5 | Locale routing `/en/`, `/fr/` | ❌ | |

---

## F15 — Observability & QA

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| F15.1 | Health endpoint | ✅ | |
| F15.2 | Swagger API docs | ✅ | |
| F15.3 | Error boundary (frontend) | ✅ | |
| F15.4 | Sonner toasts | ✅ | |
| F15.5 | Playwright smoke test | 🟨 | Single spec |
| F15.6 | Export logging | ✅ | `export_logs` |
| F15.7 | Vercel Analytics | ✅ | Production only |

---

## Feature count summary

| Status | Count (approx.) |
|--------|-----------------|
| ✅ Done | ~75 |
| 🟨 Partial | ~15 |
| 🔧 Stub | ~8 |
| ❌ Not started | ~6 |

See [TASKS.md](./TASKS.md) for implementation task breakdown and remaining work.
