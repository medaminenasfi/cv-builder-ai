import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { UserEntity } from './src/modules/users/entities/user.entity';
import { RefreshTokenEntity } from './src/modules/auth/entities/refresh-token.entity';
import { CVEntity } from './src/modules/cvs/entities/cv.entity';
import { CVVersionEntity } from './src/modules/cvs/entities/cv-version.entity';
import { TemplateEntity } from './src/modules/templates/entities/template.entity';
import { ShareLinkEntity } from './src/modules/sharing/entities/share-link.entity';
import { AiUsageEntity } from './src/modules/usage/entities/ai-usage.entity';
import { AtsMatchEntity } from './src/modules/jobs/entities/ats-match.entity';
import { CoverLetterEntity } from './src/modules/jobs/entities/cover-letter.entity';
import { ParseJobEntity } from './src/modules/parser/entities/parse-job.entity';
import { ParseAnalyticsEntity } from './src/modules/parser/entities/parse-analytics.entity';
import { ExportLogEntity } from './src/modules/dashboard/entities/export-log.entity';

config({ path: '.env' });

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USER ?? 'cvbuilder',
  password: process.env.DATABASE_PASSWORD ?? 'cvbuilder',
  database: process.env.DATABASE_NAME ?? 'cvbuilder',
  entities: [
    UserEntity,
    RefreshTokenEntity,
    CVEntity,
    CVVersionEntity,
    TemplateEntity,
    ShareLinkEntity,
    AiUsageEntity,
    AtsMatchEntity,
    CoverLetterEntity,
    ParseJobEntity,
    ParseAnalyticsEntity,
    ExportLogEntity,
  ],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
