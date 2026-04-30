import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import type { AppVariables, Bindings } from "../types";
import { verifyJwt } from "../lib/auth";
import { FeedbackRequestSchema } from "../schemas";

export const feedbackRoute = new Hono<{
  Bindings: Bindings;
  Variables: AppVariables;
}>();

feedbackRoute.post(
  "/feedback",
  verifyJwt,
  zValidator("json", FeedbackRequestSchema),
  async (c) => {
    const body = c.req.valid("json");
    const user = c.get("user");

    // evaluation がログインユーザーのキーに紐づいているか確認
    const owner = await c.env.DB.prepare(
      `SELECT e.id FROM evaluations e
         JOIN api_keys k ON e.api_key_id = k.id
        WHERE e.id = ? AND k.user_id = ?
        LIMIT 1`,
    )
      .bind(body.evaluation_id, user.id)
      .first<{ id: string }>();

    if (!owner) {
      throw new HTTPException(404, { message: "Evaluation not found" });
    }

    const id = crypto.randomUUID();
    const result = await c.env.DB.prepare(
      `INSERT INTO feedbacks (id, evaluation_id, rating, comment)
       VALUES (?, ?, ?, ?)`,
    )
      .bind(id, body.evaluation_id, body.rating, body.comment ?? null)
      .run();

    if (!result.success) {
      throw new HTTPException(500, {
        message: `Failed to insert feedback: ${result.error ?? "unknown"}`,
      });
    }

    return c.json({ id, status: "ok" });
  },
);
