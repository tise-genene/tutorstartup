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
import { buildBullConnectionOptions } from '../queue/queue.utils';
import { NotificationsHandler } from './notifications.handler';
import { NOTIFICATIONS_QUEUE, NotificationJob } from './notifications.types';

@Injectable()
export class NotificationsProcessorService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(NotificationsProcessorService.name);
  private readonly queueEnabled: boolean;
  private worker?: Worker<NotificationJob>;

  constructor(
    private readonly configService: ConfigService,
    private readonly handler: NotificationsHandler,
  ) {
    const queueConfig = this.configService.get<QueueConfig>('queue');
    this.queueEnabled = (queueConfig?.driver ?? 'redis') !== 'memory';
  }

  async onModuleInit(): Promise<void> {
    if (!this.queueEnabled) {
      return;
    }

    const redisConfig = this.configService.get<RedisConfig>('redis');
    const connection = buildBullConnectionOptions(redisConfig);
    const queueConfig = this.configService.get<QueueConfig>('queue');

    this.worker = new Worker<NotificationJob>(
      NOTIFICATIONS_QUEUE,
      async (job) => {
        await this.handler.handle(job.data);
      },
      {
        connection,
        prefix: queueConfig?.prefix ?? 'tutorstartup',
      },
    );

    this.worker.on('failed', (job, error) => {
      const jobId = job?.id ?? 'unknown';
      const err = error as Error;
      this.logger.error(`Notification job ${jobId} failed`, err.stack);
    });

    this.worker.on('error', (error) => {
      const err = error as Error;
      this.logger.error('Notifications worker encountered an error', err.stack);
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
