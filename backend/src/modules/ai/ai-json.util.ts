export function parseAiJson<T>(raw: string): T {
  const cleaned = stripMarkdownJson(raw);
  const extracted = extractJsonObject(cleaned);

  const candidates = [
    extracted,
    removeTrailingCommas(extracted),
    removeTrailingCommas(repairTruncatedJson(extracted)),
  ];

  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Invalid JSON');
}

function stripMarkdownJson(raw: string): string {
  return raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
}

function extractJsonObject(text: string): string {
  const start = text.indexOf('{');
  if (start < 0) return text.trim();

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (escape) escape = false;
      else if (c === '\\') escape = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === '{') depth++;
    if (c === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }

  return text.slice(start).trim();
}

function removeTrailingCommas(json: string): string {
  return json.replace(/,\s*([}\]])/g, '$1');
}

function repairTruncatedJson(json: string): string {
  let s = json.trim();
  const stack: string[] = [];
  let inString = false;
  let escape = false;

  for (const c of s) {
    if (inString) {
      if (escape) escape = false;
      else if (c === '\\') escape = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === '{') stack.push('}');
    else if (c === '[') stack.push(']');
    else if (c === '}' || c === ']') stack.pop();
  }

  if (inString) s += '"';
  while (stack.length) s += stack.pop();
  return s;
}

export function newCvId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
