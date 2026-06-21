import {
  BadGatewayException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { normalizeCVData, type CVData } from '../../common/cv-schema';
import {
  computeKeywordScore,
  computeSectionScore,
  cvTextBlob,
  extractJobKeywords,
  formatSkillName,
  isEnhanceableKeyword,
  keywordPresentInCv,
  matchKeywordsToCv,
} from '../../common/job-keywords.util';
import { newCvId, parseAiJson } from '../ai/ai-json.util';
import {
  CV_ATS_SYSTEM_PROMPT,
  compactCvForAts,
  compactCvForEnhance,
  cvAtsUserMessage,
  cvCoverLetterSystemPrompt,
  cvCoverLetterUserMessage,
  cvKeywordEnhanceSystemPrompt,
  cvKeywordEnhanceUserMessage,
} from '../ai/prompts/cv-ai.prompts';
import { OpenRouterService, isOpenRouterCreditsError } from '../ai/openrouter.service';
import { AiUsageService } from '../usage/ai-usage.service';
import { UsersService } from '../users/users.service';
import { CVsService } from '../cvs/cvs.service';
import { CVVersionSource } from '../cvs/entities/cv-version.entity';
import { AtsMatchEntity } from './entities/ats-match.entity';
import { CoverLetterEntity } from './entities/cover-letter.entity';

export interface AtsMatchResult {
  score: number;
  breakdown: {
    keywords: number;
    format: number;
    sections: number;
    experience: number;
  };
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  gaps?: string[];
  /** ai = OpenRouter analysis; keyword = local fallback when credits unavailable */
  analysisMode?: 'ai' | 'keyword';
  matchId?: string;
}

interface KeywordEnhancePatch {
  summary?: string;
  experienceUpdates?: Array<{ id: string; bullets: string[] }>;
  skillNames?: string[];
  experience?: Array<{ id: string; bullets?: string[] }>;
  skills?: Array<{ id?: string; name: string }>;
}

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly cvsService: CVsService,
    private readonly openRouter: OpenRouterService,
    private readonly aiUsage: AiUsageService,
    private readonly usersService: UsersService,
    @InjectRepository(AtsMatchEntity)
    private readonly atsMatchesRepository: Repository<AtsMatchEntity>,
    @InjectRepository(CoverLetterEntity)
    private readonly coverLettersRepository: Repository<CoverLetterEntity>,
  ) {}

  private async getCvData(cvId: string, userId: string): Promise<CVData> {
    const version = await this.cvsService.getLatestVersion(cvId);
    if (!version) {
      await this.cvsService.findById(cvId, userId);
      throw new NotFoundException('CV has no data');
    }
    await this.cvsService.findById(cvId, userId);
    return normalizeCVData(version.data);
  }

  async match(
    cvId: string,
    userId: string,
    jobDescription: string,
    jobTitle?: string,
  ): Promise<AtsMatchResult> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const cvData = await this.getCvData(cvId, userId);
    const cvJson = compactCvForAts(cvData);

    let result: AtsMatchResult;

    try {
      await this.aiUsage.assertWithinQuota(userId, user.plan);
      const raw = await this.openRouter.chat(
        CV_ATS_SYSTEM_PROMPT,
        cvAtsUserMessage(cvJson, jobDescription),
      );
      await this.aiUsage.recordCall(userId);

      const parsed = parseAiJson<{
        score?: number;
        breakdown?: AtsMatchResult['breakdown'];
        matchedKeywords?: string[];
        missingKeywords?: string[];
        suggestions?: string[];
      }>(raw);

      const missingKeywords = parsed.missingKeywords ?? [];
      result = {
        score: Math.min(100, Math.max(0, Math.round(parsed.score ?? 0))),
        breakdown: parsed.breakdown ?? {
          keywords: 0,
          format: 85,
          sections: 90,
          experience: 80,
        },
        matchedKeywords: parsed.matchedKeywords ?? [],
        missingKeywords,
        suggestions: parsed.suggestions ?? [],
        gaps: missingKeywords,
        analysisMode: 'ai',
      };
    } catch (err) {
      if (isOpenRouterCreditsError(err)) {
        this.logger.warn('ATS match using keyword fallback — OpenRouter credits low');
        result = this.fallbackMatch(cvData, jobDescription);
      } else if (err instanceof BadGatewayException) {
        throw err;
      } else {
        result = this.fallbackMatch(cvData, jobDescription);
      }
    }

    const saved = await this.atsMatchesRepository.save(
      this.atsMatchesRepository.create({
        cvId,
        userId,
        jobTitle: jobTitle ?? null,
        jobDescription,
        score: result.score,
        breakdown: result.breakdown,
        matchedKeywords: result.matchedKeywords,
        missingKeywords: result.missingKeywords,
        suggestions: result.suggestions,
        analysisMode: result.analysisMode ?? 'keyword',
      }),
    );

    return { ...result, matchId: saved.id };
  }

  async listMatches(cvId: string, userId: string) {
    await this.cvsService.findById(cvId, userId);
    return this.atsMatchesRepository.find({
      where: { cvId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  private fallbackMatch(cvData: CVData, jobDescription: string): AtsMatchResult {
    const keywords = extractJobKeywords(jobDescription);
    const { matched, missing } = matchKeywordsToCv(cvData, keywords);
    const keywordScore = computeKeywordScore(matched.length, keywords.length);
    const sectionScore = computeSectionScore(cvData);
    const experienceScore = cvData.experience.length > 0 ? 80 : 40;
    const overall = Math.round(
      keywordScore * 0.55 + sectionScore * 0.25 + experienceScore * 0.2,
    );

    const suggestions: string[] = [];
    if (missing.length > 0) {
      suggestions.push(
        `Add these job-relevant terms to skills and experience: ${missing.slice(0, 6).join(', ')}`,
      );
    }
    if (keywordScore < 40) {
      suggestions.push(
        'Your CV stack may differ from this role — highlight transferable skills (e.g. full-stack, databases, deployment).',
      );
    }

    return {
      score: overall,
      breakdown: {
        keywords: keywordScore,
        format: 85,
        sections: sectionScore,
        experience: experienceScore,
      },
      matchedKeywords: matched,
      missingKeywords: missing.slice(0, 15),
      suggestions,
      gaps: missing.slice(0, 15),
      analysisMode: 'keyword',
    };
  }

  private applyEnhancementPatch(
    before: CVData,
    parsed: KeywordEnhancePatch,
  ): CVData {
    const after = normalizeCVData({ ...before });

    if (typeof parsed.summary === 'string' && parsed.summary.trim()) {
      after.summary = parsed.summary.trim();
    }

    const experienceUpdates =
      parsed.experienceUpdates ??
      (Array.isArray(parsed.experience)
        ? parsed.experience
            .filter((e) => e.id && Array.isArray(e.bullets))
            .map((e) => ({ id: e.id, bullets: e.bullets! }))
        : []);

    if (experienceUpdates.length) {
      after.experience = before.experience.map((exp) => {
        const updated = experienceUpdates.find((p) => p.id === exp.id);
        if (updated?.bullets?.length) {
          return { ...exp, bullets: updated.bullets };
        }
        return exp;
      });
    }

    const skillNames =
      parsed.skillNames ??
      (Array.isArray(parsed.skills)
        ? parsed.skills.map((s) => s.name).filter(Boolean)
        : []);

    if (skillNames.length) {
      const existing = new Set(after.skills.map((s) => s.name.toLowerCase()));
      for (const name of skillNames) {
        const trimmed = name.trim();
        if (!trimmed || existing.has(trimmed.toLowerCase())) continue;
        after.skills.push({ id: newCvId(), name: trimmed, level: 'intermediate' });
        existing.add(trimmed.toLowerCase());
      }
    }

    return after;
  }

  private fallbackEnhancement(
    before: CVData,
    jobDescription: string,
    missingFromMatch: string[],
  ): CVData {
    const fromJd = extractJobKeywords(jobDescription);
    const blob = cvTextBlob(before);
    const toAdd = [...new Set([...missingFromMatch, ...fromJd])]
      .filter((kw) => isEnhanceableKeyword(kw) && !keywordPresentInCv(blob, kw))
      .slice(0, 10);

    const after = normalizeCVData({ ...before });

    if (toAdd.length) {
      const phrase = toAdd.slice(0, 6).join(', ');
      const currentSummary = after.summary?.trim() ?? '';
      if (currentSummary) {
        after.summary = `${currentSummary} Technical exposure includes: ${phrase}.`;
      } else {
        after.summary = `Full-stack developer with experience in ${phrase}.`;
      }

      const existing = new Set(after.skills.map((s) => s.name.toLowerCase()));
      for (const kw of toAdd) {
        const name = formatSkillName(kw);
        if (!existing.has(name.toLowerCase())) {
          after.skills.push({ id: newCvId(), name, level: 'intermediate' });
          existing.add(name.toLowerCase());
        }
      }

      if (after.experience.length > 0 && toAdd.length > 0) {
        const exp = after.experience[0];
        const bullet = `Applied ${toAdd.slice(0, 3).join(', ')} in production projects where relevant.`;
        if (!(exp.bullets ?? []).some((b) => b.toLowerCase().includes(toAdd[0].toLowerCase()))) {
          after.experience = [
            { ...exp, bullets: [...(exp.bullets ?? []), bullet] },
            ...after.experience.slice(1),
          ];
        }
      }
    }

    return after;
  }

  private async requestEnhancementPatch(
    before: CVData,
    jobDescription: string,
    missingKeywords: string[],
    sections: string[],
    tone: string,
  ): Promise<KeywordEnhancePatch> {
    const cvJson = compactCvForEnhance(before);
    const system = cvKeywordEnhanceSystemPrompt(tone);
    const user = cvKeywordEnhanceUserMessage(
      cvJson,
      jobDescription,
      missingKeywords,
      sections,
    );

    const raw = await this.openRouter.chat(system, user);
    return parseAiJson<KeywordEnhancePatch>(raw);
  }

  async enhanceForJob(
    cvId: string,
    userId: string,
    jobDescription: string,
    sections: string[] = ['summary', 'experience', 'skills'],
    tone = 'professional',
  ) {
    const before = await this.getCvData(cvId, userId);
    const matchResult = await this.match(cvId, userId, jobDescription);

    let after: CVData;
    try {
      const parsed = await this.requestEnhancementPatch(
        before,
        jobDescription,
        matchResult.missingKeywords,
        sections,
        tone,
      );
      after = this.applyEnhancementPatch(before, parsed);
    } catch (firstErr) {
      if (isOpenRouterCreditsError(firstErr)) {
        this.logger.warn('Enhancement using keyword fallback — OpenRouter credits low');
        after = this.fallbackEnhancement(before, jobDescription, matchResult.missingKeywords);
      } else {
        this.logger.warn(
          `Enhancement failed, using keyword fallback: ${firstErr instanceof Error ? firstErr.message : firstErr}`,
        );
        after = this.fallbackEnhancement(before, jobDescription, matchResult.missingKeywords);
      }
    }

    const addedKeywords = matchResult.missingKeywords.filter((kw) => {
      const blob = JSON.stringify(after).toLowerCase();
      return blob.includes(kw.toLowerCase());
    });

    return { before, after, addedKeywords, missingKeywords: matchResult.missingKeywords };
  }

  async applyJobEnhancement(
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

  async coverLetter(
    cvId: string,
    userId: string,
    jobDescription: string,
    jobTitle?: string,
  ) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const cvData = await this.getCvData(cvId, userId);
    const locale = cvData.meta.locale ?? 'en';
    let content: string;

    try {
      await this.aiUsage.assertWithinQuota(userId, user.plan);
      const raw = await this.openRouter.chat(
        cvCoverLetterSystemPrompt(locale),
        cvCoverLetterUserMessage(JSON.stringify(cvData), jobDescription),
      );
      await this.aiUsage.recordCall(userId);
      const parsed = parseAiJson<{ content?: string }>(raw);
      content = parsed.content ?? '';
    } catch {
      content = `Dear Hiring Manager,\n\nI am excited to apply for this role. My experience aligns with your requirements.\n\n${jobDescription.slice(0, 200)}...\n\nSincerely,\n${cvData.personal.fullName || '[Your Name]'}`;
    }

    const saved = await this.coverLettersRepository.save(
      this.coverLettersRepository.create({
        cvId,
        userId,
        jobTitle: jobTitle ?? null,
        jobDescription,
        content,
      }),
    );

    return { id: saved.id, content };
  }

  async listCoverLetters(cvId: string, userId: string) {
    await this.cvsService.findById(cvId, userId);
    return this.coverLettersRepository.find({
      where: { cvId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  interviewQuestions(_cvId: string, _userId: string, _jobDescription: string) {
    return {
      questions: [
        { q: 'Tell me about a project relevant to this role.', hint: 'Use STAR method' },
        { q: 'How do you handle tight deadlines?', hint: 'Give a concrete example' },
        { q: 'Why this company?', hint: 'Research the company mission' },
        { q: 'Describe a technical challenge you solved.', hint: 'Focus on impact' },
        { q: 'Where do you see yourself in 3 years?', hint: 'Align with the role' },
      ],
    };
  }
}
