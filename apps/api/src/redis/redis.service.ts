import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
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
  private client!: Redis;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
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
    return this.client;
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }
}
