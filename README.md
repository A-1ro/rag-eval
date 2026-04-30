# RAG評価ダッシュボード

RAGアプリの回答品質を可視化・改善するための評価プラットフォーム。
既存のRAGに**3行追加するだけ**で計測が始まるSDKと、結果を確認するダッシュボードUIを提供します。

**コンセプト**: Langfuse + Ragasの良いとこ取り・日本語対応

**本番URL**: <https://rag-eval.a-1ro.dev>

---

## クイックスタート

```bash
pip install rageval-sdk
```

<https://pypi.org/project/rageval-sdk/>

```python
from rag_eval import track  # 同期版
# from rag_eval import atrack  # 非同期版（async/await環境）

answer = your_rag.query(question)

track(
    question=question,
    answer=answer,
    chunks=[{"content": c.text, "source": c.source} for c in chunks],
    api_key="rag_eval_xxxx",
    latency_ms=320,  # 任意: RAGの応答時間（ms）
)
```

npmからも利用できます:

```bash
npm install rageval-sdk
```

---

## 機能

- **自動評価スコア** — Workers AI + Llama 3.3 70B で Relevance / Faithfulness / Completeness を自動採点
- **スコア時系列グラフ** — チャンク設計変更前後の精度変化を可視化
- **フィードバック収集** — 👍 / 👎 でエンドユーザーの評価を記録
- **フレームワーク非依存** — LangChain / LlamaIndex / 自作RAG、どれでも動く
- **Cloudflare完結** — 1つのWorkerでAPI・DB・LLM・SPA配信まで完結

---

## アーキテクチャ

```
RAGアプリ（既存コード）
  │  pip install rageval-sdk → from rag_eval import track
  ▼
[SDK]  HTTP送信（失敗してもRAG本体を止めない）
  │
  ▼
┌─────────────────── Cloudflare Workers (1つのWorker) ───────────────────┐
│                                                                       │
│  [Hono API]                                                           │
│   ├─ POST /api/auth/signup, /login, /me — 自前JWT (HS256, PBKDF2)     │
│   ├─ POST /api/track    — ログ受信・DB保存 (X-API-Key 認証)            │
│   ├─ POST /api/feedback — フィードバック記録                           │
│   ├─ GET  /api/stats    — ダッシュボード向けデータ                      │
│   └─ POST/GET/DELETE /api/keys — APIキー管理                           │
│         │                                                             │
│         ▼ ctx.waitUntil()                                             │
│   [Workers AI] @cf/meta/llama-3.3-70b-instruct-fp8-fast               │
│                                                                       │
│  [D1 SQLite]                                                          │
│   ├─ users / api_keys / evaluations / feedbacks                       │
│                                                                       │
│  [Static Assets]  Vite + React 19 + React Router v7                   │
│   ├─ /          Overview                                              │
│   ├─ /evaluations[/:id]                                               │
│   ├─ /settings  APIキー管理                                            │
│   └─ /login, /privacy                                                 │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 技術スタック

| 役割 | 技術 |
|------|------|
| SDK | Python (httpx) / TypeScript (fetch) |
| API | Hono on Cloudflare Workers |
| DB | Cloudflare D1 (SQLite) |
| 自動評価LLM | Cloudflare Workers AI / Llama 3.3 70B |
| 認証 | 自前JWT (HS256) + PBKDF2-SHA256 (パスワード) |
| Dashboard UI | Vite + React 19 + React Router v7 + Recharts |
| ホスト | Cloudflare Workers + Static Assets (1つのWorkerで完結) |

**月額コスト**: $0 (Cloudflare無料枠で運用可能)

---

## ディレクトリ構成

```
rag-eval/
├── api-worker/      # Hono API + Static Assets配信 (Cloudflare Workers)
├── dashboard-spa/   # Vite + React SPA (api-worker からホストされる)
├── sdk/             # Python SDK (PyPI: rageval-sdk)
├── sdk-npm/         # npm SDK (npm: rageval-sdk)
├── CLAUDE.md        # プロジェクト構成案
└── PERSONA.md       # ユーザーペルソナ
```

---

## 自前運用したい場合

### 1. SPAビルド

```bash
cd dashboard-spa
npm install
npm run build
```

### 2. Cloudflare D1作成 + マイグレーション

```bash
cd ../api-worker
npm install
npx wrangler d1 create rag-eval
# 出力された database_id を wrangler.jsonc の database_id に貼る
npm run db:migrate:remote
```

### 3. シークレット登録 + デプロイ

```bash
openssl rand -base64 48 | npx wrangler secret put JWT_SECRET
npm run deploy
```

これで API + ダッシュボード一式が `https://<your-worker>.workers.dev` で立ち上がります。
カスタムドメインを当てるには Cloudflare ダッシュボードの Workers > Custom Domains から設定してください。

詳細は `api-worker/README.md` を参照。

---

## 競合との比較

| サービス | RAGメトリクス内蔵 | セルフホスト | 日本語UI | 無料枠 |
|----------|:-----------------:|:------------:|:--------:|:------:|
| **RAG評価ダッシュボード** | ✅ | ✅ (Cloudflare無料枠) | ✅ | ✅ |
| LangSmith | ✗ | Enterprise限定 | ✗ | 制限あり |
| Langfuse | ✗ | ✅ | ✗ | ✅ |
| Ragas | ✅ | ✅（UIなし） | ✗ | ✅ |

---

## ライセンス

MIT
