import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { verify, sign } from "hono/jwt";
import type { ApiKeyInfo, AppVariables, AuthUser, Bindings } from "../types";

const PBKDF2_ITERATIONS = 100_000;
const JWT_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(digest));
}

export async function generateApiKey(): Promise<{ plain: string; hash: string }> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const plain = `rag_eval_${bytesToHex(bytes)}`;
  return { plain, hash: await sha256Hex(plain) };
}

/**
 * パスワードを PBKDF2-SHA256 でハッシュ化する。
 * 形式: pbkdf2$<iterations>$<salt_hex>$<hash_hex>
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const hashBytes = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${bytesToHex(salt)}$${bytesToHex(hashBytes)}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = parseInt(parts[1] ?? "0", 10);
  const salt = hexToBytes(parts[2] ?? "");
  const expected = hexToBytes(parts[3] ?? "");
  const actual = await pbkdf2(password, salt, iterations);
  return constantTimeEqual(actual, expected);
}

async function pbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    256,
  );
  return new Uint8Array(bits);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

export type JwtPayload = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
};

const JWT_ALG = "HS256" as const;

export async function issueJwt(
  user: { id: string; email: string },
  secret: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    iat: now,
    exp: now + JWT_TTL_SECONDS,
  };
  return sign(payload, secret, JWT_ALG);
}

/**
 * SDK向け: X-API-Key ヘッダーを SHA-256 ハッシュ化して api_keys テーブルと照合。
 */
export const verifyApiKey = createMiddleware<{
  Bindings: Bindings;
  Variables: AppVariables;
}>(async (c, next) => {
  const raw = c.req.header("X-API-Key");
  if (!raw) {
    throw new HTTPException(401, { message: "Missing API key" });
  }

  const keyHash = await sha256Hex(raw);
  const row = await c.env.DB.prepare(
    "SELECT id, user_id, name FROM api_keys WHERE key_hash = ? LIMIT 1",
  )
    .bind(keyHash)
    .first<ApiKeyInfo>();

  if (!row) {
    throw new HTTPException(401, { message: "Invalid API key" });
  }

  c.set("apiKeyInfo", row);
  await next();
});

/**
 * ダッシュボード向け: Authorization: Bearer <jwt> を hono/jwt で検証。
 */
export const verifyJwt = createMiddleware<{
  Bindings: Bindings;
  Variables: AppVariables;
}>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token) {
    throw new HTTPException(401, { message: "Missing bearer token" });
  }

  let payload: JwtPayload;
  try {
    payload = (await verify(token, c.env.JWT_SECRET, JWT_ALG)) as JwtPayload;
  } catch {
    throw new HTTPException(401, { message: "Invalid or expired token" });
  }

  c.set("user", { id: payload.sub, email: payload.email } satisfies AuthUser);
  await next();
});
