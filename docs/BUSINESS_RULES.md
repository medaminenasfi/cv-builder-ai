# Business Rules

## User roles

| Role | Permissions |
|------|-------------|
| **user** | Own CVs, templates (read), job match, AI, share, export |
| **admin** | All user permissions + admin routes, template CRUD, user management, platform stats |

**Rules:**
- At least one admin must always exist (cannot demote/block last admin)
- Blocked users cannot login (checked at auth)
- Admin session is separate from user session (different cookies)

---

## Plans & limits

| Rule | Free | Pro |
|------|------|-----|
| Max CVs | **3** | Unlimited (planned) |
| AI calls / day | **25** | **500** |
| Version history | **20** per CV | 20 (same cap currently) |
| Share link TTL | **7 days** | 7 days (same) |
| All AI features | **Free for now** | Same until Stripe M12 |

**Enforcement:**
- CV limit: `CVsService.create()` checks count for `plan === free`
- AI quota: `AiUsageService` in parser + jobs ( **not** in `AIService.enhance` — gap)
- Version cap: oldest version deleted when saving #21

**Plan changes:**
- Currently: admin manual `PATCH /admin/users/:id/plan`
- Future: Stripe webhook (stub only)

Constants: `packages/shared/src/cv-schema.ts` → `FREE_CV_LIMIT = 3`

---

## CV data rules

### Required fields (soft — health score reflects)

| Field | Required for export |
|-------|---------------------|
| `personal.fullName` | Recommended |
| `personal.email` | Recommended |
| At least one experience OR education | Recommended for ATS |

### Section visibility

- `meta.sections` array controls which sections appear in **LaTeX export**
- Hidden sections stripped at render time (`section-visibility.util.ts`)
- Editor sidebar hides disabled sections

### Locale & direction

| Locale | Direction | Section titles |
|--------|-----------|----------------|
| `en` | ltr | English |
| `fr` | ltr | French |
| `ar` | rtl | Arabic |

Set at: CV create, register, settings, parse detection.

### Experience rules

- Each entry has stable `id` (required for AI merge)
- `endDate` may be `"present"` or year string
- Duplicate jobs merged on parse (fuzzy dedupe)
- AI enhance must preserve `id` and employer names

### Version source tracking

| Source | When |
|--------|------|
| `manual` | User edit save |
| `import` | PDF/DOCX parse |
| `ai_enhanced` | Apply AI or job enhancement |

---

## Template rules

| Rule | Detail |
|------|--------|
| Active only | User gallery shows `is_active = true` |
| Engine | `latex` (primary) or `html` (legacy, export not wired) |
| Slug unique | Used for bundled template lookup |
| RTL | `supports_rtl` flag; Arabic CVs should use RTL-capable template |
| Placeholders | Must use `{{fullName}}` etc. — see LATEX-TEMPLATES.md |
| ModernCV | No manual `hyperref`; XeTeX handled by sandbox |

---

## Import / parse rules

| Rule | Detail |
|------|--------|
| Allowed MIME | `application/pdf`, DOCX |
| AI fallback | Heuristic parse if AI fails or quota exhausted |
| OCR | Triggered when extracted text below threshold |
| Confidence | Score + `qualityLabel`: excellent / good / review_recommended / manual_review |
| Warnings | Shown in parse wizard (duplicate sections, low confidence, etc.) |
| Replace behavior | Import into existing CV **replaces** all content |

---

## AI enhance rules

| Rule | Detail |
|------|--------|
| Preview required | Changes not saved until Apply |
| No fake employers | Prompt instructs AI not to invent jobs |
| Partial JSON | AI returns only requested sections |
| No changes | API returns 422 if before === after |
| Token budget | `OPENROUTER_ENHANCE_MAX_TOKENS` default 1536 |
| Undo | Client restores pre-enhance snapshot (not server-side) |

---

## Job match rules

| Rule | Detail |
|------|--------|
| Score range | 0–100 |
| Analysis mode | `ai` (OpenRouter) or `keyword` (fallback) |
| History | Last 20 matches stored per CV |
| Keyword enhance | Rewrites to include missing JD keywords naturally |
| Cover letter | Uses CV facts + JD; tone selectable |

---

## Sharing rules

| Rule | Detail |
|------|--------|
| Token | 64-char random hex |
| Expiry | 7 days from creation |
| Access | Public — no auth |
| View count | Incremented on each view |
| PDF | Generated at view time from latest CV data |

---

## Auth rules

| Rule | Detail |
|------|--------|
| Password | bcrypt hashed |
| Access token TTL | 15 minutes (configurable) |
| Refresh token TTL | 7 days |
| Refresh storage | Hashed in DB; httpOnly cookie |
| Bootstrap | One-time; requires `ADMIN_SETUP_SECRET` |
| Throttle | 100 req/min global |

---

## Export rules

| Rule | Detail |
|------|--------|
| PDF | Requires LaTeX sandbox healthy |
| DOCX | Always available (no template dependency) |
| Export logging | Logged to `export_logs` for dashboard KPIs |
| File access | Owner or admin only via `/files/exports/...` |

---

## Validation (API DTOs)

Backend uses `class-validator` on request bodies. Key validations:

- Email format on register/login
- Password min length on register/change
- UUID params for CV/template IDs
- `sections` array non-empty on enhance
- `tone` string on enhance

CV data normalization happens in `normalizeCVData()` — coerces strings to arrays, assigns IDs, fills defaults.

---

## Billing rules (planned — M12)

| Event | Expected behavior |
|-------|---------------------|
| Checkout complete | Set `plan = pro` |
| Subscription cancelled | Revert to `free` after period |
| Webhook signature | Verify Stripe signature |

**Current:** Checkout returns placeholder URL; webhook returns 200 without side effects.

---

## Free vs Pro feature matrix (current vs planned)

| Feature | Free (now) | Pro (now) | Pro (planned) |
|---------|------------|-----------|---------------|
| Create CV | 3 max | 3 max* | Unlimited |
| AI parse | ✅ | ✅ | ✅ |
| AI enhance | ✅ | ✅ | ✅ + higher quota |
| Job match | ✅ | ✅ | ✅ |
| Cover letter | ✅ | ✅ | ✅ |
| Export PDF | ✅ | ✅ | ✅ |
| Priority support | ❌ | ❌ | ✅ |

*Pro plan exists in DB but Stripe not wired — admin assigns manually.

---

## Compliance & privacy (guidance)

- User CV data stored in PostgreSQL JSONB
- Uploaded imports stored on local disk (user-scoped paths)
- Share links expose CV to anyone with token until expiry
- No GDPR export/delete automation yet (manual via delete CV + account TBD)

See [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) for planned compliance tasks.
