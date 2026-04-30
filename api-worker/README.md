# rag-eval Worker (Cloudflare完結版)

Hono + Cloudflare Workers + D1 + Workers AI + Static Assets で構築された
RAG評価ダッシュボード + API サーバー (1つのWorkerで完結)。
外部依存は **JWT_SECRET** 環境変数のみで、Supabase/Groq などのサードパーティ不要。

**本番URL**: <https://rag-eval.a-1ro.dev>

## エンドポイント構成

| パス | 内容 |
|---|---|
| `/` および SPA ルート (`/login`, `/evaluations/:id` 等) | `../dashboard-spa/dist/` の静的アセット (index.html フォールバック) |
| `/api/*` | Hono API |

## スタック

| 役割 | 採用技術 |
|---|---|
| ルーティング | Hono v4 |
| データベース | Cloudflare D1 (SQLite) |
| 認証 (ダッシュボード) | 自前JWT (HS256, `hono/jwt`) + PBKDF2-SHA256 パスワード |
| 認証 (SDK) | API キー (SHA-256ハッシュで保存) |
| LLM 評価 | Workers AI `@cf/meta/llama-3.3-70b-instruct-fp8-fast` |
| ホスト | Cloudflare Workers |

## 構成

```
src/
├── index.ts           # エントリポイント (CORS, ルーター束ね, エラーハンドラ)
├── schemas.ts         # Zod スキーマ
├── types.ts           # Bindings (DB, AI, JWT_SECRET)
├── lib/
│   ├── auth.ts        # PBKDF2, JWT, APIキー検証, ミドルウェア
│   └── evaluator.ts   # Workers AI で自動評価 (waitUntil)
└── routes/
    ├── auth.ts        # POST /api/auth/signup,login | GET /api/auth/me
    ├── track.ts       # POST /api/track  (X-API-Key)
    ├── feedback.ts    # POST /api/feedback (Bearer)
    ├── stats.ts       # GET  /api/stats?key_id=  (Bearer)
    └── keys.ts        # POST/GET/DELETE /api/keys (Bearer)

migrations/
└── 0001_init.sql      # users, api_keys, evaluations, feedbacks
```

## 初期セットアップ

```bash
npm install

# 1. D1データベース作成 (初回のみ)
npx wrangler d1 create rag-eval
# 出力された database_id を wrangler.jsonc の database_id に貼る

# 2. ローカルマイグレーション
npm run db:migrate:local

# 3. 開発用シークレット
cp .dev.vars.example .dev.vars
# 中身の JWT_SECRET を 32 文字以上のランダム文字列に書き換える

# 4. Workers AI を使うため Cloudflare にログイン
npx wrangler login

# 5. ローカル起動
npm run dev
```

## デプロイ

SPA を先にビルドしてから Worker をデプロイする (Worker は `../dashboard-spa/dist/` を配信)。

```bash
# 1. SPAビルド
cd ../dashboard-spa && npm run build && cd ../api-worker

# 2. リモートD1にマイグレーション (初回のみ)
npm run db:migrate:remote

# 3. シークレット登録 (初回のみ)
npx wrangler secret put JWT_SECRET

# 4. Workerデプロイ (静的アセットも一緒にアップロードされる)
npm run deploy
```

## エンドポイント

| メソッド | パス | 認証 | 説明 |
|---|---|---|---|
| POST | `/api/auth/signup` | なし | メール/パスワードで登録、JWT返却 |
| POST | `/api/auth/login`  | なし | ログイン、JWT返却 |
| GET  | `/api/auth/me`     | Bearer | 現在のユーザー情報 |
| POST | `/api/keys`        | Bearer | APIキー発行 (平文は1度だけ返却) |
| GET  | `/api/keys`        | Bearer | APIキー一覧 |
| DELETE | `/api/keys/:id`  | Bearer | APIキー削除 |
| POST | `/api/track`       | X-API-Key | RAG評価を記録 (バックグラウンドで自動採点) |
| POST | `/api/feedback`    | Bearer | 良し悪しフィードバック |
| GET  | `/api/stats`       | Bearer | 集計統計 |

## 旧FastAPI実装からの差分

| 既存 (FastAPI) | 移行後 (Hono) |
|---|---|
| Supabase PostgreSQL | Cloudflare D1 (SQLite) |
| Supabase Auth | 自前 JWT + PBKDF2 |
| Groq SDK | Workers AI binding |
| `BackgroundTasks` | `c.executionCtx.waitUntil()` |
| `pydantic` | `zod` + `@hono/zod-validator` |
| `hashlib.sha256` | `crypto.subtle.digest("SHA-256", ...)` |
| `Vercel` | `Cloudflare Workers` |

## 注意

- **Workers AI はローカル開発でもリモートを叩く** ため、`wrangler login` 済みのCloudflareアカウントでの使用量がカウントされます (無料枠: 1日10,000ニューロン)
- AI 評価が失敗してもログだけ残してRAG本体は継続動作する設計 (`evaluator.ts` で `try/catch` 握りつぶし)
- パスワードリセット・確認メールは未実装 (要望が出たら Resend や MailChannels で追加)
