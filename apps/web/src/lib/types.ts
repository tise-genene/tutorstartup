export type UserRole = "STUDENT" | "TUTOR" | "AGENCY" | "ADMIN";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isVerified: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}

export interface TutorProfile {
  id: string;
  userId: string;
  bio?: string | null;
  subjects: string[];
  hourlyRate?: number | null;
  languages: string[];
  location?: string | null;
  rating?: number | null;
  createdAt: string;
  updatedAt: string;
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
