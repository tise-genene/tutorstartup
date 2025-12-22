import { SearchTutorDocument } from './interfaces/search-tutor-document.interface';

export interface TutorSearchParams {
  query?: string;
  subjects?: string[];
  location?: string;
  page: number;
  limit: number;
}

export interface TutorSearchResult {
  data: SearchTutorDocument[];
  meta: {
    query: string;
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    cacheHit?: boolean;
    searchEnabled: boolean;
  };
}

export type SearchIndexJobAction = 'UPSERT' | 'DELETE';

export interface SearchIndexJob {
  action: SearchIndexJobAction;
  userId: string;
}

export const SEARCH_INDEX_QUEUE = 'search-index';
