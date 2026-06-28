import type { CVData } from '../../common/cv-schema';
import { isSectionVisible } from '../../common/section-visibility.util';
import { SECTION_TITLES } from '../section-titles';

/** Remove LaTeX blocks for sections the user hid in Settings (before placeholder fill). */
export function omitHiddenSectionsFromLatex(source: string, cvData: CVData): string {
  let out = source;
  for (const key of Object.keys(SECTION_TITLES)) {
    if (isSectionVisible(cvData, key)) continue;

    const withTitlePlaceholder = new RegExp(
      `\\\\section\\*?\\{\\{\\{${key}Title\\}\\}\\}[\\s\\S]*?\\{\\{${key}\\}\\}\\s*(?:\\\\vspace\\{[^}]*\\}\\s*)?`,
      'g',
    );
    out = out.replace(withTitlePlaceholder, '');

    const withPlainTitle = new RegExp(
      `\\\\section\\*?\\{[^{}]*\\}[\\s\\S]*?\\{\\{${key}\\}\\}\\s*(?:\\\\vspace\\{[^}]*\\}\\s*)?`,
      'g',
    );
    out = out.replace(withPlainTitle, '');
  }
  return out;
}

/** Drop empty \\section{} blocks left after hidden/empty content. */
export function stripEmptyLatexSections(tex: string): string {
  return tex.replace(
    /\\section\*?\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\s*(?:\\begin\{itemize\}[\s\S]*?\\end\{itemize\}\s*)?(?:\\vspace\{[^}]*\}\s*)?(?=\\section|\\end\{document\})/g,
    (block) => {
      const body = block.replace(/^\\section\*?\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\s*/, '').trim();
      if (!body) return '';
      if (/^\\begin\{itemize\}[\s\S]*\\end\{itemize\}$/.test(body)) {
        const inner = body.replace(/^\\begin\{itemize\}[\s\S]*?\\item\s*/, '').replace(/\\end\{itemize\}$/, '').trim();
        if (!inner || inner === '\\footnotesize {}' || inner === '{}') return '';
      }
      return block;
    },
  );
}
