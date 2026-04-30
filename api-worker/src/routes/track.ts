import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import type { AppVariables, Bindings } from "../types";
import { verifyApiKey } from "../lib/auth";
import { runEvaluation } from "../lib/evaluator";
import { TrackRequestSchema } from "../schemas";

export const trackRoute = new Hono<{
  Bindings: Bindings;
  Variables: AppVariables;
}>();

trackRoute.post(
  "/track",
  verifyApiKey,
  zValidator("json", TrackRequestSchema),
  async (c) => {
    const body = c.req.valid("json");
    const apiKeyInfo = c.get("apiKeyInfo");

    const evaluationId = crypto.randomUUID();
    const chunks = body.chunks ?? [];

    const result = await c.env.DB.prepare(
      `INSERT INTO evaluations
         (id, api_key_id, question, answer, chunks, latency_ms)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        evaluationId,
        apiKeyInfo.id,
        body.question,
        body.answer,
        JSON.stringify(chunks),
        body.latency_ms ?? null,
      )
      .run();

    if (!result.success) {
      throw new HTTPException(500, {
        message: `Failed to insert evaluation: ${result.error ?? "unknown"}`,
      });
    }

    // Workers AI評価はバックグラウンドで実行
    c.executionCtx.waitUntil(
      runEvaluation(c.env, evaluationId, body.question, body.answer, chunks),
    );

    return c.json({ id: evaluationId, status: "ok" });
  },
);
