/**
 * One-off debug: parse a local PDF through the same pipeline as import.
 * Usage: npx ts-node -r tsconfig-paths/register scripts/debug-parse-pdf.ts <path-to.pdf>
 */
import * as fs from 'fs';
import * as path from 'path';
import { PDFParse } from 'pdf-parse';
import { parseAndCoerceAiCV } from '../src/common/cv-parse-coerce.util';
import { emptyCVData, normalizeCVData } from '../src/common/cv-schema';
import { cleanResumeText, enrichCVFromRawText } from '../src/common/resume-text.util';
import { extractPdfTextDual } from '../src/common/pdf-extract.util';
import { validateAndRepairCVData } from '../src/common/cv-parse-validate.util';
import { detectLocaleFromText, localeToDirection } from '../src/common/language-detect.util';
import { CV_PARSE_SYSTEM_PROMPT, cvParseUserMessage } from '../src/modules/ai/prompts/cv-ai.prompts';
import { buildParseTextPayload } from '../src/common/resume-text.util';

async function main() {
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    console.error('Usage: ts-node scripts/debug-parse-pdf.ts <pdf>');
    process.exit(1);
  }
  const buffer = fs.readFileSync(path.resolve(pdfPath));
  const rawText = await extractPdfTextDual(PDFParse, buffer);
  const cleaned = cleanResumeText(rawText);

  console.log('=== EXTRACTED TEXT (first 2500 chars) ===');
  console.log(cleaned.slice(0, 2500));
  console.log('\n=== TEXT LENGTH ===', cleaned.length);

  const apiKey = process.env.OPENROUTER_API_KEY;
  let base = emptyCVData('fr');
  base.meta.locale = detectLocaleFromText(cleaned, 'fr');
  base.meta.direction = localeToDirection(base.meta.locale);

  if (apiKey) {
    const payload = buildParseTextPayload(cleaned);
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3002',
        'X-Title': 'CV Builder Parse Debug',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL ?? 'google/gemini-2.5-flash-lite',
        max_tokens: 1024,
        temperature: 0.1,
        messages: [
          { role: 'system', content: CV_PARSE_SYSTEM_PROMPT },
          { role: 'user', content: cvParseUserMessage(payload) },
        ],
      }),
    });
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }>; error?: unknown };
    if (!res.ok) {
      console.error('OpenRouter error', json);
    } else {
      const content = json.choices?.[0]?.message?.content ?? '';
      console.log('\n=== AI RAW length ===', content.length);
      try {
        base = parseAndCoerceAiCV(content, base.meta.locale);
        console.log('\n=== AI parse OK ===', base.experience?.length, 'jobs');
      } catch (err) {
        console.warn('\n=== AI JSON failed, using heuristic only ===', String(err));
      }
    }
  } else {
    console.log('\n(no OPENROUTER_API_KEY — heuristic only)');
  }

  let enriched = enrichCVFromRawText(base, cleaned);
  enriched = validateAndRepairCVData(enriched);
  enriched = normalizeCVData(enriched, enriched.meta.locale);

  console.log('\n=== PARSED CV JSON ===');
  console.log(JSON.stringify(enriched, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
