import { ApiProperty } from '@nestjs/swagger';

export class ProductArchive {
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

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
