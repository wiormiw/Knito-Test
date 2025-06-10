import { Product } from '../../../../domain/product';
import { ProductEntity } from '../entities/product.entity';

export class ProductMapper {
  static toDomain(raw: ProductEntity): Product {
    const domainEntity = new Product();
    domainEntity.id = raw.id;
    domainEntity.productName = raw.productName;
    domainEntity.price = raw.price;
    domainEntity.stock = raw.stock;
    domainEntity.isArchived = raw.isArchived;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Product): ProductEntity {
    const persistenceEntity = new ProductEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.productName = domainEntity.productName;
    persistenceEntity.price = domainEntity.price;
    persistenceEntity.code = domainEntity.code;
    persistenceEntity.stock = domainEntity.stock;
    persistenceEntity.isArchived = domainEntity.isArchived;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}
