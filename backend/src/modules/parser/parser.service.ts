import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { Repository } from 'typeorm';
import { parseAndCoerceAiCV } from '../../common/cv-parse-coerce.util';
import { emptyCVData, normalizeCVData, type CVData } from '../../common/cv-schema';
import {
  cleanResumeText,
  enrichCVFromRawText,
} from '../../common/resume-text.util';
import {
  extractPdfTextDual,
  validateDocxBuffer,
  validatePdfBuffer,
} from '../../common/pdf-extract.util';
import { resolveUploadMime } from '../../common/mime-resolve.util';
import { ocrPdfAllPages } from '../../common/ocr.util';
import { detectLocaleFromText, localeToDirection } from '../../common/language-detect.util';
import { scoreParseConfidence, type ParseConfidence } from '../../common/cv-parse-confidence.util';
import { validateAndRepairCVData } from '../../common/cv-parse-validate.util';
import {
  CV_PARSE_SYSTEM_PROMPT,
  cvParseUserMessage,
} from '../ai/prompts/cv-ai.prompts';
import { OpenRouterService } from '../ai/openrouter.service';
import { AiUsageService } from '../usage/ai-usage.service';
import { LocalStorageService } from '../storage/local-storage.service';
import { CVsService } from '../cvs/cvs.service';
import { CVVersionSource } from '../cvs/entities/cv-version.entity';
import { UserEntity } from '../users/entities/user.entity';
import { ParseAnalyticsEntity } from './entities/parse-analytics.entity';

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]);

const OCR_TEXT_THRESHOLD = 100;
const PARSE_MAX_TOKENS = 1024;
const CHEAP_MODEL = 'google/gemini-2.5-flash-lite';

export type ParseMetaResult = ParseConfidence & {
  detectedLocale: 'en' | 'fr' | 'ar';
  usedOcr: boolean;
  usedAi: boolean;
};

@Injectable()
export class ParserService {
  private readonly logger = new Logger(ParserService.name);

  constructor(
    private readonly cvsService: CVsService,
    private readonly openRouter: OpenRouterService,
    private readonly aiUsage: AiUsageService,
    private readonly localStorage: LocalStorageService,
    @InjectRepository(ParseAnalyticsEntity)
    private readonly parseAnalyticsRepo: Repository<ParseAnalyticsEntity>,
  ) {}

  async importFromText(user: UserEntity, title: string, rawText: string) {
    const cleaned = cleanResumeText(rawText);
    const { data, parseMeta } = await this.parseTextToCVData(cleaned, user, 'text/plain');
    const saved = await this.saveImportedCV(user, title, data, parseMeta);
    return { ...saved, parseMeta };
  }

  async importFromFile(
    user: UserEntity,
    title: string,
    buffer: Buffer,
    mimeType: string,
    originalName?: string,
  ) {
    const started = Date.now();
    await this.archiveUpload(user.id, buffer, mimeType, originalName);
    const { rawText, usedOcr } = await this.extractFileText(buffer, mimeType, originalName);
    const { data, parseMeta } = await this.parseTextToCVData(rawText, user, mimeType, usedOcr);
    const saved = await this.saveImportedCV(user, title, data, parseMeta);
    await this.logAnalytics(user.id, saved.cvId, mimeType, Date.now() - started, parseMeta);
    return { ...saved, parseMeta };
  }

  async importFileIntoExisting(
    cvId: string,
    user: UserEntity,
    buffer: Buffer,
    mimeType: string,
    originalName?: string,
  ) {
    await this.cvsService.findById(cvId, user.id);
    const started = Date.now();
    await this.archiveUpload(user.id, buffer, mimeType, originalName);
    const { rawText, usedOcr } = await this.extractFileText(buffer, mimeType, originalName);
    const { data, parseMeta } = await this.parseTextToCVData(rawText, user, mimeType, usedOcr);
    await this.cvsService.updateData(
      cvId,
      user.id,
      { data: data as unknown as Record<string, unknown> },
      CVVersionSource.IMPORT,
    );
    await this.logAnalytics(user.id, cvId, mimeType, Date.now() - started, parseMeta);

    return {
      cvId,
      message: 'Import merged into this CV — review your fields',
      parseMeta,
    };
  }

  private async archiveUpload(
    userId: string,
    buffer: Buffer,
    mimeType: string,
    originalName?: string,
  ): Promise<void> {
    try {
      const ext = mimeType.includes('pdf') ? 'pdf' : mimeType.includes('word') ? 'docx' : 'bin';
      const name = originalName?.replace(/[^\w.-]+/g, '_') ?? `upload-${Date.now()}.${ext}`;
      await this.localStorage.saveBuffer(`imports/${userId}`, buffer, name);
    } catch (err) {
      this.logger.warn(`Could not archive upload locally: ${String(err)}`);
    }
  }

  private async extractFileText(
    buffer: Buffer,
    mimeType: string,
    originalName?: string,
  ): Promise<{ rawText: string; usedOcr: boolean }> {
    const normalizedMime = resolveUploadMime(mimeType, originalName);

    if (normalizedMime === 'application/msword') {
      throw new BadRequestException(
        'Legacy .doc files are not supported. Please save as DOCX or PDF and try again.',
      );
    }

    if (!ALLOWED_MIMES.has(normalizedMime)) {
      throw new BadRequestException('Upload a PDF or DOCX file');
    }

    let usedOcr = false;
    let rawText: string;

    if (normalizedMime === 'application/pdf') {
      try {
        validatePdfBuffer(buffer);
      } catch (e) {
        throw new BadRequestException(
          e instanceof Error ? e.message : 'Invalid or corrupted PDF file',
        );
      }
      rawText = await extractPdfTextDual(PDFParse, buffer);
      if (rawText.trim().length < OCR_TEXT_THRESHOLD) {
        this.logger.warn('Low PDF text — running multi-page OCR');
        try {
          const ocrText = await ocrPdfAllPages(buffer);
          if (ocrText.trim().length > rawText.trim().length) {
            rawText = cleanResumeText(ocrText);
            usedOcr = true;
          }
        } catch (ocrErr) {
          this.logger.warn(`OCR fallback failed: ${String(ocrErr)}`);
        }
      }
    } else {
      try {
        validateDocxBuffer(buffer);
      } catch (e) {
        throw new BadRequestException(
          e instanceof Error ? e.message : 'Invalid or corrupted DOCX file',
        );
      }
      const result = await mammoth.extractRawText({ buffer });
      rawText = cleanResumeText(result.value);
    }

    if (!rawText.trim()) {
      throw new BadRequestException(
        'Could not extract text from file. If this is a scanned PDF, ensure pages are readable.',
      );
    }

    this.logger.log(
      `Extracted ${rawText.length} chars from ${normalizedMime.includes('pdf') ? 'PDF' : 'DOCX'} (OCR: ${usedOcr})`,
    );
    return { rawText, usedOcr };
  }

  private async parseWithAiRetry(
    rawText: string,
    locale: 'en' | 'fr' | 'ar',
    user: UserEntity,
  ): Promise<{ data: CVData | null; usedAi: boolean }> {
    let apiAvailable = true;
    try {
      this.openRouter.getApiKey();
    } catch {
      apiAvailable = false;
      this.logger.warn('No AI API key — using regex/OCR extraction only');
    }

    if (!apiAvailable) {
      return { data: null, usedAi: false };
    }

    const models = [undefined, CHEAP_MODEL, CHEAP_MODEL] as const;

    for (let attempt = 0; attempt < models.length; attempt++) {
      try {
        if (attempt === 0) {
          await this.aiUsage.assertWithinQuota(user.id, user.plan);
        }
        const raw = await this.openRouter.chat(
          CV_PARSE_SYSTEM_PROMPT,
          cvParseUserMessage(rawText),
          PARSE_MAX_TOKENS,
          models[attempt],
        );
        if (attempt === 0) {
          await this.aiUsage.recordCall(user.id);
        }
        const parsed = parseAndCoerceAiCV(raw, locale);
        this.logger.log(
          `AI parse (attempt ${attempt + 1}): ${parsed.experience?.length ?? 0} jobs`,
        );
        return { data: parsed, usedAi: true };
      } catch (err) {
        if (err instanceof ForbiddenException && attempt === 0) {
          this.logger.warn('AI quota reached — regex fallback');
          break;
        }
        this.logger.warn(`AI attempt ${attempt + 1} failed: ${String(err)}`);
      }
    }
    return { data: null, usedAi: false };
  }

  private async parseTextToCVData(
    rawText: string,
    user: UserEntity,
    mimeType: string,
    usedOcr = false,
  ): Promise<{ data: CVData; parseMeta: ParseMetaResult }> {
    const detectedLocale = detectLocaleFromText(
      rawText,
      user.locale as 'en' | 'fr' | 'ar',
    );
    const locale = detectedLocale;
    let base = emptyCVData(locale);
    base.meta.direction = localeToDirection(locale);
    base.meta.locale = locale;

    const aiResult = await this.parseWithAiRetry(rawText, locale, user);
    if (aiResult.data) {
      base = aiResult.data;
    }

    let enriched = enrichCVFromRawText(base, rawText);
    if (!enriched.personal.email) enriched.personal.email = user.email;

    enriched = validateAndRepairCVData(enriched);
    enriched = normalizeCVData(enriched, locale);
    enriched.meta.locale = locale;
    enriched.meta.direction = localeToDirection(locale);

    const confidence = scoreParseConfidence(enriched, rawText.length);
    const parseMeta: ParseMetaResult = {
      ...confidence,
      detectedLocale: locale,
      usedOcr,
      usedAi: aiResult.usedAi,
    };
    enriched.meta.parseMeta = parseMeta as unknown as Record<string, unknown>;

    this.logger.log(
      `Final parse (${locale}, ${mimeType}): score ${confidence.overall}, ${enriched.experience.length} jobs`,
    );

    if (
      rawText.length > 200 &&
      !enriched.personal.fullName &&
      !enriched.experience.length &&
      !enriched.skills.length &&
      !enriched.technologies.length &&
      !enriched.summary
    ) {
      throw new BadGatewayException(
        'Could not parse resume structure. Try a clearer file or paste text manually.',
      );
    }

    if (
      !enriched.personal.fullName &&
      !enriched.experience.length &&
      !enriched.skills.length &&
      !enriched.technologies.length &&
      !enriched.summary
    ) {
      throw new BadGatewayException(
        'Could not parse resume. Try a clearer PDF/DOCX or paste text manually.',
      );
    }

    return { data: enriched, parseMeta };
  }

  private async saveImportedCV(
    user: UserEntity,
    title: string,
    data: CVData,
    parseMeta: ParseMetaResult,
  ) {
    const cv = await this.cvsService.create(
      { title, locale: parseMeta.detectedLocale },
      user,
    );
    await this.cvsService.updateData(
      cv.id,
      user.id,
      { data: data as unknown as Record<string, unknown> },
      CVVersionSource.IMPORT,
    );
    return {
      cvId: cv.id,
      message: 'Import complete — review and edit your data',
    };
  }

  private async logAnalytics(
    userId: string,
    cvId: string,
    mimeType: string,
    durationMs: number,
    parseMeta: ParseMetaResult,
  ): Promise<void> {
    try {
      await this.parseAnalyticsRepo.save(
        this.parseAnalyticsRepo.create({
          userId,
          cvId,
          mimeType: mimeType.slice(0, 32),
          durationMs,
          usedOcr: parseMeta.usedOcr,
          usedAi: parseMeta.usedAi,
          confidenceScore: parseMeta.overall,
          qualityLabel: parseMeta.qualityLabel,
          detectedLocale: parseMeta.detectedLocale,
          warnings: parseMeta.warnings,
        }),
      );
    } catch (err) {
      this.logger.warn(`Parse analytics log failed: ${String(err)}`);
    }
  }
}
