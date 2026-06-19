import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { TemplateEntity } from '../src/modules/templates/entities/template.entity';
import { UserEntity } from '../src/modules/users/entities/user.entity';
import { RefreshTokenEntity } from '../src/modules/auth/entities/refresh-token.entity';

config({ path: path.join(__dirname, '../.env') });

/** Default RTL support for known slugs; new folders default to false */
const RTL_SLUGS = new Set(['minimal', 'creative', 'arabic', 'rtl']);

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
    console.warn('No template folders found in templates/');
    await ds.destroy();
    return;
  }

  for (const t of templates) {
    const dir = path.join(root, t.slug);
    const htmlPath = path.join(dir, 'template.html');
    const cssPath = path.join(dir, 'template.css');
    const htmlStructure = fs.existsSync(htmlPath)
      ? fs.readFileSync(htmlPath, 'utf-8')
      : `<div><h1>{{fullName}}</h1><p>{{summary}}</p>{{experience}}</div>`;
    const css = fs.existsSync(cssPath)
      ? fs.readFileSync(cssPath, 'utf-8')
      : 'body { font-family: sans-serif; padding: 40px; }';

    const existing = await repo.findOne({ where: { slug: t.slug } });
    if (existing) {
      existing.htmlStructure = htmlStructure;
      existing.css = css;
      existing.supportsRtl = t.supportsRtl;
      await repo.save(existing);
      console.log(`Updated template: ${t.slug}`);
    } else {
      await repo.save(
        repo.create({
          slug: t.slug,
          name: t.name,
          htmlStructure,
          css,
          isActive: true,
          supportsRtl: t.supportsRtl,
        }),
      );
      console.log(`Created template: ${t.slug}`);
    }
  }

  await ds.destroy();
  console.log(`Seed complete — ${templates.length} template(s) processed`);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
