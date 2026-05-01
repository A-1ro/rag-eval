import type { TrackOptions, TrackPayload } from "./types.js";

const DEFAULT_API_URL = "https://rag-eval.a-1ro.dev";

function resolveConfig(options: TrackOptions): {
  url: string;
  key: string | undefined;
  payload: TrackPayload;
} {
  const url = (
    options.apiUrl ??
    (typeof process !== "undefined" ? process.env["RAG_EVAL_API_URL"] : undefined) ??
    DEFAULT_API_URL
  ).replace(/\/$/, "");

  const key =
    options.apiKey ??
    (typeof process !== "undefined" ? process.env["RAG_EVAL_API_KEY"] : undefined);

  const payload: TrackPayload = {
    question: options.question,
    answer: options.answer,
    chunks: options.chunks ?? [],
    latency_ms: options.latencyMs,
  };

  return { url, key, payload };
}

/**
 * RAGの質問・回答・チャンクをCollector APIに送信する。
 *
 * 失敗してもRAG本体を止めない（例外を握りつぶす）。
 *
 * @returns evaluation_id（成功時）または null（失敗時）
 */
export function track(options: TrackOptions): Promise<string | null> {
  const { url, key, payload } = resolveConfig(options);

  if (!key) return Promise.resolve(null);

  const endpoint = `${url}/api/track`;
  return fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": key,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5000),
  })
    .then(async (res) => {
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error(
          `[rag-eval] POST ${endpoint} failed: ${res.status} ${res.statusText}${body ? ` - ${body}` : ""}`,
        );
        return null;
      }
      return res.json() as Promise<{ id?: string }>;
    })
    .then((data) => data?.id ?? null)
    .catch((err) => {
      console.error(`[rag-eval] POST ${endpoint} error:`, err);
      return null;
    });
}

/**
 * track() の async/await 版。戻り値・挙動は同じ。
 *
 * @returns evaluation_id（成功時）または null（失敗時）
 */
export async function atrack(options: TrackOptions): Promise<string | null> {
  return track(options);
}
