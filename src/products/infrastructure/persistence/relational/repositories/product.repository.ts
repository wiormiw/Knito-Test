import { Injectable } from '@nestjs/common';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { Product } from '../../../../domain/product';
import { ProductRepository } from '../../product.repository';
import { ProductMapper } from '../mappers/product.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { AppDataSource } from '../../../../../database/data-source';

@Injectable()
export class ProductRelationalRepository implements ProductRepository {
  async create(data: Product): Promise<Product> {
    const persistenceModel = ProductMapper.toPersistence(data);
    const result = await AppDataSource.query(
      `
        INSERT INTO "product" ("productName", price, code, stock)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `,
      [
        persistenceModel.productName,
        persistenceModel.price,
        persistenceModel.code,
        persistenceModel.stock,
      ],
    );

    return ProductMapper.toDomain(result[0]);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<Product[]> {
    const params: any[] = [];
    const offset = (paginationOptions.page - 1) * paginationOptions.limit;
    const limit = paginationOptions.limit;

    const query = `
      SELECT * FROM "product"
      OFFSET $${params.length + 1}
      LIMIT $${params.length + 2}
    `;

    params.push(offset, limit);

    const rows = await AppDataSource.query(query, params);

    return rows.map((row) => ProductMapper.toDomain(row));
  }

  async findById(id: Product['id']): Promise<NullableType<Product>> {
    const rows = await AppDataSource.query(
      `
        SELECT * FROM "product" WHERE id = $1
      `,
      [id],
    );

    return rows[0] ? ProductMapper.toDomain(rows[0]) : null;
  }

  async findByName(
    productName: Product['productName'],
  ): Promise<NullableType<Product>> {
    const rows = await AppDataSource.query(
      `
        SELECT * FROM "product" WHERE "productName" = $1
      `,
      [productName],
    );

    return rows[0] ? ProductMapper.toDomain(rows[0]) : null;
  }

  async findByIdIn(ids: Product[`id`][]): Promise<Product[]> {
    if (!ids.length) return [];

    const rows = await AppDataSource.query(
      `
      SELECT * FROM product WHERE id IN (${ids.map((_, i) => `$${i + 1}`).join(',')}),
    `,
      [ids],
    );

    return rows.map((row) => ProductMapper.toDomain(row));
  }

  async findByIds(ids: Product['id'][]): Promise<Product[]> {
    if (!ids.length) return [];

    const rows = await AppDataSource.query(
      `
        SELECT * FROM "product" WHERE id = ANY($1)
      `,
      [ids],
    );

    return rows.map((row) => ProductMapper.toDomain(row));
  }

  async findByCode(code: Product[`code`]): Promise<NullableType<Product>> {
    const rows = await AppDataSource.query(
      `
        SELECT * FROM "product" WHERE code = $1;
      `,
      [code],
    );

    return rows[0] ? ProductMapper.toDomain(rows[0]) : null;
  }

  async update(id: Product['id'], payload: Partial<Product>): Promise<Product> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new Error('Product not found!');
    }

    const updated = {
      ...entity,
      ...payload,
    };

    const persistence = ProductMapper.toPersistence(updated);

    const result = await AppDataSource.query(
      `
        WITH updated_product AS (
          UPDATE "product"
          SET
            "productName" = $1,
            price = $2,
            stock = $3,
            "updatedAt" = NOW()
          WHERE id = $4
          RETURNING *
        )
        SELECT * FROM updated_product
      `,
      [persistence.productName, persistence.price, persistence.stock, id],
    );

    if (result.length === 0) {
      throw new Error('Product not found after update');
    }

    console.log(ProductMapper.toDomain(result[0]));

    return ProductMapper.toDomain(result[0]);
  }

  async remove(id: Product['id']): Promise<void> {
    await AppDataSource.query(
      `
        DELETE FROM "product" WHERE id = $1
      `,
      [id],
    );
  }

  // A1: Move data to another table
  // B6: Use transaction in query
  async moveToArchive(id: Product[`id`]): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.query(
        `
          SELECT * FROM "product" WHERE id = $1
        `,
        [id],
      );

      if (!product[0]) {
        throw new Error('Product not found!');
      }

      // Query for hard move for archive, will fails because order constraints
      // await queryRunner.query(
      //   `
      //     WITH moved_product AS (
      //       DELETE FROM "product" WHERE id = $1
      //       RETURNING "productName", price, code, stock
      //     )
      //     INSERT INTO "product_archive" ("productName", price, code, stock)
      //     SELECT "productName", price, code, stock
      //     FROM moved_product;
      //   `,
      //   [id],
      // );

      await queryRunner.query(
        `
          WITH marked_product AS (
            UPDATE "product"
            SET "isArchived" = true
            WHERE id = $1
            RETURNING id, "productName", price, code, stock
          )
          INSERT INTO "product_archive" (id, "productName", price, code, stock)
          SELECT id, "productName", price, code, stock
          FROM marked_product;
        `,
        [id],
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Find product for cron job
  async findProductToArchive(): Promise<Product> {
    const rows = await AppDataSource.query(
      `
        SELECT * FROM "product"
        WHERE ("stock" <= 0 OR "createdAt" < NOW() - INTERVAL '30 minute')
          AND "isArchived" = false
        LIMIT 1;
      `,
    );

    return ProductMapper.toDomain(rows[0]);
  }

  // A2: Grouping data
  async getStockCategories(): Promise<
    { stockCategory: string; productCount: number }[]
  > {
    const rows = await AppDataSource.query(
      `
        SELECT
          CASE
            WHEN stock < 10 THEN 'Low'
            WHEN stock BETWEEN 10 AND 50 THEN 'Medium'
            ELSE 'High'
          END AS stock_category,
          COUNT(*) AS product_count
        FROM "product"
        GROUP BY stock_category;
      `,
    );

    return rows.map((row) => ({
      stockCategory: row.stock_category,
      productCount: Number(row.product_count),
    }));
  }

  // A4: Get latest data without ORDER BY
  // NOTE: But since my data couldn't approve duplicate, check the first word prefix instead
  async getLatestProductByName(): Promise<Product[]> {
    // try to return Promise<Product[]> instead of Promise<Product>
    const rows = await AppDataSource.query(
      `
        SELECT p.*
        FROM product p
        JOIN (
          SELECT split_part("productName", ' ', 1) AS prefix, MAX(id) AS max_id
          FROM product
          GROUP BY prefix
        ) latest
        ON split_part(p."productName", ' ', 1) = latest.prefix AND p.id = latest.max_id;
      `,
    );

    return rows.map((row) => ProductMapper.toDomain(row));
  }
}
