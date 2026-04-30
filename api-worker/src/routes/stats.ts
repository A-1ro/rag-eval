import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import type { AppVariables, Bindings } from "../types";
import { verifyJwt } from "../lib/auth";
import { StatsQuerySchema } from "../schemas";

type RecentRow = {
  id: string;
  question: string;
  answer: string;
  chunks: string; // JSON string
  latency_ms: number | null;
  auto_score_relevance: number | null;
  auto_score_faithfulness: number | null;
  auto_score_completeness: number | null;
  created_at: string;
};

export const statsRoute = new Hono<{
  Bindings: Bindings;
  Variables: AppVariables;
}>();

statsRoute.get(
  "/stats",
  verifyJwt,
  zValidator("query", StatsQuerySchema),
  async (c) => {
    const { key_id, offset, limit } = c.req.valid("query");
    const user = c.get("user");
    const db = c.env.DB;

    // key_id がログインユーザーのものか確認
    const keyCheck = await db
      .prepare(
        "SELECT id FROM api_keys WHERE id = ? AND user_id = ? LIMIT 1",
      )
      .bind(key_id, user.id)
      .first<{ id: string }>();

    if (!keyCheck) {
      throw new HTTPException(404, { message: "API key not found" });
    }

    // 件数 + 平均スコア (1クエリで集計)
    const agg = await db
      .prepare(
        `SELECT
           COUNT(*) AS total,
           AVG(auto_score_relevance) AS avg_relevance,
           AVG(auto_score_faithfulness) AS avg_faithfulness,
           AVG(auto_score_completeness) AS avg_completeness
         FROM evaluations
         WHERE api_key_id = ?`,
      )
      .bind(key_id)
      .first<{
        total: number;
        avg_relevance: number | null;
        avg_faithfulness: number | null;
        avg_completeness: number | null;
      }>();

    // フィードバック率
    const fb = await db
      .prepare(
        `SELECT
           COUNT(*) AS total,
           SUM(CASE WHEN f.rating = 1 THEN 1 ELSE 0 END) AS positive
         FROM feedbacks f
         JOIN evaluations e ON f.evaluation_id = e.id
         WHERE e.api_key_id = ?`,
      )
      .bind(key_id)
      .first<{ total: number; positive: number | null }>();

    const positive_feedback_rate =
      fb && fb.total > 0 ? (fb.positive ?? 0) / fb.total : null;

    // 最近の評価
    const recentResult = await db
      .prepare(
        `SELECT id, question, answer, chunks, latency_ms,
                auto_score_relevance, auto_score_faithfulness, auto_score_completeness,
                created_at
         FROM evaluations
         WHERE api_key_id = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
      )
      .bind(key_id, limit, offset)
      .all<RecentRow>();

    const recent = (recentResult.results ?? []).map((r) => ({
      ...r,
      chunks: safeParseJson(r.chunks),
    }));

    return c.json({
      total: agg?.total ?? 0,
      avg_relevance: agg?.avg_relevance ?? null,
      avg_faithfulness: agg?.avg_faithfulness ?? null,
      avg_completeness: agg?.avg_completeness ?? null,
      positive_feedback_rate,
      recent,
    });
  },
);

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}
