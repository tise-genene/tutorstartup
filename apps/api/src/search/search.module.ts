import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { RedisModule } from '../redis/redis.module';
import { SearchController } from './search.controller';
import { SearchCacheService } from './search-cache.service';
import { SearchIndexerService } from './search-indexer.service';
import { SearchProcessorService } from './search-processor.service';
import { SearchIndexQueueService } from './search-queue.service';
import { SearchService } from './search.service';

@Module({
  imports: [QueueModule, RedisModule],
  controllers: [SearchController],
  providers: [
    SearchService,
    SearchCacheService,
    SearchIndexerService,
    SearchIndexQueueService,
    SearchProcessorService,
  ],
  exports: [SearchIndexQueueService, SearchService],
})
export class SearchModule {}
