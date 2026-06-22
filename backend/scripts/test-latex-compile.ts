import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

config({ path: path.join(__dirname, '../.env') });

const SANDBOX_URL = process.env.LATEX_SANDBOX_URL ?? 'http://localhost:8081';

const SAMPLE_TEX = String.raw`\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[french]{babel}
\usepackage[margin=2cm]{geometry}
\usepackage{hyperref}
\begin{document}
\begin{center}
{\LARGE\textbf{Test CV}}\\
Smoke test compile
\end{center}
\end{document}`;

async function main() {
  console.log(`Checking health at ${SANDBOX_URL}/health ...`);
  const health = await fetch(`${SANDBOX_URL}/health`);
  if (!health.ok) {
    console.error('Health check failed. Run: docker compose up latex-sandbox');
    process.exit(1);
  }
  console.log('Health OK:', await health.json());

  console.log('Compiling sample .tex ...');
  const res = await fetch(`${SANDBOX_URL}/compile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tex: SAMPLE_TEX }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Compile failed:', res.status, err);
    process.exit(1);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.subarray(0, 4).toString() !== '%PDF') {
    console.error('Output is not a PDF');
    process.exit(1);
  }

  const outPath = path.join(__dirname, 'test-output.pdf');
  fs.writeFileSync(outPath, buf);
  console.log(`Success — wrote ${outPath} (${buf.length} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
