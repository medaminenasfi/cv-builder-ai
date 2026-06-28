import {
  BadGatewayException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { normalizeCVData, type CVData } from '../../common/cv-schema';
import { CVsService } from '../cvs/cvs.service';
import { CVVersionSource } from '../cvs/entities/cv-version.entity';
import { AiUsageService } from '../usage/ai-usage.service';
import { UsersService } from '../users/users.service';
import { parseAiJson } from './ai-json.util';
import {
  buildEnhancePayload,
  enhancementHasChanges,
  mergeEnhancement,
} from './enhance-merge.util';
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
    private readonly aiUsage: AiUsageService,
    private readonly usersService: UsersService,
  ) {}

  async enhance(
    cvId: string,
    userId: string,
    sections: string[],
    tone: string,
  ) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    await this.cvsService.findById(cvId, userId);
    const version = await this.cvsService.getLatestVersion(cvId);
    if (!version) throw new NotFoundException('CV has no data');

    await this.aiUsage.assertWithinQuota(userId, user.plan);

    const before = normalizeCVData(version.data);
    const payload = buildEnhancePayload(before, sections);
    const maxTokens = this.openRouter.getEnhanceMaxTokens();
    const system = cvEnhanceSystemPrompt(tone, sections);
    const userMsg = cvEnhanceUserMessage(payload, sections, tone);

    const raw = await this.openRouter.chat(system, userMsg, maxTokens);

    let parsed: Partial<CVData>;
    try {
      parsed = parseAiJson<Partial<CVData>>(raw);
    } catch {
      const retryRaw = await this.openRouter.chat(
        `${system}\nReturn ONLY valid JSON. No markdown.`,
        userMsg,
        maxTokens,
      );
      try {
        parsed = parseAiJson<Partial<CVData>>(retryRaw);
      } catch {
        throw new BadGatewayException('AI returned invalid JSON for enhancement');
      }
    }

    await this.aiUsage.recordCall(userId);

    const after = mergeEnhancement(before, parsed, sections);

    if (!enhancementHasChanges(before, after, sections)) {
      throw new UnprocessableEntityException(
        'AI did not produce changes for the selected sections. Try again or edit manually.',
      );
    }

    return {
      before,
      after,
      tone,
      sections,
      message: 'Review suggestions and click Apply to update your CV',
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
