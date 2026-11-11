import { Injectable } from '@nestjs/common';

export interface ProviderRates {
  base: string;
  rates: Record<string, number>;
  updatedAt: string;
}

interface OpenErApiResponse {
  result: string;
  base_code: string;
  time_last_update_utc: string;
  rates: Record<string, number>;
}

@Injectable()
export class RatesProvider {
  private readonly baseUrl = process.env.RATES_API_URL ?? 'https://open.er-api.com/v6/latest';

  async fetchLatest(base: string): Promise<ProviderRates> {
    const response = await fetch(`${this.baseUrl}/${base}`, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) {
      throw new Error(`El proveedor de tasas respondió con estado ${response.status}`);
    }
    const body = (await response.json()) as OpenErApiResponse;
    if (body.result !== 'success') {
      throw new Error('El proveedor de tasas no devolvió resultados');
    }
    return {
      base: body.base_code,
      rates: body.rates,
      updatedAt: new Date(body.time_last_update_utc).toISOString(),
    };
  }
}