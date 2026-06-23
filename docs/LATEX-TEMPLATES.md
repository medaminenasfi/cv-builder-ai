# LaTeX Templates

CV Builder uses **real LaTeX** compiled in an isolated Docker sandbox (`latex-sandbox`).

## Quick start (Windows)

```powershell
docker compose up -d postgres redis latex-sandbox
cd backend
$env:LATEX_SANDBOX_URL="http://localhost:8081"
npm run start:dev
```

Verify compiler:

```powershell
curl http://localhost:8081/health
cd backend && npm run test:latex
```

Seed bundled templates:

```powershell
npm run seed:templates
```

## Admin workflow

1. Open **Admin → Templates**
2. Paste or upload a `.tex` file
3. Click **Compile & Preview** (requires sandbox running)
4. Save template

## Placeholders

Insert these in your `.tex` file; the server fills them from CV data:

| Placeholder | Content |
|-------------|---------|
| `{{fullName}}` | Full name |
| `{{title}}` | Job title |
| `{{contactLine}}` | Location · phone · email · links |
| `{{summary}}` | Profile text |
| `{{experience}}` | LaTeX experience block |
| `{{education}}` | LaTeX education block |
| `{{skills}}` | Skills list |
| `{{languages}}` | Languages |
| `{{technologies}}` | Technologies |
| `{{summaryTitle}}` | Localized section title |
| `{{experienceTitle}}` | Localized section title |

See `frontend/lib/templates-api.ts` → `LATEX_PLACEHOLDERS` for the full list.

## Example template

```latex
\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[french]{babel}
\usepackage[margin=2cm]{geometry}
\usepackage{hyperref}
\usepackage{enumitem}
\begin{document}
\begin{center}
  {\LARGE\textbf{{{fullName}}}}\\[4pt]
  {{title}}\\[2pt]
  {{contactLine}}
\end{center}
\section*{{{summaryTitle}}}
{{summary}}
\section*{{{experienceTitle}}}
{{experience}}
\end{document}
```

## Bundled templates

Located in `templates/*/main.tex`:

- `modern-fr` — blue header, French
- `classic` — traditional layout
- `minimal` — compact single-column
- `jake-resume` — Jake-style 9pt letter
- `jake-resume-12pt` — Jake-style 12pt letter (English babel)

See also: [Jake LaTeX conversion guide](JAKE-LATEX-CONVERSION-GUIDE.md) — convert hardcoded Jake `.tex` to placeholders + ChatGPT prompt.

## Troubleshooting

| Error | Fix |
|-------|-----|
| LaTeX compiler offline | Run `docker compose up latex-sandbox` |
| Package not found | Use packages from warmup list: `inputenc`, `fontenc`, `babel`, `geometry`, `hyperref`, `enumitem`, `xcolor` |
| `Missing \begin{document}` at line 1 | Remove markdown fences (\`\`\`latex ... \`\`\`) from pasted template — or paste raw `.tex` only |
| `sourcesanspro` not found | Not in Tectonic bundle — use `inputenc` + `T1` `fontenc` instead |
| `\write18` rejected | Shell escape is blocked for security |
| Slow preview | Normal — LaTeX takes 2–10s; editor debounces 1.5s |

## API

| Endpoint | Description |
|----------|-------------|
| `POST /admin/templates/latex/compile` | Test compile pasted `.tex` |
| `GET /admin/templates/:id/preview.pdf` | Sample PDF preview |
| `POST /cvs/:id/preview.pdf` | Live editor preview |
| `GET /cvs/:id/export/pdf` | Download PDF |

Sandbox internal API: `POST http://latex-sandbox:8081/compile` with `{ "tex": "..." }`.
