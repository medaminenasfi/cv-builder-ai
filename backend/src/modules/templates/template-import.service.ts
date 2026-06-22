import Anthropic from '@anthropic-ai/sdk';
import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  TEMPLATE_IMPORT_SYSTEM_PROMPT,
  TEMPLATE_IMPORT_USER_MESSAGE,
  TEMPLATE_IMPORT_HTML_SYSTEM_PROMPT,
  TEMPLATE_IMPORT_HTML_USER_MESSAGE,
  TEMPLATE_IMPORT_CSS_SYSTEM_PROMPT,
  templateImportCssUserMessage,
} from './template-import.prompts';
import type { TemplateConfig } from './template-import.types';
import { compressImageForVision } from '../../common/image-compress.util';
import {
  isCvResumeJson,
  isJsonTemplateFile,
  parseTemplateJsonText,
  parseTemplateResponse,
  parseTemplateCssPhase,
  parseTemplateHtmlPhase,
  validateTemplateConfig,
} from './template-import.parse.util';

const CV_JSON_ON_TEMPLATE_HINT =
  'This JSON is CV resume data (personal_info, experience), not a template design. Import it at Dashboard → Create Resume → Import JSON. For templates use htmlStructure + css — try Import HTML+CSS or download Template JSON example.';

const ALLOWED_MIMES = new Set<string>([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
]);

const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_OPENROUTER_MODEL = 'google/gemini-2.5-flash-lite';
const TEMPLATE_VISION_MODEL = 'google/gemini-2.5-flash-lite';
const TEMPLATE_IMPORT_DEFAULT_TOKENS = 2048;
const TEMPLATE_IMPORT_OUTPUT_CAP = 4096;
const TEMPLATE_IMPORT_MIN_OUTPUT_TOKENS = 512;
const TEMPLATE_PHASE_MAX_TOKENS = 1200;
const DEFAULT_ANTHROPIC_MAX_TOKENS = 4096;

const OPENROUTER_MODEL_MAP: Record<string, string> = {
  'claude-sonnet-4-20250514': DEFAULT_OPENROUTER_MODEL,
  'claude-opus-4-5': 'anthropic/claude-opus-4',
  'claude-3-5-sonnet-20241022': 'anthropic/claude-3.5-sonnet',
};

function normalizeApiKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.startsWith('ssk-or-v1-')) {
    return `sk-or-v1-${trimmed.slice('ssk-or-v1-'.length)}`;
  }
  return trimmed;
}

function isOpenRouterKey(key: string): boolean {
  return key.startsWith('sk-or-v1-') || key.startsWith('sk-or-');
}

function isAnthropicKey(key: string): boolean {
  return key.startsWith('sk-ant-');
}

function resolveApiKey(configService: ConfigService): string | undefined {
  const candidates = [
    configService.get<string>('OPENROUTER_API_KEY'),
    process.env.OPENROUTER_API_KEY,
    configService.get<string>('ANTHROPIC_API_KEY'),
    process.env.ANTHROPIC_API_KEY,
  ];

  for (const candidate of candidates) {
    if (candidate?.trim()) {
      return normalizeApiKey(candidate);
    }
  }

  return undefined;
}

function resolveMaxTokens(
  configService: ConfigService,
  apiKey: string,
): number {
  const templateConfigured = configService.get<string>(
    'OPENROUTER_TEMPLATE_MAX_TOKENS',
  );
  const templateParsed = templateConfigured
    ? Number.parseInt(templateConfigured, 10)
    : NaN;

  if (Number.isFinite(templateParsed) && templateParsed > 0) {
    if (isOpenRouterKey(apiKey)) {
      return Math.min(templateParsed, TEMPLATE_IMPORT_OUTPUT_CAP);
    }
    return templateParsed;
  }

  if (isOpenRouterKey(apiKey)) {
    return TEMPLATE_IMPORT_DEFAULT_TOKENS;
  }

  return DEFAULT_ANTHROPIC_MAX_TOKENS;
}

function normalizeUploadMime(mimeType: string, buffer: Buffer): string {
  const normalized = mimeType === 'image/jpg' ? 'image/jpeg' : mimeType;
  if (ALLOWED_MIMES.has(normalized)) return normalized;

  if (buffer.length >= 4) {
    if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
    if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'image/png';
    if (buffer.subarray(0, 4).toString() === '%PDF') {
      return 'application/pdf';
    }
  }

  return normalized;
}

function resolveTemplateVisionModel(
  configService: ConfigService,
  apiKey: string,
): string {
  const configured =
    configService.get<string>('OPENROUTER_TEMPLATE_MODEL') ??
    configService.get<string>('OPENROUTER_MODEL');

  if (isOpenRouterKey(apiKey)) {
    if (configured?.includes('/')) return configured;
    return TEMPLATE_VISION_MODEL;
  }

  return resolveModel(configService, apiKey);
}

function isPromptTokenLimitMessage(message: string): boolean {
  return /prompt tokens limit exceeded/i.test(message);
}

function parseAffordableMaxTokens(message: string): number | undefined {
  const match = message.match(/can only afford (\d+)/i);
  if (!match) return undefined;
  const afford = Number.parseInt(match[1], 10);
  if (!Number.isFinite(afford) || afford < 64) return undefined;
  return Math.max(64, afford - 8);
}

function resolveModel(configService: ConfigService, apiKey: string): string {
  const configured =
    configService.get<string>('OPENROUTER_MODEL') ??
    configService.get<string>('ANTHROPIC_MODEL') ??
    DEFAULT_OPENROUTER_MODEL;

  if (isOpenRouterKey(apiKey)) {
    if (configured.includes('/')) return configured;
    return OPENROUTER_MODEL_MAP[configured] ?? DEFAULT_OPENROUTER_MODEL;
  }

  return configured;
}

function createAnthropicClient(
  apiKey: string,
  referer: string,
): Anthropic {
  return new Anthropic({ apiKey });
}

function extractOpenRouterErrorMessage(body: string, status: number): string {
  try {
    const parsed = JSON.parse(body) as {
      error?: { message?: string; code?: number };
    };
    const nested = parsed.error?.message;
    if (nested) return nested;
  } catch {
    // ignore parse errors
  }
  return body.slice(0, 300) || `HTTP ${status}`;
}

@Injectable()
export class TemplateImportService {
  private readonly logger = new Logger(TemplateImportService.name);

  constructor(private readonly configService: ConfigService) {}

  async importFromJsonText(text: string): Promise<TemplateConfig> {
    return parseTemplateJsonText(text);
  }

  async importFromJsonPayload(payload: unknown): Promise<TemplateConfig> {
    if (isCvResumeJson(payload)) {
      throw new BadRequestException(CV_JSON_ON_TEMPLATE_HINT);
    }
    return validateTemplateConfig(payload);
  }

  async extractTemplateConfigFromFile(
    fileBuffer: Buffer,
    mimeType: string,
    filename?: string,
  ): Promise<TemplateConfig> {
    if (isJsonTemplateFile(mimeType, filename)) {
      return parseTemplateJsonText(fileBuffer.toString('utf8'));
    }

    const normalizedMime = normalizeUploadMime(mimeType, fileBuffer);

    if (!ALLOWED_MIMES.has(normalizedMime)) {
      throw new BadRequestException(
        'Unsupported file type. Upload PDF, PNG, or JPEG.',
      );
    }

    const apiKey = resolveApiKey(this.configService);
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'AI API key is not configured. Set OPENROUTER_API_KEY=sk-or-v1-... in backend/.env and restart the server.',
      );
    }

    const model = resolveTemplateVisionModel(this.configService, apiKey);
    const maxTokens = resolveMaxTokens(this.configService, apiKey);
    const referer =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    if (isOpenRouterKey(apiKey)) {
      return await this.callOpenRouter(
        apiKey,
        model,
        referer,
        fileBuffer,
        normalizedMime,
        maxTokens,
      );
    }

    const raw = await this.callAnthropic(
      apiKey,
      model,
      fileBuffer,
      normalizedMime,
      maxTokens,
    );

    const config = parseTemplateResponse(raw);

    if (config.confidence.overall < 0.7) {
      this.logger.warn(
        `Low-confidence template import (${config.confidence.overall}) — admin should review`,
      );
    }

    return config;
  }

  importTemplatePackage(input: {
    name: string;
    htmlStructure: string;
    css: string;
    slug?: string;
    supportsRtl?: boolean;
  }): TemplateConfig {
    return validateTemplateConfig({
      name: input.name,
      slug: input.slug,
      htmlStructure: input.htmlStructure,
      css: input.css,
      supportsRtl: input.supportsRtl ?? false,
      confidence: { overall: 1, layout: 1, styling: 1 },
      notes: 'Imported from HTML/CSS package',
    });
  }

  private async callOpenRouter(
    apiKey: string,
    model: string,
    referer: string,
    fileBuffer: Buffer,
    mimeType: string,
    maxTokens: number,
  ): Promise<TemplateConfig> {
    if (mimeType === 'application/pdf') {
      throw new BadRequestException(
        'OpenRouter PDF uploads require paid file credits. The admin UI converts PDFs to JPEG automatically — refresh and try again, or upload PNG/JPEG.',
      );
    }

    const widths = [880, 620, 460];
    let lastError = 'AI template extraction failed';
    const phaseTokens = Math.min(
      maxTokens,
      TEMPLATE_PHASE_MAX_TOKENS,
      Math.max(TEMPLATE_IMPORT_MIN_OUTPUT_TOKENS, Math.floor(maxTokens / 2)),
    );

    for (let pass = 0; pass < widths.length; pass++) {
      const { buffer, mimeType: outMime } = await compressImageForVision(
        fileBuffer,
        widths[pass],
      );
      const base64 = buffer.toString('base64');
      const imagePart = {
        type: 'image_url' as const,
        image_url: { url: `data:${outMime};base64,${base64}` },
      };

      try {
        const htmlRaw = await this.openRouterChat(
          apiKey,
          model,
          referer,
          phaseTokens,
          {
            systemPrompt: TEMPLATE_IMPORT_HTML_SYSTEM_PROMPT,
            userContent: [
              { type: 'text', text: TEMPLATE_IMPORT_HTML_USER_MESSAGE },
              imagePart,
            ],
          },
        );
        const htmlPhase = parseTemplateHtmlPhase(htmlRaw);

        const cssRaw = await this.openRouterChat(
          apiKey,
          model,
          referer,
          phaseTokens,
          {
            systemPrompt: TEMPLATE_IMPORT_CSS_SYSTEM_PROMPT,
            userContent: [
              {
                type: 'text',
                text: templateImportCssUserMessage(htmlPhase.htmlStructure),
              },
              imagePart,
            ],
          },
        );
        const cssPhase = parseTemplateCssPhase(cssRaw);

        return validateTemplateConfig({
          name: htmlPhase.name,
          slug: undefined,
          htmlStructure: htmlPhase.htmlStructure,
          css: cssPhase.css,
          supportsRtl: htmlPhase.supportsRtl,
          confidence: {
            overall: 0.75,
            layout: 0.75,
            styling: 0.75,
          },
          notes: 'Two-phase AI import (HTML + CSS)',
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        lastError = msg;
        if (isPromptTokenLimitMessage(msg) && pass < widths.length - 1) {
          this.logger.warn(
            `Prompt too large for credits — retrying template import with ${widths[pass + 1]}px image`,
          );
          continue;
        }

        if (pass === widths.length - 1) {
          this.logger.warn(
            `Two-phase import failed, trying single-pass fallback: ${msg.slice(0, 120)}`,
          );
          try {
            return await this.callOpenRouterSinglePass(
              apiKey,
              model,
              referer,
              fileBuffer,
              maxTokens,
            );
          } catch (fallbackErr) {
            throw fallbackErr;
          }
        }
        throw err;
      }
    }

    throw new BadGatewayException(lastError);
  }

  private async callOpenRouterSinglePass(
    apiKey: string,
    model: string,
    referer: string,
    fileBuffer: Buffer,
    maxTokens: number,
  ): Promise<TemplateConfig> {
    const { buffer, mimeType: outMime } = await compressImageForVision(
      fileBuffer,
      620,
    );
    const base64 = buffer.toString('base64');

    const raw = await this.openRouterChat(apiKey, model, referer, maxTokens, {
      systemPrompt: TEMPLATE_IMPORT_SYSTEM_PROMPT,
      userContent: [
        { type: 'text', text: TEMPLATE_IMPORT_USER_MESSAGE },
        {
          type: 'image_url',
          image_url: { url: `data:${outMime};base64,${base64}` },
        },
      ],
    });

    return parseTemplateResponse(raw);
  }

  private async openRouterChat(
    apiKey: string,
    model: string,
    referer: string,
    maxTokens: number,
    options: {
      systemPrompt: string;
      userContent: unknown[];
      plugins?: unknown[];
    },
  ): Promise<string> {
    let attemptMaxTokens = maxTokens;

    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch(OPENROUTER_CHAT_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': referer,
          'X-Title': 'CV Builder',
        },
        body: JSON.stringify({
          model,
          max_tokens: attemptMaxTokens,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: options.systemPrompt },
            { role: 'user', content: options.userContent },
          ],
          ...(options.plugins ? { plugins: options.plugins } : {}),
        }),
      });

      const body = await response.text();

      if (response.ok) {
        let data: {
          choices?: Array<{ message?: { content?: string | null } }>;
        };
        try {
          data = JSON.parse(body) as typeof data;
        } catch {
          throw new BadGatewayException('AI returned an invalid response');
        }

        const content = data.choices?.[0]?.message?.content;
        if (typeof content !== 'string' || !content.trim()) {
          throw new BadGatewayException('AI returned an empty response');
        }

        return content;
      }

      this.logger.error(
        `OpenRouter template import failed (${response.status}): ${body.slice(0, 500)}`,
      );
      const message = extractOpenRouterErrorMessage(body, response.status);

      if (response.status === 402 && attempt === 0) {
        const affordable = parseAffordableMaxTokens(message);
        if (
          affordable &&
          affordable < attemptMaxTokens &&
          affordable >= TEMPLATE_IMPORT_MIN_OUTPUT_TOKENS
        ) {
          this.logger.warn(
            `Retrying OpenRouter with max_tokens=${affordable} (credit limit)`,
          );
          attemptMaxTokens = affordable;
          continue;
        }
      }

      if (response.status === 401 || response.status === 403) {
        throw new ServiceUnavailableException(
          'Invalid OPENROUTER_API_KEY. Check your key at openrouter.ai/keys and restart the backend.',
        );
      }

      if (response.status === 404 && /no endpoints found/i.test(message)) {
        throw new BadGatewayException(
          `OpenRouter model "${model}" is unavailable. Set OPENROUTER_MODEL and OPENROUTER_TEMPLATE_MODEL to a current model in backend/.env (e.g. google/gemini-2.5-flash-lite). See openrouter.ai/models`,
        );
      }

      if (response.status === 402) {
        if (isPromptTokenLimitMessage(message)) {
          throw new BadGatewayException(
            `OpenRouter prompt too large for your credits (${message}). Upload a smaller screenshot, import a .json package, or add credits at openrouter.ai/settings/credits.`,
          );
        }
        throw new BadGatewayException(
          `OpenRouter credits insufficient: ${message} Add credits at openrouter.ai/settings/credits, import a .json template package, or use Add Template with .html + .css files.`,
        );
      }

      throw new BadGatewayException(`AI template extraction failed: ${message}`);
    }

    throw new BadGatewayException('AI template extraction failed');
  }

  private async callAnthropic(
    apiKey: string,
    model: string,
    fileBuffer: Buffer,
    mimeType: string,
    maxTokens: number,
  ): Promise<string> {
    if (!isAnthropicKey(apiKey)) {
      throw new ServiceUnavailableException(
        'Use OPENROUTER_API_KEY (sk-or-v1-...) for OpenRouter, or ANTHROPIC_API_KEY (sk-ant-...) for Anthropic direct.',
      );
    }

    const client = createAnthropicClient(apiKey, '');
    const base64 = fileBuffer.toString('base64');

    const documentBlock =
      mimeType === 'application/pdf'
        ? {
            type: 'document' as const,
            source: {
              type: 'base64' as const,
              media_type: 'application/pdf' as const,
              data: base64,
            },
          }
        : {
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: mimeType as 'image/png' | 'image/jpeg',
              data: base64,
            },
          };

    try {
      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system: TEMPLATE_IMPORT_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              documentBlock,
              { type: 'text', text: TEMPLATE_IMPORT_USER_MESSAGE },
            ],
          },
        ],
      });

      return response.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('');
    } catch (err) {
      this.logger.error('Anthropic template import failed', err);
      const message = err instanceof Error ? err.message : String(err);

      if (/401|403|authentication|invalid.*api.*key/i.test(message)) {
        throw new ServiceUnavailableException(
          'Invalid ANTHROPIC_API_KEY. Check your key and restart the backend.',
        );
      }

      throw new BadGatewayException(
        `AI template extraction failed: ${message}`,
      );
    }
  }
}
