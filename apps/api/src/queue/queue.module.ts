import { Module } from '@nestjs/common';
import { QueueFactoryService } from './queue.factory.js';
import { QueueHealthService } from './queue.health.js';

@Module({
  providers: [QueueFactoryService, QueueHealthService],
  exports: [QueueFactoryService, QueueHealthService],
})
export class QueueModule {}
