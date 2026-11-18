import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/setup-app.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { RatesProvider } from '../../src/currency/rates.provider.js';
import { CacheService } from '../../src/currency/cache.service.js';

/**
 * Integración: países y conversión de moneda con PostgreSQL real.
 * El proveedor externo de tasas se sustituye por un doble; la caché arranca vacía.
 */
describe('Divisas (integración con la base de datos)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let providerUp = true;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(RatesProvider)
      .useValue({
        fetchLatest: (base: string) =>
          providerUp
            ? Promise.resolve({ base, rates: { COP: 1, USD: 0.00025, EUR: 0.00023 }, updatedAt: new Date().toISOString() })
            : Promise.reject(new Error('proveedor caído')),
      })
      .overrideProvider(CacheService)
      .useValue({ get: () => Promise.resolve(null), set: () => Promise.resolve(), onModuleDestroy: () => Promise.resolve() })
      .compile();
    app = configureApp(moduleRef.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('carga el catálogo de países en la base de datos al iniciar', async () => {
    const res = await request(app.getHttpServer()).get('/countries/CO').expect(200);
    expect(res.body).toMatchObject({ code: 'CO', currency: 'COP' });
  });

  it('convierte una cantidad y guarda la foto de las tasas en la base', async () => {
    const before = await prisma.rateSnapshot.count({ where: { base: 'COP' } });

    const res = await request(app.getHttpServer()).get('/convert?amount=40000&from=COP&to=USD').expect(200);
    expect(res.body).toMatchObject({ from: 'COP', to: 'USD', rate: 0.00025, result: 10 });

    expect(await prisma.rateSnapshot.count({ where: { base: 'COP' } })).toBe(before + 1);
  });

  it('si el proveedor externo falla, responde con la última tasa guardada (tolerancia a fallos)', async () => {
    providerUp = false;
    const res = await request(app.getHttpServer()).get('/rates?base=COP').expect(200);
    expect(res.body).toMatchObject({ base: 'COP', fallback: true });
  });

  it('publica la documentación de la API (OpenAPI)', async () => {
    const res = await request(app.getHttpServer()).get('/docs-json').expect(200);
    expect(res.body.openapi).toBeDefined();
    expect(Object.keys(res.body.paths).length).toBeGreaterThan(0);
  });
});
