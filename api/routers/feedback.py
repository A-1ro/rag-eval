from fastapi import APIRouter, Depends, HTTPException
from models.schemas import FeedbackRequest, FeedbackResponse
from services.auth import verify_supabase_jwt
from services.database import get_supabase

router = APIRouter()


@router.post("/feedback", response_model=FeedbackResponse)
async def feedback(
    body: FeedbackRequest,
    user: dict = Depends(verify_supabase_jwt),
):
    supabase = get_supabase()

    # evaluation がログインユーザーのキーに紐づいているか確認
    eval_check = (
        supabase.table("evaluations")
        .select("id, api_keys!inner(user_id)")
        .eq("id", str(body.evaluation_id))
        .eq("api_keys.user_id", user["id"])
        .maybe_single()
        .execute()
    )
    if not eval_check.data:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    result = (
        supabase.table("feedbacks")
        .insert(
            {
                "evaluation_id": str(body.evaluation_id),
                "rating": body.rating,
                "comment": body.comment,
            }
        )
        .execute()
    )

    return FeedbackResponse(id=result.data[0]["id"])
