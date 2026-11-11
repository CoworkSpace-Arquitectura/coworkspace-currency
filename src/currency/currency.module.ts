import { Module } from '@nestjs/common';
import { CurrencyController } from './currency.controller.js';
import { CurrencyService } from './currency.service.js';
import { CacheService } from './cache.service.js';
import { RatesProvider } from './rates.provider.js';

@Module({
  controllers: [CurrencyController],
  providers: [CurrencyService, CacheService, RatesProvider],
})
export class CurrencyModule {}