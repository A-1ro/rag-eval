# rag-eval SDK

RAGアプリの回答品質を3行で計測できるSDKです。

## インストール

```bash
pip install rageval-sdk
```

## 使い方

```python
from rag_eval import track

# 既存のRAGコードに3行追加するだけ
answer = your_rag_system.query(question)
track(
    question=question,
    answer=answer,
    chunks=[{"content": chunk.text, "source": chunk.source} for chunk in retrieved_chunks],
    api_key="rag_eval_xxxx",  # または環境変数 RAG_EVAL_API_KEY
    latency_ms=elapsed_ms,   # 任意
)
```

### 非同期版（FastAPI / asyncio）

```python
from rag_eval import atrack

await atrack(
    question=question,
    answer=answer,
    chunks=chunks,
    api_key="rag_eval_xxxx",  # または環境変数 RAG_EVAL_API_KEY
)
```

### セルフホスト版

```python
track(
    question=question,
    answer=answer,
    chunks=chunks,
    api_url="https://your-own-server.com",  # または環境変数 RAG_EVAL_API_URL
    api_key="your-key",
)
```

## 環境変数

| 変数名 | 説明 |
|--------|------|
| `RAG_EVAL_API_KEY` | APIキー |
| `RAG_EVAL_API_URL` | APIのURL（セルフホスト時） |

## ライセンス

MIT
