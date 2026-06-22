import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LatexCompileSuccess {
  pdf: Buffer;
}

export interface LatexCompileFailure {
  error: string;
  log: string;
}

@Injectable()
export class LatexCompileClient implements OnModuleInit {
  private readonly logger = new Logger(LatexCompileClient.name);
  private sandboxUrl: string;
  private timeoutMs: number;

  constructor(private readonly config: ConfigService) {
    this.sandboxUrl =
      this.config.get<string>('LATEX_SANDBOX_URL') ?? 'http://localhost:8081';
    const raw = this.config.get<string>('LATEX_COMPILE_TIMEOUT_MS') ?? '120000';
    const parsed = Number.parseInt(String(raw).replace(/\D.*$/, ''), 10);
    this.timeoutMs = Number.isFinite(parsed) && parsed > 0 ? parsed : 120000;
  }

  async onModuleInit() {
    try {
      const res = await fetch(`${this.sandboxUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        this.logger.log(`LaTeX sandbox reachable at ${this.sandboxUrl}`);
      } else {
        this.logger.warn(
          `LaTeX sandbox health check failed (${res.status}). Run: docker compose up latex-sandbox`,
        );
      }
    } catch {
      this.logger.warn(
        `LaTeX sandbox offline at ${this.sandboxUrl}. Run: docker compose up latex-sandbox`,
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.sandboxUrl}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async compile(tex: string): Promise<LatexCompileSuccess> {
    let res: Response;
    try {
      res = await fetch(`${this.sandboxUrl}/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tex, jobName: 'main' }),
        signal: AbortSignal.timeout(this.timeoutMs + 10000),
      });
    } catch (err) {
      const name = err instanceof Error ? err.name : '';
      if (name === 'TimeoutError' || name === 'AbortError') {
        throw new ServiceUnavailableException(
          `LaTeX compile timed out after ${Math.round(this.timeoutMs / 1000)}s. First compile may need extra time — try again or increase LATEX_COMPILE_TIMEOUT_MS.`,
        );
      }
      throw new ServiceUnavailableException(
        `LaTeX compiler unreachable at ${this.sandboxUrl}. Run: docker compose up latex-sandbox`,
      );
    }

    if (res.status === 400 || res.status === 413) {
      const body = (await res.json()) as { message?: string; error?: string };
      throw new BadRequestException(
        body.message ?? body.error ?? 'Invalid LaTeX source',
      );
    }

    if (res.status === 422) {
      const body = (await res.json()) as { log?: string; error?: string };
      throw new UnprocessableEntityException({
        error: body.error ?? 'compile_failed',
        log: body.log ?? 'LaTeX compilation failed',
      });
    }

    if (!res.ok) {
      throw new ServiceUnavailableException(
        `LaTeX compiler error (${res.status})`,
      );
    }

    const arrayBuffer = await res.arrayBuffer();
    const pdf = Buffer.from(arrayBuffer);
    if (pdf.length < 4 || pdf.subarray(0, 4).toString() !== '%PDF') {
      throw new ServiceUnavailableException('LaTeX compiler returned invalid PDF');
    }

    return { pdf };
  }
}
