import { Controller, Get, Param, Query } from '@nestjs/common';
import { CurrencyService } from './currency.service.js';
import { ConvertQueryDto, RatesQueryDto } from './dto/convert-query.dto.js';

@Controller()
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('countries')
  findCountries() {
    return this.currencyService.findCountries();
  }

  @Get('countries/:code')
  findCountry(@Param('code') code: string) {
    return this.currencyService.findCountry(code);
  }

  @Get('rates')
  getRates(@Query() query: RatesQueryDto) {
    return this.currencyService.getRates(query.base);
  }

  @Get('convert')
  convert(@Query() query: ConvertQueryDto) {
    return this.currencyService.convert(query.amount, query.from, query.to);
  }
}