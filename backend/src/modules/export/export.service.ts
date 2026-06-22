import { Injectable, NotFoundException } from '@nestjs/common';
import { normalizeCVData } from '../../common/cv-schema';
import { renderLatex } from '../../template-engine/latex/render-latex';
import { LocalStorageService } from '../storage/local-storage.service';
import { CVsService } from '../cvs/cvs.service';
import { TemplatesService } from '../templates/templates.service';
import { LatexCompileClient } from '../latex/latex-compile.client';
import { DocxExportService } from './docx-export.service';

@Injectable()
export class ExportService {
  constructor(
    private readonly cvsService: CVsService,
    private readonly templatesService: TemplatesService,
    private readonly latexCompileClient: LatexCompileClient,
    private readonly docxExportService: DocxExportService,
    private readonly localStorage: LocalStorageService,
  ) {}

  private async resolveTemplateLatex(templateId: string | null | undefined): Promise<string> {
    if (!templateId) return '';
    const template = await this.templatesService.findById(templateId);
    return template?.latexSource?.trim() ?? '';
  }

  private async buildTex(
    cvId: string,
    userId: string,
    draft?: { data?: Record<string, unknown>; templateId?: string | null },
  ): Promise<{ tex: string; locale: string }> {
    const cv = await this.cvsService.findById(cvId, userId);
    const version = await this.cvsService.getLatestVersion(cvId);
    const locale = (cv.locale ?? 'en') as 'en' | 'fr' | 'ar';

    const draftPayload =
      draft && draft.data !== undefined && draft.data !== null
        ? draft.data
        : undefined;
    const rawSource = draftPayload ?? version?.data ?? {};
    const data = normalizeCVData(rawSource, locale);

    const templateId =
      draft?.templateId !== undefined ? draft.templateId : cv.templateId;
    const latexSource = await this.resolveTemplateLatex(templateId);

    const tex = renderLatex(latexSource, data, {
      direction: data.meta?.direction ?? 'ltr',
      locale: cv.locale,
    });

    return { tex, locale: cv.locale };
  }

  async renderCVPdf(
    cvId: string,
    userId: string,
    draft?: { data?: Record<string, unknown>; templateId?: string | null },
  ): Promise<Buffer> {
    const { tex } = await this.buildTex(cvId, userId, draft);
    const { pdf } = await this.latexCompileClient.compile(tex);
    return pdf;
  }

  async exportPdf(cvId: string, userId: string): Promise<Buffer> {
    return this.renderCVPdf(cvId, userId);
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

  async renderPublicSharePdf(cvId: string): Promise<{
    pdf: Buffer;
    title: string;
    locale: string;
    fullName: string;
  } | null> {
    const cv = await this.cvsService.findByIdPublic(cvId);
    if (!cv) return null;
    const version = await this.cvsService.getLatestVersion(cvId);
    const locale = (cv.locale ?? 'en') as 'en' | 'fr' | 'ar';
    const data = normalizeCVData(version?.data ?? {}, locale);

    const latexSource = await this.resolveTemplateLatex(cv.templateId);
    const tex = renderLatex(latexSource, data, {
      direction: data.meta?.direction ?? 'ltr',
      locale: cv.locale,
    });
    const { pdf } = await this.latexCompileClient.compile(tex);

    return {
      pdf,
      title: cv.title,
      locale: cv.locale,
      fullName: data.personal?.fullName ?? cv.title,
    };
  }

  async exportPublicPdf(cvId: string): Promise<Buffer> {
    const rendered = await this.renderPublicSharePdf(cvId);
    if (!rendered) throw new NotFoundException('CV not found');
    return rendered.pdf;
  }
}
