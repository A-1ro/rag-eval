# RAG評価ダッシュボード

RAGアプリの回答品質を可視化・改善するための評価プラットフォーム。
既存のRAGに**3行追加するだけ**で計測が始まるSDKと、結果を確認するダッシュボードUIを提供します。

**コンセプト**: Langfuse + Ragasの良いとこ取り・日本語対応

---

## クイックスタート

```bash
pip install rag-eval
```

```python
from rag_eval import track

answer = your_rag.query(question)

track(
    question=question,
    answer=answer,
    chunks=[{"content": c.text, "source": c.source} for c in chunks],
    api_key="rag_eval_xxxx",
)
```

---

## 機能

- **自動評価スコア** — Groq + Llama 3.3 70B で Relevance / Faithfulness / Completeness を自動採点
- **スコア時系列グラフ** — チャンク設計変更前後の精度変化を可視化
- **フィードバック収集** — 👍 / 👎 でエンドユーザーの評価を記録
- **SaaS & セルフホスト対応** — データを外に出せない環境は Docker Compose で完結
- **フレームワーク非依存** — LangChain / LlamaIndex / 自作RAG、どれでも動く

---

## アーキテクチャ

```
RAGアプリ（既存コード）
  │  pip install rag-eval → from rag_eval import track
  ▼
[SDK]  httpx で非同期送信（失敗してもRAG本体を止めない）
  │
  ▼
[Collector API]  FastAPI on Vercel
  ├─ POST /api/track    ← ログ受信・DB保存
  ├─ POST /api/feedback ← フィードバック記録
  ├─ GET  /api/stats    ← ダッシュボード向けデータ
  └─ POST /api/keys     ← APIキー発行
  │
  ▼  BackgroundTask（Vercel 10秒タイムアウト対策）
[Groq + Llama 3.3 70B]  自動評価スコア算出
  │
  ▼
[Supabase]  PostgreSQL（evaluations / feedbacks / api_keys）
  │
  ▼
[Dashboard UI]  Next.js on Vercel
  ├─ Overview    — 総クエリ数・平均スコア・スコア推移グラフ
  ├─ Evaluations — 質問・回答・スコア一覧
  └─ Settings    — APIキー管理
```

---

## 技術スタック

| 役割 | 技術 |
|------|------|
| SDK | Python / httpx |
| Collector API | FastAPI / Supabase / Groq |
| Dashboard UI | Next.js / TypeScript / Recharts |
| DB | Supabase (PostgreSQL) |
| ホスト | Vercel Hobby |
| セルフホスト | Docker Compose |

**月額コスト（SaaS運営側）**: $0〜5

---

## セットアップ

### SaaS版（Vercelにデプロイ）

**1. Supabaseでテーブル作成**

[Supabase](https://supabase.com) でプロジェクトを作成し、SQL Editorで実行：

```sql
-- api/migrations/001_init.sql の内容を貼り付け
```

**2. Collector APIをVercelにデプロイ**

```bash
cd api
vercel --prod
```

Vercelの環境変数に設定：
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY`

**3. DashboardをVercelにデプロイ**

```bash
cd dashboard
vercel --prod
```

Vercelの環境変数に設定：
- `NEXT_PUBLIC_API_URL` — Collector APIのURL

**4. APIキーを発行**

```bash
curl -X POST https://your-api.vercel.app/api/keys \
  -H "Content-Type: application/json" \
  -d '{"name": "本番環境"}'
```

---

### セルフホスト版

```bash
git clone https://github.com/yourname/rag-eval
cd rag-eval

# 環境変数を設定
cp api/.env.example api/.env
# GROQ_API_KEY を .env に記入

docker compose up
```

- API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 競合との比較

| サービス | RAGメトリクス内蔵 | セルフホスト | 日本語UI | 無料枠 |
|----------|:-----------------:|:------------:|:--------:|:------:|
| **RAG評価ダッシュボード** | ✅ | ✅ | ✅ | ✅ |
| LangSmith | ✗ | Enterprise限定 | ✗ | 制限あり |
| Langfuse | ✗ | ✅ | ✗ | ✅ |
| Ragas | ✅ | ✅（UIなし） | ✗ | ✅ |

---

## ライセンス

MIT
