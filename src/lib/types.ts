import type {
  UserRole,
  LessonRequestStatus,
  JobPostStatus,
  JobPayType,
  GenderPreference,
  ProposalStatus,
  ContractStatus,
  ContractMilestoneStatus,
  PaymentStatus,
  PaymentProvider,
  AuthenticatedUser,
  AuthResponse,
  PaginationParams,
  TutorSearchParams,
  PersonSummary,
} from "../shared";

export type {
  UserRole,
  LessonRequestStatus,
  JobPostStatus,
  JobPayType,
  GenderPreference,
  ProposalStatus,
  ContractStatus,
  ContractMilestoneStatus,
  PaymentStatus,
  PaymentProvider,
  AuthenticatedUser,
  AuthResponse,
  PaginationParams,
  TutorSearchParams,
  PersonSummary,
};

export interface TutorProfile {
  id: string;
  userId: string;
  name?: string | null;
  bio?: string | null;
  subjects: string[];
  hourlyRate?: number | null;
  languages: string[];
  location?: string | null;
  rating?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface LessonRequestUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LessonRequest {
  id: string;
  tutorId: string;
  requesterId: string;
  subject: string;
  message: string;
  status: LessonRequestStatus;

  tutorResponseMessage?: string | null;
  tutorResponseFileUrl?: string | null;
  tutorResponseVideoUrl?: string | null;
  respondedAt?: string | null;

  createdAt: string;
  updatedAt: string;
  requester: LessonRequestUser;
}

export interface CreateLessonRequestPayload {
  tutorUserId: string;
  subject: string;
  message: string;
}

export interface JobPost {
  id: string;
  parentId: string;
  title: string;
  description: string;
  subjects: string[];
  location?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  budget?: number | null;

  grade?: number | null;
  sessionMinutes?: number | null;
  daysPerWeek?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  preferredDays?: string[];
  payType?: JobPayType | null;
  hourlyAmount?: number | null;
  monthlyAmount?: number | null;
  fixedAmount?: number | null;
  genderPreference?: GenderPreference | null;
  currency?: string | null;

  status: JobPostStatus;
  publishedAt?: string | null;
  closedAt?: string | null;
  hiredTutorId?: string | null;
  hiredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobPayload {
  status?: JobPostStatus;
  title: string;
  description: string;
  subjects?: string[];
  location?: string;
  locationLat?: number;
  locationLng?: number;
  budget?: number;

  grade?: number;
  sessionMinutes?: number;
  daysPerWeek?: number;
  startTime?: string;
  endTime?: string;
  preferredDays?: string[];
  payType?: JobPayType;
  hourlyAmount?: number;
  monthlyAmount?: number;
  fixedAmount?: number;
  genderPreference?: GenderPreference;
  currency?: string;
}

export interface Proposal {
  id: string;
  jobPostId: string;
  tutorId: string;
  contractId?: string | null;
  message: string;
  fileUrl?: string | null;
  videoUrl?: string | null;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
  jobPost?: {
    id: string;
    title: string;
    status: string;
  };
}

export interface Contract {
  id: string;
  jobPostId: string;
  proposalId: string;
  parentId: string;
  tutorId: string;
  status: ContractStatus;
  amount?: number | null;
  currency?: string;
  createdAt: string;
  updatedAt: string;
  jobPost?: { id: string; title: string; status: string };
  parent?: PersonSummary;
  tutor?: PersonSummary;
}

export interface ContractMilestone {
  id: string;
  contractId: string;
  title: string;
  amount: number;
  currency: string;
  status: ContractMilestoneStatus;
  fundedAt?: string | null;
  releasedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  contractId: string;
  createdByUserId: string;
  amount: number;
  currency: string;
  providerReference?: string | null;
  checkoutUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContractMessage {
  id: string;
  contractId: string;
  senderId: string;
  body: string;
  attachmentUrl?: string | null;
  createdAt: string;
  sender?: PersonSummary;
}

export interface Appointment {
  id: string;
  contractId: string;
  createdByUserId: string;
  title: string;
  notes?: string | null;
  startAt: string;
  endAt: string;
  locationText?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentPayload {
  title: string;
  notes?: string;
  startAt: string;
  endAt: string;
  locationText?: string;
  locationLat?: number;
  locationLng?: number;
}

export interface CreateProposalPayload {
  message: string;
  fileUrl?: string;
  videoUrl?: string;
}

export interface TutorProfileInput {
  bio?: string;
  subjects?: string[];
  hourlyRate?: number;
  languages?: string[];
  location?: string;
}

export interface SearchTutorDocument {
  id: string;
  profileId: string;
  name: string;
  bio?: string | null;
  subjects: string[];
  languages: string[];
  location?: string | null;
  hourlyRate?: number | null;
  rating?: number | null;
  updatedAt: string;
}

export interface TutorSearchResultMeta {
  query: string;
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  cacheHit?: boolean;
  searchEnabled: boolean;
}

export interface TutorSearchResult {
  data: SearchTutorDocument[];
  meta: TutorSearchResultMeta;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}
