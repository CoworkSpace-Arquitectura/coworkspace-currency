import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CacheService } from './cache.service.js';
import { RatesProvider } from './rates.provider.js';
import type { ProviderRates } from './rates.provider.js';
import { COUNTRIES } from './countries.data.js';

const CACHE_TTL_SECONDS = 6 * 60 * 60;
export const RATES_SOURCE = 'Rates By Exchange Rate API (https://www.exchangerate-api.com)';

export function roundForCurrency(value: number, currency: string) {
  const digits = new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

@Injectable()
export class CurrencyService implements OnModuleInit {
  private readonly logger = new Logger(CurrencyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly provider: RatesProvider,
  ) {}

  async onModuleInit() {
    for (const country of COUNTRIES) {
      await this.prisma.country.upsert({
        where: { code: country.code },
        create: country,
        update: { name: country.name, currency: country.currency },
      });
    }
    this.logger.log(`Catálogo de países listo: ${COUNTRIES.length} países`);
  }

  findCountries() {
    return this.prisma.country.findMany({ orderBy: { name: 'asc' } });
  }

  async findCountry(code: string) {
    const country = await this.prisma.country.findUnique({ where: { code: code.toUpperCase() } });
    if (!country) {
      throw new NotFoundException(`País ${code} no disponible`);
    }
    return country;
  }

  async getRates(base: string) {
    const key = `rates:${base}`;

    const cached = await this.cache.get<ProviderRates>(key);
    if (cached) {
      return { ...cached, cached: true, fallback: false, source: RATES_SOURCE };
    }

    try {
      const fresh = await this.provider.fetchLatest(base);
      await this.cache.set(key, fresh, CACHE_TTL_SECONDS);
      await this.prisma.rateSnapshot.create({ data: { base: fresh.base, rates: fresh.rates } });
      return { ...fresh, cached: false, fallback: false, source: RATES_SOURCE };
    } catch (error) {
      this.logger.warn(`Proveedor de tasas no disponible: ${(error as Error).message}`);
      const snapshot = await this.prisma.rateSnapshot.findFirst({
        where: { base },
        orderBy: { fetchedAt: 'desc' },
      });
      if (!snapshot) {
        throw new ServiceUnavailableException('No hay tasas de cambio disponibles en este momento');
      }
      return {
        base,
        rates: snapshot.rates as Record<string, number>,
        updatedAt: snapshot.fetchedAt.toISOString(),
        cached: false,
        fallback: true,
        source: RATES_SOURCE,
      };
    }
  }

  async convert(amount: number, from: string, to: string) {
    const rates = await this.getRates(from);
    if (from !== to && !Object.hasOwn(rates.rates, to)) {
      throw new BadRequestException(`No hay tasa de cambio de ${from} a ${to}`);
    }
    const rate = from === to ? 1 : rates.rates[to];
    return {
      amount,
      from,
      to,
      rate,
      result: roundForCurrency(amount * rate, to),
      ratesUpdatedAt: rates.updatedAt,
      source: rates.source,
    };
  }
}