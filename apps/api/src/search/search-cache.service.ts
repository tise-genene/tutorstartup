import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { RedisService } from '../redis/redis.service';
import { TutorSearchParams, TutorSearchResult } from './search.types';
import type { CacheConfig } from '../config/cache.config';

@Injectable()
export class SearchCacheService {
  private readonly logger = new Logger(SearchCacheService.name);
  private readonly ttlSeconds: number;
  private readonly driver: 'redis' | 'memory';
  private readonly memoryCache = new Map<
    string,
    { value: TutorSearchResult; expiresAt: number }
  >();

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.ttlSeconds = this.configService.get<number>('cache.defaultTtl', 30);
    const cacheConfig = this.configService.get<CacheConfig>('cache');
    this.driver =
      (cacheConfig?.driver ?? 'redis') === 'memory' ? 'memory' : 'redis';
  }

  buildKey(params: TutorSearchParams): string {
    const normalizedSubjects = (params.subjects ?? [])
      .map((subject) => subject.trim())
      .filter(Boolean)
      .map((subject) => subject.toLowerCase());

    const normalized: TutorSearchParams = {
      ...params,
      subjects: Array.from(new Set(normalizedSubjects)).sort(),
      query: params.query?.trim() ?? '',
      location: params.location?.trim() || undefined,
    };

    const serialized = JSON.stringify(normalized);
    const hash = createHash('sha1').update(serialized).digest('hex');
    return `search:tutors:${hash}`;
  }

  async get(key: string): Promise<TutorSearchResult | null> {
    if (this.driver === 'memory' || !this.redisService.isEnabled()) {
      return this.getFromMemory(key);
    }

    try {
      const raw = await this.redisService.getClient().get(key);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as TutorSearchResult;
      if ((parsed?.meta?.total ?? 0) === 0) {
        return null;
      }
      return parsed;
    } catch (error) {
      const err = error as Error;
      this.logger.warn('Failed to read tutor search cache', err.stack);
      return null;
    }
  }

  async set(key: string, value: TutorSearchResult): Promise<void> {
    if ((value?.meta?.total ?? 0) === 0) {
      return;
    }

    if (this.driver === 'memory' || !this.redisService.isEnabled()) {
      this.setInMemory(key, value);
      return;
    }

    try {
      await this.redisService
        .getClient()
        .set(key, JSON.stringify(value), 'EX', this.ttlSeconds);
    } catch (error) {
      const err = error as Error;
      this.logger.warn('Failed to write tutor search cache', err.stack);
    }
  }

  private getFromMemory(key: string): TutorSearchResult | null {
    const now = Date.now();
    const entry = this.memoryCache.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= now) {
      this.memoryCache.delete(key);
      return null;
    }

    if ((entry.value?.meta?.total ?? 0) === 0) {
      return null;
    }

    return entry.value;
  }

  private setInMemory(key: string, value: TutorSearchResult): void {
    const expiresAt = Date.now() + this.ttlSeconds * 1000;
    this.memoryCache.set(key, { value, expiresAt });
  }
}
