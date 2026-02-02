import * as Joi from 'joi';

const isTestEnv = process.env.NODE_ENV === 'test';
const defaultCacheDriver = isTestEnv ? 'memory' : 'redis';
const defaultQueueDriver = isTestEnv ? 'memory' : 'redis';
const defaultSearchDriver = isTestEnv ? 'memory' : 'meilisearch';
const defaultSearchSyncEnabled = !isTestEnv;
const defaultRedisUrl = isTestEnv ? '' : 'redis://localhost:6379';
const defaultMeilisearchHost = isTestEnv ? '' : 'http://localhost:7700';
const defaultRateLimitDriver = isTestEnv ? 'memory' : 'redis';
const defaultCsrfEnabled =
  (process.env.NODE_ENV ?? 'development') === 'production' ? 'true' : 'false';
const defaultSessionCleanupEnabled =
  (process.env.NODE_ENV ?? 'development') === 'production' ? 'true' : 'false';

export const configValidationSchema = Joi.object({
  BRAND_NAME: Joi.string().allow('', null).default('TutorStartup'),
  SUPPORT_EMAIL: Joi.string().email().allow('', null).default(''),
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  TRUST_PROXY: Joi.string().allow('', null),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api'),
  API_VERSION: Joi.string().default('1'),
  DATABASE_URL: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
  RATE_LIMIT_DRIVER: Joi.string()
    .valid('redis', 'memory')
    .default(defaultRateLimitDriver),
  RATE_LIMIT_TTL: Joi.number().default(60),
  RATE_LIMIT_MAX: Joi.number().default(100),
  FRONTEND_URL: Joi.string().default('http://localhost:3000'),
  API_PUBLIC_URL: Joi.string().uri().default('http://localhost:4000/api'),
  CHAPA_SECRET_KEY: Joi.string().allow('', null).default(''),
  CHAPA_WEBHOOK_SECRET: Joi.string().allow('', null).default(''),
  CHAPA_BASE_URL: Joi.string().uri().default('https://api.chapa.co/v1'),
  AUTH_CSRF_ENABLED: Joi.string()
    .valid('true', 'false', '1', '0', 'yes', 'no', 'y', 'n', 'on', 'off')
    .default(defaultCsrfEnabled),

  SESSION_CLEANUP_ENABLED: Joi.string()
    .valid('true', 'false', '1', '0', 'yes', 'no', 'y', 'n', 'on', 'off')
    .default(defaultSessionCleanupEnabled),
  SESSION_CLEANUP_INTERVAL_MINUTES: Joi.number().integer().min(1).default(60),
  SESSION_CLEANUP_RETENTION_DAYS: Joi.number().integer().min(1).default(30),
  SWAGGER_ENABLED: Joi.string()
    .valid('true', 'false', '1', '0', 'yes', 'no', 'y', 'n', 'on', 'off')
    .default('true'),
  SWAGGER_PATH: Joi.string().default('docs'),
  CACHE_DRIVER: Joi.string()
    .valid('redis', 'memory')
    .default(defaultCacheDriver),
  CACHE_DEFAULT_TTL: Joi.number().default(30),
  QUEUE_DRIVER: Joi.string()
    .valid('redis', 'memory')
    .default(defaultQueueDriver),
  QUEUE_PREFIX: Joi.string().default('tutorstartup'),
  SEARCH_DRIVER: Joi.string()
    .valid('meilisearch', 'memory')
    .default(defaultSearchDriver),
  SEARCH_SYNC_ENABLED: Joi.boolean()
    .truthy('true', '1', 'yes', 'y', 'on')
    .falsy('false', '0', 'no', 'n', 'off')
    .default(defaultSearchSyncEnabled),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('', null).default(''),
  REDIS_DB: Joi.number().min(0).default(0),
  REDIS_URL: Joi.string().uri().allow('', null).default(defaultRedisUrl),
  MEILISEARCH_HOST: Joi.string()
    .uri()
    .allow('', null)
    .default(defaultMeilisearchHost),
  MEILISEARCH_MASTER_KEY: Joi.string().allow('', null),
  MEILISEARCH_INDEX_PREFIX: Joi.string().default('tutorstartup'),

  AUTH_REFRESH_COOKIE_NAME: Joi.string().default('tutorstartup_refresh'),
  AUTH_REFRESH_COOKIE_DOMAIN: Joi.string().allow('', null),
  AUTH_REFRESH_COOKIE_SECURE: Joi.string()
    .valid('true', 'false', '1', '0', 'yes', 'no', 'y', 'n', 'on', 'off')
    .allow('', null),
  AUTH_REFRESH_COOKIE_MAXAGE_DAYS: Joi.number().default(30),

  RESEND_API_KEY: Joi.string().allow('', null).default(''),
  // Leave empty by default so EmailService can fall back to Resend's dev sender.
  // In production you should set this to a verified sender/domain.
  RESEND_FROM_EMAIL: Joi.string().email().allow('', null).default(''),

  // Optional SMTP fallback (useful when Resend is in testing mode).
  SMTP_HOST: Joi.string().allow('', null).default(''),
  SMTP_PORT: Joi.number().integer().min(1).max(65535).default(587),
  SMTP_USER: Joi.string().allow('', null).default(''),
  SMTP_PASSWORD: Joi.string().allow('', null).default(''),
  SMTP_FROM: Joi.string().email().allow('', null).default(''),

  AUTH_EMAIL_VERIFY_TTL_MINUTES: Joi.number()
    .integer()
    .min(5)
    .default(60 * 24),
  AUTH_PASSWORD_RESET_TTL_MINUTES: Joi.number().integer().min(5).default(60),

  GOOGLE_CLIENT_ID: Joi.string().allow('', null).default(''),
  GOOGLE_CLIENT_SECRET: Joi.string().allow('', null).default(''),
});
