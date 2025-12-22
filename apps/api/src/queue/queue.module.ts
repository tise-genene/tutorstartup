import { Module } from '@nestjs/common';
import { QueueFactoryService } from './queue.factory';
import { QueueHealthService } from './queue.health';

@Module({
  providers: [QueueFactoryService, QueueHealthService],
  exports: [QueueFactoryService, QueueHealthService],
})
export class QueueModule {}
