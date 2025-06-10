// src/modules/database/seeds/product/product.seed.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../../../../products/infrastructure/persistence/relational/entities/product.entity';
import { format } from 'date-fns';

@Injectable()
export class ProductSeedService {
  constructor(
    @InjectRepository(ProductEntity)
    private repository: Repository<ProductEntity>,
  ) {}

  async run() {
    const today = format(new Date(), 'yyyyMMdd');
    const codePrefix = `PROD-${today}-`;

    // Get the highest existing code for today
    const lastProduct = await this.repository
      .createQueryBuilder('product')
      .where('product.code LIKE :code', { code: `${codePrefix}%` })
      .orderBy('product.code', 'DESC')
      .getOne();

    let runningNumber = 1;
    if (lastProduct) {
      const lastNumber = parseInt(lastProduct.code.split('-')[2]);
      runningNumber = lastNumber + 1;
    }

    const initialProducts = [
      {
        productName: 'Laptop',
        price: 99900,
        stock: 50,
        code: `${codePrefix}${runningNumber.toString().padStart(3, '0')}`,
      },
      {
        productName: 'Smartphone',
        price: 69900,
        stock: 100,
        code: `${codePrefix}${(runningNumber + 1).toString().padStart(3, '0')}`,
      },
      {
        productName: 'Headphones',
        price: 19900,
        stock: 200,
        code: `${codePrefix}${(runningNumber + 2).toString().padStart(3, '0')}`,
      },
      {
        productName: 'Tablet',
        price: 49900,
        stock: 75,
        code: `${codePrefix}${(runningNumber + 3).toString().padStart(3, '0')}`,
      },
      {
        productName: 'Smartwatch',
        price: 29900,
        stock: 150,
        code: `${codePrefix}${(runningNumber + 4).toString().padStart(3, '0')}`,
      },
    ];

    // Check if any products exist for today
    const countToday = await this.repository
      .createQueryBuilder('product')
      .where('product.code LIKE :code', { code: `${codePrefix}%` })
      .getCount();

    if (countToday === 0) {
      await this.repository.save(
        initialProducts.map((product) => this.repository.create(product)),
      );
    }
  }
}