import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { normalizeCVData, type CVData } from '../../common/cv-schema';
import { CVsService } from '../cvs/cvs.service';
import { CVVersionSource } from '../cvs/entities/cv-version.entity';
import { parseAiJson } from './ai-json.util';
import {
  cvEnhanceSystemPrompt,
  cvEnhanceUserMessage,
} from './prompts/cv-ai.prompts';
import { OpenRouterService } from './openrouter.service';

@Injectable()
export class AIService {
  constructor(
    private readonly cvsService: CVsService,
    private readonly openRouter: OpenRouterService,
  ) {}

  async enhance(
    cvId: string,
    userId: string,
    sections: string[],
    tone: string,
  ) {
    const version = await this.cvsService.getLatestVersion(cvId);
    if (!version) throw new NotFoundException('CV has no data');

    const before = normalizeCVData(version.data);
    const raw = await this.openRouter.chat(
      cvEnhanceSystemPrompt(tone),
      cvEnhanceUserMessage(JSON.stringify(before), sections, tone),
    );

    let parsed: Partial<CVData>;
    try {
      parsed = parseAiJson<Partial<CVData>>(raw);
    } catch {
      const retryRaw = await this.openRouter.chat(
        `${cvEnhanceSystemPrompt(tone)}\nReturn ONLY valid JSON. No markdown.`,
        cvEnhanceUserMessage(JSON.stringify(before), sections, tone),
      );
      try {
        parsed = parseAiJson<Partial<CVData>>(retryRaw);
      } catch {
        throw new BadGatewayException('AI returned invalid JSON for enhancement');
      }
    }

    const after = normalizeCVData({ ...before, ...parsed });

    return {
      before,
      after,
      tone,
      sections,
      message: 'Review suggestions before applying',
    };
  }

  async applyEnhancement(
    cvId: string,
    userId: string,
    data: Record<string, unknown>,
  ) {
    await this.cvsService.updateData(
      cvId,
      userId,
      { data },
      CVVersionSource.AI_ENHANCED,
    );
    return { applied: true };
  }
}
