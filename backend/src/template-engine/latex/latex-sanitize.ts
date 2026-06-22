/** Strip pdfLaTeX-only directives that Tectonic does not support. */
export function sanitizeLatexForTectonic(tex: string): string {
  return tex
    .replace(/^\s*\\input\s*\{glyphtounicode\}\s*$/gm, '')
    .replace(/^\s*\\usepackage(?:\[[^\]]*\])?\{glyphtounicode\}\s*$/gm, '')
    .replace(/^\s*\\pdfgentounicode\s*=\s*1\s*$/gm, '');
}
