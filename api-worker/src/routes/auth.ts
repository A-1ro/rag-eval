import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import type { AppVariables, Bindings } from "../types";
import {
  hashPassword,
  issueJwt,
  verifyJwt,
  verifyPassword,
} from "../lib/auth";
import { LoginRequestSchema, SignupRequestSchema } from "../schemas";

export const authRoute = new Hono<{
  Bindings: Bindings;
  Variables: AppVariables;
}>();

/**
 * メールアドレスとパスワードで新規登録。
 * 重複登録は 409、成功時は JWT を返却。
 */
authRoute.post(
  "/auth/signup",
  zValidator("json", SignupRequestSchema),
  async (c) => {
    const { email, password } = c.req.valid("json");
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await c.env.DB.prepare(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
    )
      .bind(normalizedEmail)
      .first<{ id: string }>();

    if (existing) {
      throw new HTTPException(409, { message: "Email already registered" });
    }

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);

    const result = await c.env.DB.prepare(
      "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)",
    )
      .bind(id, normalizedEmail, passwordHash)
      .run();

    if (!result.success) {
      throw new HTTPException(500, {
        message: `Failed to create user: ${result.error ?? "unknown"}`,
      });
    }

    const token = await issueJwt(
      { id, email: normalizedEmail },
      c.env.JWT_SECRET,
    );
    return c.json({ token, user: { id, email: normalizedEmail } });
  },
);

/**
 * ログイン。失敗時は 401。成功時は JWT を返却。
 */
authRoute.post(
  "/auth/login",
  zValidator("json", LoginRequestSchema),
  async (c) => {
    const { email, password } = c.req.valid("json");
    const normalizedEmail = email.toLowerCase().trim();

    const user = await c.env.DB.prepare(
      "SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1",
    )
      .bind(normalizedEmail)
      .first<{ id: string; email: string; password_hash: string }>();

    const ok = user
      ? await verifyPassword(password, user.password_hash)
      : false;

    if (!user || !ok) {
      throw new HTTPException(401, { message: "Invalid email or password" });
    }

    const token = await issueJwt(
      { id: user.id, email: user.email },
      c.env.JWT_SECRET,
    );
    return c.json({ token, user: { id: user.id, email: user.email } });
  },
);

/**
 * 現在のログインユーザー情報を返す。
 */
authRoute.get("/auth/me", verifyJwt, async (c) => {
  const user = c.get("user");
  return c.json({ user });
});
