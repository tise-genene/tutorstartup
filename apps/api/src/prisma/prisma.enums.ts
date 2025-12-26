export const UserRole = {
  STUDENT: 'STUDENT',
  PARENT: 'PARENT',
  TUTOR: 'TUTOR',
  AGENCY: 'AGENCY',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const LessonRequestStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
} as const;

export type LessonRequestStatus =
  (typeof LessonRequestStatus)[keyof typeof LessonRequestStatus];
