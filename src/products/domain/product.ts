import { ApiProperty } from '@nestjs/swagger';
import { Order } from '../../orders/domain/order';

export class Product {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: String,
    example: 'combed 30s',
  })
  productName: string;

  @ApiProperty({
    type: Number,
    example: 6500,
  })
  price: number;

  @ApiProperty({
    type: String,
    example: 'PROD0001',
  })
  code: string;

  @ApiProperty({
    type: Number,
    example: 100,
  })
  stock: number;

  @ApiProperty({
    type: () => [Order],
  })
  orders?: Order[];

  @ApiProperty({
    type: Boolean,
    example: false,
  })
  isArchived: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
