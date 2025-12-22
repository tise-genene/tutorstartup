import { SearchController } from './search.controller';
import { SearchCacheService } from './search-cache.service';
import { SearchService } from './search.service';
import { TutorSearchResult } from './search.types';

describe('SearchController', () => {
  const buildController = () => {
    const cache = {
      buildKey: jest.fn().mockReturnValue('cache-key'),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    } as unknown as SearchCacheService;

    const searchService = {
      searchTutors: jest.fn(),
    } as unknown as SearchService;

    return {
      cache,
      searchService,
      controller: new SearchController(cache, searchService),
    };
  };

  it('returns cached responses with a cache-hit flag', async () => {
    const { cache, controller, searchService } = buildController();
    const cached: TutorSearchResult = {
      data: [],
      meta: {
        query: 'math',
        limit: 20,
        page: 1,
        total: 0,
        hasMore: false,
        cacheHit: false,
        searchEnabled: true,
      },
    };
    (cache.get as jest.Mock).mockResolvedValueOnce(cached);

    const response = await controller.searchTutors({
      q: 'math',
      limit: 20,
      page: 1,
    } as never);

    expect(response.meta.cacheHit).toBe(true);
    expect(searchService.searchTutors).not.toHaveBeenCalled();
  });

  it('delegates to SearchService and stores results when cache misses', async () => {
    const { cache, controller, searchService } = buildController();
    const liveResult: TutorSearchResult = {
      data: [],
      meta: {
        query: '',
        limit: 20,
        page: 1,
        total: 0,
        hasMore: false,
        cacheHit: false,
        searchEnabled: true,
      },
    };
    (searchService.searchTutors as jest.Mock).mockResolvedValueOnce(liveResult);

    const response = await controller.searchTutors({
      q: '',
      subjects: [],
      limit: 20,
      page: 1,
    } as never);

    expect(searchService.searchTutors).toHaveBeenCalled();
    expect(cache.set).toHaveBeenCalledWith('cache-key', liveResult);
    expect(response.data).toEqual(liveResult.data);
  });
});
