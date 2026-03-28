from fastapi import APIRouter, Depends, HTTPException
from models.schemas import FeedbackRequest, FeedbackResponse
from services.auth import verify_api_key
from services.database import get_supabase

router = APIRouter()


@router.post("/feedback", response_model=FeedbackResponse)
async def feedback(
    body: FeedbackRequest,
    api_key_info: dict = Depends(verify_api_key),
):
    supabase = get_supabase()

    # evaluation_id が api_key_info に紐づいていることを確認
    eval_check = (
        supabase.table("evaluations")
        .select("id")
        .eq("id", str(body.evaluation_id))
        .eq("api_key_id", api_key_info["id"])
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
