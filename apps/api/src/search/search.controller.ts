import { Controller, Get, Query } from '@nestjs/common';
import { SearchCacheService } from './search-cache.service';
import { SearchService } from './search.service';
import { SearchTutorsQueryDto } from './dto/search-tutors-query.dto';
import { TutorSearchParams } from './search.types';

@Controller({ path: 'tutors', version: '1' })
export class SearchController {
  constructor(
    private readonly searchCache: SearchCacheService,
    private readonly searchService: SearchService,
  ) {}

  @Get('search')
  async searchTutors(@Query() query: SearchTutorsQueryDto) {
    const params: TutorSearchParams = {
      query: query.q?.trim() ?? '',
      subjects: (query.subjects ?? []).filter(Boolean),
      location: query.location?.trim() || undefined,
      limit: query.limit ?? 20,
      page: query.page ?? 1,
    };

    const cacheKey = this.searchCache.buildKey(params);
    const cached = await this.searchCache.get(cacheKey);
    if (cached) {
      return {
        ...cached,
        meta: {
          ...cached.meta,
          cacheHit: true,
        },
      };
    }

    const result = await this.searchService.searchTutors(params);
    await this.searchCache.set(cacheKey, result);
    return result;
  }
}
