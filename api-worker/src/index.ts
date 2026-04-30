import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import type { AppVariables, Bindings } from "./types";
import { authRoute } from "./routes/auth";
import { trackRoute } from "./routes/track";
import { feedbackRoute } from "./routes/feedback";
import { statsRoute } from "./routes/stats";
import { keysRoute } from "./routes/keys";

const app = new Hono<{ Bindings: Bindings; Variables: AppVariables }>();

app.use(
  "*",
  cors({
    origin: "*", // 本番はダッシュボードのドメインに絞る
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  }),
);

app.route("/api", authRoute);
app.route("/api", trackRoute);
app.route("/api", feedbackRoute);
app.route("/api", statsRoute);
app.route("/api", keysRoute);

// /api/* 以外はSPA配信。wrangler.jsonc の not_found_handling=single-page-application
// により、アセットがなければ /index.html が返る (React Router がクライアントサイドで処理)。
app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ detail: err.message }, err.status);
  }
  console.error(err);
  return c.json(
    { detail: `Internal error: ${err.name}: ${err.message}` },
    500,
  );
});

export default app;
