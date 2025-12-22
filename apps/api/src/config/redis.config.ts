import { registerAs } from '@nestjs/config';

export interface RedisConfig {
  host: string;
  port: number;
  password: string;
  db: number;
  url: string;
}

const toNumber = (value: string | undefined, defaultValue: number): number => {
  if (value === undefined || value === '') {
    return defaultValue;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? defaultValue : parsed;
};

export const redisConfig = registerAs<RedisConfig>('redis', (): RedisConfig => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const defaultRedisUrl = nodeEnv === 'test' ? '' : 'redis://localhost:6379';

  return {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: toNumber(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD ?? '',
    db: toNumber(process.env.REDIS_DB, 0),
    url: process.env.REDIS_URL ?? defaultRedisUrl,
  } satisfies RedisConfig;
});

export default redisConfig;
