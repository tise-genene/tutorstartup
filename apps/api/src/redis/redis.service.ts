import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import type { CacheConfig } from '../config/cache.config';
import type { QueueConfig } from '../config/queue.config';
import type { RedisConfig } from '../config/redis.config';

const buildRedisOptions = (config?: RedisConfig): RedisOptions | string => {
  if (config?.url && config.url.trim().length > 0) {
    return config.url;
  }

  return {
    host: config?.host ?? 'localhost',
    port: config?.port ?? 6379,
    password: config?.password || undefined,
    db: config?.db ?? 0,
    lazyConnect: true,
  } satisfies RedisOptions;
};

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client?: Redis;
  private enabled = false;

  constructor(private readonly configService: ConfigService) {
    const cacheConfig = this.configService.get<CacheConfig>('cache');
    const queueConfig = this.configService.get<QueueConfig>('queue');
    const cacheEnabled = (cacheConfig?.driver ?? 'redis') === 'redis';
    const queueEnabled = (queueConfig?.driver ?? 'redis') === 'redis';
    const rateLimitEnabled =
      this.configService
        .get<string>('RATE_LIMIT_DRIVER', 'memory')
        .toLowerCase() === 'redis';
    this.enabled = cacheEnabled || queueEnabled || rateLimitEnabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    const redisConfig = this.configService.get<RedisConfig>('redis');
    const options = buildRedisOptions(redisConfig);

    this.client =
      typeof options === 'string'
        ? new Redis(options, { lazyConnect: true })
        : new Redis({ ...options, lazyConnect: true });

    await this.client.connect();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client not available (driver disabled)');
    }
    return this.client;
  }

  async ping(): Promise<string> {
    if (!this.client) {
      return 'disabled';
    }
    return this.client.ping();
  }
}
