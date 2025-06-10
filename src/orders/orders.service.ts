import {
  HttpStatus,
  // common
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderRepository } from './infrastructure/persistence/order.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Order } from './domain/order';
import { UserRepository } from '../users/infrastructure/persistence/user.repository';
import { ProductRepository } from '../products/infrastructure/persistence/product.repository';

@Injectable()
export class OrdersService {
  constructor(
    // Dependencies here
    private readonly orderRepository: OrderRepository,
    private readonly userRepository: UserRepository,
    private readonly productepository: ProductRepository,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    // Do not remove comment below.
    // <creating-property />

    // Check existing user
    const user = await this.userRepository.findById(createOrderDto.userId);
    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: `couldn't create an order because of invalid user`,
        },
      });
    }

    // Get product IDs from DTO
    const productIds = createOrderDto.products.map((p) => Number(p.id));

    // Fetch all products
    const products = await this.productepository.findByIds(productIds);

    // Check if products exists
    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missingIds = productIds.filter((id) => !foundIds.has(id));

      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          products: `Products with IDs ${missingIds.join(', ')} not found`,
        },
      });
    }

    // Check if products and amount matched
    const calculatedAmount = products.reduce(
      (sum, product) => sum + product.price,
      0,
    );

    if (calculatedAmount !== createOrderDto.totalAmount) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          totalAmount: `Total amount ${createOrderDto.totalAmount} doesn't match products total ${calculatedAmount}`,
        },
      });
    }

    return this.orderRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      totalAmount: createOrderDto.totalAmount,
      user: user,
      products: products,
    });
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.orderRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: Order['id']) {
    return this.orderRepository.findById(id);
  }

  findByIds(ids: Order['id'][]) {
    return this.orderRepository.findByIds(ids);
  }

  async update(
    id: Order['id'],

    updateOrderDto: UpdateOrderDto,
  ) {
    // Do not remove comment below.
    // <updating-property />

    // Check existing order
    const existingOrder = await this.orderRepository.findById(id);
    if (!existingOrder) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: {
          order: `order with id:${id} is not exist! can't update it's data`,
        },
      });
    }

    const updatePayload: Partial<Order> = {};

    // Validate user if being updated
    if (updateOrderDto.userId) {
      const user = await this.userRepository.findById(updateOrderDto.userId);
      if (!user) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            user: `Couldn't update order because of invalid user`,
          },
        });
      }
      updatePayload.user = user;
    }

    if (updateOrderDto.products) {
      const productIds = updateOrderDto.products.map((p) => Number(p.id));
      const products = await this.productepository.findByIds(productIds);

      if (products.length !== productIds.length) {
        const foundIds = new Set(products.map((p) => p.id));
        const missingIds = productIds.filter((id) => !foundIds.has(id));

        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            products: `Products with IDs ${missingIds.join(', ')} not found`,
          },
        });
      }

      updatePayload.products = products;

      if (updateOrderDto.products && !updateOrderDto.totalAmount) {
        updatePayload.totalAmount = products.reduce(
          (sum, product) => sum + product.price,
          0,
        );
      }

      if (updateOrderDto.products && updateOrderDto.totalAmount) {
        const calculatedAmount = updatePayload.products!.reduce(
          (sum, product) => sum + product.price,
          0,
        );

        if (calculatedAmount !== updateOrderDto.totalAmount) {
          throw new UnprocessableEntityException({
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            errors: {
              totalAmount: `Total amount ${updateOrderDto.totalAmount} doesn't match products total ${calculatedAmount}`,
            },
          });
        }
      }
    }

    return this.orderRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      totalAmount: updatePayload.totalAmount,
      user: updatePayload.user,
      products: updatePayload.products,
    });
  }

  remove(id: Order['id']) {
    return this.orderRepository.remove(id);
  }

  rankUserByTotalOrder() {
    return this.orderRepository.rankUserByTotalOrder();
  }
}
