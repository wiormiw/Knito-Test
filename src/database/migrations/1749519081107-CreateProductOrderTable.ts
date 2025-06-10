import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductOrderTable1749519081107
  implements MigrationInterface
{
  name = 'CreateProductOrderTable1749519081107';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "product" ("id" SERIAL NOT NULL, "productName" character varying NOT NULL, "price" integer NOT NULL, "code" character varying NOT NULL, "stock" integer NOT NULL DEFAULT '100', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_99c39b067cfa73c783f0fc49a61" UNIQUE ("code"), CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "order" ("id" SERIAL NOT NULL, "totalAmount" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_1031171c13130102495201e3e20" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_archive" ("id" SERIAL NOT NULL, "productName" character varying NOT NULL, "price" integer NOT NULL, "code" character varying NOT NULL, "stock" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7f6cfc9b7aab9ff50dd80ee9029" UNIQUE ("code"), CONSTRAINT "PK_12a2f74853c9c15d895c9cc06ba" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "order_product" ("orderId" integer NOT NULL, "productId" integer NOT NULL, CONSTRAINT "PK_e5607973360ec57e94f2171bc31" PRIMARY KEY ("orderId", "productId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3fb066240db56c9558a9113943" ON "order_product" ("orderId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_073c85ed133e05241040bd70f0" ON "order_product" ("productId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD CONSTRAINT "FK_caabe91507b3379c7ba73637b84" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_product" ADD CONSTRAINT "FK_3fb066240db56c9558a91139431" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_product" ADD CONSTRAINT "FK_073c85ed133e05241040bd70f02" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_product" DROP CONSTRAINT "FK_073c85ed133e05241040bd70f02"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_product" DROP CONSTRAINT "FK_3fb066240db56c9558a91139431"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" DROP CONSTRAINT "FK_caabe91507b3379c7ba73637b84"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_073c85ed133e05241040bd70f0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3fb066240db56c9558a9113943"`,
    );
    await queryRunner.query(`DROP TABLE "order_product"`);
    await queryRunner.query(`DROP TABLE "product_archive"`);
    await queryRunner.query(`DROP TABLE "order"`);
    await queryRunner.query(`DROP TABLE "product"`);
  }
}
