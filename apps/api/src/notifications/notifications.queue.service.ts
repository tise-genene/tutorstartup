import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import type { QueueConfig } from '../config/queue.config';
import { QueueFactoryService } from '../queue/queue.factory';
import { NotificationsHandler } from './notifications.handler';
import {
  NOTIFICATIONS_QUEUE,
  NotificationJob,
  NotificationJobName,
  NotificationJobPayloadMap,
} from './notifications.types';

@Injectable()
export class NotificationsQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(NotificationsQueueService.name);
  private readonly queueEnabled: boolean;
  private queue?: Queue<NotificationJob>;

  constructor(
    private readonly queueFactory: QueueFactoryService,
    private readonly configService: ConfigService,
    private readonly handler: NotificationsHandler,
  ) {
    const queueConfig = this.configService.get<QueueConfig>('queue');
    this.queueEnabled = (queueConfig?.driver ?? 'redis') !== 'memory';

    if (this.queueEnabled) {
      this.queue = this.queueFactory.createQueue(NOTIFICATIONS_QUEUE);
    } else {
      this.logger.log(
        'Queue driver disabled; notifications will execute inline.',
      );
    }
  }

  async enqueue<K extends NotificationJobName>(
    name: K,
    payload: NotificationJobPayloadMap[K],
  ): Promise<void> {
    if (this.queue && this.queueEnabled) {
      await this.queue.add(name, { name, payload });
      return;
    }

    await this.handler.handle({ name, payload });
  }

  async enqueueWelcomeEmail(
    payload: NotificationJobPayloadMap['send-welcome-email'],
  ): Promise<void> {
    await this.enqueue('send-welcome-email', payload);
  }

  async enqueueTutorProfileReminder(
    payload: NotificationJobPayloadMap['tutor-profile-reminder'],
  ): Promise<void> {
    await this.enqueue('tutor-profile-reminder', payload);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.queue) {
      await this.queue.close();
    }
  }
}
