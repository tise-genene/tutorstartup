export type UserRole = "STUDENT" | "PARENT" | "TUTOR" | "AGENCY" | "ADMIN";

export type LessonRequestStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isVerified: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthenticatedUser;
}

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

export type JobPostStatus = "OPEN" | "CLOSED";

export interface JobPost {
  id: string;
  parentId: string;
  title: string;
  description: string;
  subjects: string[];
  location?: string | null;
  budget?: number | null;
  status: JobPostStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobPayload {
  title: string;
  description: string;
  subjects?: string[];
  location?: string;
  budget?: number;
}

export type ProposalStatus =
  | "SUBMITTED"
  | "WITHDRAWN"
  | "ACCEPTED"
  | "DECLINED";

export interface Proposal {
  id: string;
  jobPostId: string;
  tutorId: string;
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

export interface TutorSearchParams {
  query?: string;
  subjects?: string[];
  location?: string;
  limit?: number;
  page?: number;
}
