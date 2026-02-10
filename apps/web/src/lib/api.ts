import type {
  AuthResponse,
  Contract,
  ContractMilestone,
  ContractMessage,
  Payment,
  CreateJobPayload,
  CreateLessonRequestPayload,
  CreateProposalPayload,
  JobPost,
  LessonRequest,
  LessonRequestStatus,
  LoginPayload,
  Proposal,
  RegisterPayload,
  TutorProfile,
  TutorProfileInput,
  TutorSearchParams,
  TutorSearchResult,
  Appointment,
  CreateAppointmentPayload,
  PaginationParams,
} from "./types";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
).replace(/\/$/, "");

type ApiOptions = RequestInit & { token?: string };

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  const mergedHeaders = new Headers(headers);
  if (!mergedHeaders.has("Content-Type") && rest.body) {
    mergedHeaders.set("Content-Type", "application/json");
  }
  if (token) {
    mergedHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: mergedHeaders,
    credentials: "include",
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      (payload as { message?: string })?.message ?? response.statusText;
    throw new ApiError(message || "Request failed", response.status, payload);
  }

  return payload as T;
}

export async function registerUser(
  payload: RegisterPayload,
): Promise<{ ok: true }> {
  return request<{ ok: true }>("/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  return request<AuthResponse>("/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function refreshSession(): Promise<AuthResponse> {
  return request<AuthResponse>("/v1/auth/refresh", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function logoutSession(): Promise<{ ok: true } | { ok: boolean }> {
  return request<{ ok: true } | { ok: boolean }>("/v1/auth/logout", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function fetchMe(token: string): Promise<AuthResponse["user"]> {
  return request<AuthResponse["user"]>("/v1/auth/me", {
    method: "GET",
    token,
  });
}

export async function updateMe(
  token: string,
  payload: { avatarUrl?: string },
): Promise<AuthResponse["user"]> {
  return request<AuthResponse["user"]>("/v1/users/me", {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export async function forgotPassword(email: string): Promise<{ ok: true }> {
  return request<{ ok: true }>("/v1/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(params: {
  token: string;
  password: string;
}): Promise<{ ok: true }> {
  return request<{ ok: true }>("/v1/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function getGoogleAuthUrl(): string {
  return `${API_BASE_URL}/v1/auth/google`;
}

export async function fetchTutorProfile(token: string): Promise<TutorProfile> {
  return request<TutorProfile>("/v1/tutors/me", {
    method: "GET",
    token,
  });
}

export async function upsertTutorProfile(
  token: string,
  payload: TutorProfileInput,
): Promise<TutorProfile> {
  return request<TutorProfile>("/v1/tutors/me", {
    method: "PUT",
    body: JSON.stringify(payload),
    token,
  });
}

export async function fetchTutorByUserId(
  userId: string,
): Promise<TutorProfile> {
  return request<TutorProfile>(`/v1/tutors/${userId}`, {
    method: "GET",
  });
}

export async function searchTutors(
  params: TutorSearchParams,
): Promise<TutorSearchResult> {
  const query = new URLSearchParams();
  if (params.query) {
    query.set("q", params.query);
  }
  if (params.location) {
    query.set("location", params.location);
  }
  if (params.limit) {
    query.set("limit", String(params.limit));
  }
  if (params.page) {
    query.set("page", String(params.page));
  }
  (params.subjects ?? []).forEach((subject) => {
    if (subject.trim().length > 0) {
      query.append("subjects", subject.trim());
    }
  });

  return request<TutorSearchResult>(`/v1/tutors/search?${query.toString()}`);
}

export async function createLessonRequest(
  token: string,
  payload: CreateLessonRequestPayload,
): Promise<LessonRequest> {
  return request<LessonRequest>("/v1/lesson-requests", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function fetchLessonRequestInbox(
  token: string,
  params?: PaginationParams,
): Promise<LessonRequest[]> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  return request<LessonRequest[]>(
    `/v1/lesson-requests/inbox?${query.toString()}`,
    {
      method: "GET",
      token,
    },
  );
}

export async function updateLessonRequestStatus(
  token: string,
  id: string,
  status: LessonRequestStatus,
  payload?: {
    tutorResponseMessage?: string;
    tutorResponseFileUrl?: string;
    tutorResponseVideoUrl?: string;
  },
): Promise<LessonRequest> {
  return request<LessonRequest>(`/v1/lesson-requests/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ status, ...(payload ?? {}) }),
  });
}

export async function fetchPendingLessonRequestCount(
  token: string,
): Promise<{ pending: number }> {
  return request<{ pending: number }>("/v1/lesson-requests/inbox/count", {
    method: "GET",
    token,
  });
}

export async function createJob(
  token: string,
  payload: CreateJobPayload,
): Promise<JobPost> {
  return request<JobPost>("/v1/jobs", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function publishJob(token: string, id: string): Promise<JobPost> {
  return request<JobPost>(`/v1/jobs/${id}/publish`, {
    method: "POST",
    token,
    body: JSON.stringify({}),
  });
}

export async function updateJob(
  token: string,
  id: string,
  payload: Partial<CreateJobPayload>,
): Promise<JobPost> {
  return request<JobPost>(`/v1/jobs/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export async function fetchOpenJobs(
  token: string,
  params?: PaginationParams,
): Promise<JobPost[]> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  return request<JobPost[]>(`/v1/jobs/open?${query.toString()}`, {
    method: "GET",
    token,
  });
}

export async function fetchMyJobs(
  token: string,
  params?: PaginationParams,
): Promise<JobPost[]> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  return request<JobPost[]>(`/v1/jobs/mine?${query.toString()}`, {
    method: "GET",
    token,
  });
}

export async function fetchJobById(
  token: string,
  id: string,
): Promise<JobPost> {
  return request<JobPost>(`/v1/jobs/${id}`, {
    method: "GET",
    token,
  });
}

export async function submitProposal(
  token: string,
  jobId: string,
  payload: CreateProposalPayload,
): Promise<Proposal> {
  return request<Proposal>(`/v1/jobs/${jobId}/proposals`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function fetchJobProposals(
  token: string,
  jobId: string,
  params?: PaginationParams,
): Promise<
  (Proposal & {
    tutor?: { id: string; name: string; email: string; role: string };
  })[]
> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  return request<
    (Proposal & {
      tutor?: { id: string; name: string; email: string; role: string };
    })[]
  >(`/v1/jobs/${jobId}/proposals?${query.toString()}`, {
    method: "GET",
    token,
  });
}

export async function fetchMyProposals(
  token: string,
  params?: PaginationParams,
): Promise<Proposal[]> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  return request<Proposal[]>(`/v1/proposals/mine?${query.toString()}`, {
    method: "GET",
    token,
  });
}

export async function withdrawProposal(
  token: string,
  proposalId: string,
): Promise<Proposal> {
  return request<Proposal>(`/v1/proposals/${proposalId}/withdraw`, {
    method: "POST",
    token,
    body: JSON.stringify({}),
  });
}

export async function declineProposal(
  token: string,
  proposalId: string,
): Promise<Proposal> {
  return request<Proposal>(`/v1/proposals/${proposalId}/decline`, {
    method: "POST",
    token,
    body: JSON.stringify({}),
  });
}

export async function acceptProposal(
  token: string,
  proposalId: string,
): Promise<Contract> {
  return request<Contract>(`/v1/proposals/${proposalId}/accept`, {
    method: "POST",
    token,
    body: JSON.stringify({}),
  });
}

export async function closeJob(token: string, jobId: string): Promise<JobPost> {
  return request<JobPost>(`/v1/jobs/${jobId}/close`, {
    method: "POST",
    token,
    body: JSON.stringify({}),
  });
}

export async function fetchMyContracts(
  token: string,
  params?: PaginationParams,
): Promise<Contract[]> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  return request<Contract[]>(`/v1/contracts/mine?${query.toString()}`, {
    method: "GET",
    token,
  });
}

export async function fetchContractById(
  token: string,
  id: string,
): Promise<Contract> {
  return request<Contract>(`/v1/contracts/${id}`, {
    method: "GET",
    token,
  });
}

export async function fetchContractMessages(
  token: string,
  contractId: string,
  params?: PaginationParams,
): Promise<ContractMessage[]> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  return request<ContractMessage[]>(
    `/v1/contracts/${contractId}/messages?${query.toString()}`,
    {
      method: "GET",
      token,
    },
  );
}

export async function fetchContractAppointments(
  token: string,
  contractId: string,
  params?: PaginationParams,
): Promise<Appointment[]> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  return request<Appointment[]>(
    `/v1/contracts/${contractId}/appointments?${query.toString()}`,
    {
      method: "GET",
      token,
    },
  );
}

export async function createContractAppointment(
  token: string,
  contractId: string,
  payload: CreateAppointmentPayload,
): Promise<Appointment> {
  return request<Appointment>(`/v1/contracts/${contractId}/appointments`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function cancelContractAppointment(
  token: string,
  contractId: string,
  appointmentId: string,
): Promise<Appointment> {
  return request<Appointment>(
    `/v1/contracts/${contractId}/appointments/${appointmentId}/cancel`,
    {
      method: "POST",
      token,
      body: JSON.stringify({}),
    },
  );
}

export async function sendContractMessage(
  token: string,
  contractId: string,
  payload: { body: string; attachmentUrl?: string },
): Promise<ContractMessage> {
  return request<ContractMessage>(`/v1/contracts/${contractId}/messages`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function createContractPaymentIntent(
  token: string,
  contractId: string,
  payload?: { amount?: number; currency?: string },
): Promise<{
  paymentId: string;
  providerReference?: string | null;
  status: string;
  checkoutUrl: string;
}> {
  return request(`/v1/contracts/${contractId}/payments/intent`, {
    method: "POST",
    token,
    body: JSON.stringify(payload ?? {}),
  });
}

export async function fetchContractPayments(
  token: string,
  contractId: string,
  params?: PaginationParams,
): Promise<Payment[]> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  return request<Payment[]>(
    `/v1/contracts/${contractId}/payments?${query.toString()}`,
    {
      method: "GET",
      token,
    },
  );
}

export async function fetchContractMilestones(
  token: string,
  contractId: string,
  params?: PaginationParams,
): Promise<ContractMilestone[]> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  return request<ContractMilestone[]>(
    `/v1/contracts/${contractId}/milestones?${query.toString()}`,
    {
      method: "GET",
      token,
    },
  );
}

export async function createContractMilestone(
  token: string,
  contractId: string,
  payload: { title: string; amount: number; currency?: string },
): Promise<ContractMilestone> {
  return request<ContractMilestone>(`/v1/contracts/${contractId}/milestones`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function createMilestonePaymentIntent(
  token: string,
  contractId: string,
  milestoneId: string,
): Promise<{
  paymentId: string;
  providerReference?: string | null;
  status: string;
  checkoutUrl: string;
}> {
  return request(
    `/v1/contracts/${contractId}/milestones/${milestoneId}/payments/intent`,
    {
      method: "POST",
      token,
      body: JSON.stringify({}),
    },
  );
}

export async function releaseContractMilestone(
  token: string,
  contractId: string,
  milestoneId: string,
): Promise<ContractMilestone> {
  return request<ContractMilestone>(
    `/v1/contracts/${contractId}/milestones/${milestoneId}/release`,
    {
      method: "POST",
      token,
      body: JSON.stringify({}),
    },
  );
}

export async function payoutContractMilestone(
  token: string,
  contractId: string,
  milestoneId: string,
): Promise<unknown> {
  return request(
    `/v1/contracts/${contractId}/milestones/${milestoneId}/payout`,
    {
      method: "POST",
      token,
      body: JSON.stringify({}),
    },
  );
}
