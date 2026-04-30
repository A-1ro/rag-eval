import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import type { AppVariables, Bindings } from "../types";
import { generateApiKey, verifyJwt } from "../lib/auth";
import { CreateKeyRequestSchema } from "../schemas";

export const keysRoute = new Hono<{
  Bindings: Bindings;
  Variables: AppVariables;
}>();

/**
 * 新しいAPIキーを発行する。
 * 平文キーはこのレスポンスでのみ返却し、DB には SHA-256 ハッシュのみ保存。
 */
keysRoute.post(
  "/keys",
  verifyJwt,
  zValidator("json", CreateKeyRequestSchema),
  async (c) => {
    const { name } = c.req.valid("json");
    const user = c.get("user");

    const { plain, hash } = await generateApiKey();
    const id = crypto.randomUUID();

    const result = await c.env.DB.prepare(
      `INSERT INTO api_keys (id, user_id, key_hash, name)
       VALUES (?, ?, ?, ?)`,
    )
      .bind(id, user.id, hash, name ?? null)
      .run();

    if (!result.success) {
      throw new HTTPException(500, {
        message: `Failed to create API key: ${result.error ?? "unknown"}`,
      });
    }

    return c.json({ id, key: plain, name: name ?? null });
  },
);

keysRoute.get("/keys", verifyJwt, async (c) => {
  const user = c.get("user");
  const result = await c.env.DB.prepare(
    "SELECT id, name, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC",
  )
    .bind(user.id)
    .all<{ id: string; name: string | null; created_at: string }>();

  return c.json(result.results ?? []);
});

keysRoute.delete("/keys/:key_id", verifyJwt, async (c) => {
  const keyId = c.req.param("key_id");
  const user = c.get("user");

  const existing = await c.env.DB.prepare(
    "SELECT id FROM api_keys WHERE id = ? AND user_id = ? LIMIT 1",
  )
    .bind(keyId, user.id)
    .first<{ id: string }>();

  if (!existing) {
    throw new HTTPException(404, { message: "API key not found" });
  }

  await c.env.DB.prepare("DELETE FROM api_keys WHERE id = ?")
    .bind(keyId)
    .run();
  return c.json({ status: "deleted" });
});
