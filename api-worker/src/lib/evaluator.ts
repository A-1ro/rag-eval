import type { Bindings } from "../types";
import type { Chunk } from "../schemas";

const EVAL_PROMPT = `以下のRAG回答を3つの観点で0.0〜1.0のスコアで評価してください。
JSONのみを返してください（他のテキスト不要）。

質問: {question}
回答: {answer}
参照チャンク:
{chunks}

評価観点:
- relevance: 質問に対して回答は関連しているか
- faithfulness: 回答はチャンクの内容に基づいているか（幻覚がないか）
- completeness: 回答は質問を十分にカバーしているか

出力形式（JSONのみ）:
{"relevance": 0.0, "faithfulness": 0.0, "completeness": 0.0}
`;

const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

/**
 * Cloudflare Workers AI + Llama 3.3 70B で RAG 回答を自動評価する。
 * ctx.waitUntil() から呼ばれる。失敗してもログだけ残して握りつぶす。
 */
export async function runEvaluation(
  env: Bindings,
  evaluationId: string,
  question: string,
  answer: string,
  chunks: Chunk[],
): Promise<void> {
  try {
    const chunksText =
      chunks.length > 0
        ? chunks.map((c) => `- ${c.content ?? ""}`).join("\n")
        : "(チャンクなし)";

    const prompt = EVAL_PROMPT.replace("{question}", question)
      .replace("{answer}", answer)
      .replace("{chunks}", chunksText);

    const result = await env.AI.run(MODEL, {
      messages: [{ role: "user", content: prompt }],
      temperature: 0.0,
      max_tokens: 100,
    });

    const scores = extractScores(result);
    if (!scores) {
      console.error(
        `Evaluation ${evaluationId}: could not extract scores, shape=`,
        JSON.stringify(result).slice(0, 300),
      );
      return;
    }

    await env.DB.prepare(
      `UPDATE evaluations
         SET auto_score_relevance = ?,
             auto_score_faithfulness = ?,
             auto_score_completeness = ?
       WHERE id = ?`,
    )
      .bind(
        Number(scores.relevance ?? 0),
        Number(scores.faithfulness ?? 0),
        Number(scores.completeness ?? 0),
        evaluationId,
      )
      .run();
  } catch (e) {
    console.error(`Evaluation failed for ${evaluationId}:`, e);
  }
}

type Scores = {
  relevance?: number;
  faithfulness?: number;
  completeness?: number;
};

/**
 * Workers AI のレスポンスから3スコアを抽出する。形は以下のいずれか:
 *   { response: { relevance, faithfulness, completeness } }   ← 自動パース済み
 *   { response: "{...JSON...}" }                              ← 文字列
 *   { response: { content: "..." } }                          ← OpenAI互換
 *   { choices: [{ message: { content: "..." } }] }            ← OpenAI互換
 */
function extractScores(result: unknown): Scores | null {
  if (!result || typeof result !== "object") return null;
  const r = result as Record<string, unknown>;

  // ケース1: response がすでにスコアを持つオブジェクト
  if (r.response && typeof r.response === "object") {
    const inner = r.response as Record<string, unknown>;
    if (
      typeof inner.relevance === "number" ||
      typeof inner.faithfulness === "number" ||
      typeof inner.completeness === "number"
    ) {
      return inner as Scores;
    }
    if (typeof inner.content === "string") return parseJsonScores(inner.content);
    if (typeof inner.response === "string") return parseJsonScores(inner.response);
  }

  // ケース2: response が文字列
  if (typeof r.response === "string") return parseJsonScores(r.response);

  // ケース3: OpenAI互換 (choices[0].message.content)
  if (Array.isArray(r.choices) && r.choices.length > 0) {
    const first = r.choices[0] as Record<string, unknown> | undefined;
    const msg = first?.message as Record<string, unknown> | undefined;
    if (msg && typeof msg.content === "string") return parseJsonScores(msg.content);
  }

  return null;
}

function parseJsonScores(text: string): Scores | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as Scores;
  } catch {
    return null;
  }
}
