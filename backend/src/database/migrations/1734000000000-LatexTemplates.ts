import { MigrationInterface, QueryRunner } from 'typeorm';

export class LatexTemplates1734000000000 implements MigrationInterface {
  name = 'LatexTemplates1734000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "templates_engine_enum" AS ENUM ('latex', 'html');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "templates"
      ADD COLUMN IF NOT EXISTS "engine" "templates_engine_enum" NOT NULL DEFAULT 'latex'
    `);

    await queryRunner.query(`
      ALTER TABLE "templates"
      ADD COLUMN IF NOT EXISTS "latex_source" text
    `);

    await queryRunner.query(`
      ALTER TABLE "templates"
      ALTER COLUMN "html_structure" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "templates"
      ALTER COLUMN "css" DROP NOT NULL
    `);

    await queryRunner.query(`
      UPDATE "templates"
      SET "is_active" = false
      WHERE "latex_source" IS NULL OR trim("latex_source") = ''
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN IF EXISTS "latex_source"`);
    await queryRunner.query(`ALTER TABLE "templates" DROP COLUMN IF EXISTS "engine"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "templates_engine_enum"`);
  }
}
