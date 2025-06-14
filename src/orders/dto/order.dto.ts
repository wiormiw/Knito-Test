import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class OrderDto {
  @ApiProperty()
  @IsNumber()
  id: number | string;
}
