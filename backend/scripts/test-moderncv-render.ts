import * as fs from 'fs';
import * as path from 'path';
import { renderLatex, SAMPLE_CV } from '../src/template-engine/latex/render-latex';

async function main() {
  const texPath =
    process.argv[2] ??
    path.join(__dirname, '../../templates/moderncv-banking/main.tex');
  const source = fs.readFileSync(texPath, 'utf8');
  const rendered = renderLatex(source, SAMPLE_CV, { locale: 'fr' });
  const outPath = path.join(__dirname, 'moderncv-rendered.tex');
  fs.writeFileSync(outPath, rendered);
  console.log('Wrote', outPath, rendered.length, 'bytes');
  console.log('First error-prone lines around header:');
  const lines = rendered.split('\n');
  lines.slice(10, 20).forEach((l, i) => console.log(`${11 + i}: ${l}`));

  const url = process.env.LATEX_SANDBOX_URL ?? 'http://localhost:8081';
  try {
    const res = await fetch(`${url}/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tex: rendered }),
    });
    if (!res.ok) {
      console.error('Compile failed:', res.status, await res.text());
      process.exit(1);
    }
    const pdf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(path.join(__dirname, 'moderncv-test.pdf'), pdf);
    console.log('PDF OK', pdf.length, 'bytes');
  } catch (e) {
    console.warn('Sandbox not reachable — rendered .tex only:', e);
  }
}

main();
