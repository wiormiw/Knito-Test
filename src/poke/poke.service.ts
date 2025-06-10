import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { capitalizeString } from '../utils/capitalize-string';

@Injectable()
export class PokemonProductService {
  constructor(private readonly httpService: HttpService) {}

  // B4: Integrate with API External
  // Integrate third-party API with product enpoint to create Pokemon Plush Doll Product
  async createRandomPokemonProduct(): Promise<{
    productName: string;
    price: number;
    stock: number;
  }> {
    const id = Math.floor(Math.random() * 151) + 1;
    const response = await firstValueFrom(
      this.httpService.get(`pokemon/${id}`),
    );

    const pokeData = response.data;
    const productName = `${capitalizeString(pokeData.name)} Plush Doll`;

    return {
      productName,
      price: Math.floor(Math.random() * 10000) + 50, // Dummy pricing
      stock: Math.floor(Math.random() * 10) + 1,
    };
  }
}
