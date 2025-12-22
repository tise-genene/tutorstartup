import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { NotificationsHandler } from './notifications.handler';
import { NotificationsProcessorService } from './notifications.processor.service';
import { NotificationsQueueService } from './notifications.queue.service';

@Module({
  imports: [QueueModule],
  providers: [
    NotificationsHandler,
    NotificationsQueueService,
    NotificationsProcessorService,
  ],
  exports: [NotificationsQueueService],
})
export class NotificationsModule {}
