import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { QueueFactoryService } from './queue.factory.js';
import type { QueueConfig } from '../config/queue.config';

@Injectable()
export class QueueHealthService implements OnModuleDestroy {
  private readonly enabled: boolean;
  private probeQueue?: Queue;

  constructor(
    private readonly queueFactory: QueueFactoryService,
    private readonly configService: ConfigService,
  ) {
    const queueConfig = this.configService.get<QueueConfig>('queue');
    this.enabled = (queueConfig?.driver ?? 'redis') !== 'memory';
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async check(): Promise<void> {
    if (!this.enabled) {
      return;
    }
    if (!this.probeQueue) {
      this.probeQueue = this.queueFactory.createQueue('__health__');
    }
    await this.probeQueue.getJobCounts();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.probeQueue) {
      await this.probeQueue.close();
    }
  }
}
