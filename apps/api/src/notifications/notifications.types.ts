export const NOTIFICATIONS_QUEUE = 'notifications-email';

export type NotificationJobName =
  | 'send-welcome-email'
  | 'tutor-profile-reminder';

export interface WelcomeEmailPayload {
  userId: string;
  email: string;
  name: string;
}

export interface TutorProfileReminderPayload {
  userId: string;
  email: string;
  name: string;
}

export type NotificationJobPayloadMap = {
  'send-welcome-email': WelcomeEmailPayload;
  'tutor-profile-reminder': TutorProfileReminderPayload;
};

export interface NotificationJob<
  T extends NotificationJobName = NotificationJobName,
> {
  name: T;
  payload: NotificationJobPayloadMap[T];
}
