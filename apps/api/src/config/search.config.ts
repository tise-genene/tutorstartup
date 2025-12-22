import { registerAs } from '@nestjs/config';

export type SearchDriver = 'meilisearch' | 'memory';

export interface SearchConfig {
  driver: SearchDriver;
  indexPrefix: string;
  syncEnabled: boolean;
  meilisearch: {
    host: string;
    masterKey: string;
  };
}

const parseBoolean = (
  value: string | undefined,
  defaultValue: boolean,
): boolean => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const normalized = value.toLowerCase();
  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) {
    return false;
  }
  return defaultValue;
};

const toIndexPrefix = (prefix: string | undefined): string => {
  if (!prefix || !prefix.trim()) {
    return 'tutorstartup';
  }
  return prefix.trim();
};

export const searchConfig = registerAs<SearchConfig>(
  'search',
  (): SearchConfig => {
    const nodeEnv = process.env.NODE_ENV ?? 'development';
    const isTestEnv = nodeEnv === 'test';
    const fallbackDriver: SearchDriver = isTestEnv ? 'memory' : 'meilisearch';
    const defaultHost = isTestEnv ? '' : 'http://localhost:7700';
    const defaultSync = !isTestEnv;

    return {
      driver:
        (process.env.SEARCH_DRIVER as SearchDriver | undefined) ??
        fallbackDriver,
      indexPrefix: toIndexPrefix(process.env.MEILISEARCH_INDEX_PREFIX),
      syncEnabled: parseBoolean(process.env.SEARCH_SYNC_ENABLED, defaultSync),
      meilisearch: {
        host: process.env.MEILISEARCH_HOST ?? defaultHost,
        masterKey: process.env.MEILISEARCH_MASTER_KEY ?? '',
      },
    } satisfies SearchConfig;
  },
);

export default searchConfig;
