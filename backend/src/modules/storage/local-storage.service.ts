import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class LocalStorageService implements OnModuleInit {
  private readonly logger = new Logger(LocalStorageService.name);
  private root = '';

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    this.root =
      this.configService.get<string>('LOCAL_STORAGE_PATH') ??
      join(process.cwd(), 'storage');

    for (const sub of ['exports', 'uploads', 'imports']) {
      await mkdir(join(this.root, sub), { recursive: true });
    }
    this.logger.log(`Local storage root: ${this.root}`);
  }

  getRoot(): string {
    return this.root;
  }

  getAbsolutePath(relativePath: string): string {
    const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
    const abs = join(this.root, normalized);
    if (!abs.startsWith(this.root)) {
      throw new Error('Invalid storage path');
    }
    return abs;
  }

  async saveBuffer(
    subdir: string,
    buffer: Buffer,
    filename?: string,
  ): Promise<{ path: string; relativePath: string }> {
    const safeName = filename ?? randomUUID();
    const relativePath = `${subdir}/${safeName}`.replace(/\\/g, '/');
    const abs = this.getAbsolutePath(relativePath);
    await mkdir(dirname(abs), { recursive: true });
    await writeFile(abs, buffer);
    return { path: abs, relativePath };
  }

  buildPublicUrl(relativePath: string): string {
    const base =
      this.configService.get<string>('API_PUBLIC_URL') ??
      `http://localhost:${this.configService.get('PORT', 3002)}/api`;
    const normalized = relativePath.replace(/\\/g, '/');
    return `${base.replace(/\/$/, '')}/files/${normalized}`;
  }
}
