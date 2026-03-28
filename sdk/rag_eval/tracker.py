import os
from typing import Optional

import httpx

DEFAULT_API_URL = "https://rag-eval-api.vercel.app"


def track(
    question: str,
    answer: str,
    chunks: Optional[list] = None,
    api_key: Optional[str] = None,
    api_url: Optional[str] = None,
    latency_ms: Optional[int] = None,
) -> Optional[str]:
    """
    RAGの質問・回答・チャンクをCollector APIに送信する。

    失敗してもRAG本体を止めない（例外を握りつぶす）。

    Args:
        question: ユーザーの質問
        answer: RAGの回答
        chunks: 取得されたチャンクのリスト [{"content": "...", "source": "..."}]
        api_key: APIキー（未指定の場合は RAG_EVAL_API_KEY 環境変数を使用）
        api_url: APIのURL（未指定の場合はデフォルトのSaaS URLを使用）
        latency_ms: RAGの応答時間（ミリ秒）

    Returns:
        evaluation_id（成功時）または None（失敗時）
    """
    url = (api_url or os.getenv("RAG_EVAL_API_URL") or DEFAULT_API_URL).rstrip("/")
    key = api_key or os.getenv("RAG_EVAL_API_KEY")

    if not key:
        return None

    payload = {
        "question": question,
        "answer": answer,
        "chunks": chunks or [],
        "latency_ms": latency_ms,
    }

    try:
        response = httpx.post(
            f"{url}/api/track",
            json=payload,
            headers={"X-API-Key": key},
            timeout=5.0,
        )
        response.raise_for_status()
        return response.json().get("id")
    except Exception:
        return None


async def atrack(
    question: str,
    answer: str,
    chunks: Optional[list] = None,
    api_key: Optional[str] = None,
    api_url: Optional[str] = None,
    latency_ms: Optional[int] = None,
) -> Optional[str]:
    """
    非同期版 track()。asyncio / FastAPI 環境向け。

    引数・戻り値は track() と同じ。
    """
    url = (api_url or os.getenv("RAG_EVAL_API_URL") or DEFAULT_API_URL).rstrip("/")
    key = api_key or os.getenv("RAG_EVAL_API_KEY")

    if not key:
        return None

    payload = {
        "question": question,
        "answer": answer,
        "chunks": chunks or [],
        "latency_ms": latency_ms,
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{url}/api/track",
                json=payload,
                headers={"X-API-Key": key},
                timeout=5.0,
            )
        response.raise_for_status()
        return response.json().get("id")
    except Exception:
        return None
