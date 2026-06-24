/** Escape text for LaTeX body (not math mode). */
export function escapeLatex(text: string): string {
  return text
    .replace(/\u2019/g, "'")
    .replace(/\u2018/g, "'")
    .replace(/\u201C/g, '``')
    .replace(/\u201D/g, "''")
    .replace(/\u2014/g, '---')
    .replace(/\u2013/g, '--')
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([&%$#_{}])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/\u00B7/g, '\\textperiodcentered{}');
}
