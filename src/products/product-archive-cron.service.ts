import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProductsService } from './products.service';

@Injectable()
export class ProductArchiveCronService {
  private readonly logger = new Logger(ProductArchiveCronService.name);

  constructor(private readonly productsService: ProductsService) {}

  // B5: Cron job
  @Cron(CronExpression.EVERY_MINUTE)
  async handleArchiveOneProduct() {
    this.logger.log('Running archive cron job...');

    try {
      const product = await this.productsService.findProductToArchive();

      if (!product) {
        const msg  = 'No product to archive at this time.'
        this.logger.log(msg);
        throw new Error(msg);
      }

      await this.productsService.moveToArchive(product.id);
      this.logger.log(`Archived product with id ${product.id}`);
    } catch (err) {
      this.logger.error(`Failed to archive product: ${err.message}`);
    }
  }
}
