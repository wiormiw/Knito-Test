import { Module } from '@nestjs/common';
import { PokeProductController } from './poke.controller';
import { HttpModule } from '@nestjs/axios';
import { PokemonProductService } from './poke.service';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000, // 5 seconds
      maxRedirects: 5,
      baseURL: 'https://pokeapi.co/api/v2',
      headers: {
        'User-Agent': 'KnittoTestApp/1.0',
        Accept: 'application/json',
      },
    }),
    ProductsModule,
  ],
  providers: [PokemonProductService],
  controllers: [PokeProductController],
})
export class PokeModule {}
