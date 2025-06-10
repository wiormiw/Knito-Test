import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class CreateProductDto {
  // Don't forget to use the class-validator decorators in the DTO properties.
  @ApiProperty({ example: 'Book', type: String })
  @IsNotEmpty()
  productName: string;

  @ApiProperty({ example: 100_000, type: Number })
  @IsNumber()
  @IsNotEmpty()
  @Min(1000, { message: 'price need to be at least 1000!' })
  @Max(100_000, { message: 'price must not exceed 1.000.000!' })
  price: number;

  @ApiProperty({ example: 100, type: Number })
  @IsNotEmpty()
  @IsNumber()
  @Min(1, { message: 'stock need to be positive number!' })
  @Max(1000, { message: 'stock must not exceed 1000!' })
  stock: number;
}
