# RAG評価ダッシュボード — 構成案

作成日: 2026-03-28
最終更新日: 2026-05-01 (Cloudflare完結構成に移行)

---

## プロダクト概要

RAGアプリの回答品質を可視化・改善するための評価プラットフォーム。
既存のRAGに数行追加するだけで計測が始まるSDKと、結果を確認するダッシュボードUIを提供する。

**コンセプト**: 「Langfuse + Ragasの良いとこ取り・日本語対応」

**本番URL**: <https://rag-eval.a-1ro.dev>

---

## 競合調査

| サービス          | 料金            | OSS    | セルフホスト           | 弱点                                                 |
| ----------------- | --------------- | ------ | ---------------------- | ---------------------------------------------------- |
| **LangSmith**     | $39/シート/月〜 | ✗      | Enterprise限定         | LangChain依存・シート課金が高い・RAGメトリクス非内蔵 |
| **Langfuse**      | 無料〜$29/月    | MIT    | ✅（インフラコスト大） | UIが洗練されていない・RAGメトリクス非内蔵            |
| **Ragas**         | 無料            | MIT    | ✅                     | ダッシュボードUIなし・RAG専用                        |
| **TruLens**       | 無料            | MIT    | ✅                     | 本番スケール不向き・開発停滞気味                     |
| **Arize/Phoenix** | 無料〜          | Apache | ✅                     | RAG評価メトリクスが弱い・Observability特化           |
| **Helicone**      | 無料〜$20/月    | MIT    | ✅                     | RAG評価がスコープ外                                  |

### 差別化ポイント

競合の隙間を突く：

1. **Langfuseの強み**（OSS・セルフホスト・フレームワーク非依存・ユーザー数無制限課金）を持ちつつ
2. **Ragasの強み**（RAGメトリクス内蔵）をデフォルトで提供し
3. **日本語UI・日本語ドキュメント**で日本市場に特化（競合全員が手薄）
4. **設定ゼロで使い始められる**（Ragasはコード定義が必要、UIがない）

LangSmithはRAG専用メトリクスを内蔵していない。Ragasはメトリクスは出せるがUIがない。この隙間が狙い目。

---

## 配布モデル（両方対応）

### SaaS型（デフォルト）

```bash
pip install rageval-sdk
```

```python
from rag_eval import track
track(question, answer, chunks, api_key="rag_eval_xxxx")
```

→ 登録→APIキー発行→即使える。サーバー不要。デフォルトURLは `https://rag-eval.a-1ro.dev`。

### セルフホスト型

各自のCloudflareアカウントにデプロイ可能。`api-worker/README.md` の手順で
`wrangler deploy` するだけで自分のWorker URL でAPI・ダッシュボード一式が立ち上がる。

```python
track(question, answer, chunks, api_url="https://your-worker.workers.dev")
```

**SDK内部ロジック**: `api_url` が指定されたらそちらに送信、なければデフォルトSaaSへ送信。

---

## 技術スタック

| 役割          | 技術                                            | 補足                          |
| ------------- | ----------------------------------------------- | ----------------------------- |
| SDK (Python)  | PyPI公開 (`rageval-sdk`)                        | `httpx` で同期/非同期送信     |
| SDK (npm)     | npm公開 (`rageval-sdk`)                         | `fetch` ベース                |
| API           | Hono on Cloudflare Workers                      | TypeScript                    |
| 自動評価LLM   | Cloudflare Workers AI / Llama 3.3 70B fp8-fast  | 無料枠1日10,000ニューロン     |
| DB            | Cloudflare D1 (SQLite)                          | 無料枠5GB                     |
| 認証          | 自前JWT (HS256) + PBKDF2-SHA256                 | `hono/jwt`, Web Crypto API    |
| Dashboard UI  | Vite + React 19 + React Router v7 / Recharts    | ビルド成果物をWorkerが配信    |
| ホスト        | Cloudflare Workers + Static Assets              | 1つのWorkerで API + SPA 完結  |

**月額コスト（SaaS運営側）**: $0（Cloudflare無料枠のみ）

---

## アーキテクチャ図

```
RAGアプリ（ユーザーの既存コード）
  │
  │ from rag_eval import track
  │ track(question, answer, chunks, api_key="...")
  │
  ▼
[rageval-sdk] (pip install rageval-sdk / npm install rageval-sdk)
  │ api_url指定あり → セルフホストWorkerへ
  │ api_url指定なし → https://rag-eval.a-1ro.dev へ
  │
  ▼
┌──────────── Cloudflare Workers (rag-eval-api) ────────────┐
│                                                           │
│  [Hono API]   /api/*                                      │
│    ・POST /api/auth/signup, /login, /me  (JWT発行)        │
│    ・POST /api/track     (X-API-Key, バックグラウンド評価) │
│    ・POST /api/feedback  (Bearer)                         │
│    ・GET  /api/stats     (Bearer)                         │
│    ・POST/GET/DELETE /api/keys (Bearer)                   │
│                  │                                        │
│                  ├─ ctx.waitUntil()                       │
│                  ▼                                        │
│  [Workers AI]  @cf/meta/llama-3.3-70b-instruct-fp8-fast   │
│                                                           │
│  [D1 SQLite]                                              │
│    users / api_keys / evaluations / feedbacks             │
│                                                           │
│  [Static Assets]  /  /login  /evaluations[/:id]  ...      │
│    (Vite + React 19 + React Router v7 ビルド成果物)       │
│    not_found_handling=single-page-application で          │
│    任意ルートを index.html にフォールバック               │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## DBスキーマ (D1 / SQLite)

### users テーブル

```sql
CREATE TABLE users (
  id            TEXT PRIMARY KEY,                     -- crypto.randomUUID()
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,                        -- pbkdf2$<iter>$<salt>$<hash>
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### api_keys テーブル

```sql
CREATE TABLE api_keys (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash   TEXT UNIQUE NOT NULL,                    -- SHA-256
  name       TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### evaluations テーブル

```sql
CREATE TABLE evaluations (
  id                      TEXT PRIMARY KEY,
  api_key_id              TEXT NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  question                TEXT NOT NULL,
  answer                  TEXT NOT NULL,
  chunks                  TEXT NOT NULL DEFAULT '[]', -- JSON文字列
  latency_ms              INTEGER,
  auto_score_relevance    REAL,                       -- LLMによる関連性スコア(0-1)
  auto_score_faithfulness REAL,                       -- LLMによる忠実性スコア(0-1)
  auto_score_completeness REAL,                       -- LLMによる完全性スコア(0-1)
  created_at              TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### feedbacks テーブル

```sql
CREATE TABLE feedbacks (
  id            TEXT PRIMARY KEY,
  evaluation_id TEXT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  rating        INTEGER NOT NULL CHECK (rating IN (1, -1)), -- 1=良い, -1=悪い
  comment       TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
```

完全なマイグレーションは `api-worker/migrations/0001_init.sql`。

---

## SDK実装

### パッケージ構成 (Python)

```
sdk/
├── rag_eval/
│   ├── __init__.py      # track / atrack をエクスポート
│   └── tracker.py       # httpxクライアント実装
├── pyproject.toml
└── README.md
```

### tracker.py 抜粋

```python
DEFAULT_API_URL = "https://rag-eval.a-1ro.dev"

def track(question, answer, chunks=None, api_key=None, api_url=None, latency_ms=None):
    url = (api_url or os.getenv("RAG_EVAL_API_URL") or DEFAULT_API_URL).rstrip("/")
    key = api_key or os.getenv("RAG_EVAL_API_KEY")
    if not key:
        return None
    try:
        response = httpx.post(
            f"{url}/api/track",
            json={"question": question, "answer": answer,
                  "chunks": chunks or [], "latency_ms": latency_ms},
            headers={"X-API-Key": key},
            timeout=5.0,
        )
        response.raise_for_status()
        return response.json().get("id")
    except Exception:
        return None  # ログ送信の失敗でRAG本体を止めない
```

npm版 (`sdk-npm/`) も同等のAPI (`fetch` ベース)。

---

## API エンドポイント一覧

| メソッド | パス | 認証 | 説明 |
|---|---|---|---|
| POST | `/api/auth/signup` | なし | メール/パスワードで登録、JWT返却 |
| POST | `/api/auth/login`  | なし | ログイン、JWT返却 |
| GET  | `/api/auth/me`     | Bearer | 現在のユーザー情報 |
| POST | `/api/keys`        | Bearer | APIキー発行（平文は1度だけ返却） |
| GET  | `/api/keys`        | Bearer | APIキー一覧 |
| DELETE | `/api/keys/:id`  | Bearer | APIキー削除 |
| POST | `/api/track`       | X-API-Key | RAG評価を記録（バックグラウンドで自動採点） |
| POST | `/api/feedback`    | Bearer | 良し悪しフィードバック |
| GET  | `/api/stats`       | Bearer | 集計統計 |

---

## Dashboard UI 画面構成

1. **Login** (`/login`) — メール/パスワードでサインイン・サインアップ
2. **Overview** (`/`) — 総クエリ数・平均スコア・スコア推移グラフ・最近の評価
3. **Evaluations** (`/evaluations`) — 質問・回答・スコア一覧（ページング対応）
4. **Evaluation Detail** (`/evaluations/:id`) — 質問・回答・参照チャンク・スコア・フィードバック入力
5. **Settings** (`/settings`) — APIキー管理（発行・一覧・削除）
6. **Privacy** (`/privacy`) — プライバシーポリシー（パブリック）

---

## ポートフォリオとしてのアピールポイント

- **LangSmithの代替をOSSで作った** → プロダクト思考が見える
- **SDKのPyPI / npm 両公開** → ライブラリ設計の経験
- **1つのCloudflare WorkerでAPI・DB・LLM・SPA配信が完結** → モダンなEdgeアーキテクチャ設計力
- **今日のRAGポートフォリオとセットで見せられる** → 「作って評価する」一連のサイクルを持っている

---

## 注意点

- APIキーはDBにハッシュ（SHA-256）で保存。平文保存禁止。発行時のみレスポンスで平文を返す
- パスワードはPBKDF2-SHA256（10万イテレーション + 16バイトソルト）でハッシュ化して保存
- ログ送信失敗でRAG本体を止めない（SDK内 try/except で握りつぶす）
- Workers AI 評価はリクエストレスポンス後に `ctx.waitUntil()` でバックグラウンド実行（ユーザー待機なし）
- Workers AI のローカル開発は Cloudflare のリモートを叩く（`wrangler login` 必須・課金対象）
- メール認証・パスワードリセットは未実装（必要になったら Resend 等の外部メール送信サービスを追加）

---

## ペルソナについて

@PERSONA.md
