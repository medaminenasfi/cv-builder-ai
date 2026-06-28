# UI — Pages, Components & UX

## Design system

| Aspect | Choice |
|--------|--------|
| Font | Inter (Google Fonts) |
| Primary color | Purple (`#7c3aed` → `#a855f7` gradient) |
| Framework | Tailwind CSS 4 |
| Components | shadcn-style (`components/ui/`) |
| Icons | Lucide React |
| Toasts | Sonner |
| Rich text | TipTap (summary field) |
| Charts | Recharts (job-match history) |
| PDF display | pdf.js → canvas PNG (no iframe download) |

**Dark mode:** Settings toggle adds `dark` class but **full dark theme not implemented**.

**i18n:** All UI strings are **hardcoded English**. CV content locale is separate.

---

## Route map

### Public routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Hero, features, pricing, footer (placeholder links) |
| `/login` | Login | Email/password; cosmetic language flags |
| `/register` | Register | Email, password, locale → API |
| `/cv/share/[token]` | Share view | Public PDF viewer + download |

### User routes (auth required)

| Route | Page | Description |
|-------|------|-------------|
| `/dashboard` | Dashboard | CV grid, KPIs, actions |
| `/dashboard/cvs/new` | New CV | Manual → templates; Import file; LinkedIn stub |
| `/templates` | Gallery | Template cards, preview modal, create CV |
| `/cv/[id]/edit` | Editor | Main builder (manual + AI) |
| `/cv/[id]/review` | Review | 10-step post-import wizard |
| `/cv/[id]/preview` | Preview | Full-page A4 PDF |
| `/job-match` | Job Match | ATS, enhance, cover letter (`?cvId=`) |
| `/settings` | Settings | Account, plan, language, profile tabs |

### Admin routes

| Route | Page | Description |
|-------|------|-------------|
| `/admin/login` | Admin login | Separate session |
| `/admin` | Dashboard | Stats, quick links |
| `/admin/dashboard` | Redirect | → `/admin` |
| `/admin/templates` | Templates | LaTeX CRUD, compile, bundled |
| `/admin/users` | Users | Plan, role, block |
| `/admin/plans` | Plans | Billing stats |
| `/admin/stats` | Stats detail | Platform metrics |

---

## Layout structure

```
AppShell (authenticated pages)
├── Sidebar (desktop) / Bottom nav (mobile)
│   Dashboard | Templates | Job Match | Settings | Logout
├── TopBar (optional title + actions)
└── Page content

AdminGuard (admin pages)
├── Admin sidebar
└── Page content
```

---

## Key page workflows

### Dashboard (`/dashboard`)

```
Load KPIs (React Query) + CV list + ATS scores
  → CVCard grid
      → Edit → /cv/:id/edit
      → AI Improve → /cv/:id/edit?ai=1
      → Job Match → /job-match?cvId=:id
      → Share → copy link toast
      → Export PDF/DOCX
```

### Editor (`/cv/[id]/edit`)

```
EditorShell
├── Left: Manual OR AI panel
│   Manual: EditorSidebar + Section panels
│   AI: EditorAiSidePanel (import + EditorAiPanel)
└── Right: CVLivePreview (sticky)

Query params:
  ?ai=1     → AI mode
  ?parse=1  → Open parse wizard
  ?keywords=kw1,kw2 → Merge into skills
```

**Auto-save:** 5s debounce; status in `EditorHeader` (Saved / Saving / Failed)

### Job Match (`/job-match`)

```
Select CV → Paste JD → Match → Score circle + breakdown
  → Enhance for job → Diff → Apply
  → Cover letter (tone picker)
  → Score history chart
  → Link to editor with keywords
```

---

## Component catalog

### Layout

| Component | File | Purpose |
|-----------|------|---------|
| `AppShell` | `components/layout/AppShell.tsx` | Main app wrapper |
| `Sidebar` | `components/layout/Sidebar.tsx` | Navigation |
| `TopBar` | `components/layout/TopBar.tsx` | Page header |
| `AdminGuard` | `components/admin/AdminGuard.tsx` | Admin layout + auth |
| `ErrorBoundary` | `components/ErrorBoundary.tsx` | Global error catch |

### Dashboard

| Component | Purpose |
|-----------|---------|
| `DashboardKpis` | 6 animated stat cards |
| `CVCard` | Resume card with overflow menu |

### Editor

| Component | Purpose |
|-----------|---------|
| `EditorShell` | Two-column layout + mobile tabs |
| `EditorHeader` | Title, health, save status, PDF download |
| `EditorModeSwitch` | Manual ↔ AI |
| `EditorSidebar` | Section navigation |
| `SectionPanel` | Scroll-target wrapper |
| `SortableList` | DnD reorder (experience/education) |
| `RichTextSummary` | TipTap summary |
| `EditorHealthBadge` | Completeness score |
| `EditorAiPanel` | 9 AI actions + diff + Apply |
| `EditorAiSidePanel` | Import zone + AI panel container |
| `EditorInlineParseWizard` | 3-step import review |
| `CVLivePreview` | LaTeX → PDF → image preview |

### Templates

| Component | Purpose |
|-----------|---------|
| `TemplatePreviewFrame` | Card/modal PDF preview |

### Unused / orphan components

| Component | Status |
|-----------|--------|
| `CVPreview` | Stub placeholder — not used |
| `BulletRow` | Legacy mockData — not used |
| `EditorWorkflowPanel` | Not imported |
| `EditorImportZone` | Superseded by inline import |

---

## Editor sections (manual mode)

| Section ID | Fields |
|------------|--------|
| `personal` | fullName, title, email, phone, location, linkedin, website |
| `summary` | Rich text (TipTap) |
| `experience` | Jobs: company, role, dates, bullets (sortable) |
| `education` | institution, degree, dates (sortable) |
| `skills` | Comma/line textarea |
| `languages` | `Language — Level` per line |
| `technologies` | Comma-separated |
| `certifications` | `Name — Issuer — Year` |
| `projects` | Title + bullet lines |
| `settings` | CV title, template, visible sections |

---

## AI panel actions

| Button | Backend sections | Tone |
|--------|------------------|------|
| Improve Summary | summary | professional |
| Rewrite Experience | experience | professional |
| Quantify Achievements | experience | professional |
| Improve Skills | skills, technologies | professional |
| ATS Optimize | summary, experience, skills | professional |
| Professional Tone | summary, experience, skills | professional |
| Executive Tone | summary, experience, skills | executive |
| Technical Tone | summary, experience, skills | technical |
| Academic Tone | summary, experience, skills | academic |

**UX flow:** Click action → spinner → toast "Review… click Apply" → Before/After diff → **Apply** updates editor → **Undo** restores snapshot.

---

## Settings tabs

| Tab | Status |
|-----|--------|
| Account | ✅ Email, password |
| Plan | 🔧 Stripe placeholder |
| Language | ✅ Saves locale to backend |
| Profile | ✅ Basic fields |
| Notifications | 🔧 localStorage only |
| Resume defaults | ✅ Section defaults |
| Theme | 🔧 Toggle without full theme |

---

## Mobile UX

| Screen | Behavior |
|--------|----------|
| Dashboard | FAB for new CV |
| Editor | Edit / Preview tabs; AI panel duplicated above shell on xl:hidden |
| Sidebar | Bottom navigation bar |

---

## Accessibility notes

- Buttons use semantic `<button>` elements
- Share page provides download alternative to PDF viewer
- Loading states with spinners and disabled buttons
- **Gap:** Limited ARIA labels; no skip links; color-only status in some badges

---

## Wireframe equivalents (logical)

### Editor (desktop)

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back | CV Title | Health ● | Saving… | Download PDF      │
├──────────────────────┬──────────────────────────────────────┤
│ [Manual] [AI]        │                                      │
│ ┌─ Sections ─────┐   │     Live PDF Preview                 │
│ │ Personal       │   │     (compiled LaTeX image)           │
│ │ Summary        │   │                                      │
│ │ Experience     │   │                                      │
│ │ ...            │   │                                      │
│ └────────────────┘   │                                      │
│ [Form fields]        │                                      │
└──────────────────────┴──────────────────────────────────────┘
```

### Job Match

```
┌─────────────────────────────────────────┐
│ CV selector | Job title | Job description │
│ [Run Match]                             │
├─────────────────────────────────────────┤
│  (87)   Score breakdown                 │
│  ATS    Keywords matched / missing      │
│         AI suggestions                  │
│ [Enhance for job] [Cover letter]        │
└─────────────────────────────────────────┘
```

---

## Frontend env

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3002/api` | Backend base |

---

## Testing (UI)

```bash
cd frontend && npm run test:e2e   # Playwright smoke
cd frontend && npm run lint
```

See [QA-PRODUCTION.md](./QA-PRODUCTION.md) for manual QA checklist.
