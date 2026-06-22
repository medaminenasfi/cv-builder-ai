'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const PORT = Number(process.env.PORT || 8081);
const COMPILE_TIMEOUT_MS = Number(process.env.COMPILE_TIMEOUT_MS || 180000);
const MAX_TEX_BYTES = Number(process.env.MAX_TEX_BYTES || 262144);
const TECTONIC_BIN = process.env.TECTONIC_BIN || 'tectonic';
const CACHE_DIR = process.env.TECTONIC_CACHE_DIR || '/var/cache/tectonic';

fs.mkdirSync(CACHE_DIR, { recursive: true });

const FORBIDDEN_PATTERNS = [
  /\\write18\b/i,
  /\\immediate\\write18\b/i,
  /\\openin\b/i,
  /\\openout\b/i,
  /\\input\s*\{\s*\//i,
  /\\include\s*\{\s*\//i,
  /\\InputIfFileExists\s*\{\s*\//i,
];

function tectonicEnv() {
  return {
    ...process.env,
    HOME: CACHE_DIR,
    XDG_CACHE_HOME: CACHE_DIR,
    RUST_LOG: 'error',
  };
}

function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('payload_too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function validateTex(tex) {
  if (!tex || typeof tex !== 'string') {
    return { ok: false, error: 'missing_tex', message: 'Request body must include "tex" string' };
  }
  if (Buffer.byteLength(tex, 'utf8') > MAX_TEX_BYTES) {
    return { ok: false, error: 'tex_too_large', message: `LaTeX source exceeds ${MAX_TEX_BYTES} bytes` };
  }
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(tex)) {
      return {
        ok: false,
        error: 'forbidden_command',
        message: 'LaTeX source contains forbidden commands (shell escape or absolute paths)',
      };
    }
  }
  if (!tex.includes('\\documentclass')) {
    return { ok: false, error: 'invalid_tex', message: 'LaTeX source must include \\documentclass' };
  }
  return { ok: true };
}

async function compileTex(tex, jobName = 'main') {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'latex-'));
  const safeName = jobName.replace(/[^a-zA-Z0-9_-]/g, '') || 'main';
  const texPath = path.join(workDir, `${safeName}.tex`);
  const outDir = path.join(workDir, 'out');

  try {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(texPath, tex, 'utf8');

    const { stderr } = await execFileAsync(
      TECTONIC_BIN,
      ['-X', 'compile', `${safeName}.tex`, '--outdir', outDir],
      {
        cwd: workDir,
        timeout: COMPILE_TIMEOUT_MS,
        maxBuffer: 8 * 1024 * 1024,
        env: tectonicEnv(),
      },
    );

    const pdfPath = path.join(outDir, `${safeName}.pdf`);
    if (!fs.existsSync(pdfPath)) {
      return {
        ok: false,
        error: 'compile_failed',
        log: stderr || 'PDF was not produced',
      };
    }

    const pdf = fs.readFileSync(pdfPath);
    return { ok: true, pdf, log: stderr || '' };
  } catch (err) {
    const log =
      (err.stderr && String(err.stderr)) ||
      (err.stdout && String(err.stdout)) ||
      err.message ||
      'Compile failed';
    return { ok: false, error: 'compile_failed', log };
  } finally {
    try {
      fs.rmSync(workDir, { recursive: true, force: true });
    } catch {
      /* ignore cleanup errors */
    }
  }
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    sendJson(res, 200, { ok: true, engine: 'tectonic', cacheDir: CACHE_DIR });
    return;
  }

  if (req.method === 'POST' && req.url === '/compile') {
    try {
      const raw = await readBody(req, MAX_TEX_BYTES + 4096);
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        sendJson(res, 400, { error: 'invalid_json', message: 'Body must be JSON' });
        return;
      }

      const validation = validateTex(body.tex);
      if (!validation.ok) {
        sendJson(res, 400, validation);
        return;
      }

      const result = await compileTex(body.tex, body.jobName || 'main');
      if (!result.ok) {
        sendJson(res, 422, {
          error: result.error,
          log: result.log,
        });
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Length': result.pdf.length,
      });
      res.end(result.pdf);
    } catch (err) {
      if (err.message === 'payload_too_large') {
        sendJson(res, 413, { error: 'payload_too_large', message: 'Request body too large' });
        return;
      }
      sendJson(res, 500, { error: 'internal_error', message: err.message });
    }
    return;
  }

  sendJson(res, 404, { error: 'not_found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`latex-sandbox listening on :${PORT} (cache: ${CACHE_DIR})`);
});
