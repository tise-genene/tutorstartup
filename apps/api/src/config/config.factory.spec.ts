import { cacheConfig } from './cache.config';
import { queueConfig } from './queue.config';
import { redisConfig } from './redis.config';
import { searchConfig } from './search.config';

describe('Config factories', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('cacheConfig', () => {
    it('defaults to redis driver outside test env', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.CACHE_DRIVER;
      delete process.env.CACHE_DEFAULT_TTL;

      const value = cacheConfig();
      expect(value).toEqual({ driver: 'redis', defaultTtl: 30 });
    });

    it('switches to memory driver in test env', () => {
      process.env.NODE_ENV = 'test';
      delete process.env.CACHE_DRIVER;

      const value = cacheConfig();
      expect(value.driver).toBe('memory');
    });

    it('parses user provided TTL', () => {
      process.env.CACHE_DEFAULT_TTL = '120';

      const value = cacheConfig();
      expect(value.defaultTtl).toBe(120);
    });
  });

  describe('queueConfig', () => {
    it('falls back to memory driver in test env', () => {
      process.env.NODE_ENV = 'test';
      delete process.env.QUEUE_DRIVER;

      const value = queueConfig();
      expect(value.driver).toBe('memory');
    });

    it('uses provided prefix', () => {
      process.env.NODE_ENV = 'development';
      process.env.QUEUE_PREFIX = 'custom-prefix';

      const value = queueConfig();
      expect(value.prefix).toBe('custom-prefix');
    });
  });

  describe('redisConfig', () => {
    it('returns sane defaults outside test env', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.REDIS_HOST;
      delete process.env.REDIS_PORT;
      delete process.env.REDIS_PASSWORD;
      delete process.env.REDIS_DB;
      delete process.env.REDIS_URL;

      const value = redisConfig();
      expect(value).toEqual({
        host: 'localhost',
        port: 6379,
        password: '',
        db: 0,
        url: 'redis://localhost:6379',
      });
    });

    it('omits redis url by default in test env', () => {
      process.env.NODE_ENV = 'test';
      delete process.env.REDIS_URL;

      const value = redisConfig();
      expect(value.url).toBe('');
    });

    it('parses numeric values', () => {
      process.env.REDIS_PORT = '6380';
      process.env.REDIS_DB = '1';

      const value = redisConfig();
      expect(value.port).toBe(6380);
      expect(value.db).toBe(1);
    });
  });

  describe('searchConfig', () => {
    it('enables sync by default outside test env', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.SEARCH_SYNC_ENABLED;

      const value = searchConfig();
      expect(value.syncEnabled).toBe(true);
      expect(value.meilisearch.host).toBe('http://localhost:7700');
    });

    it('disables sync and host by default in test env', () => {
      process.env.NODE_ENV = 'test';
      delete process.env.SEARCH_SYNC_ENABLED;
      delete process.env.MEILISEARCH_HOST;

      const value = searchConfig();
      expect(value.syncEnabled).toBe(false);
      expect(value.meilisearch.host).toBe('');
    });

    it('parses boolean string overrides', () => {
      process.env.SEARCH_SYNC_ENABLED = 'false';

      const value = searchConfig();
      expect(value.syncEnabled).toBe(false);
    });
  });
});
