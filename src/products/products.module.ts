import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { RelationalProductPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ProductArchiveCronService } from './product-archive-cron.service';

@Module({
  imports: [
    // do not remove this comment
    RelationalProductPersistenceModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductArchiveCronService],
  exports: [
    ProductsService,
    RelationalProductPersistenceModule,
    ProductsService,
  ],
})
export class ProductsModule {}
