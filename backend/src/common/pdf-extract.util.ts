import { Logger } from '@nestjs/common';
import { cleanResumeText, extractPdfText } from './resume-text.util';

const logger = new Logger('PdfExtractUtil');

type PDFParseClass = new (opts: { data: Buffer }) => {
  getText: () => Promise<{ text: string; pages?: Array<{ num: number; text: string }> }>;
  destroy?: () => Promise<void>;
};

/** Extract PDF text with pdf-parse; returns empty string on hard failure. */
export async function extractPdfTextSafe(
  PDFParse: PDFParseClass,
  buffer: Buffer,
): Promise<string> {
  try {
    return await extractPdfText(PDFParse, buffer);
  } catch (err) {
    logger.warn(`Primary PDF extract failed: ${String(err)}`);
    return '';
  }
}

/** Merge primary + secondary extraction, prefer longer clean output. */
export async function extractPdfTextDual(
  PDFParse: PDFParseClass,
  buffer: Buffer,
): Promise<string> {
  const primary = await extractPdfTextSafe(PDFParse, buffer);

  if (primary.trim().length >= 100) {
    return primary;
  }

  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy?.();
    const alt = cleanResumeText(result.text ?? '');
    if (alt.trim().length > primary.trim().length) {
      logger.log(`Dual PDF extract: secondary yielded ${alt.length} chars`);
      return alt;
    }
  } catch {
    // ignore secondary failure
  }

  return primary;
}

export function validatePdfBuffer(buffer: Buffer): void {
  if (buffer.length < 32) {
    throw new Error('File appears corrupted or empty');
  }
  const header = buffer.subarray(0, 5).toString('ascii');
  if (!header.startsWith('%PDF')) {
    throw new Error('Not a valid PDF file');
  }
}

export function validateDocxBuffer(buffer: Buffer): void {
  if (buffer.length < 4) {
    throw new Error('File appears corrupted or empty');
  }
  const zipSig = buffer[0] === 0x50 && buffer[1] === 0x4b;
  if (!zipSig) {
    throw new Error('Not a valid DOCX file (expected ZIP archive)');
  }
}
