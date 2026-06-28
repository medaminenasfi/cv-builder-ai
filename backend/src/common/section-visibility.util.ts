import type { CVData } from './cv-schema';

/** Whether a CV section should appear in export/preview (Settings → Visible sections). */
export function isSectionVisible(data: CVData, key: string): boolean {
  const sections = data.meta?.sections;
  if (!sections?.length) return true;
  return sections.includes(key);
}
