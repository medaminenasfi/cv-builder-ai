import { Injectable, NotFoundException } from '@nestjs/common';
import { CVsService } from '../cvs/cvs.service';
import { TemplatesService } from '../templates/templates.service';
import { renderTemplate } from '../../template-engine/render';
import type { CVData } from '../../common/cv-schema';

@Injectable()
export class ExportService {
  constructor(
    private readonly cvsService: CVsService,
    private readonly templatesService: TemplatesService,
  ) {}

  async exportHtml(cvId: string, userId: string): Promise<{ html: string }> {
    const cv = await this.cvsService.findById(cvId, userId);
    const version = await this.cvsService.getLatestVersion(cvId);
    const data = (version?.data ?? {}) as unknown as CVData;

    let htmlStructure = '';
    let css = 'body { font-family: Arial, sans-serif; padding: 40px; }';
    if (cv.templateId) {
      const template = await this.templatesService.findById(cv.templateId);
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
}
