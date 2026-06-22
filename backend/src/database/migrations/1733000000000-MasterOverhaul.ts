import { MigrationInterface, QueryRunner } from 'typeorm';

export class MasterOverhaul1733000000000 implements MigrationInterface {
  name = 'MasterOverhaul1733000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "parse_analytics" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "cvId" uuid,
        "mimeType" varchar(32) NOT NULL,
        "durationMs" int NOT NULL,
        "usedOcr" boolean NOT NULL DEFAULT false,
        "usedAi" boolean NOT NULL DEFAULT false,
        "confidenceScore" int NOT NULL DEFAULT 0,
        "qualityLabel" varchar(32),
        "detectedLocale" varchar(8) NOT NULL DEFAULT 'en',
        "warnings" jsonb NOT NULL DEFAULT '[]',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_parse_analytics" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_parse_analytics_userId" ON "parse_analytics" ("userId")`,
    );

    await queryRunner.query(`
      ALTER TABLE "share_links"
      ADD COLUMN IF NOT EXISTS "view_count" int NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "share_links"
      ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP NOT NULL DEFAULT now()
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "export_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "cvId" uuid,
        "format" varchar(16) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_export_logs" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_export_logs_userId" ON "export_logs" ("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "export_logs"`);
    await queryRunner.query(`ALTER TABLE "share_links" DROP COLUMN IF EXISTS "updated_at"`);
    await queryRunner.query(`ALTER TABLE "share_links" DROP COLUMN IF EXISTS "view_count"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "parse_analytics"`);
  }
}
