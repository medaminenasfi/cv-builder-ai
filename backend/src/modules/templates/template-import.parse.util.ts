import { BadRequestException } from '@nestjs/common';
import type { TemplateConfig } from './template-import.types';

function extractFencedBlock(raw: string, lang: string): string | undefined {
  const re = new RegExp(`\`\`\`${lang}\\s*([\\s\\S]*?)\`\`\``, 'i');
  const match = raw.match(re);
  return match?.[1]?.trim();
}

function tryParseJson(raw: string): unknown | undefined {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function extractRawFieldBeforeKey(
  raw: string,
  field: string,
  nextKey: string,
): string | undefined {
  const startRe = new RegExp(`"${field}"\\s*:\\s*"`);
  const startMatch = startRe.exec(raw);
  if (!startMatch || startMatch.index === undefined) return undefined;

  const contentStart = startMatch.index + startMatch[0].length;
  const endRe = new RegExp(`"\\s*,\\s*"${nextKey}"\\s*:`);
  const slice = raw.slice(contentStart);
  const endMatch = endRe.exec(slice);
  if (!endMatch || endMatch.index === undefined) return undefined;

  return slice.slice(0, endMatch.index);
}

/** ChatGPT often returns htmlStructure with unescaped " inside HTML attributes. */
function repairChatGptTemplateJson(cleaned: string): unknown | undefined {
  const htmlStructure = extractRawFieldBeforeKey(cleaned, 'htmlStructure', 'css');
  const css = extractRawFieldBeforeKey(cleaned, 'css', 'supportsRtl');
  if (!htmlStructure?.trim() || !css?.trim()) return undefined;

  const name =
    cleaned.match(/"name"\s*:\s*"((?:\\.|[^"\\])*)"/)?.[1]?.trim() ??
    'Imported Template';
  const slug = cleaned.match(/"slug"\s*:\s*"((?:\\.|[^"\\])*)"/)?.[1]?.trim();

  return {
    name,
    slug,
    htmlStructure: unescapeJsonString(htmlStructure),
    css: unescapeJsonString(css),
    supportsRtl: /"supportsRtl"\s*:\s*true/i.test(cleaned),
    confidence: { overall: 0.85, layout: 0.85, styling: 0.85 },
    notes: 'Repaired ChatGPT JSON (quotes inside HTML/CSS were fixed automatically)',
  };
}

function extractJsonObject(raw: string): unknown | undefined {
  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const direct = tryParseJson(cleaned);
  if (direct !== undefined) return direct;

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) {
    const slice = cleaned.slice(start, end + 1);
    const sliced = tryParseJson(slice);
    if (sliced !== undefined) return sliced;
  }

  const repaired = repairChatGptTemplateJson(cleaned);
  if (repaired) return repaired;

  const htmlBlock = extractFencedBlock(raw, 'html');
  const cssBlock = extractFencedBlock(raw, 'css');
  if (htmlBlock && cssBlock) {
    return {
      name: 'Imported Template',
      htmlStructure: htmlBlock,
      css: cssBlock,
      supportsRtl: false,
      confidence: { overall: 0.65, layout: 0.65, styling: 0.65 },
      notes: 'Parsed from HTML/CSS code blocks',
    };
  }

  const htmlField = cleaned.match(
    /"htmlStructure"\s*:\s*"((?:\\.|[^"\\])*)"/s,
  )?.[1];
  const cssField = cleaned.match(/"css"\s*:\s*"((?:\\.|[^"\\])*)"/s)?.[1];
  if (htmlField && cssField) {
    return {
      name:
        cleaned.match(/"name"\s*:\s*"((?:\\.|[^"\\])*)"/)?.[1] ??
        'Imported Template',
      htmlStructure: unescapeJsonString(htmlField),
      css: unescapeJsonString(cssField),
      supportsRtl: /"supportsRtl"\s*:\s*true/i.test(cleaned),
      confidence: { overall: 0.6, layout: 0.6, styling: 0.6 },
      notes: 'Recovered from partial AI JSON',
    };
  }

  return undefined;
}

function unescapeJsonString(value: string): string {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

export function validateTemplateConfig(data: unknown): TemplateConfig {
  if (!data || typeof data !== 'object') {
    throw new BadRequestException('Invalid template config');
  }

  const o = data as Record<string, unknown>;
  const confidence = o.confidence as Record<string, unknown> | undefined;

  if (
    typeof o.name !== 'string' ||
    typeof o.htmlStructure !== 'string' ||
    typeof o.css !== 'string' ||
    !o.htmlStructure.trim() ||
    !o.css.trim()
  ) {
    throw new BadRequestException(
      'Template must include name, htmlStructure, and css',
    );
  }

  return {
    name: o.name.trim(),
    slug: typeof o.slug === 'string' ? o.slug.trim() : undefined,
    htmlStructure: o.htmlStructure,
    css: o.css,
    supportsRtl: Boolean(o.supportsRtl),
    confidence: {
      overall: clamp01(confidence?.overall, 0.5),
      layout: clamp01(confidence?.layout, 0.5),
      styling: clamp01(confidence?.styling, 0.5),
    },
    notes: typeof o.notes === 'string' ? o.notes : undefined,
  };
}

function clamp01(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : fallback;
  return Math.max(0, Math.min(1, n));
}

export function parseTemplateJsonText(raw: string): TemplateConfig {
  const parsed = extractJsonObject(raw);
  if (!parsed) {
    throw new BadRequestException(
      'Invalid template JSON. Paste the full ChatGPT message, or use Import HTML+CSS. Tip: ask ChatGPT to use single quotes in HTML attributes (class=\'cv-root\').',
    );
  }
  if (isCvResumeJson(parsed)) {
    throw new BadRequestException(
      'This is CV resume data, not a template design. Import CV JSON on Dashboard → Create Resume.',
    );
  }
  return validateTemplateConfig(parsed);
}

export function parseTemplateResponse(raw: string): TemplateConfig {
  return parseTemplateJsonText(raw);
}

export function parseTemplateHtmlPhase(raw: string): {
  name: string;
  htmlStructure: string;
  supportsRtl: boolean;
} {
  const parsed = extractJsonObject(raw);
  if (!parsed || typeof parsed !== 'object') {
    throw new BadRequestException('AI HTML phase returned invalid JSON');
  }
  const o = parsed as Record<string, unknown>;
  if (typeof o.htmlStructure !== 'string' || !o.htmlStructure.trim()) {
    throw new BadRequestException('AI HTML phase missing htmlStructure');
  }
  return {
    name: typeof o.name === 'string' ? o.name.trim() : 'Imported Template',
    htmlStructure: o.htmlStructure,
    supportsRtl: Boolean(o.supportsRtl),
  };
}

export function parseTemplateCssPhase(raw: string): { css: string } {
  const parsed = extractJsonObject(raw);
  if (!parsed || typeof parsed !== 'object') {
    throw new BadRequestException('AI CSS phase returned invalid JSON');
  }
  const o = parsed as Record<string, unknown>;
  if (typeof o.css !== 'string' || !o.css.trim()) {
    throw new BadRequestException('AI CSS phase missing css');
  }
  return { css: o.css };
}

export function isCvResumeJson(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const o = data as Record<string, unknown>;
  if (typeof o.htmlStructure === 'string' && typeof o.css === 'string') {
    return false;
  }
  return Boolean(
    o.personal_info ||
      o.profile ||
      (Array.isArray(o.experience) && o.experience.length > 0) ||
      (o.personal && typeof o.personal === 'object'),
  );
}

export function isJsonTemplateFile(mimeType: string, filename?: string): boolean {
  const mime = mimeType.toLowerCase();
  if (
    mime === 'application/json' ||
    mime === 'text/json' ||
    mime === 'application/octet-stream'
  ) {
    return Boolean(filename?.toLowerCase().endsWith('.json'));
  }
  return mime.includes('json');
}
