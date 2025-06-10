// Don't forget to use the class-validator decorators in the DTO properties.
// import { Allow } from 'class-validator';

import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional({ example: 'Book', type: String })
  @IsOptional()
  productName: string;

  @ApiPropertyOptional({ example: 100_000, type: Number })
  @IsNumber()
  @IsOptional()
  @Min(1000, { message: 'price need to be at least 1000!' })
  @Max(100_000, { message: 'price must not exceed 1.000.000!' })
  price: number;

  @ApiPropertyOptional({ example: 1000, type: Number })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'stock need to be positive number!' })
  @Max(1000, { message: 'stock must not exceed 1000!' })
  stock: number;
}
