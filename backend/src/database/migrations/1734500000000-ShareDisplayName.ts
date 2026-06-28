import { MigrationInterface, QueryRunner } from 'typeorm';

export class ShareDisplayName1734500000000 implements MigrationInterface {
  name = 'ShareDisplayName1734500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "share_links"
      ADD COLUMN IF NOT EXISTS "display_name" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "share_links" DROP COLUMN IF EXISTS "display_name"
    `);
  }
}
