/** Fix common AI/paste mistakes in Jake-style tabular macros. */
export function normalizePastedLatexTemplate(tex: string): string {
  let out = tex
    .replace(/^\uFEFF/, '')
    .trim()
    .replace(/^```(?:latex|tex)?\s*\r?\n/i, '')
    .replace(/\r?\n```\s*$/i, '')
    .trim()
    .replace(/^\s*\\usepackage(?:\[[^\]]*\])?\{sourcesanspro\}\s*$/gm, '')
    .replace(/(\{\{fullName\}\}|\\scshape\s+\w[^\\]*?)\s*\[3pt\]/g, '$1 \\\\[3pt]')
    .replace(/([^\\])\[3pt\](\s*\r?\n)/g, '$1\\\\[3pt]$2');

  // Single \ before newline inside tabular* (should be \\)
  out = out.replace(
    /(?<!\\)\\(\r?\n)(\s*(?:\\textit|\\end\{tabular|\\bfseries|\\itshape))/g,
    '\\\\$1$2',
  );

  if (!out.includes('\\usepackage[utf8]{inputenc}') && !/\\documentclass[^\n]*\{moderncv\}/.test(out)) {
    out = out.replace(
      /(\\documentclass[^\n]*\n)/,
      '$1\\usepackage[utf8]{inputenc}\n\\usepackage[T1]{fontenc}\n',
    );
  }

  if (/\\documentclass[^\n]*\{moderncv\}/.test(out)) {
    out = out
      .replace(/^\s*\\usepackage(?:\[[^\]]*\])?\{inputenc\}\s*$/gm, '')
      .replace(/^\s*\\usepackage(?:\[[^\]]*\])?\{fontenc\}\s*$/gm, '')
      .replace(/^\s*\\usepackage(?:\[[^\]]*\])?\{babel\}\s*$/gm, '')
      .replace(/^\s*\\usepackage(?:\[[^\]]*\])?\{ragged2e\}\s*$/gm, '')
      .replace(/^\s*\\usepackage(?:\[[^\]]*\])?\{import\}\s*$/gm, '')
      .replace(/^\s*\\usepackage(?:\[[^\]]*\])?\{multicol\}\s*$/gm, '')
      .replace(/^\s*\\nopagenumbers(?:\{\})?\s*$/gm, '')
      .replace(
        /\\newcommand\*\{\\customcventry\}[\s\S]*?(?=\\begin\{document\}|\\usepackage|\\moderncv)/,
        '',
      );
    if (!/\bfrench\b/.test(out.match(/\\documentclass[^\n]*/)?.[0] ?? '')) {
      out = out.replace(
        /\\documentclass(\[[^\]]*\])?\{moderncv\}/,
        (match, opts?: string) => {
          if (opts && /french/.test(opts)) return match;
          if (opts) {
            const inner = opts.slice(1, -1);
            return `\\documentclass[${inner},french]{moderncv}`;
          }
          return '\\documentclass[french]{moderncv}';
        },
      );
    }
  }

  if (!out.includes('{hyperref}') && /\{\{contactLine\}\}/.test(out) && !/\\documentclass[^\n]*\{moderncv\}/.test(out)) {
    out = out.replace(
      /(\\begin\{document\})/,
      '\\usepackage[hidelinks]{hyperref}\n$1',
    );
  }

  return out;
}

/** ModernCV needs \\name{} before \\begin{document} and \\makecvtitle — not a manual center header. */
export function prepareModerncvDocument(tex: string, personalBlock: string): string {
  if (!/\\documentclass[^\n]*\{moderncv\}/.test(tex)) return tex;

  let out = tex;
  const docIdx = out.indexOf('\\begin{document}');
  if (docIdx >= 0) {
    const preamble = out.slice(0, docIdx);
    if (!/\\name\s*\{/.test(preamble) && personalBlock.trim()) {
      out = out.replace('\\begin{document}', `${personalBlock.trim()}\n\n\\begin{document}`);
    }
  }

  out = out.replace(
    /\\begin\{document\}\s*(?:\\vspace\{[^}]*\}\s*)?\\begin\{center\}[\s\S]*?\\end\{center\}\s*(?:\\vspace\{[^}]*\}\s*)?/,
    '\\begin{document}\n\\makecvtitle\n\n',
  );

  if (!/\\makecvtitle/.test(out)) {
    out = out.replace(/\\begin\{document\}\s*/, '\\begin{document}\n\\makecvtitle\n\n');
  }

  return out;
}

/** Strip pdfLaTeX-only directives and empty list environments that break compile. */
export function sanitizeLatexForTectonic(tex: string): string {
  let out = normalizePastedLatexTemplate(tex)
    .replace(/^\s*\\input\s*\{glyphtounicode\}\s*$/gm, '')
    .replace(/^\s*\\usepackage(?:\[[^\]]*\])?\{glyphtounicode\}\s*$/gm, '')
    .replace(/^\s*\\pdfgentounicode\s*=\s*1\s*$/gm, '');

  const emptyListPatterns = [
    /\\resumeSubHeadingListStart\s*\\resumeSubHeadingListEnd(?:\s*\\vspace\{[^}]*\})?/g,
    /\\resumeItemListStart\s*\\resumeItemListEnd/g,
    /\\resumeProjectListStart\s*\\resumeProjectListEnd/g,
    /\\begin\{itemize\}(?:\[[^\]]*\])?\s*\\footnotesize\{\s*\}\s*\\end\{itemize\}/g,
    /\\begin\{itemize\}(?:\[[^\]]*\])?\s*\\end\{itemize\}/g,
  ];
  for (const pattern of emptyListPatterns) {
    out = out.replace(pattern, '');
  }

  if (!out.includes('\\begin{document}')) {
    throw new Error(
      'LaTeX template must include \\begin{document}. Remove markdown code fences (```) if pasted from ChatGPT.',
    );
  }

  return out;
}
