import { Logger } from '@nestjs/common';
import puppeteer from 'puppeteer';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const logger = new Logger('OcrUtil');

const OCR_LANGS = 'eng+fra+ara';

export async function ocrImageBuffer(imageBuffer: Buffer): Promise<string> {
  const Tesseract = await import('tesseract.js');
  const result = await Tesseract.recognize(imageBuffer, OCR_LANGS, {
    logger: () => undefined,
  });
  return result.data.text ?? '';
}

/** OCR all visible PDF pages (scanned documents). */
export async function ocrPdfAllPages(pdfBuffer: Buffer, maxPages = 12): Promise<string> {
  const tmpPath = join(tmpdir(), `cv-ocr-${Date.now()}.pdf`);
  await writeFile(tmpPath, pdfBuffer);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 2 });
    await page.goto(`file:///${tmpPath.replace(/\\/g, '/')}`, {
      waitUntil: 'load',
      timeout: 30000,
    });
    await new Promise((r) => setTimeout(r, 800));

    const pageTexts: string[] = [];
    for (let i = 0; i < maxPages; i++) {
      const screenshot = (await page.screenshot({ type: 'png' })) as Buffer;
      const text = (await ocrImageBuffer(screenshot)).trim();
      if (text.length > 25) {
        const sig = text.slice(0, 80);
        if (!pageTexts.some((t) => t.slice(0, 80) === sig)) {
          pageTexts.push(text);
        }
      }
      await page.keyboard.press('PageDown');
      await new Promise((r) => setTimeout(r, 350));
    }

    const combined = pageTexts.join('\n\n');
    logger.log(`OCR extracted ${combined.length} chars from up to ${maxPages} PDF pages`);
    return combined;
  } finally {
    await browser.close();
    await unlink(tmpPath).catch(() => undefined);
  }
}

/** @deprecated Use ocrPdfAllPages */
export async function ocrPdfFirstPage(pdfBuffer: Buffer): Promise<string> {
  return ocrPdfAllPages(pdfBuffer, 1);
}
