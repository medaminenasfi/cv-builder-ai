import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
import { normalizeCVData } from '../../common/cv-schema';
import { LocalStorageService } from '../storage/local-storage.service';
import { CVsService } from '../cvs/cvs.service';
import { TemplatesService } from '../templates/templates.service';
import { renderTemplate } from '../../template-engine/render';
import { DocxExportService } from './docx-export.service';

@Injectable()
export class ExportService {
  constructor(
    private readonly cvsService: CVsService,
    private readonly templatesService: TemplatesService,
    private readonly docxExportService: DocxExportService,
    private readonly localStorage: LocalStorageService,
  ) {}

  async renderCVHtml(
    cvId: string,
    userId: string,
    draft?: { data?: Record<string, unknown>; templateId?: string | null },
  ): Promise<{ html: string }> {
    const cv = await this.cvsService.findById(cvId, userId);
    const version = await this.cvsService.getLatestVersion(cvId);
    const locale = (cv.locale ?? 'en') as 'en' | 'fr' | 'ar';

    const data = normalizeCVData(
      draft?.data ?? version?.data ?? {},
      locale,
    );

    const templateId = draft?.templateId !== undefined ? draft.templateId : cv.templateId;

    let htmlStructure = '';
    let css = 'body { font-family: Arial, sans-serif; padding: 40px; }';
    if (templateId) {
      const template = await this.templatesService.findById(templateId);
      if (template) {
        htmlStructure = template.htmlStructure;
        css = template.css;
      }
    }

    const html = renderTemplate(htmlStructure, css, data, {
      direction: data.meta?.direction ?? 'ltr',
      locale: cv.locale,
    });
    return { html };
  }

  async exportHtml(cvId: string, userId: string): Promise<{ html: string }> {
    return this.renderCVHtml(cvId, userId);
  }

  async exportPdf(cvId: string, userId: string): Promise<Buffer> {
    const { html } = await this.renderCVHtml(cvId, userId);
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load', timeout: 15000 });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  async exportDocx(cvId: string, userId: string): Promise<Buffer> {
    const cv = await this.cvsService.findByIdWithData(cvId, userId);
    const locale = (cv.locale ?? 'en') as 'en' | 'fr' | 'ar';
    return this.docxExportService.buildDocxBuffer(
      normalizeCVData(cv.data, locale),
      locale,
    );
  }

  async exportPdfToStorage(cvId: string, userId: string) {
    const buffer = await this.exportPdf(cvId, userId);
    const saved = await this.localStorage.saveBuffer(
      `exports/${userId}`,
      buffer,
      `cv-${cvId}.pdf`,
    );
    const url = this.localStorage.buildPublicUrl(saved.relativePath);
    return { url, signedUrl: url, path: saved.relativePath, storage: 'local' as const };
  }

  async exportDocxToStorage(cvId: string, userId: string) {
    const buffer = await this.exportDocx(cvId, userId);
    const saved = await this.localStorage.saveBuffer(
      `exports/${userId}`,
      buffer,
      `cv-${cvId}.docx`,
    );
    const url = this.localStorage.buildPublicUrl(saved.relativePath);
    return { url, signedUrl: url, path: saved.relativePath, storage: 'local' as const };
  }
}
