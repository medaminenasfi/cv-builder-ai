/** Escape text for LaTeX body (not math mode). */
export function escapeLatex(text: string): string {
  return text
    .replace(/\u2014/g, '---')
    .replace(/\u2013/g, '--')
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([&%$#_{}])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}
