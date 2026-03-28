from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID


class Chunk(BaseModel):
    content: str
    source: Optional[str] = None


class TrackRequest(BaseModel):
    question: str
    answer: str
    chunks: Optional[List[Chunk]] = []
    latency_ms: Optional[int] = None


class TrackResponse(BaseModel):
    id: UUID
    status: str = "ok"


class FeedbackRequest(BaseModel):
    evaluation_id: UUID
    rating: int  # 1 or -1
    comment: Optional[str] = None


class FeedbackResponse(BaseModel):
    id: UUID
    status: str = "ok"


class EvaluationSummary(BaseModel):
    id: UUID
    question: str
    answer: str
    chunks: Optional[List[Chunk]] = []
    latency_ms: Optional[int]
    auto_score_relevance: Optional[float]
    auto_score_faithfulness: Optional[float]
    auto_score_completeness: Optional[float]
    created_at: str


class StatsResponse(BaseModel):
    total: int
    avg_relevance: Optional[float]
    avg_faithfulness: Optional[float]
    avg_completeness: Optional[float]
    positive_feedback_rate: Optional[float]
    recent: List[EvaluationSummary]
