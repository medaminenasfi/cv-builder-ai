# RULES — Coding Standards & Engineering Practices

Standards for all contributors and AI-assisted implementation sessions.

---

## 1. General principles

1. **Minimize scope** — Smallest correct diff; no unrelated changes.
2. **Match existing conventions** — Read surrounding code before writing.
3. **No over-engineering** — Avoid premature abstractions.
4. **Self-documenting code** — Comments only for non-obvious business logic.
5. **One TASKS.md item at a time** — Stop after each task for approval.

---

## 2. Repository structure

```
backend/src/
  common/           # Shared utils, guards, decorators, cv-schema
  modules/          # Feature modules (auth, cvs, ai, ...)
  template-engine/  # LaTeX/HTML rendering
  database/migrations/

frontend/
  app/              # Next.js App Router pages
  components/       # React components by domain
  lib/              # API clients, utils, hooks, types
  providers/        # Context providers
  messages/         # i18n JSON (future)

templates/          # Bundled LaTeX sources
packages/shared/    # Shared types (keep in sync with backend cv-schema)
docs/               # Canonical documentation
```

---

## 3. Naming conventions

| Item | Convention | Example |
|------|------------|---------|
| Backend files | kebab-case | `enhance-merge.util.ts` |
| NestJS classes | PascalCase + suffix | `CVsService`, `CVEntity` |
| API routes | kebab-case, plural nouns | `/cvs/:id/enhance` |
| React components | PascalCase | `EditorAiPanel.tsx` |
| React hooks | camelCase, `use` prefix | `useAutoSave` |
| DB tables | snake_case | `cv_versions` |
| Env vars | SCREAMING_SNAKE | `OPENROUTER_API_KEY` |
| Task IDs | T + 3 digits | T120 |
| Feature IDs | F + 2 digits + sub | F08.1 |

---

## 4. TypeScript rules

- Strict typing; avoid `any` unless JSON boundary with immediate parse
- Shared CV types: canonical source is `backend/src/common/cv-schema.ts`
- Frontend mirrors in `frontend/lib/types/cv-data.ts` — update both when schema changes
- Prefer interfaces for data shapes; enums for fixed sets
- Use `unknown` + type guards at API boundaries

---

## 5. Backend (NestJS) rules

### Module structure

```
modules/feature/
  feature.module.ts
  feature.controller.ts
  feature.service.ts
  dto/
  entities/
```

### Controllers

- Thin controllers — logic in services
- Always use guards: `@UseGuards(JwtAuthGuard)` for user routes
- Admin routes: add `RolesGuard` + `@Roles(UserRole.ADMIN)`
- Validate bodies with DTOs + `class-validator`

### Services

- Inject repositories via `@InjectRepository`
- Throw Nest HTTP exceptions (`NotFoundException`, `BadGatewayException`, etc.)
- Normalize CV data through `normalizeCVData()` before save/return

### Database

- **Never** rely on `synchronize: true` in production
- New columns/tables → new migration file with timestamp prefix
- JSONB for CV data; no separate columns per CV field

---

## 6. Frontend (Next.js) rules

### Components

- `'use client'` only when needed (hooks, events, browser APIs)
- Prefer composition over mega-components (edit page is a known exception — split when touching it)
- API calls only through `lib/*-api.ts` — never raw fetch in components

### State

- Server state: TanStack Query (`useCVList`, etc.)
- Editor state: local `useState` + auto-save hook
- Auth: `AuthProvider` context

### Styling

- Tailwind utility classes
- Purple gradient for primary CTAs: `#7c3aed` → `#a855f7`
- Rounded corners: `rounded-lg` / `rounded-2xl` for cards

### UX

- Use Sonner toasts — never `alert()`
- Loading: disable buttons + spinner
- Errors: show in page banner + toast

---

## 7. API design rules

| Rule | Detail |
|------|--------|
| Prefix | All routes under `/api` |
| Auth header | `Authorization: Bearer <token>` |
| Errors | `{ statusCode, message }` |
| IDs | UUID v4 for entities |
| Pagination | `?page=&limit=` on list endpoints |
| File upload | Multipart form field `file` |
| AI endpoints | Return `{ before, after }` for enhancements |

---

## 8. Error handling

### Backend

| Scenario | Exception |
|----------|-----------|
| Missing entity | `NotFoundException` |
| Plan limit hit | `ForbiddenException` or `BadRequestException` |
| AI invalid JSON | `BadGatewayException` |
| AI no changes | `UnprocessableEntityException` |
| Missing API key | `ServiceUnavailableException` |
| LaTeX compile fail | `BadGatewayException` with log |

### Frontend

- Catch `ApiError` from `apiFetch` — display `message`
- Network errors: generic "Connection failed"
- LaTeX offline: show sandbox message in preview component

---

## 9. Security practices

| Area | Rule |
|------|------|
| Passwords | bcrypt, min 8 chars |
| JWT secrets | Strong random, never commit |
| Refresh tokens | Hashed in DB; httpOnly cookie |
| File uploads | Validate MIME; size limit; user-scoped paths |
| LaTeX | Sandboxed Docker; no shell escape; max tex bytes |
| Share tokens | 64-char crypto random |
| Admin bootstrap | One-time secret; disable after use |
| CORS | Restrict to `FRONTEND_URL` |
| Rate limit | 100 req/min (adjust per env) |
| Secrets | Never in git — use `.env` locally, vault in prod |

---

## 10. Testing strategy

| Level | Tool | Scope |
|-------|------|-------|
| Build smoke | `npm run build` (backend + frontend) | Every task |
| Lint | ESLint | Every task |
| Unit | Jest (backend) | Utils, merge logic, parse coerce |
| Integration | Manual + Swagger | New endpoints |
| E2E | Playwright (`frontend/e2e/`) | Critical paths — expand in T128 |
| LaTeX | `npm run test:latex` | Template changes |

**Gate:** Do not mark TASKS.md ✅ unless build passes and no new lint errors in touched files.

---

## 11. Performance rules

| Area | Guideline |
|------|-----------|
| LaTeX preview | Debounce ≥ 2s; use compile cache |
| AI calls | Use tiered token caps (chat/parse/enhance) |
| DB queries | Select only needed columns; paginate lists |
| Frontend bundles | Dynamic import heavy libs (pdf.js) |
| Images | PDF → PNG for previews, not full PDF embed |

---

## 12. Git & commits

- Commit only when user asks
- Never force-push main
- Never commit `.env` or secrets
- Commit messages: imperative, focus on why

---

## 13. Documentation rules

- Canonical docs live in `/docs`
- Update TASKS.md checkpoint after each completed task
- Update FEATURES.md status when completing a feature task
- Legacy docs (`PLAN.md`, `docs/QA-*.md`) — reference but don't duplicate; PROJECT.md is overview

---

## 14. AI-assisted development workflow

```
1. Read TASKS.md → pick lowest open task (respect dependencies)
2. Read relevant docs (API, BUSINESS_RULES, ARCHITECTURE)
3. Implement minimal diff
4. Run: backend build, frontend tsc/lint
5. Update TASKS.md: status ✅ + checkpoint
6. STOP — wait for user approval
```

---

## 15. Environment & secrets checklist

```env
# Required
DATABASE_*
JWT_SECRET, JWT_REFRESH_SECRET
OPENROUTER_API_KEY
LATEX_SANDBOX_URL

# Recommended
OPENROUTER_PARSE_MAX_TOKENS=1024
OPENROUTER_ENHANCE_MAX_TOKENS=1536
FRONTEND_URL=http://localhost:3000

# Production only
NODE_ENV=production
STRIPE_SECRET_KEY
API_PUBLIC_URL
```

---

## 16. Code review checklist

- [ ] Matches naming conventions
- [ ] No secrets in code
- [ ] CV data normalized before save
- [ ] Auth guard on new endpoints
- [ ] Error cases handled
- [ ] UI shows loading + error states
- [ ] TASKS.md updated
- [ ] Build passes
