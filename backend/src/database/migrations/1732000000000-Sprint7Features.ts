import { MigrationInterface, QueryRunner } from 'typeorm';

export class Sprint7Features1732000000000 implements MigrationInterface {
  name = 'Sprint7Features1732000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "ai_usage" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "usage_date" date NOT NULL,
        "call_count" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_usage" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ai_usage_user_date" UNIQUE ("user_id", "usage_date")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "ats_matches" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "cv_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "job_title" character varying,
        "job_description" text NOT NULL,
        "score" integer NOT NULL,
        "breakdown" jsonb NOT NULL DEFAULT '{}',
        "matched_keywords" jsonb NOT NULL DEFAULT '[]',
        "missing_keywords" jsonb NOT NULL DEFAULT '[]',
        "suggestions" jsonb NOT NULL DEFAULT '[]',
        "analysis_mode" character varying NOT NULL DEFAULT 'ai',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ats_matches" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ats_matches_cv" FOREIGN KEY ("cv_id") REFERENCES "cvs"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_ats_matches_cv_created" ON "ats_matches" ("cv_id", "created_at")`);

    await queryRunner.query(`
      CREATE TABLE "cover_letters" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "cv_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "job_title" character varying,
        "job_description" text NOT NULL,
        "content" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cover_letters" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cover_letters_cv" FOREIGN KEY ("cv_id") REFERENCES "cvs"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_cover_letters_cv_created" ON "cover_letters" ("cv_id", "created_at")`);

    await queryRunner.query(`
      CREATE TABLE "parse_jobs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "cv_id" uuid,
        "status" character varying NOT NULL DEFAULT 'pending',
        "file_name" character varying,
        "mime_type" character varying,
        "error" text,
        "result" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_parse_jobs" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "parse_jobs"`);
    await queryRunner.query(`DROP INDEX "IDX_cover_letters_cv_created"`);
    await queryRunner.query(`DROP TABLE "cover_letters"`);
    await queryRunner.query(`DROP INDEX "IDX_ats_matches_cv_created"`);
    await queryRunner.query(`DROP TABLE "ats_matches"`);
    await queryRunner.query(`DROP TABLE "ai_usage"`);
  }
}
