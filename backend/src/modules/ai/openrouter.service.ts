import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_OPENROUTER_MODEL = 'google/gemini-2.5-flash-lite';
const CHEAP_OPENROUTER_MODEL = 'google/gemini-2.5-flash-lite';
const DEFAULT_OPENROUTER_MAX_TOKENS = 192;
const DEFAULT_OPENROUTER_PARSE_MAX_TOKENS = 1024;
const DEFAULT_OPENROUTER_ENHANCE_MAX_TOKENS = 1536;
const ABSOLUTE_MAX_TOKENS = 256;
const ABSOLUTE_PARSE_MAX_TOKENS = 2048;
const ABSOLUTE_ENHANCE_MAX_TOKENS = 4096;

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

function parseAffordableMaxTokens(message: string): number | undefined {
  const match = message.match(/can only afford (\d+)/i);
  if (!match) return undefined;
  const afford = Number.parseInt(match[1], 10);
  if (!Number.isFinite(afford) || afford < 64) return undefined;
  return Math.max(64, afford - 8);
}

function extractOpenRouterErrorMessage(body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    // ignore
  }
  return body.slice(0, 300);
}

function truncateForBudget(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n[truncated]`;
}

export function isOpenRouterCreditsError(err: unknown): boolean {
  if (!(err instanceof BadGatewayException)) return false;
  return /credits|402|afford|paid account/i.test(err.message);
}

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);

  constructor(private readonly configService: ConfigService) {}

  getApiKey(): string {
    const candidates = [
      this.configService.get<string>('OPENROUTER_API_KEY'),
      process.env.OPENROUTER_API_KEY,
      this.configService.get<string>('ANTHROPIC_API_KEY'),
      process.env.ANTHROPIC_API_KEY,
    ];
    for (const candidate of candidates) {
      if (candidate?.trim()) return normalizeApiKey(candidate);
    }
    throw new ServiceUnavailableException(
      'AI API key is not configured. Set OPENROUTER_API_KEY in backend/.env',
    );
  }

  private resolveModel(apiKey: string): string {
    const configured =
      this.configService.get<string>('OPENROUTER_MODEL') ??
      this.configService.get<string>('ANTHROPIC_MODEL') ??
      DEFAULT_OPENROUTER_MODEL;

    if (apiKey.startsWith('sk-or-v1-') || apiKey.startsWith('sk-or-')) {
      if (configured.includes('/')) return configured;
      return OPENROUTER_MODEL_MAP[configured] ?? DEFAULT_OPENROUTER_MODEL;
    }
    return configured;
  }

  private resolveMaxTokens(): number {
    const configured = this.configService.get<string>('OPENROUTER_MAX_TOKENS');
    const parsed = configured ? Number.parseInt(configured, 10) : NaN;
    const fromEnv =
      Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_OPENROUTER_MAX_TOKENS;
    return Math.min(fromEnv, ABSOLUTE_MAX_TOKENS);
  }

  private resolveParseMaxTokens(requested?: number): number {
    const configured = this.configService.get<string>('OPENROUTER_PARSE_MAX_TOKENS');
    const parsed = configured ? Number.parseInt(configured, 10) : NaN;
    const cap =
      Number.isFinite(parsed) && parsed > 0
        ? parsed
        : DEFAULT_OPENROUTER_PARSE_MAX_TOKENS;
    const bounded = Math.min(cap, ABSOLUTE_PARSE_MAX_TOKENS);
    if (requested && requested > 0) return Math.min(requested, bounded);
    return bounded;
  }

  private resolveEnhanceMaxTokens(requested?: number): number {
    const configured = this.configService.get<string>('OPENROUTER_ENHANCE_MAX_TOKENS');
    const parsed = configured ? Number.parseInt(configured, 10) : NaN;
    const cap =
      Number.isFinite(parsed) && parsed > 0
        ? parsed
        : DEFAULT_OPENROUTER_ENHANCE_MAX_TOKENS;
    const bounded = Math.min(cap, ABSOLUTE_ENHANCE_MAX_TOKENS);
    if (requested && requested > 0) return Math.min(requested, bounded);
    return bounded;
  }

  /** Token budget for CV enhance / section rewrite (needs more than chat default). */
  getEnhanceMaxTokens(): number {
    return this.resolveEnhanceMaxTokens();
  }

  async chat(
    system: string,
    user: string,
    maxTokens?: number,
    modelOverride?: string,
  ): Promise<string> {
    const apiKey = this.getApiKey();
    let model = modelOverride ?? this.resolveModel(apiKey);
    const referer =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const defaultCap = this.resolveMaxTokens();
    const cap =
      maxTokens != null && maxTokens > ABSOLUTE_MAX_TOKENS
        ? maxTokens >= ABSOLUTE_PARSE_MAX_TOKENS
          ? this.resolveParseMaxTokens(maxTokens)
          : this.resolveEnhanceMaxTokens(maxTokens)
        : defaultCap;
    let attemptMaxTokens = maxTokens ? Math.min(maxTokens, cap) : cap;
    let userContent = user;
    let usedCheapModel = false;

    for (let attempt = 0; attempt < 8; attempt++) {
      if (attempt === 2) {
        userContent = truncateForBudget(user, Math.max(800, Math.floor(user.length * 0.55)));
      } else if (attempt >= 4) {
        userContent = truncateForBudget(user, Math.max(500, Math.floor(user.length * 0.35)));
      }

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
            { role: 'system', content: system },
            { role: 'user', content: userContent },
          ],
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

      const message = extractOpenRouterErrorMessage(body);

      if (response.status === 402) {
        this.logger.warn(
          `OpenRouter 402 (max_tokens=${attemptMaxTokens}): ${message.slice(0, 120)}`,
        );
        const affordable = parseAffordableMaxTokens(message);
        if (affordable && affordable < attemptMaxTokens) {
          attemptMaxTokens = affordable;
          continue;
        }
        if (!usedCheapModel && model !== CHEAP_OPENROUTER_MODEL) {
          this.logger.warn(
            `Switching to ${CHEAP_OPENROUTER_MODEL} — low OpenRouter credits`,
          );
          model = CHEAP_OPENROUTER_MODEL;
          attemptMaxTokens = Math.min(512, attemptMaxTokens);
          usedCheapModel = true;
          continue;
        }
      } else {
        this.logger.error(
          `OpenRouter failed (${response.status}): ${body.slice(0, 400)}`,
        );
      }

      if (response.status === 401 || response.status === 403) {
        throw new ServiceUnavailableException('Invalid OPENROUTER_API_KEY');
      }

      if (response.status === 404 && /no endpoints found/i.test(message)) {
        throw new BadGatewayException(
          `OpenRouter model "${model}" is unavailable. Update OPENROUTER_MODEL in backend/.env (try google/gemini-2.5-flash-lite). See openrouter.ai/models`,
        );
      }

      if (response.status === 402) {
        throw new BadGatewayException(
          `OpenRouter credits exhausted: ${message} Add credits at openrouter.ai/settings/credits or set OPENROUTER_MAX_TOKENS=192 and OPENROUTER_MODEL=google/gemini-2.5-flash-lite in backend/.env`,
        );
      }

      throw new BadGatewayException(`AI request failed: ${message}`);
    }

    throw new BadGatewayException('AI request failed after retries');
  }
}
