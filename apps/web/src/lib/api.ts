import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  TutorProfile,
  TutorProfileInput,
  TutorSearchParams,
  TutorSearchResult,
} from "./types";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
).replace(/\/$/, "");

type ApiOptions = RequestInit & { token?: string };

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown
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
  payload: RegisterPayload
): Promise<AuthResponse> {
  return request<AuthResponse>("/v1/auth/register", {
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

export async function fetchTutorProfile(token: string): Promise<TutorProfile> {
  return request<TutorProfile>("/v1/tutors/me", {
    method: "GET",
    token,
  });
}

export async function upsertTutorProfile(
  token: string,
  payload: TutorProfileInput
): Promise<TutorProfile> {
  return request<TutorProfile>("/v1/tutors/me", {
    method: "PUT",
    body: JSON.stringify(payload),
    token,
  });
}

export async function searchTutors(
  params: TutorSearchParams
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
