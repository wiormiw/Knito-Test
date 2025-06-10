// Don't forget to use the class-validator decorators in the DTO properties.
// import { Allow } from 'class-validator';

import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateOrderDto } from './create-order.dto';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { ProductDto } from '../../products/dto/product.dto';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @ApiPropertyOptional({ example: 100, type: Number })
  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'price need to be at least 1!' })
  totalAmount?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
  })
  @IsOptional()
  @Min(1, { message: 'userId need to be a positive' })
  userId?: number | string;

  @ApiPropertyOptional()
  products: ProductDto[];
}
