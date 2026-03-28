from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routers import track, feedback, stats, keys

app = FastAPI(
    title="rag-eval API",
    description="RAG評価ダッシュボード — Collector API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番はVercelドメインのみに絞る
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(track.router, prefix="/api")
app.include_router(feedback.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(keys.router, prefix="/api")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal error: {type(exc).__name__}: {exc}"},
    )


@app.get("/")
async def root():
    return {"status": "ok", "service": "rag-eval API"}
