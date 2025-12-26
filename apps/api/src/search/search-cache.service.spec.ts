import { ConfigService } from '@nestjs/config';
import { SearchCacheService } from './search-cache.service';
import { RedisService } from '../redis/redis.service';
import type { TutorSearchParams, TutorSearchResult } from './search.types';

describe('SearchCacheService', () => {
  const redisClient = {
    get: jest.fn<Promise<string | null>, [string]>(),
    set: jest.fn<Promise<'OK'>, [string, string, string, number]>(),
  };
  const redisService = {
    getClient: () => redisClient,
    isEnabled: () => true,
  } as unknown as RedisService;

  const configService = {
    get: jest.fn().mockReturnValue(45),
  } as unknown as ConfigService;

  const service = new SearchCacheService(redisService, configService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes cache keys for equivalent inputs', () => {
    const paramsA: TutorSearchParams = {
      query: '  math  ',
      subjects: ['Physics', 'mathematics', 'physics'],
      location: ' Addis ',
      limit: 20,
      page: 1,
    };

    const paramsB: TutorSearchParams = {
      query: 'math',
      subjects: ['mathematics', 'Physics'],
      location: 'Addis',
      limit: 20,
      page: 1,
    };

    const keyA = service.buildKey(paramsA);
    const keyB = service.buildKey(paramsB);

    expect(keyA).toBe(keyB);
  });

  it('retrieves JSON payloads from Redis', async () => {
    const cached: TutorSearchResult = {
      data: [
        {
          id: 'tutor-1',
          profileId: 'profile-1',
          name: 'Tutor One',
          bio: null,
          subjects: ['mathematics'],
          languages: [],
          location: null,
          hourlyRate: null,
          rating: null,
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: {
        query: 'math',
        limit: 20,
        page: 1,
        total: 1,
        hasMore: false,
        searchEnabled: true,
      },
    };
    redisClient.get.mockResolvedValueOnce(JSON.stringify(cached));

    await expect(service.get('cache-key')).resolves.toEqual(cached);
  });

  it('treats cached empty payloads as misses', async () => {
    const cached: TutorSearchResult = {
      data: [],
      meta: {
        query: 'math',
        limit: 20,
        page: 1,
        total: 0,
        hasMore: false,
        searchEnabled: true,
      },
    };
    redisClient.get.mockResolvedValueOnce(JSON.stringify(cached));

    await expect(service.get('cache-key')).resolves.toBeNull();
  });

  it('writes JSON payloads with the configured TTL', async () => {
    const payload: TutorSearchResult = {
      data: [
        {
          id: 'tutor-1',
          profileId: 'profile-1',
          name: 'Tutor One',
          bio: null,
          subjects: ['mathematics'],
          languages: [],
          location: null,
          hourlyRate: null,
          rating: null,
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: {
        query: '',
        limit: 20,
        page: 1,
        total: 1,
        hasMore: false,
        searchEnabled: true,
      },
    };

    await service.set('cache-key', payload);

    expect(redisClient.set).toHaveBeenCalledWith(
      'cache-key',
      JSON.stringify(payload),
      'EX',
      45,
    );
  });

  it('does not write empty payloads', async () => {
    const payload: TutorSearchResult = {
      data: [],
      meta: {
        query: '',
        limit: 20,
        page: 1,
        total: 0,
        hasMore: false,
        searchEnabled: true,
      },
    };

    await service.set('cache-key', payload);

    expect(redisClient.set).not.toHaveBeenCalled();
  });
});
