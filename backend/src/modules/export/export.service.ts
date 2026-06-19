import { Injectable } from '@nestjs/common';
import { normalizeCVData } from '../../common/cv-schema';
import { CVsService } from '../cvs/cvs.service';
import { TemplatesService } from '../templates/templates.service';
import { renderTemplate } from '../../template-engine/render';

@Injectable()
export class ExportService {
  constructor(
    private readonly cvsService: CVsService,
    private readonly templatesService: TemplatesService,
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
}
