import type { RedisOptions } from 'ioredis';
import type { RedisConfig } from '../config/redis.config';

export const buildBullConnectionOptions = (
  config?: RedisConfig | null,
): RedisOptions | { url: string } => {
  if (config?.url && config.url.trim().length > 0) {
    return { url: config.url };
  }

  return {
    host: config?.host ?? 'localhost',
    port: config?.port ?? 6379,
    password: config?.password || undefined,
    db: config?.db ?? 0,
  } satisfies RedisOptions;
};
