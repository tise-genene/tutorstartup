import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker } from 'bullmq';
import type { QueueConfig } from '../config/queue.config';
import type { RedisConfig } from '../config/redis.config';
import type { SearchConfig } from '../config/search.config';
import { buildBullConnectionOptions } from '../queue/queue.utils';
import { SearchIndexerService } from './search-indexer.service';
import { SearchService } from './search.service';
import { SEARCH_INDEX_QUEUE, SearchIndexJob } from './search.types';

@Injectable()
export class SearchProcessorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SearchProcessorService.name);
  private readonly queueEnabled: boolean;
  private readonly syncEnabled: boolean;
  private worker?: Worker<SearchIndexJob>;

  constructor(
    private readonly configService: ConfigService,
    private readonly searchIndexer: SearchIndexerService,
    private readonly searchService: SearchService,
  ) {
    const queueConfig = this.configService.get<QueueConfig>('queue');
    const searchConfig = this.configService.get<SearchConfig>('search');
    this.queueEnabled = (queueConfig?.driver ?? 'redis') !== 'memory';
    this.syncEnabled = searchConfig?.syncEnabled ?? true;
  }

  async onModuleInit(): Promise<void> {
    if (
      !this.queueEnabled ||
      !this.syncEnabled ||
      !this.searchService.isEnabled()
    ) {
      return;
    }

    const redisConfig = this.configService.get<RedisConfig>('redis');
    const connection = buildBullConnectionOptions(redisConfig);
    const queueConfig = this.configService.get<QueueConfig>('queue');

    this.worker = new Worker<SearchIndexJob>(
      SEARCH_INDEX_QUEUE,
      async (job) => {
        if (job.data.action === 'DELETE') {
          await this.searchIndexer.removeTutorProfile(job.data.userId);
          return;
        }
        await this.searchIndexer.syncTutorProfile(job.data.userId);
      },
      {
        connection,
        prefix: queueConfig?.prefix ?? 'tutorstartup',
      },
    );

    this.worker.on('failed', (job, error) => {
      const jobId = job?.id ?? 'unknown';
      const err = error as Error;
      this.logger.error(`Search job ${jobId} failed`, err.stack);
    });

    this.worker.on('error', (error) => {
      const err = error as Error;
      this.logger.error('Search queue worker encountered an error', err.stack);
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
