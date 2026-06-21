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
} from './template-import.prompts';
import type { TemplateConfig } from './template-import.types';

const ALLOWED_MIMES = new Set<string>([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
]);

const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_OPENROUTER_MODEL = 'anthropic/claude-sonnet-4';
/** Lower default keeps free/low-balance OpenRouter accounts under credit limits. */
const DEFAULT_OPENROUTER_MAX_TOKENS = 768;
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
  const configured = configService.get<string>('OPENROUTER_MAX_TOKENS');
  const parsed = configured ? Number.parseInt(configured, 10) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return isOpenRouterKey(apiKey)
    ? DEFAULT_OPENROUTER_MAX_TOKENS
    : DEFAULT_ANTHROPIC_MAX_TOKENS;
}

function parseAffordableMaxTokens(message: string): number | undefined {
  const match = message.match(/can only afford (\d+)/i);
  if (!match) return undefined;
  const afford = Number.parseInt(match[1], 10);
  if (!Number.isFinite(afford) || afford < 256) return undefined;
  return Math.max(256, afford - 64);
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

  async extractTemplateConfigFromFile(
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<TemplateConfig> {
    const normalizedMime = mimeType === 'image/jpg' ? 'image/jpeg' : mimeType;

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

    const model = resolveModel(this.configService, apiKey);
    const maxTokens = resolveMaxTokens(this.configService, apiKey);
    const referer =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    const raw = isOpenRouterKey(apiKey)
      ? await this.callOpenRouter(
          apiKey,
          model,
          referer,
          fileBuffer,
          normalizedMime,
          maxTokens,
        )
      : await this.callAnthropic(
          apiKey,
          model,
          fileBuffer,
          normalizedMime,
          maxTokens,
        );

    const config = this.parseTemplateConfig(raw);

    if (config.confidence.overall < 0.7) {
      this.logger.warn(
        `Low-confidence template import (${config.confidence.overall}) — admin should review`,
      );
    }

    return config;
  }

  private async callOpenRouter(
    apiKey: string,
    model: string,
    referer: string,
    fileBuffer: Buffer,
    mimeType: string,
    maxTokens: number,
  ): Promise<string> {
    if (mimeType === 'application/pdf') {
      throw new BadRequestException(
        'OpenRouter PDF uploads require paid file credits. The admin UI converts PDFs to PNG automatically — refresh the page and try again, or upload a PNG/JPEG screenshot.',
      );
    }

    const base64 = fileBuffer.toString('base64');

    return this.openRouterChat(apiKey, model, referer, maxTokens, {
      userContent: [
        { type: 'text', text: TEMPLATE_IMPORT_USER_MESSAGE },
        {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${base64}`,
          },
        },
      ],
    });
  }

  private async openRouterChat(
    apiKey: string,
    model: string,
    referer: string,
    maxTokens: number,
    options: {
      userContent: unknown[];
      plugins?: unknown[];
    },
  ): Promise<string> {
    let attemptMaxTokens = maxTokens;

    for (let attempt = 0; attempt < 2; attempt++) {
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
          messages: [
            { role: 'system', content: TEMPLATE_IMPORT_SYSTEM_PROMPT },
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
        if (affordable && affordable < attemptMaxTokens) {
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

      if (response.status === 402) {
        throw new BadGatewayException(
          `OpenRouter credits insufficient: ${message} Add credits at openrouter.ai/settings/credits, or set OPENROUTER_MAX_TOKENS to a lower value in backend/.env.`,
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

  private parseTemplateConfig(raw: string): TemplateConfig {
    const cleaned = raw
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new BadRequestException(
        'AI returned invalid JSON. Try a clearer PDF or add the template manually.',
      );
    }

    return this.validateTemplateConfig(parsed);
  }

  private validateTemplateConfig(data: unknown): TemplateConfig {
    if (!data || typeof data !== 'object') {
      throw new BadRequestException('Invalid template config from AI');
    }

    const o = data as Record<string, unknown>;
    const confidence = o.confidence as Record<string, unknown> | undefined;

    if (
      typeof o.name !== 'string' ||
      typeof o.htmlStructure !== 'string' ||
      typeof o.css !== 'string' ||
      !o.htmlStructure.trim() ||
      !o.css.trim()
    ) {
      throw new BadRequestException(
        'AI response missing required name, htmlStructure, or css',
      );
    }

    return {
      name: o.name.trim(),
      slug: typeof o.slug === 'string' ? o.slug.trim() : undefined,
      htmlStructure: o.htmlStructure,
      css: o.css,
      supportsRtl: Boolean(o.supportsRtl),
      confidence: {
        overall: this.clamp01(confidence?.overall, 0.5),
        layout: this.clamp01(confidence?.layout, 0.5),
        styling: this.clamp01(confidence?.styling, 0.5),
      },
      notes: typeof o.notes === 'string' ? o.notes : undefined,
    };
  }

  private clamp01(value: unknown, fallback: number): number {
    const n = typeof value === 'number' ? value : fallback;
    return Math.max(0, Math.min(1, n));
  }
}
