import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterProductTable1749542141966 implements MigrationInterface {
  name = 'AlterProductTable1749542141966';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product" ADD "isArchived" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "isArchived"`);
  }
}
