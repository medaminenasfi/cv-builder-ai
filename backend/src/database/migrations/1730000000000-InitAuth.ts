import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitAuth1730000000000 implements MigrationInterface {
  name = 'InitAuth1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`
      CREATE TYPE "users_role_enum" AS ENUM ('user', 'admin')
    `);
    await queryRunner.query(`
      CREATE TYPE "users_plan_enum" AS ENUM ('free', 'pro')
    `);
    await queryRunner.query(`
      CREATE TYPE "users_locale_enum" AS ENUM ('en', 'fr', 'ar')
    `);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "role" "users_role_enum" NOT NULL DEFAULT 'user',
        "plan" "users_plan_enum" NOT NULL DEFAULT 'free',
        "locale" "users_locale_enum" NOT NULL DEFAULT 'en',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token_hash" character varying NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "revoked_at" TIMESTAMPTZ,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_refresh_tokens_token_hash" ON "refresh_tokens" ("token_hash")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_refresh_tokens_token_hash"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "users_locale_enum"`);
    await queryRunner.query(`DROP TYPE "users_plan_enum"`);
    await queryRunner.query(`DROP TYPE "users_role_enum"`);
  }
}
