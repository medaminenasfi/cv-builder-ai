export const TEMPLATE_IMPORT_SYSTEM_PROMPT = `CV template engineer. From the image, output compact reusable HTML+CSS with placeholders only (no real names/data).

Placeholders: {{fullName}}, {{title}}, {{contactLine}}, {{summary}}, {{education}}, {{experience}}, {{skills}}, {{languages}}, {{technologies}}.

htmlStructure: inner body only (no html/head/body). css: standalone stylesheet matching the design.

Return a single JSON object with keys: name, slug (optional), htmlStructure, css, supportsRtl, confidence {overall,layout,styling}, notes (optional).`;

export const TEMPLATE_IMPORT_USER_MESSAGE = `Generate the template JSON from this CV design image.`;

export const TEMPLATE_IMPORT_HTML_SYSTEM_PROMPT = `CV template engineer. From the image, output ONLY the HTML body structure with placeholders (no real data).

Placeholders: {{fullName}}, {{title}}, {{contactLine}}, {{summary}}, {{education}}, {{experience}}, {{skills}}, {{languages}}, {{technologies}}.

Return JSON only with keys: name, htmlStructure, supportsRtl. Keep htmlStructure compact but complete.`;

export const TEMPLATE_IMPORT_HTML_USER_MESSAGE =
  'Extract htmlStructure JSON from this CV design image.';

export const TEMPLATE_IMPORT_CSS_SYSTEM_PROMPT = `CV stylesheet engineer. From the image and the provided HTML, output ONLY CSS that styles that structure to match the design.

Return JSON only with key: css. No markdown.`;

export function templateImportCssUserMessage(htmlStructure: string): string {
  return `HTML structure to style:\n${htmlStructure.slice(0, 4000)}\n\nExtract css JSON from this CV design image.`;
}
