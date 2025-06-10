import {
  ConflictException,
  HttpStatus,
  // common
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductRepository } from './infrastructure/persistence/product.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Product } from './domain/product';
import { AppDataSource } from '../database/data-source';
import { format } from 'date-fns';
import { ProductEntity } from './infrastructure/persistence/relational/entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    // Dependencies here
    private readonly productRepository: ProductRepository,
  ) {}

  // B2: Endpoint with unique code and running number (+ race condition handling)
  // B6: Use transaction in query
  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Do not remove comment below.
    // <creating-property />
    const existingName = await this.productRepository.findByName(
      createProductDto.productName,
    );
    if (existingName) {
      throw new ConflictException({
        status: HttpStatus.CONFLICT,
        errors: {
          productName: `product name exists, please change it!`,
        },
      });
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    await queryRunner.startTransaction();

    try {
      // Code prefix (PROD-Today)
      const today = format(new Date(), 'yyyyMMdd');
      const codePrefix = `PROD-${today}-`;

      // Lock the table to prevent race conditions
      await queryRunner.query(`LOCK TABLE "product" IN EXCLUSIVE MODE`);

      // Get highest running number today
      const lastProduct = await queryRunner.query(
        `SELECT code from "product" WHERE code LIKE $1 ORDER BY code DESC LIMIT 1`,
        [`${codePrefix}%`],
      );

      if (!lastProduct) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            code: `can't retrieve latest product code for code generation! try again later.`,
          },
        });
      }

      let runningNumber = 1;
      if (lastProduct[0]) {
        const lastNumber = parseInt(lastProduct[0].code.split('-')[2]);
        runningNumber = lastNumber + 1;
      }

      // Generate unique code
      const code = `${codePrefix}${runningNumber.toString().padStart(3, '0')}`;

      // Create product
      const product = queryRunner.manager.getRepository(ProductEntity);

      const createdProduct = await product.save({
        productName: createProductDto.productName,
        price: createProductDto.price,
        code,
        stock: createProductDto.stock,
      });
      await queryRunner.commitTransaction();
      return createdProduct;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      // throw new Error(`Failed to create product: ${error.message}`)
      throw new InternalServerErrorException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        errors: {
          product: `failed to create product with unique code!`,
          raw: error.message,
        },
      });
    } finally {
      await queryRunner.release();
    }
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.productRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: Product['id']) {
    return this.productRepository.findById(id);
  }

  findByName(name: Product[`productName`]) {
    return this.productRepository.findByName(name);
  }

  findByCode(code: Product[`code`]) {
    return this.productRepository.findByCode(code);
  }

  findByIds(ids: Product['id'][]) {
    return this.productRepository.findByIds(ids);
  }

  async update(
    id: Product['id'],

    updateProductDto: UpdateProductDto,
  ) {
    // Do not remove comment below.
    // <updating-property />
    const existingProduct = await this.productRepository.findById(id);
    if (!existingProduct) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: {
          product: `product with id:${id} is not exist! can't update it's data`,
        },
      });
    }

    const updatePayload: Partial<Product> = {};

    if (updateProductDto.productName !== undefined) {
      if (existingProduct.productName === updateProductDto.productName) {
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          errors: {
            productName: `product name exists, please change it!`,
          },
        });
      }
      updatePayload.productName = updateProductDto.productName;
    }

    if (updateProductDto.price !== undefined) {
      updatePayload.price = updateProductDto.price;
    }

    if (updateProductDto.stock !== undefined) {
      updatePayload.stock = updateProductDto.stock;
    }

    return this.productRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      productName: updatePayload.productName,
      price: updatePayload.price,
      stock: updatePayload.stock,
    });
  }

  remove(id: Product['id']) {
    return this.productRepository.remove(id);
  }

  async moveToArchive(id: Product[`id`]) {
    const existingProduct = await this.productRepository.findById(id);
    if (!existingProduct) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: {
          product: `product with id:${id} is not exist! can't update it's data`,
        },
      });
    }

    try {
      await this.productRepository.moveToArchive(id);
    } catch (error) {
      throw new InternalServerErrorException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        errors: {
          product: `failed to move product to archive!`,
          raw: error.message,
        },
      });
    }
  }

  getStockCategories() {
    return this.productRepository.getStockCategories();
  }

  getLatestProductByName() {
    return this.productRepository.getLatestProductByName();
  }

  findProductToArchive() {
    return this.productRepository.findProductToArchive();
  }
}
