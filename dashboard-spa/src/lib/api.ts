import type {
  ApiKeyInfo,
  AuthResponse,
  AuthUser,
  CreateKeyResponse,
  Stats,
} from "./types";

const TOKEN_KEY = "rag_eval_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { ...init, headers });
  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      // ignore
    }
    if (res.status === 401) clearToken();
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function signup(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchMe(): Promise<{ user: AuthUser }> {
  return request<{ user: AuthUser }>("/api/auth/me");
}

export async function fetchStats(
  keyId: string,
  offset = 0,
  limit = 20,
): Promise<Stats> {
  const params = new URLSearchParams({
    key_id: keyId,
    offset: String(offset),
    limit: String(limit),
  });
  return request<Stats>(`/api/stats?${params}`);
}

export async function submitFeedback(
  evaluationId: string,
  rating: 1 | -1,
  comment?: string,
): Promise<void> {
  await request<{ id: string; status: string }>("/api/feedback", {
    method: "POST",
    body: JSON.stringify({
      evaluation_id: evaluationId,
      rating,
      comment: comment ?? null,
    }),
  });
}

export async function createApiKey(name?: string): Promise<CreateKeyResponse> {
  return request<CreateKeyResponse>("/api/keys", {
    method: "POST",
    body: JSON.stringify({ name: name ?? null }),
  });
}

export async function listApiKeys(): Promise<ApiKeyInfo[]> {
  return request<ApiKeyInfo[]>("/api/keys");
}

export async function deleteApiKey(keyId: string): Promise<void> {
  await request<{ status: string }>(`/api/keys/${keyId}`, { method: "DELETE" });
}
