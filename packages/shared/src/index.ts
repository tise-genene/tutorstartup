// Shared enums
export type UserRole = "STUDENT" | "PARENT" | "TUTOR" | "AGENCY" | "ADMIN";
export type LessonRequestStatus = "PENDING" | "ACCEPTED" | "DECLINED";
export type JobPostStatus = "DRAFT" | "OPEN" | "CLOSED";
export type JobPayType = "HOURLY" | "MONTHLY" | "FIXED";
export type GenderPreference = "ANY" | "MALE" | "FEMALE";
export type ProposalStatus = "SUBMITTED" | "WITHDRAWN" | "ACCEPTED" | "DECLINED";
export type ContractStatus = "PENDING_PAYMENT" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type ContractMilestoneStatus = "DRAFT" | "FUNDED" | "RELEASED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED";
export type PaymentProvider = "CHAPA" | "TELEBIRR";

// Common Interfaces
export interface AuthenticatedUser {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    isVerified: boolean;
    avatarUrl?: string | null;
}

export interface AuthResponse {
    accessToken: string;
    user: AuthenticatedUser;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
}

export interface TutorSearchParams extends PaginationParams {
    query?: string;
    subjects?: string[];
    location?: string;
}

export interface PersonSummary {
    id: string;
    name: string;
    role: string;
}
