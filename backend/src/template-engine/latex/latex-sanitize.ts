/** Fix common AI/paste mistakes in Jake-style tabular macros. */
export function normalizePastedLatexTemplate(tex: string): string {
  let out = tex
    .replace(/^\uFEFF/, '')
    .trim()
    .replace(/^```(?:latex|tex)?\s*\r?\n/i, '')
    .replace(/\r?\n```\s*$/i, '')
    .trim()
    .replace(/^\s*\\usepackage(?:\[[^\]]*\])?\{sourcesanspro\}\s*$/gm, '')
    .replace(/(\{\{fullName\}\}\})\s*\[3pt\]/g, '$1 \\\\[3pt]');

  // Single \ before newline inside tabular* (should be \\)
  out = out.replace(
    /(?<!\\)\\(\r?\n)(\s*(?:\\textit|\\end\{tabular))/g,
    '\\\\$1$2',
  );

  if (!out.includes('\\usepackage[utf8]{inputenc}')) {
    out = out.replace(
      /(\\documentclass[^\n]*\n)/,
      '$1\\usepackage[utf8]{inputenc}\n\\usepackage[T1]{fontenc}\n',
    );
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
