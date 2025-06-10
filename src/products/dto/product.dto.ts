import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class ProductDto {
  @ApiProperty()
  @IsNumber()
  id: number | string;
}
