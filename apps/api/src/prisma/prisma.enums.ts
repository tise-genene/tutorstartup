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
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type ContractStatus =
  (typeof ContractStatus)[keyof typeof ContractStatus];

export const PaymentProvider = {
  CHAPA: 'CHAPA',
} as const;

export type PaymentProvider =
  (typeof PaymentProvider)[keyof typeof PaymentProvider];

export const PaymentStatus = {
  PENDING: 'PENDING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const LedgerEntryType = {
  CLIENT_CHARGE: 'CLIENT_CHARGE',
  PLATFORM_FEE: 'PLATFORM_FEE',
  TUTOR_PAYABLE: 'TUTOR_PAYABLE',
  TUTOR_PAYOUT: 'TUTOR_PAYOUT',
  REFUND: 'REFUND',
} as const;

export type LedgerEntryType =
  (typeof LedgerEntryType)[keyof typeof LedgerEntryType];
