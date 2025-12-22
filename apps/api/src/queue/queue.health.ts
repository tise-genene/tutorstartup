import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QueueFactoryService } from './queue.factory.js';

@Injectable()
export class QueueHealthService implements OnModuleDestroy {
  private readonly probeQueue: Queue;

  constructor(queueFactory: QueueFactoryService) {
    this.probeQueue = queueFactory.createQueue('__health__');
  }

  async check(): Promise<void> {
    await this.probeQueue.getJobCounts();
  }

  async onModuleDestroy(): Promise<void> {
    await this.probeQueue.close();
  }
}
