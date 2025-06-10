import { ProductMapper } from '../../../../../products/infrastructure/persistence/relational/mappers/product.mapper';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { Order } from '../../../../domain/order';
import { OrderEntity } from '../entities/order.entity';

export class OrderMapper {
  static toDomain(raw: OrderEntity): Order {
    const domainEntity = new Order();
    domainEntity.id = raw.id;
    domainEntity.totalAmount = raw.totalAmount;
    if (raw.user) {
      domainEntity.user = UserMapper.toDomain(raw.user);
    }
    if (raw.products) {
      domainEntity.products = raw.products.map((product: any) =>
        ProductMapper.toDomain(product),
      );
    }
    domainEntity.createdAt = raw.createdAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Order): OrderEntity {
    const persistenceEntity = new OrderEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.totalAmount = domainEntity.totalAmount;
    if (domainEntity.user) {
      persistenceEntity.user = UserMapper.toPersistence(domainEntity.user);
    }
    if (domainEntity.products) {
      persistenceEntity.products = domainEntity.products.map((product) =>
        ProductMapper.toPersistence(product),
      );
    }
    persistenceEntity.createdAt = domainEntity.createdAt;

    return persistenceEntity;
  }
}
