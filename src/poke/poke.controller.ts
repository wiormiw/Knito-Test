import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../roles/roles.guard';
import { Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { Product } from '../products/domain/product';
import { PokemonProductService } from './poke.service';
import { ProductsService } from '../products/products.service';

@ApiTags('Poke')
@Roles(RoleEnum.admin)
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({
  path: 'poke',
  version: '1',
})
export class PokeProductController {
  constructor(
    private readonly pokeService: PokemonProductService,
    private readonly productsService: ProductsService,
  ) {}

  // B4: Integrate with API External
  @Post('generate')
  async createPokeProduct(): Promise<Product> {
    const pokemonProduct = await this.pokeService.createRandomPokemonProduct();
    return this.productsService.create(pokemonProduct);
  }
}
