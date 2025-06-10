import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { OrderEntity } from '../entities/order.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { Order } from '../../../../domain/order';
import { OrderRepository } from '../../order.repository';
import { OrderMapper } from '../mappers/order.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { AppDataSource } from '../../../../../database/data-source';

@Injectable()
export class OrderRelationalRepository implements OrderRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
  ) {}

  // B6: Use transaction in query
  async create(data: Order): Promise<Order> {
    const persistenceModel = OrderMapper.toPersistence(data);
    const queryRunner = AppDataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const orderResult = await queryRunner.query(
        `
          INSERT INTO "order" ("totalAmount", "userId")
          VALUES ($1, $2)
          RETURNING *;
        `,
        [persistenceModel.totalAmount, persistenceModel.user.id],
      );

      const orderId = orderResult[0].id;

      if (persistenceModel.products?.length) {
        const productValues = persistenceModel.products
          .map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`)
          .join(', ');

        await queryRunner.query(
          `
            INSERT INTO "order_product" ("orderId", "productId")
            VALUES ${productValues};
          `,
          persistenceModel.products.flatMap((product) => [orderId, product.id]),
        );
      }

      await queryRunner.commitTransaction();

      const completeOrder = await this.findById(orderId);
      if (!completeOrder) {
        throw new Error(`Failed to fetch created order`);
      }
      return completeOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // A3: Aggregate query with minimum 3 table
  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<Order[]> {
    const offset = (paginationOptions.page - 1) * paginationOptions.limit;

    const rows = await AppDataSource.query(
      `
        SELECT o.*, 
                u.id as "userId", u.email as "userEmail",
                json_agg(
                  json_build_object(
                    'id', p.id,
                    'productName', p."productName",
                    'price', p.price,
                    'code', p.code
                  )
                ) as products
        FROM "order" o
        LEFT JOIN "user" u ON o."userId" = u.id
        LEFT JOIN "order_product" op ON o.id = op."orderId"
        LEFT JOIN product p ON op."productId" = p.id
        GROUP BY o.id, u.id, u.email
        OFFSET $1 LIMIT $2;
      `,
      [offset, paginationOptions.limit],
    );

    return rows.map((row) =>
      OrderMapper.toDomain({
        ...row,
        user: {
          id: row.userId,
          email: row.userEmail,
        },
        products: row.products.filter((product) => product.id),
      }),
    );
  }

  // A3: Aggregate query with minimum 3 table
  async findById(id: Order['id']): Promise<NullableType<Order>> {
    const rows = await AppDataSource.query(
      `
        SELECT o.*, 
                u.id as "userId", u.email as "userEmail",
                json_agg(
                  json_build_object(
                    'id', p.id,
                    'productName', p."productName",
                    'price', p.price,
                    'code', p.code
                  )
                ) as products
        FROM "order" o
        LEFT JOIN "user" u ON o."userId" = u.id
        LEFT JOIN "order_product" op ON o.id = op."orderId"
        LEFT JOIN "product" p ON op."productId" = p.id
        WHERE o.id = $1
        GROUP BY o.id, u.id, u.email;
      `,
      [id],
    );

    return rows[0]
      ? OrderMapper.toDomain({
          ...rows[0],
          user: {
            id: rows[0].userId,
            email: rows[0].userEmail,
          },
          products: rows[0].products.filter((p) => p.id),
        })
      : null;
  }

  async findByIds(ids: Order['id'][]): Promise<Order[]> {
    const entities = await this.orderRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => OrderMapper.toDomain(entity));
  }

  // B6: Use transaction in query
  async update(id: Order['id'], payload: Partial<Order>): Promise<Order> {
    const queryRunner = AppDataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const entity = await this.findById(id);
      if (!entity) {
        throw new Error('Order not found!');
      }

      const updated = {
        ...entity,
        totalAmount: payload.totalAmount !== undefined ? payload.totalAmount : entity.totalAmount,
        user: payload.user ?? entity.user,
        products: payload.products ?? entity.products,
      };

      const persistence = OrderMapper.toPersistence(updated);

      // Validate required fields
      if (persistence.totalAmount === null || persistence.totalAmount === undefined) {
        throw new Error('Total amount cannot be null');
      }

      if (!persistence.user?.id) {
        throw new Error('User ID is required');
      }

      await queryRunner.query(
        `
          UPDATE "order"
          SET "totalAmount" = $1, "userId" = $2
          WHERE id = $3;
        `,
        [
          persistence.totalAmount,
          persistence.user.id,
          id
        ],
      );

      // Update if products changes
      if (payload.products) {
        // Delete old relationship (actually, this only great if you include userId in the payload though..)
        await queryRunner.query(
          `
            DELETE FROM "order_product" WHERE "orderId" = $1;
          `,
          [id],
        );

        // Insert new relationships
        if (persistence.products?.length) {
          const productValues = persistence.products
            .map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`)
            .join(', ');

          await queryRunner.query(
            `
              INSERT INTO "order_product" ("orderId", "productId")
              VALUES ${productValues};
            `,
            persistence.products.flatMap(product => [id, product.id]),
          );
        }
      }

      await queryRunner.commitTransaction();

      const updatedOrder = await this.findById(id);
      if (!updatedOrder) {
        throw new Error(`Failed to fetch updated order`);
      }

      return updatedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // B6: Use transaction in query
  async remove(id: Order['id']): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Delete relationship (order_product)
      await queryRunner.query(
        `
          DELETE FROM "order_product" WHERE "orderId" = $1
        `,
        [id],
      );

      // Delete the actual orders
      await queryRunner.query(
        `
          DELETE FROM "order" WHERE id = $1
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

  // B7: Report endpoint (Rank user by total order)
  async rankUserByTotalOrder(): Promise<{
    userId: number | string,
    firstName: string,
    lastName: string,
    totalOrderAmount: number
  }[]> {
    const rows = await AppDataSource.query(
      `
        SELECT 
          u.id,
          u."firstName",
          u."lastName",
          COALESCE(SUM(o."totalAmount"), 0) AS "totalOrderAmount"
        FROM "user" u
        LEFT JOIN "order" o ON u.id = o."userId"
        GROUP BY u.id
        ORDER BY 
          -- Order users with orders first (total amount > 0), then by ID
          (SUM(o."totalAmount") IS NULL) ASC,
          COALESCE(SUM(o."totalAmount"), 0) DESC,
          u.id ASC;
      `,
    );

    return rows.map((row) => ({
      userId: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      totalOrderAmount: Number(row.totalOrderAmount)
    }))
  }
}
