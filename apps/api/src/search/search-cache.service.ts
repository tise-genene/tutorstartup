import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { RedisService } from '../redis/redis.service';
import { TutorSearchParams, TutorSearchResult } from './search.types';

@Injectable()
export class SearchCacheService {
  private readonly logger = new Logger(SearchCacheService.name);
  private readonly ttlSeconds: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.ttlSeconds = this.configService.get<number>('cache.defaultTtl', 30);
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
    try {
      const raw = await this.redisService.getClient().get(key);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as TutorSearchResult;
    } catch (error) {
      const err = error as Error;
      this.logger.warn('Failed to read tutor search cache', err.stack);
      return null;
    }
  }

  async set(key: string, value: TutorSearchResult): Promise<void> {
    try {
      await this.redisService
        .getClient()
        .set(key, JSON.stringify(value), 'EX', this.ttlSeconds);
    } catch (error) {
      const err = error as Error;
      this.logger.warn('Failed to write tutor search cache', err.stack);
    }
  }
}
