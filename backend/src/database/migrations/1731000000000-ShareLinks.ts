import { MigrationInterface, QueryRunner } from 'typeorm';

export class ShareLinks1731000000000 implements MigrationInterface {
  name = 'ShareLinks1731000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "share_links" (
        "token" character varying(64) NOT NULL,
        "cv_id" uuid NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_share_links" PRIMARY KEY ("token"),
        CONSTRAINT "FK_share_links_cv" FOREIGN KEY ("cv_id")
          REFERENCES "cvs"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_share_links_cv_id" ON "share_links" ("cv_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_share_links_cv_id"`);
    await queryRunner.query(`DROP TABLE "share_links"`);
  }
}
