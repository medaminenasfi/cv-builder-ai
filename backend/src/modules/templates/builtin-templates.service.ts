import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const RTL_SLUGS = new Set(['minimal', 'creative', 'arabic', 'rtl', 'modern-fr', 'jake-resume']);

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

export interface BundledTemplateConfig {
  name: string;
  slug: string;
  latexSource: string;
  supportsRtl: boolean;
  notes: string;
}

@Injectable()
export class BuiltinTemplatesService {
  listBundled(): { slug: string; name: string; supportsRtl: boolean }[] {
    const root = resolveTemplatesRoot();
    if (!fs.existsSync(root)) return [];

    return fs
      .readdirSync(root, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .filter((d) => {
        const texPath = path.join(root, d.name, 'main.tex');
        return fs.existsSync(texPath);
      })
      .map((d) => ({
        slug: d.name,
        name: titleFromSlug(d.name),
        supportsRtl: RTL_SLUGS.has(d.name),
      }))
      .sort((a, b) => a.slug.localeCompare(b.slug));
  }

  loadBundled(slug: string): BundledTemplateConfig {
    const root = resolveTemplatesRoot();
    const dir = path.join(root, slug);
    const texPath = path.join(dir, 'main.tex');

    if (!fs.existsSync(texPath)) {
      throw new NotFoundException(`Built-in LaTeX template "${slug}" not found`);
    }

    const latexSource = fs.readFileSync(texPath, 'utf-8');

    return {
      name: titleFromSlug(slug),
      slug,
      latexSource,
      supportsRtl: RTL_SLUGS.has(slug),
      notes: 'Loaded from project templates/ folder',
    };
  }
}
