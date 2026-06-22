import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import type { TemplateConfig } from './template-import.types';

const RTL_SLUGS = new Set(['minimal', 'creative', 'arabic', 'rtl']);

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function resolveTemplatesRoot(): string {
  const candidates = [
    path.join(process.cwd(), '..', 'templates'),
    path.join(process.cwd(), 'templates'),
    path.join(__dirname, '..', '..', '..', '..', 'templates'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
}

@Injectable()
export class BuiltinTemplatesService {
  listBundled(): { slug: string; name: string; supportsRtl: boolean }[] {
    const root = resolveTemplatesRoot();
    if (!fs.existsSync(root)) return [];

    return fs
      .readdirSync(root, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => ({
        slug: d.name,
        name: titleFromSlug(d.name),
        supportsRtl: RTL_SLUGS.has(d.name),
      }))
      .sort((a, b) => a.slug.localeCompare(b.slug));
  }

  loadBundled(slug: string): TemplateConfig {
    const root = resolveTemplatesRoot();
    const dir = path.join(root, slug);
    const htmlPath = path.join(dir, 'template.html');
    const cssPath = path.join(dir, 'template.css');

    if (!fs.existsSync(dir)) {
      throw new NotFoundException(`Built-in template "${slug}" not found`);
    }

    const htmlStructure = fs.existsSync(htmlPath)
      ? fs.readFileSync(htmlPath, 'utf-8')
      : '';
    const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf-8') : '';

    if (!htmlStructure.trim() || !css.trim()) {
      throw new NotFoundException(
        `Template "${slug}" is missing template.html or template.css`,
      );
    }

    return {
      name: titleFromSlug(slug),
      slug,
      htmlStructure,
      css,
      supportsRtl: RTL_SLUGS.has(slug),
      confidence: { overall: 1, layout: 1, styling: 1 },
      notes: 'Loaded from project templates/ folder',
    };
  }
}
