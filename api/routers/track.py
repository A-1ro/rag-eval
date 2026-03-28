from fastapi import APIRouter, Depends, BackgroundTasks
from models.schemas import TrackRequest, TrackResponse
from services.auth import verify_api_key
from services.database import get_supabase
from services.evaluator import run_evaluation

router = APIRouter()


@router.post("/track", response_model=TrackResponse)
async def track(
    body: TrackRequest,
    background_tasks: BackgroundTasks,
    api_key_info: dict = Depends(verify_api_key),
):
    supabase = get_supabase()

    result = (
        supabase.table("evaluations")
        .insert(
            {
                "api_key_id": api_key_info["id"],
                "question": body.question,
                "answer": body.answer,
                "chunks": [c.model_dump() for c in (body.chunks or [])],
                "latency_ms": body.latency_ms,
            }
        )
        .execute()
    )

    evaluation_id = result.data[0]["id"]

    # Groq評価はバックグラウンドで実行（10秒タイムアウト対策）
    background_tasks.add_task(
        run_evaluation,
        evaluation_id,
        body.question,
        body.answer,
        [c.model_dump() for c in (body.chunks or [])],
    )

    return TrackResponse(id=evaluation_id)
