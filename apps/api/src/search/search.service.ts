import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch } from 'meilisearch';
import type { Index } from 'meilisearch';
import type { SearchConfig } from '../config/search.config';
import { SearchTutorDocument } from './interfaces/search-tutor-document.interface';
import { TutorSearchParams, TutorSearchResult } from './search.types';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly enabled: boolean;
  private readonly indexName: string;
  private client?: MeiliSearch;
  private indexPromise?: Promise<Index<SearchTutorDocument>>;
  private settingsPromise?: Promise<void>;

  constructor(private readonly configService: ConfigService) {
    const searchConfig = this.configService.get<SearchConfig>('search');
    const driver = searchConfig?.driver ?? 'memory';
    const host = searchConfig?.meilisearch.host ?? '';

    this.enabled = driver === 'meilisearch' && Boolean(host);
    this.indexName = `${searchConfig?.indexPrefix ?? 'tutorstartup'}_tutors`;

    if (this.enabled) {
      this.client = new MeiliSearch({
        host,
        apiKey: searchConfig?.meilisearch.masterKey || undefined,
      });
    } else {
      this.logger.log(
        'Search driver disabled; tutor search responses will be empty.',
      );
    }
  }

  isEnabled(): boolean {
    return this.enabled && Boolean(this.client);
  }

  async checkHealth(): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    const response = await this.client!.health();
    if (response.status !== 'available') {
      const status =
        typeof response.status === 'string'
          ? response.status
          : String(response.status);
      throw new Error(`Meilisearch unhealthy: ${status}`);
    }
  }

  async upsertTutor(document: SearchTutorDocument): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    try {
      const index = await this.getIndex();
      await index.addDocuments([document], { primaryKey: 'id' });
    } catch (error) {
      const err = error as Error;
      this.logger.error('Failed to upsert tutor search document', err.stack);
    }
  }

  async removeTutor(userId: string): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    try {
      const index = await this.getIndex();
      await index.deleteDocument(userId);
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to remove tutor ${userId} from search index`,
        err.stack,
      );
    }
  }

  async searchTutors(params: TutorSearchParams): Promise<TutorSearchResult> {
    if (!this.isEnabled()) {
      return this.buildEmptyResult(params, false);
    }

    const query = params.query?.trim() ?? '';
    const filters = this.buildFilters(params);

    try {
      const index = await this.getIndex();
      const response = await index.search<SearchTutorDocument>(query, {
        limit: params.limit,
        offset: (params.page - 1) * params.limit,
        filter: filters.length > 0 ? filters : undefined,
      });

      const total = response.estimatedTotalHits ?? response.hits?.length ?? 0;
      const hasMore = total > params.page * params.limit;
      const hits = (response.hits ?? []).map((hit) => ({
        ...hit,
        subjects: hit.subjects ?? [],
        languages: hit.languages ?? [],
      }));

      return {
        data: hits,
        meta: {
          query,
          page: params.page,
          limit: params.limit,
          total,
          hasMore,
          cacheHit: false,
          searchEnabled: true,
        },
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        'Tutor search failed; returning empty response',
        err.stack,
      );
      return this.buildEmptyResult(params, this.isEnabled());
    }
  }

  private buildFilters(params: TutorSearchParams): string[] {
    const filters: string[] = [];
    const subjectFilters: string[] = [];
    const rawSubjects = params.subjects ?? [];
    for (const subject of rawSubjects) {
      if (typeof subject !== 'string') {
        continue;
      }
      const trimmed = subject.trim();
      if (trimmed.length > 0) {
        subjectFilters.push(trimmed);
      }
    }
    if (subjectFilters.length > 0) {
      const serializedSubjects = subjectFilters
        .map((subject) => `"${this.escapeFilterValue(subject)}"`)
        .join(', ');
      filters.push(`subjects IN [${serializedSubjects}]`);
    }

    if (params.location) {
      filters.push(`location = "${this.escapeFilterValue(params.location)}"`);
    }

    return filters;
  }

  private escapeFilterValue(value: string): string {
    return value.replace(/"/g, '\\"');
  }

  private buildEmptyResult(
    params: TutorSearchParams,
    searchEnabled: boolean,
  ): TutorSearchResult {
    return {
      data: [],
      meta: {
        query: params.query?.trim() ?? '',
        page: params.page,
        limit: params.limit,
        total: 0,
        hasMore: false,
        cacheHit: false,
        searchEnabled,
      },
    };
  }

  private async getIndex(): Promise<Index<SearchTutorDocument>> {
    if (!this.client) {
      throw new Error('Search client not initialised');
    }

    if (!this.indexPromise) {
      this.indexPromise = this.client
        .getIndex<SearchTutorDocument>(this.indexName)
        .catch(async (error) => {
          const code = (error as { code?: string }).code;
          if (code === 'index_not_found') {
            await this.client!.createIndex(this.indexName, {
              primaryKey: 'id',
            });
            return this.client!.getIndex<SearchTutorDocument>(this.indexName);
          }
          throw error;
        });
    }

    const index = await this.indexPromise;
    await this.ensureIndexSettings(index);
    return index;
  }

  private async ensureIndexSettings(
    index: Index<SearchTutorDocument>,
  ): Promise<void> {
    if (!this.client) {
      return;
    }

    if (!this.settingsPromise) {
      this.settingsPromise = (async () => {
        await index.updateFilterableAttributes(['subjects', 'location']);
      })().catch((error) => {
        const err = error as Error;
        this.logger.error(
          'Failed to initialize search index settings',
          err.stack,
        );
      });
    }

    await this.settingsPromise;
  }
}
