import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Product } from '../../domain/product';

export abstract class ProductRepository {
  abstract create(
    data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Product>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<Product[]>;

  abstract findById(id: Product['id']): Promise<NullableType<Product>>;

  abstract findByName(
    productName: Product['productName'],
  ): Promise<NullableType<Product>>;

  abstract findByCode(code: Product[`code`]): Promise<NullableType<Product>>;

  abstract findByIds(ids: Product['id'][]): Promise<Product[]>;

  abstract findByIdIn(ids: Product[`id`][]): Promise<Product[]>;

  abstract update(
    id: Product['id'],
    payload: DeepPartial<Product>,
  ): Promise<Product | null>;

  abstract remove(id: Product['id']): Promise<void>;

  abstract moveToArchive(id: Product[`id`]): Promise<void>;

  abstract findProductToArchive(): Promise<Product>;

  abstract getStockCategories(): Promise<
    { stockCategory: string; productCount: number }[]
  >;

  abstract getLatestProductByName(): Promise<Product[]>;
}
