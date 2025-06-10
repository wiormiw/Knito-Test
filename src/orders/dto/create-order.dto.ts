import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ProductDto } from '../../products/dto/product.dto';

export class CreateOrderDto {
  // Don't forget to use the class-validator decorators in the DTO properties.

  @ApiProperty({ example: 100, type: Number })
  @IsNotEmpty()
  @IsNumber()
  @Min(1, { message: 'total amount need to be positive number!' })
  totalAmount: number;

  @ApiProperty({
    type: Number,
    example: 1,
  })
  @IsNotEmpty()
  @Min(1, { message: 'userId need to be a positive' })
  userId: number | string;

  @ApiProperty()
  @IsNotEmpty()
  products: ProductDto[];
}
