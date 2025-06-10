import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/domain/user';
import { Product } from '../../products/domain/product';

export class Order {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: Number,
    example: 10000,
  })
  totalAmount: number;

  @ApiProperty({
    type: () => User,
  })
  user: User;

  @ApiProperty({
    type: () => [Product],
  })
  products: Product[];

  @ApiProperty()
  createdAt: Date;
}
