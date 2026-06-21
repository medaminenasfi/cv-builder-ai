import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { parseAndCoerceAiCV } from '../../common/cv-parse-coerce.util';
import { emptyCVData, normalizeCVData, type CVData } from '../../common/cv-schema';
import {
  cleanResumeText,
  enrichCVFromRawText,
  extractPdfText,
} from '../../common/resume-text.util';
import { ocrPdfFirstPage } from '../../common/ocr.util';
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

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const PARSE_MAX_TOKENS = 1024;

@Injectable()
export class ParserService {
  private readonly logger = new Logger(ParserService.name);

  constructor(
    private readonly cvsService: CVsService,
    private readonly openRouter: OpenRouterService,
    private readonly aiUsage: AiUsageService,
    private readonly localStorage: LocalStorageService,
  ) {}

  async importFromText(user: UserEntity, title: string, rawText: string) {
    const cleaned = cleanResumeText(rawText);
    const parsed = await this.parseTextToCVData(cleaned, user);
    return this.saveImportedCV(user, title, parsed);
  }

  async importFromFile(
    user: UserEntity,
    title: string,
    buffer: Buffer,
    mimeType: string,
    originalName?: string,
  ) {
    await this.archiveUpload(user.id, buffer, mimeType, originalName);
    const rawText = await this.extractFileText(buffer, mimeType);
    const parsed = await this.parseTextToCVData(rawText, user);
    return this.saveImportedCV(user, title, parsed);
  }

  async importFileIntoExisting(
    cvId: string,
    user: UserEntity,
    buffer: Buffer,
    mimeType: string,
    originalName?: string,
  ) {
    await this.cvsService.findById(cvId, user.id);
    await this.archiveUpload(user.id, buffer, mimeType, originalName);
    const rawText = await this.extractFileText(buffer, mimeType);
    const parsed = await this.parseTextToCVData(rawText, user);
    await this.cvsService.updateData(
      cvId,
      user.id,
      { data: parsed as unknown as Record<string, unknown> },
      CVVersionSource.IMPORT,
    );

    return {
      cvId,
      message: 'Import merged into this CV — review your fields',
    };
  }

  private async archiveUpload(
    userId: string,
    buffer: Buffer,
    mimeType: string,
    originalName?: string,
  ): Promise<void> {
    try {
      const ext = mimeType.includes('pdf') ? 'pdf' : 'docx';
      const name = originalName?.replace(/[^\w.-]+/g, '_') ?? `upload-${Date.now()}.${ext}`;
      await this.localStorage.saveBuffer(`imports/${userId}`, buffer, name);
    } catch (err) {
      this.logger.warn(`Could not archive upload locally: ${String(err)}`);
    }
  }

  private async extractFileText(buffer: Buffer, mimeType: string): Promise<string> {
    const normalizedMime = mimeType.toLowerCase();
    if (!ALLOWED_MIMES.has(normalizedMime)) {
      throw new BadRequestException('Upload a PDF or DOCX file');
    }

    let rawText: string;
    if (normalizedMime === 'application/pdf') {
      rawText = await extractPdfText(PDFParse, buffer);
      if (rawText.trim().length < 80) {
        this.logger.warn('Low PDF text — trying OCR on first page');
        try {
          const ocrText = await ocrPdfFirstPage(buffer);
          if (ocrText.trim().length > rawText.trim().length) {
            rawText = cleanResumeText(ocrText);
          }
        } catch (ocrErr) {
          this.logger.warn(`OCR fallback failed: ${String(ocrErr)}`);
        }
      }
    } else {
      const result = await mammoth.extractRawText({ buffer });
      rawText = cleanResumeText(result.value);
    }

    if (!rawText.trim()) {
      throw new BadRequestException('Could not extract text from file');
    }

    this.logger.log(
      `Extracted ${rawText.length} chars from ${normalizedMime.includes('pdf') ? 'PDF' : 'DOCX'}`,
    );
    return rawText;
  }

  private async parseTextToCVData(
    rawText: string,
    user: UserEntity,
  ): Promise<CVData> {
    const locale = user.locale as 'en' | 'fr' | 'ar';
    let base = emptyCVData(locale);

    try {
      await this.aiUsage.assertWithinQuota(user.id, user.plan);
      const raw = await this.openRouter.chat(
        CV_PARSE_SYSTEM_PROMPT,
        cvParseUserMessage(rawText),
        PARSE_MAX_TOKENS,
      );
      await this.aiUsage.recordCall(user.id);
      base = parseAndCoerceAiCV(raw, locale);
      this.logger.log(
        `AI parse: ${base.experience?.length ?? 0} jobs, ${base.skills?.length ?? 0} skills`,
      );
    } catch (err) {
      if (err instanceof ForbiddenException) {
        this.logger.warn('AI quota reached — using text extraction fallback');
      } else if (err instanceof BadGatewayException) {
        this.logger.warn(`AI parse failed (${err.message}) — using text extraction fallback`);
      } else {
        this.logger.warn(`Parse error (${String(err)}) — using text extraction fallback`);
      }
    }

    let enriched = enrichCVFromRawText(base, rawText);
    if (!enriched.personal.email) enriched.personal.email = user.email;

    enriched = normalizeCVData(enriched, locale);

    this.logger.log(
      `Final parse: ${enriched.experience.length} jobs, ${enriched.education.length} education, ${enriched.skills.length} skills, ${enriched.languages.length} languages, ${enriched.technologies.length} tech`,
    );

    if (
      !enriched.personal.fullName &&
      !enriched.experience.length &&
      !enriched.skills.length &&
      !enriched.technologies.length
    ) {
      throw new BadGatewayException(
        'Could not parse resume. Check OpenRouter credits or paste text manually.',
      );
    }

    return enriched;
  }

  private async saveImportedCV(
    user: UserEntity,
    title: string,
    data: CVData,
  ) {
    const cv = await this.cvsService.create({ title }, user);
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
}
