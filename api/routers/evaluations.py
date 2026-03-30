from fastapi import APIRouter, Depends, HTTPException
from models.schemas import EvaluationSummary
from services.auth import verify_supabase_jwt
from services.database import get_supabase

router = APIRouter()


@router.get("/evaluations/{evaluation_id}", response_model=EvaluationSummary)
async def get_evaluation(
    evaluation_id: str,
    user: dict = Depends(verify_supabase_jwt),
):
    """指定IDの評価詳細を返す（自分のAPIキーに紐づくもののみ）。"""
    supabase = get_supabase()

    result = (
        supabase.table("evaluations")
        .select(
            "id, question, answer, chunks, latency_ms,"
            "auto_score_relevance, auto_score_faithfulness, auto_score_completeness,"
            "created_at,"
            "api_keys!inner(user_id)"
        )
        .eq("id", evaluation_id)
        .eq("api_keys.user_id", user["id"])
        .limit(1)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    row = result.data[0]
    return EvaluationSummary(
        id=row["id"],
        question=row["question"],
        answer=row["answer"],
        chunks=row.get("chunks") or [],
        latency_ms=row.get("latency_ms"),
        auto_score_relevance=row.get("auto_score_relevance"),
        auto_score_faithfulness=row.get("auto_score_faithfulness"),
        auto_score_completeness=row.get("auto_score_completeness"),
        created_at=row["created_at"],
    )
