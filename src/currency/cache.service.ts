import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 2 })
    : null;

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) {
      return null;
    }
    try {
      const value = await this.redis.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      this.logger.warn(`No se pudo leer la caché: ${(error as Error).message}`);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number) {
    if (!this.redis) {
      return;
    }
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      this.logger.warn(`No se pudo escribir la caché: ${(error as Error).message}`);
    }
  }

  async onModuleDestroy() {
    await this.redis?.quit();
  }
}