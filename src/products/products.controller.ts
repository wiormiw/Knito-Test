import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Product } from './domain/product';
import { AuthGuard } from '@nestjs/passport';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { FindAllProductsDto } from './dto/find-all-products.dto';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';

@ApiTags('Products')
@ApiBearerAuth()
@Roles(RoleEnum.admin)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({
  path: 'products',
  version: '1',
})
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiCreatedResponse({
    type: Product,
  })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOkResponse({
    type: InfinityPaginationResponse(Product),
  })
  async findAll(
    @Query() query: FindAllProductsDto,
  ): Promise<InfinityPaginationResponseDto<Product>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.productsService.findAllWithPagination({
        paginationOptions: {
          page,
          limit,
        },
      }),
      { page, limit },
    );
  }

  @Get(`stock/categories`)
  getStockCategories() {
    return this.productsService.getStockCategories();
  }

  @Get(`latest/product`)
  getLatestProductByName() {
    return this.productsService.getLatestProductByName();
  }

  @Get('name/:name')
  @ApiParam({
    name: 'name',
    type: String,
    required: true,
    example: 'Book',
  })
  @ApiOkResponse({
    type: Product,
  })
  findByName(@Param('name') name: string) {
    return this.productsService.findByName(name);
  }

  @Get('code/:code')
  @ApiParam({
    name: 'code',
    type: String,
    required: true,
    example: 'PROD-20250610-001',
  })
  @ApiOkResponse({
    type: Product,
  })
  findByCode(@Param('code') code: string) {
    return this.productsService.findByCode(code);
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @ApiOkResponse({
    type: Product,
  })
  findById(@Param('id') id: number) {
    return this.productsService.findById(id);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @ApiOkResponse({
    type: Product,
  })
  update(@Param('id') id: number, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  remove(@Param('id') id: number) {
    return this.productsService.remove(id);
  }

  @Post(`archive/:id`)
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  moveToArchive(@Param('id') id: number) {
    return this.productsService.moveToArchive(id);
  }
}
