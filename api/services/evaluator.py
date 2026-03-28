import os
import json
import logging
from groq import Groq
from services.database import get_supabase

logger = logging.getLogger(__name__)

_groq_client: Groq | None = None


def get_groq_client() -> Groq:
    global _groq_client
    if _groq_client is None:
        _groq_client = Groq(api_key=os.environ["GROQ_API_KEY"])
    return _groq_client


EVAL_PROMPT = """\
以下のRAG回答を3つの観点で0.0〜1.0のスコアで評価してください。
JSONのみを返してください（他のテキスト不要）。

質問: {question}
回答: {answer}
参照チャンク:
{chunks}

評価観点:
- relevance: 質問に対して回答は関連しているか
- faithfulness: 回答はチャンクの内容に基づいているか（幻覚がないか）
- completeness: 回答は質問を十分にカバーしているか

出力形式（JSONのみ）:
{{"relevance": 0.0, "faithfulness": 0.0, "completeness": 0.0}}
"""


async def run_evaluation(
    evaluation_id: str,
    question: str,
    answer: str,
    chunks: list,
) -> None:
    """
    Groq + Llama 3.3 70B でRAG回答を自動評価し、スコアをDBに保存する。
    BackgroundTask から呼ばれる（Vercel 10秒タイムアウト対策）。
    失敗しても握りつぶしてログだけ残す。
    """
    try:
        chunks_text = "\n".join(
            f"- {c.get('content', '')}" for c in chunks
        ) or "(チャンクなし)"

        client = get_groq_client()
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": EVAL_PROMPT.format(
                        question=question,
                        answer=answer,
                        chunks=chunks_text,
                    ),
                }
            ],
            temperature=0.0,
            max_tokens=100,
        )

        raw = response.choices[0].message.content.strip()
        scores = json.loads(raw)

        supabase = get_supabase()
        supabase.table("evaluations").update(
            {
                "auto_score_relevance": float(scores.get("relevance", 0)),
                "auto_score_faithfulness": float(scores.get("faithfulness", 0)),
                "auto_score_completeness": float(scores.get("completeness", 0)),
            }
        ).eq("id", evaluation_id).execute()

    except Exception as e:
        logger.error(f"Evaluation failed for {evaluation_id}: {e}")
