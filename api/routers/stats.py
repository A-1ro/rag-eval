from fastapi import APIRouter, Depends, Query, HTTPException
from models.schemas import StatsResponse, EvaluationSummary
from services.auth import verify_supabase_jwt
from services.database import get_supabase

router = APIRouter()


@router.get("/stats", response_model=StatsResponse)
async def stats(
    key_id: str = Query(..., description="表示するAPIキーのID"),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user: dict = Depends(verify_supabase_jwt),
):
    supabase = get_supabase()

    # key_id がログインユーザーのものか確認
    key_check = (
        supabase.table("api_keys")
        .select("id")
        .eq("id", key_id)
        .eq("user_id", user["id"])
        .limit(1)
        .execute()
    )
    if not key_check.data:
        raise HTTPException(status_code=404, detail="API key not found")

    # 件数
    count_result = (
        supabase.table("evaluations")
        .select("id", count="exact")
        .eq("api_key_id", key_id)
        .execute()
    )
    total = count_result.count or 0

    # 平均スコア
    avg_result = (
        supabase.table("evaluations")
        .select(
            "auto_score_relevance,"
            "auto_score_faithfulness,"
            "auto_score_completeness"
        )
        .eq("api_key_id", key_id)
        .not_.is_("auto_score_relevance", "null")
        .execute()
    )

    rows = avg_result.data or []
    avg_relevance = avg_faithfulness = avg_completeness = None
    if rows:
        avg_relevance = sum(r["auto_score_relevance"] for r in rows) / len(rows)
        avg_faithfulness = sum(r["auto_score_faithfulness"] for r in rows) / len(rows)
        avg_completeness = sum(r["auto_score_completeness"] for r in rows) / len(rows)

    # フィードバック率
    fb_result = (
        supabase.table("feedbacks")
        .select("rating, evaluations!inner(api_key_id)")
        .eq("evaluations.api_key_id", key_id)
        .execute()
    )
    feedbacks = fb_result.data or []
    positive_feedback_rate = None
    if feedbacks:
        positive = sum(1 for f in feedbacks if f["rating"] == 1)
        positive_feedback_rate = positive / len(feedbacks)

    # 最近の評価
    recent_result = (
        supabase.table("evaluations")
        .select(
            "id, question, answer, chunks, latency_ms,"
            "auto_score_relevance, auto_score_faithfulness, auto_score_completeness,"
            "created_at"
        )
        .eq("api_key_id", key_id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    recent = [EvaluationSummary(**r) for r in (recent_result.data or [])]

    return StatsResponse(
        total=total,
        avg_relevance=avg_relevance,
        avg_faithfulness=avg_faithfulness,
        avg_completeness=avg_completeness,
        positive_feedback_rate=positive_feedback_rate,
        recent=recent,
    )
