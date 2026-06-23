import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { TemplateEntity, TemplateEngine } from '../src/modules/templates/entities/template.entity';
import { UserEntity } from '../src/modules/users/entities/user.entity';
import { RefreshTokenEntity } from '../src/modules/auth/entities/refresh-token.entity';

config({ path: path.join(__dirname, '../.env') });

const RTL_SLUGS = new Set(['minimal', 'creative', 'arabic', 'rtl', 'modern-fr', 'jake-resume', 'jake-resume-12pt']);

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function discoverTemplates(root: string): { slug: string; name: string; supportsRtl: boolean }[] {
  if (!fs.existsSync(root)) return [];

  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .filter((d) => fs.existsSync(path.join(root, d.name, 'main.tex')))
    .map((d) => ({
      slug: d.name,
      name: titleFromSlug(d.name),
      supportsRtl: RTL_SLUGS.has(d.name),
    }));
}

async function seed() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 55432),
    username: process.env.DATABASE_USER ?? 'cvbuilder',
    password: process.env.DATABASE_PASSWORD ?? 'cvbuilder',
    database: process.env.DATABASE_NAME ?? 'cvbuilder',
    entities: [TemplateEntity, UserEntity, RefreshTokenEntity],
    synchronize: true,
  });
  await ds.initialize();
  const repo = ds.getRepository(TemplateEntity);
  const root = path.join(__dirname, '../../templates');

  const templates = discoverTemplates(root);
  if (templates.length === 0) {
    console.warn('No LaTeX template folders found (templates/*/main.tex)');
    await ds.destroy();
    return;
  }

  for (const t of templates) {
    const texPath = path.join(root, t.slug, 'main.tex');
    const latexSource = fs.readFileSync(texPath, 'utf-8');

    const existing = await repo.findOne({ where: { slug: t.slug } });
    if (existing) {
      existing.latexSource = latexSource;
      existing.engine = TemplateEngine.LATEX;
      existing.supportsRtl = t.supportsRtl;
      existing.isActive = true;
      await repo.save(existing);
      console.log(`Updated LaTeX template: ${t.slug}`);
    } else {
      await repo.save(
        repo.create({
          slug: t.slug,
          name: t.name,
          engine: TemplateEngine.LATEX,
          latexSource,
          isActive: true,
          supportsRtl: t.supportsRtl,
        }),
      );
      console.log(`Created LaTeX template: ${t.slug}`);
    }
  }

  await ds.destroy();
  console.log(`Seed complete — ${templates.length} LaTeX template(s) processed`);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
