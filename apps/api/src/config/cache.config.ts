import { registerAs } from '@nestjs/config';

export type CacheDriver = 'redis' | 'memory';

export interface CacheConfig {
  driver: CacheDriver;
  defaultTtl: number;
}

const toNumber = (value: string | undefined, fallback: number): number => {
  if (value === undefined || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const cacheConfig = registerAs<CacheConfig>('cache', () => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const fallbackDriver: CacheDriver = nodeEnv === 'test' ? 'memory' : 'redis';
  const driver =
    (process.env.CACHE_DRIVER as CacheDriver | undefined) ?? fallbackDriver;

  return {
    driver,
    defaultTtl: toNumber(process.env.CACHE_DEFAULT_TTL, 30),
  } satisfies CacheConfig;
});

export default cacheConfig;
