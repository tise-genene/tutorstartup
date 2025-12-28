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

export const JobPostStatus = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
} as const;

export type JobPostStatus = (typeof JobPostStatus)[keyof typeof JobPostStatus];

export const ProposalStatus = {
  SUBMITTED: 'SUBMITTED',
  WITHDRAWN: 'WITHDRAWN',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
} as const;

export type ProposalStatus =
  (typeof ProposalStatus)[keyof typeof ProposalStatus];

export const ContractStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type ContractStatus =
  (typeof ContractStatus)[keyof typeof ContractStatus];
