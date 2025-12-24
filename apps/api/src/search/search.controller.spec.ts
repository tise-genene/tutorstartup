import { SearchController } from './search.controller';
import { SearchCacheService } from './search-cache.service';
import { SearchService } from './search.service';
import { TutorSearchResult } from './search.types';

describe('SearchController', () => {
  const buildController = () => {
    const buildKeyMock = jest.fn().mockReturnValue('cache-key');
    const cacheGetMock = jest.fn().mockResolvedValue(null);
    const cacheSetMock = jest.fn().mockResolvedValue(undefined);
    const cache = {
      buildKey: buildKeyMock,
      get: cacheGetMock,
      set: cacheSetMock,
    } as unknown as SearchCacheService;

    const searchTutorsMock = jest.fn();
    const searchService = {
      searchTutors: searchTutorsMock,
    } as unknown as SearchService;

    return {
      cache,
      searchService,
      controller: new SearchController(cache, searchService),
      cacheSetMock,
      cacheGetMock,
      searchTutorsMock,
    };
  };

  it('returns cached responses with a cache-hit flag', async () => {
    const { cache, controller, searchTutorsMock } = buildController();
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
    expect(searchTutorsMock).not.toHaveBeenCalled();
  });

  it('delegates to SearchService and stores results when cache misses', async () => {
    const { cacheSetMock, controller, searchTutorsMock } = buildController();
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
    searchTutorsMock.mockResolvedValueOnce(liveResult);

    const response = await controller.searchTutors({
      q: '',
      subjects: [],
      limit: 20,
      page: 1,
    } as never);

    expect(searchTutorsMock).toHaveBeenCalled();
    expect(cacheSetMock).toHaveBeenCalledWith('cache-key', liveResult);
    expect(response.data).toEqual(liveResult.data);
  });
});
