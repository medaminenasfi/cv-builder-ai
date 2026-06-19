import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { TemplateEntity } from '../src/modules/templates/entities/template.entity';
import { UserEntity } from '../src/modules/users/entities/user.entity';
import { RefreshTokenEntity } from '../src/modules/auth/entities/refresh-token.entity';

config({ path: path.join(__dirname, '../.env') });

const TEMPLATES = [
  { slug: 'modern', name: 'Modern', supportsRtl: false },
  { slug: 'classic', name: 'Classic', supportsRtl: false },
  { slug: 'minimal', name: 'Minimal', supportsRtl: true },
  { slug: 'executive', name: 'Executive', supportsRtl: false },
  { slug: 'creative', name: 'Creative', supportsRtl: true },
];

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

  for (const t of TEMPLATES) {
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
  console.log('Seed complete');
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
