import { Logger } from '@nestjs/common';
import puppeteer from 'puppeteer';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const logger = new Logger('OcrUtil');

export async function ocrImageBuffer(imageBuffer: Buffer): Promise<string> {
  const Tesseract = await import('tesseract.js');
  const result = await Tesseract.recognize(imageBuffer, 'eng+fra', {
    logger: () => undefined,
  });
  return result.data.text ?? '';
}

/** OCR fallback when PDF text extraction returns very little (scanned PDFs). */
export async function ocrPdfFirstPage(pdfBuffer: Buffer): Promise<string> {
  const tmpPath = join(tmpdir(), `cv-ocr-${Date.now()}.pdf`);
  await writeFile(tmpPath, pdfBuffer);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.goto(`file:///${tmpPath.replace(/\\/g, '/')}`, {
      waitUntil: 'load',
      timeout: 20000,
    });
    const screenshot = (await page.screenshot({ type: 'png' })) as Buffer;
    const text = await ocrImageBuffer(screenshot);
    logger.log(`OCR extracted ${text.length} chars from PDF first page`);
    return text;
  } finally {
    await browser.close();
    await unlink(tmpPath).catch(() => undefined);
  }
}
