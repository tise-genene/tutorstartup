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

// ==================== MESSAGING SYSTEM TYPES ====================

export type ConversationStatus = 'ACTIVE' | 'ARCHIVED' | 'BLOCKED';

export interface Conversation {
  id: string;
  jobPostId?: string | null;
  proposalId?: string | null;
  parentId: string;
  tutorId: string;
  status: ConversationStatus;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  parent?: PersonSummary;
  tutor?: PersonSummary;
  jobPost?: {
    id: string;
    title: string;
    status: string;
  };
  proposal?: {
    id: string;
    status: string;
  };
  lastMessage?: Message;
  unreadCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  sender?: PersonSummary;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  lastReadAt?: string | null;
  unreadCount: number;
  isMuted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConversationPayload {
  tutorId: string;
  jobPostId?: string;
  proposalId?: string;
  initialMessage: string;
}

export interface SendMessagePayload {
  conversationId: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

export interface MessagePreview {
  id: string;
  conversationId: string;
  content: string;
  senderId: string;
  createdAt: string;
  senderName: string;
}

export interface ConversationWithDetails extends Conversation {
  messages: Message[];
  participants: ConversationParticipant[];
  otherUser: PersonSummary;
}

// ==================== INTERVIEW SCHEDULING TYPES ====================

export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULED';
export type MeetingProvider = 'zoom' | 'google_meet' | 'teams' | 'manual';

export interface Interview {
  id: string;
  proposalId: string;
  jobPostId: string;
  parentId: string;
  tutorId: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink?: string | null;
  meetingProvider: MeetingProvider;
  status: InterviewStatus;
  notes?: string | null;
  clientNotes?: string | null;
  tutorNotes?: string | null;
  rating?: number | null;
  feedback?: string | null;
  reminderSentAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  parent?: PersonSummary;
  tutor?: PersonSummary;
  proposal?: Proposal;
  jobPost?: JobPost;
}

export interface CreateInterviewPayload {
  proposalId: string;
  jobPostId: string;
  tutorId: string;
  scheduledAt: string;
  durationMinutes?: number;
  meetingLink?: string;
  meetingProvider?: MeetingProvider;
  notes?: string;
}

export interface UpdateInterviewPayload {
  scheduledAt?: string;
  durationMinutes?: number;
  meetingLink?: string;
  meetingProvider?: MeetingProvider;
  status?: InterviewStatus;
  notes?: string;
  clientNotes?: string;
  tutorNotes?: string;
  rating?: number;
  feedback?: string;
}

export interface TutorAvailability {
  id: string;
  tutorId: string;
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isRecurring: boolean;
  specificDate?: string | null;
  timezone: string;
  isBlocked: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableTimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface CreateAvailabilityPayload {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
  specificDate?: string;
  timezone?: string;
  notes?: string;
}

export interface ScheduledSession {
  id: string;
  contractId: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink?: string | null;
  locationText?: string | null;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string | null;
  parentAttended?: boolean | null;
  tutorAttended?: boolean | null;
  createdAt: string;
  updatedAt: string;
}

// ==================== ENHANCED PROPOSAL TYPES ====================

// Extended proposal with interview info
export interface ProposalWithInterview extends Proposal {
  tutor?: PersonSummary;
  interview?: Interview | null;
  interviewCount?: number;
}

// ==================== EMAIL NOTIFICATION TYPES ====================

export type NotificationType = 
  | 'NEW_MESSAGE'
  | 'NEW_PROPOSAL'
  | 'PROPOSAL_ACCEPTED'
  | 'PROPOSAL_DECLINED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEW_REMINDER_24H'
  | 'INTERVIEW_REMINDER_1H'
  | 'INTERVIEW_CANCELLED'
  | 'INTERVIEW_RESCHEDULED'
  | 'CONTRACT_CREATED'
  | 'SESSION_REMINDER'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_SENT'
  | 'NEW_LESSON_REQUEST'
  | 'LESSON_REQUEST_ACCEPTED'
  | 'LESSON_REQUEST_DECLINED'
  | 'WELCOME'
  | 'PASSWORD_RESET';

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED' | 'OPENED';

export interface EmailNotification {
  id: string;
  userId: string;
  type: NotificationType;
  subject: string;
  bodyHtml?: string | null;
  bodyText?: string | null;
  recipientEmail: string;
  status: NotificationStatus;
  metadata: Record<string, any>;
  sentAt?: string | null;
  deliveredAt?: string | null;
  openedAt?: string | null;
  errorMessage?: string | null;
  retryCount: number;
  scheduledFor?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  newMessageEmail: boolean;
  newProposalEmail: boolean;
  proposalAcceptedEmail: boolean;
  proposalDeclinedEmail: boolean;
  interviewScheduledEmail: boolean;
  interviewReminderEmail: boolean;
  interviewCancelledEmail: boolean;
  contractCreatedEmail: boolean;
  paymentReceivedEmail: boolean;
  lessonRequestEmail: boolean;
  marketingEmail: boolean;
  digestEmail: boolean;
  digestFrequency: 'daily' | 'weekly' | 'never';
  createdAt: string;
  updatedAt: string;
}

export interface UpdateNotificationPreferencesPayload {
  newMessageEmail?: boolean;
  newProposalEmail?: boolean;
  proposalAcceptedEmail?: boolean;
  proposalDeclinedEmail?: boolean;
  interviewScheduledEmail?: boolean;
  interviewReminderEmail?: boolean;
  interviewCancelledEmail?: boolean;
  contractCreatedEmail?: boolean;
  paymentReceivedEmail?: boolean;
  lessonRequestEmail?: boolean;
  marketingEmail?: boolean;
  digestEmail?: boolean;
  digestFrequency?: 'daily' | 'weekly' | 'never';
}

// ==================== REVIEWS & RATINGS TYPES ====================

export type ReviewStatus = 'PENDING' | 'SUBMITTED' | 'EDITED' | 'HIDDEN';

export interface Review {
  id: string;
  contractId: string;
  jobPostId: string;
  reviewerId: string;
  revieweeId: string;
  
  // Ratings (1-5 stars)
  overallRating: number;
  professionalismRating?: number | null;
  communicationRating?: number | null;
  punctualityRating?: number | null;
  expertiseRating?: number | null;
  
  // Review content
  title?: string | null;
  content: string;
  wouldRecommend?: boolean | null;
  
  // Metadata
  status: ReviewStatus;
  isPublic: boolean;
  helpfulCount: number;
  reportedCount: number;
  
  // Response from reviewee
  responseContent?: string | null;
  respondedAt?: string | null;
  
  createdAt: string;
  updatedAt: string;
  
  // Joined fields
  reviewer?: PersonSummary;
  reviewee?: PersonSummary;
  contract?: {
    id: string;
    jobPost?: {
      id: string;
      title: string;
    };
  };
}

export interface CreateReviewPayload {
  contractId: string;
  jobPostId: string;
  revieweeId: string;
  overallRating: number;
  professionalismRating?: number;
  communicationRating?: number;
  punctualityRating?: number;
  expertiseRating?: number;
  title?: string;
  content: string;
  wouldRecommend?: boolean;
}

export interface UpdateReviewPayload {
  overallRating?: number;
  professionalismRating?: number;
  communicationRating?: number;
  punctualityRating?: number;
  expertiseRating?: number;
  title?: string;
  content?: string;
  wouldRecommend?: boolean;
}

export interface ReviewVote {
  id: string;
  reviewId: string;
  userId: string;
  isHelpful: boolean;
  createdAt: string;
}

export interface TutorReviewStats {
  tutorId: string;
  totalReviews: number;
  averageRating: number;
  averageProfessionalism: number;
  averageCommunication: number;
  averagePunctuality: number;
  averageExpertise: number;
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
  wouldRecommendCount: number;
  wouldRecommendPercentage: number;
  updatedAt: string;
}

export interface ReviewBreakdown {
  fiveStar: number;
  fourStar: number;
  threeStar: number;
  twoStar: number;
  oneStar: number;
}
