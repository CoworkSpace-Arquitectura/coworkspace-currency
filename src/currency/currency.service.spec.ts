import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceUnavailableException } from '@nestjs/common';
import { CurrencyService, roundForCurrency } from './currency.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { CacheService } from './cache.service.js';
import type { RatesProvider } from './rates.provider.js';

describe('CurrencyService', () => {
  const prisma = {
    rateSnapshot: { create: vi.fn(), findFirst: vi.fn() },
  };
  const cache = { get: vi.fn(), set: vi.fn() };
  const provider = { fetchLatest: vi.fn() };
  let service: CurrencyService;

  const copRates = { base: 'COP', rates: { COP: 1, MXN: 0.005, USD: 0.00025 }, updatedAt: '2026-11-11T00:00:00.000Z' };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CurrencyService(
      prisma as unknown as PrismaService,
      cache as unknown as CacheService,
      provider as unknown as RatesProvider,
    );
  });

  it('usa la caché y no llama al proveedor externo', async () => {
    cache.get.mockResolvedValue(copRates);

    const result = await service.getRates('COP');

    expect(result.cached).toBe(true);
    expect(provider.fetchLatest).not.toHaveBeenCalled();
  });

  it('sin caché consulta al proveedor, guarda en caché y guarda una copia', async () => {
    cache.get.mockResolvedValue(null);
    provider.fetchLatest.mockResolvedValue(copRates);

    const result = await service.getRates('COP');

    expect(result.cached).toBe(false);
    expect(cache.set).toHaveBeenCalledWith('rates:COP', copRates, 21600);
    expect(prisma.rateSnapshot.create).toHaveBeenCalled();
  });

  it('si el proveedor falla usa la última copia guardada', async () => {
    cache.get.mockResolvedValue(null);
    provider.fetchLatest.mockRejectedValue(new Error('sin conexión'));
    prisma.rateSnapshot.findFirst.mockResolvedValue({
      base: 'COP',
      rates: copRates.rates,
      fetchedAt: new Date('2026-11-10T00:00:00.000Z'),
    });

    const result = await service.getRates('COP');

    expect(result.fallback).toBe(true);
    expect(result.rates.MXN).toBe(0.005);
  });

  it('responde 503 si el proveedor falla y no hay copia guardada', async () => {
    cache.get.mockResolvedValue(null);
    provider.fetchLatest.mockRejectedValue(new Error('sin conexión'));
    prisma.rateSnapshot.findFirst.mockResolvedValue(null);

    await expect(service.getRates('COP')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('convierte con la tasa de la moneda destino', async () => {
    cache.get.mockResolvedValue(copRates);

    const result = await service.convert(60000, 'COP', 'MXN');

    expect(result.rate).toBe(0.005);
    expect(result.result).toBe(300);
  });

  it('redondea según los decimales de cada moneda', () => {
    expect(roundForCurrency(10.456, 'USD')).toBe(10.46);
    expect(roundForCurrency(1234.6, 'CLP')).toBe(1235);
  });
});