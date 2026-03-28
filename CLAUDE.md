# RAG評価ダッシュボード — 構成案

作成日: 2026-03-28

---

## プロダクト概要

RAGアプリの回答品質を可視化・改善するための評価プラットフォーム。
既存のRAGに数行追加するだけで計測が始まるSDKと、結果を確認するダッシュボードUIを提供する。

**コンセプト**: 「Langfuse + Ragasの良いとこ取り・日本語対応」

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

```python
pip install rag-eval
```

```python
from rag_eval import track
track(question, answer, chunks, api_key="rag_eval_xxxx")
```

→ 登録→APIキー発行→即使える。サーバー不要。

### セルフホスト型

```python
track(question, answer, chunks, api_url="https://your-own-server.com")
```

→ データを外に出せない企業向け。Dockerfileで提供。

**SDK内部ロジック**: `api_url` が指定されたらそちらに送信、なければデフォルトサーバーに送信。

---

## 技術スタック

| 役割          | 技術                          | 補足                           |
| ------------- | ----------------------------- | ------------------------------ |
| SDK           | Python パッケージ（PyPI公開） | `httpx` で非同期送信           |
| Collector API | FastAPI (Python)              | ログ受信・自動評価スコア算出   |
| 自動評価LLM   | Groq + Llama 3.3 70B          | 無料枠・爆速                   |
| DB            | Supabase (PostgreSQL)         | 無料枠・REST API自動生成       |
| Dashboard UI  | Next.js / TypeScript          | Recharts でグラフ表示          |
| ホスト        | Vercel Hobby                  | スリープなし・無料             |
| セルフホスト  | Docker Compose                | Collector API + Supabase互換DB |

**月額コスト（SaaS運営側）**: $0〜5

---

## アーキテクチャ図

```
RAGアプリ（ユーザーの既存コード）
  │
  │ from rag_eval import track
  │ track(question, answer, chunks, api_key="...")
  │
  ▼
[rag-eval SDK] (pip install rag-eval)
  │ api_url指定あり → セルフホストサーバーへ
  │ api_url指定なし → デフォルトサーバーへ
  ▼
[Collector API] FastAPI on Vercel
  │ ・受信データをDBに保存
  │ ・Groqで自動評価スコア算出（非同期）
  ▼
[Supabase] PostgreSQL
  │ evaluations テーブル
  │ feedbacks テーブル
  │ api_keys テーブル
  ▼
[Dashboard UI] Next.js on Vercel
  ・スコアの時系列グラフ
  ・良い/悪い回答のフィードバック入力
  ・チャンク設計の比較ビュー
  ・APIキー管理画面
```

---

## DBスキーマ

### evaluations テーブル

```sql
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  chunks JSONB,           -- 取得されたチャンクの配列
  latency_ms INTEGER,
  auto_score_relevance FLOAT,    -- LLMによる関連性スコア(0-1)
  auto_score_faithfulness FLOAT, -- LLMによる忠実性スコア(0-1)
  auto_score_completeness FLOAT, -- LLMによる完全性スコア(0-1)
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### feedbacks テーブル

```sql
CREATE TABLE feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID REFERENCES evaluations(id),
  rating INTEGER CHECK (rating IN (1, -1)), -- 1=良い, -1=悪い
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### api_keys テーブル

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  key_hash TEXT UNIQUE NOT NULL, -- APIキーはハッシュで保存
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## SDK実装

### パッケージ構成

```
rag-eval/
├── rag_eval/
│   ├── __init__.py      # track() をエクスポート
│   └── tracker.py       # HTTPクライアント実装
├── pyproject.toml
└── README.md
```

### tracker.py

```python
import os
import httpx
from typing import Optional

DEFAULT_API_URL = "https://rag-eval-api.vercel.app"

def track(
    question: str,
    answer: str,
    chunks: list,
    api_key: Optional[str] = None,
    api_url: Optional[str] = None,
    latency_ms: Optional[int] = None,
):
    """RAGの質問・回答・チャンクをログ送信する"""
    url = api_url or DEFAULT_API_URL
    key = api_key or os.getenv("RAG_EVAL_API_KEY")

    payload = {
        "question": question,
        "answer": answer,
        "chunks": chunks,
        "latency_ms": latency_ms,
    }

    try:
        httpx.post(
            f"{url}/api/track",
            json=payload,
            headers={"X-API-Key": key} if key else {},
            timeout=5.0,
        )
    except Exception:
        pass  # ログ送信の失敗でRAG本体を止めない
```

---

## Collector API エンドポイント

### POST /api/track

```
リクエスト:
{
  "question": "string",
  "answer": "string",
  "chunks": [{"content": "string", "source": "string"}],
  "latency_ms": 1234
}

レスポンス:
{ "id": "uuid", "status": "ok" }
```

### POST /api/feedback

```
リクエスト:
{
  "evaluation_id": "uuid",
  "rating": 1,  // 1=良い, -1=悪い
  "comment": "string"
}
```

### GET /api/stats

```
レスポンス:
{
  "total": 100,
  "avg_relevance": 0.82,
  "avg_faithfulness": 0.75,
  "positive_feedback_rate": 0.68,
  "recent": [...]
}
```

---

## Dashboard UI 画面構成

1. **Overview** — 総クエリ数・平均スコア・フィードバック率のサマリー
2. **Evaluations** — 質問・回答・スコアの一覧（フィルタ・ソート対応）
3. **Feedback** — 良い/悪い入力画面（evaluation詳細から遷移）
4. **Compare** — チャンク設計A vs Bの精度比較
5. **Settings** — APIキー管理・セルフホスト用設定

---

## MVP スコープ（2〜3週間）

### Week 1

- [ ] Supabaseでテーブル作成
- [ ] Collector API: POST /api/track 実装
- [ ] APIキー認証実装
- [ ] Vercelにデプロイ

### Week 2

- [ ] Groqによる自動評価スコア算出（非同期）
- [ ] Dashboard UI: Overview + Evaluations画面
- [ ] POST /api/feedback 実装
- [ ] Next.jsにフィードバック入力UI

### Week 3

- [ ] rag-eval SDKをPyPIに公開
- [ ] README + 使い方ドキュメント
- [ ] Docker Compose（セルフホスト用）
- [ ] 今日のRAGポートフォリオと接続してデモ動作確認

---

## セルフホスト用 Docker Compose

```yaml
version: "3.9"
services:
  api:
    build: ./api
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/rageval
      - GROQ_API_KEY=${GROQ_API_KEY}

  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: rageval
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

---

## ポートフォリオとしてのアピールポイント

- **LangSmithの代替をOSSで作った** → プロダクト思考が見える
- **SDKのPyPI公開** → ライブラリ設計の経験
- **SaaS + セルフホストの両対応** → アーキテクチャ設計力
- **今日のRAGポートフォリオとセットで見せられる** → 「作って評価する」一連のサイクルを持っている

---

## 注意点

- APIキーはDBにハッシュ（SHA-256）で保存。平文保存禁止
- ログ送信失敗でRAG本体を止めない（try/exceptで握りつぶす）
- Vercelのタイムアウト（10秒）に注意。Groqの評価は非同期で行う

---

## ペルソナについて

@PERSONA.md
