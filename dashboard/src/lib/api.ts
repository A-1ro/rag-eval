import type { Stats, Evaluation, ApiKeyInfo, CreateKeyResponse } from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "https://rag-eval-api.vercel.app";

function headers(apiKey: string) {
  return {
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
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
    headers: headers(apiKey),
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
  return res.json();
}

export async function fetchEvaluation(
  apiKey: string,
  id: string
): Promise<Evaluation> {
  const res = await fetch(`${API_BASE}/api/evaluations/${id}`, {
    headers: headers(apiKey),
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
    headers: headers(apiKey),
    body: JSON.stringify({
      evaluation_id: evaluationId,
      rating,
      comment: comment ?? null,
    }),
  });
  if (!res.ok) throw new Error(`Failed to submit feedback: ${res.status}`);
}

export async function createApiKey(
  name?: string
): Promise<CreateKeyResponse> {
  const res = await fetch(`${API_BASE}/api/keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name ?? null }),
  });
  if (!res.ok) throw new Error(`Failed to create API key: ${res.status}`);
  return res.json();
}

export async function listApiKeys(apiKey: string): Promise<ApiKeyInfo[]> {
  const res = await fetch(`${API_BASE}/api/keys`, {
    headers: headers(apiKey),
  });
  if (!res.ok) throw new Error(`Failed to list API keys: ${res.status}`);
  return res.json();
}

export async function deleteApiKey(
  apiKey: string,
  keyId: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/keys/${keyId}`, {
    method: "DELETE",
    headers: headers(apiKey),
  });
  if (!res.ok) throw new Error(`Failed to delete API key: ${res.status}`);
}
