import {
  BadGatewayException,
  BadRequestException,
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
import {
  CV_PARSE_SYSTEM_PROMPT,
  cvParseUserMessage,
} from '../ai/prompts/cv-ai.prompts';
import { OpenRouterService } from '../ai/openrouter.service';
import { CVsService } from '../cvs/cvs.service';
import { CVVersionSource } from '../cvs/entities/cv-version.entity';
import { UserEntity } from '../users/entities/user.entity';

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

/** Higher token budget for parse — needs full JSON output */
const PARSE_MAX_TOKENS = 1024;

@Injectable()
export class ParserService {
  private readonly logger = new Logger(ParserService.name);

  constructor(
    private readonly cvsService: CVsService,
    private readonly openRouter: OpenRouterService,
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
  ) {
    const rawText = await this.extractFileText(buffer, mimeType);
    const parsed = await this.parseTextToCVData(rawText, user);
    return this.saveImportedCV(user, title, parsed);
  }

  async importFileIntoExisting(
    cvId: string,
    user: UserEntity,
    buffer: Buffer,
    mimeType: string,
  ) {
    await this.cvsService.findById(cvId, user.id);
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

  private async extractFileText(buffer: Buffer, mimeType: string): Promise<string> {
    const normalizedMime = mimeType.toLowerCase();
    if (!ALLOWED_MIMES.has(normalizedMime)) {
      throw new BadRequestException('Upload a PDF or DOCX file');
    }

    let rawText: string;
    if (normalizedMime === 'application/pdf') {
      rawText = await extractPdfText(PDFParse, buffer);
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

    try {
      const raw = await this.openRouter.chat(
        CV_PARSE_SYSTEM_PROMPT,
        cvParseUserMessage(rawText),
        PARSE_MAX_TOKENS,
      );
      let normalized = parseAndCoerceAiCV(raw, locale);
      normalized = enrichCVFromRawText(normalized, rawText);

      if (!normalized.personal.email) {
        normalized.personal.email = user.email;
      }

      this.logger.log(
        `Parsed CV: ${normalized.experience.length} jobs, ${normalized.education.length} education, ${normalized.skills.length} skills`,
      );
      return normalized;
    } catch (err) {
      if (err instanceof BadGatewayException) {
        this.logger.warn(
          `AI parse failed (${err.message}) — using regex enrichment fallback`,
        );
        const fallback = enrichCVFromRawText(emptyCVData(locale), rawText);
        if (!fallback.personal.email) fallback.personal.email = user.email;
        if (
          !fallback.personal.fullName &&
          !fallback.experience.length &&
          !fallback.skills.length
        ) {
          throw err;
        }
        return normalizeCVData(fallback, locale);
      }
      throw new BadGatewayException(
        'AI failed to parse resume. Try a clearer file or paste text instead.',
      );
    }
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
