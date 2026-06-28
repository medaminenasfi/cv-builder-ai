import { MigrationInterface, QueryRunner } from 'typeorm';

export class CoreCV1730500000000 implements MigrationInterface {
  name = 'CoreCV1730500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "is_blocked" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "templates_engine_enum" AS ENUM ('latex', 'html');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "templates" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "slug" character varying NOT NULL,
        "name" character varying NOT NULL,
        "engine" "templates_engine_enum" NOT NULL DEFAULT 'latex',
        "latex_source" text,
        "html_structure" text,
        "css" text,
        "thumbnail_url" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "supports_rtl" boolean NOT NULL DEFAULT false,
        "created_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_templates_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_templates" PRIMARY KEY ("id"),
        CONSTRAINT "FK_templates_creator" FOREIGN KEY ("created_by")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cvs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "template_id" uuid,
        "title" character varying NOT NULL,
        "locale" character varying NOT NULL DEFAULT 'en',
        "job_title_target" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cvs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cvs_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cvs_template" FOREIGN KEY ("template_id")
          REFERENCES "templates"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cvs_user_id" ON "cvs" ("user_id")
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "cv_versions_source_enum" AS ENUM ('manual', 'import', 'ai_enhanced');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cv_versions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "cv_id" uuid NOT NULL,
        "version_number" integer NOT NULL DEFAULT 1,
        "data" jsonb NOT NULL DEFAULT '{}',
        "source" "cv_versions_source_enum" NOT NULL DEFAULT 'manual',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cv_versions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cv_versions_cv" FOREIGN KEY ("cv_id")
          REFERENCES "cvs"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cv_versions_cv_id" ON "cv_versions" ("cv_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cv_versions_cv_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cv_versions"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "cv_versions_source_enum"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cvs_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cvs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "templates"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "is_blocked"`);
  }
}
