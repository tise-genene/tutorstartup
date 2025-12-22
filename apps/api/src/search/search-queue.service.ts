import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import type { QueueConfig } from '../config/queue.config';
import type { SearchConfig } from '../config/search.config';
import { QueueFactoryService } from '../queue/queue.factory';
import { SearchIndexerService } from './search-indexer.service';
import { SearchService } from './search.service';
import { SEARCH_INDEX_QUEUE, SearchIndexJob } from './search.types';

@Injectable()
export class SearchIndexQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(SearchIndexQueueService.name);
  private readonly queueEnabled: boolean;
  private readonly syncEnabled: boolean;
  private queue?: Queue<SearchIndexJob>;

  constructor(
    private readonly queueFactory: QueueFactoryService,
    private readonly configService: ConfigService,
    private readonly searchIndexer: SearchIndexerService,
    private readonly searchService: SearchService,
  ) {
    const queueConfig = this.configService.get<QueueConfig>('queue');
    const searchConfig = this.configService.get<SearchConfig>('search');
    this.queueEnabled = (queueConfig?.driver ?? 'redis') !== 'memory';
    this.syncEnabled = searchConfig?.syncEnabled ?? true;

    if (this.shouldUseQueue()) {
      this.queue = this.queueFactory.createQueue(SEARCH_INDEX_QUEUE);
    } else if (!this.syncEnabled) {
      this.logger.log('Search sync disabled via configuration.');
    } else {
      this.logger.log('Search sync will run inline (queue driver disabled).');
    }
  }

  async enqueueUpsert(userId: string): Promise<void> {
    if (!this.syncEnabled || !this.searchService.isEnabled()) {
      return;
    }

    try {
      if (this.shouldUseQueue() && this.queue) {
        await this.queue.add('sync-tutor', { action: 'UPSERT', userId });
        return;
      }

      await this.searchIndexer.syncTutorProfile(userId);
    } catch (error) {
      const err = error as Error;
      this.logger.error('Failed to enqueue tutor search sync job', err.stack);
    }
  }

  async enqueueDelete(userId: string): Promise<void> {
    if (!this.syncEnabled || !this.searchService.isEnabled()) {
      return;
    }

    try {
      if (this.shouldUseQueue() && this.queue) {
        await this.queue.add('delete-tutor', { action: 'DELETE', userId });
        return;
      }

      await this.searchIndexer.removeTutorProfile(userId);
    } catch (error) {
      const err = error as Error;
      this.logger.error('Failed to enqueue tutor search delete job', err.stack);
    }
  }

  private shouldUseQueue(): boolean {
    return (
      this.queueEnabled && this.syncEnabled && this.searchService.isEnabled()
    );
  }

  async onModuleDestroy(): Promise<void> {
    if (this.queue) {
      await this.queue.close();
    }
  }
}
