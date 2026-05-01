import { track } from "./client.js";
import type { Chunk } from "./types.js";

export interface TrackAutoRAGOptions {
  /** APIキー（未指定の場合は RAG_EVAL_API_KEY 環境変数を使用） */
  apiKey?: string;
  /** APIのURL（未指定の場合はデフォルトのSaaS URLを使用） */
  apiUrl?: string;
  /** Workers の ExecutionContext。渡すと waitUntil() でノンブロッキング送信になる */
  ctx?: { waitUntil(promise: Promise<unknown>): void };
}

interface AutoRagAiSearchInput {
  query: string;
  [key: string]: unknown;
}

interface LegacyDataItem {
  filename?: string;
  content?: Array<{ type?: string; text?: string }>;
}

interface NewChunkItem {
  text?: string;
  item?: { key?: string };
  filename?: string;
}

interface AutoRagAiSearchResult {
  // レガシー(env.AI.autorag().aiSearch()): { response, data: [{filename, content:[{text}]}] }
  response?: string;
  data?: LegacyDataItem[];
  // 新形式(AI Search binding): { chunks: [{text, item:{key}}] } or chatCompletions系
  chunks?: NewChunkItem[];
  choices?: Array<{ message?: { content?: string } }>;
  [key: string]: unknown;
}

function extractAnswer(result: AutoRagAiSearchResult): string {
  return (
    result.response ??
    result.choices?.[0]?.message?.content ??
    ""
  );
}

function toChunks(result: AutoRagAiSearchResult): Chunk[] {
  // 新形式: { chunks: [{ text, item: { key } }] }
  if (Array.isArray(result.chunks)) {
    return result.chunks.map((c) => ({
      content: c.text ?? "",
      source: c.item?.key ?? c.filename,
    }));
  }
  // レガシー: { data: [{ filename, content: [{ text }] }] }
  return (result.data ?? []).map((d) => ({
    content: (d.content ?? [])
      .map((c) => c.text ?? "")
      .filter((t) => t.length > 0)
      .join("\n"),
    source: d.filename,
  }));
}

/**
 * Cloudflare AutoRAG (env.AI.autorag(...)) をラップして、aiSearch() の結果を
 * 自動的に rag-eval に送信するProxyを返す。
 *
 * 既存コードの env.AI.autorag("my-rag") を trackAutoRAG(env.AI.autorag("my-rag"), {...})
 * に差し替えるだけで動く。aiSearch 以外のメソッド・プロパティは透過する。
 *
 * @example
 * ```ts
 * const rag = trackAutoRAG(env.AI.autorag("my-rag"), {
 *   apiKey: env.RAG_EVAL_API_KEY,
 *   ctx,
 * });
 * const { response } = await rag.aiSearch({ query: "..." });
 * ```
 */
export function trackAutoRAG<T extends object>(
  rag: T,
  options: TrackAutoRAGOptions,
): T {
  return new Proxy(rag, {
    get(target, prop, receiver) {
      if (prop === "aiSearch") {
        return async function (input: AutoRagAiSearchInput) {
          const original = (target as Record<string, unknown>)["aiSearch"] as (
            input: AutoRagAiSearchInput,
          ) => Promise<AutoRagAiSearchResult>;
          const start = Date.now();
          const result = await original.call(target, input);
          const latencyMs = Date.now() - start;

          const promise = track({
            question: input.query,
            answer: extractAnswer(result ?? {}),
            chunks: toChunks(result ?? {}),
            latencyMs,
            apiKey: options.apiKey,
            apiUrl: options.apiUrl,
          });

          if (options.ctx) {
            options.ctx.waitUntil(promise);
          } else {
            promise.catch(() => {});
          }

          return result;
        };
      }

      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}
