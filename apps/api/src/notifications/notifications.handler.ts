import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationJob,
  NotificationJobName,
  NotificationJobPayloadMap,
} from './notifications.types';

@Injectable()
export class NotificationsHandler {
  private readonly logger = new Logger(NotificationsHandler.name);

  async handle<T extends NotificationJobName>(
    job: NotificationJob<T>,
  ): Promise<void> {
    switch (job.name) {
      case 'send-welcome-email':
        await this.sendWelcomeEmail(job.payload);
        return;
      case 'tutor-profile-reminder':
        await this.sendTutorProfileReminder(job.payload);
        return;
      default:
        this.logger.warn(`Unknown notification job: ${job.name as string}`);
    }
  }

  private async sendWelcomeEmail(
    payload: NotificationJobPayloadMap['send-welcome-email'],
  ): Promise<void> {
    this.logger.log(
      `Sending welcome email to ${payload.email} for user ${payload.userId}`,
    );
  }

  private async sendTutorProfileReminder(
    payload: NotificationJobPayloadMap['tutor-profile-reminder'],
  ): Promise<void> {
    this.logger.log(
      `Sending tutor profile reminder to ${payload.email} for user ${payload.userId}`,
    );
  }
}
