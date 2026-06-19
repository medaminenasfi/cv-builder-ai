import { Injectable } from '@nestjs/common';
import { CVsService } from '../cvs/cvs.service';
import { CVVersionSource } from '../cvs/entities/cv-version.entity';

@Injectable()
export class AIService {
  constructor(private readonly cvsService: CVsService) {}

  async enhance(
    cvId: string,
    userId: string,
    sections: string[],
    tone: string,
  ) {
    const version = await this.cvsService.getLatestVersion(cvId);
    if (!version) return { suggestions: [] };

    const data = { ...version.data } as Record<string, unknown>;
    const enhanced = JSON.parse(JSON.stringify(data));

    if (sections.includes('summary') && typeof enhanced.summary === 'string') {
      enhanced.summary = `[${tone}] ${enhanced.summary}`;
    }

    return {
      before: data,
      after: enhanced,
      tone,
      sections,
      message: 'Review suggestions before applying',
    };
  }

  async applyEnhancement(cvId: string, userId: string, data: Record<string, unknown>) {
    await this.cvsService.updateData(cvId, userId, { data });
    return { applied: true };
  }
}
