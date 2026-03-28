import type { Stats, Evaluation, ApiKeyInfo, CreateKeyResponse } from "./types";
import { createClient } from "./supabase";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "https://rag-eval-api.vercel.app";

/** SDK向けエンドポイント用（X-API-Key） */
function sdkHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
  };
}

/** ダッシュボード向けエンドポイント用（Supabase JWT） */
async function authHeaders(): Promise<Record<string, string>> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("Not authenticated");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
}

export async function fetchStats(
  apiKey: string,
  offset = 0,
  limit = 20
): Promise<Stats> {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
  });
  const res = await fetch(`${API_BASE}/api/stats?${params}`, {
    headers: sdkHeaders(apiKey),
  });
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
  return res.json();
}

export async function fetchEvaluation(
  apiKey: string,
  id: string
): Promise<Evaluation> {
  const res = await fetch(`${API_BASE}/api/evaluations/${id}`, {
    headers: sdkHeaders(apiKey),
  });
  if (!res.ok) throw new Error(`Failed to fetch evaluation: ${res.status}`);
  return res.json();
}

export async function submitFeedback(
  apiKey: string,
  evaluationId: string,
  rating: 1 | -1,
  comment?: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/feedback`, {
    method: "POST",
    headers: sdkHeaders(apiKey),
    body: JSON.stringify({
      evaluation_id: evaluationId,
      rating,
      comment: comment ?? null,
    }),
  });
  if (!res.ok) throw new Error(`Failed to submit feedback: ${res.status}`);
}

export async function createApiKey(name?: string): Promise<CreateKeyResponse> {
  const res = await fetch(`${API_BASE}/api/keys`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ name: name ?? null }),
  });
  if (!res.ok) throw new Error(`Failed to create API key: ${res.status}`);
  return res.json();
}

export async function listApiKeys(): Promise<ApiKeyInfo[]> {
  const res = await fetch(`${API_BASE}/api/keys`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to list API keys: ${res.status}`);
  return res.json();
}

export async function deleteApiKey(keyId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/keys/${keyId}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete API key: ${res.status}`);
}
