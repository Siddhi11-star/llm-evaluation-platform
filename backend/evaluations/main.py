"""
Evaluation Agent Standalone FastAPI Application.
Run directly with:
    uvicorn backend.evaluations.main:app --host 0.0.0.0 --port 8001 --reload
"""

import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure directory is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    from .router import router as evaluations_router
    from .service import EvaluationOrchestrator
    from .db import EvaluationDatabase
except ImportError:
    from router import router as evaluations_router
    from service import EvaluationOrchestrator
    from db import EvaluationDatabase

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("evaluations.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Evaluation Agent database connection...")
    await EvaluationDatabase.connect()
    yield
    logger.info("Closing Evaluation Agent database connection...")
    await EvaluationDatabase.close()


app = FastAPI(
    title="JudgeAI Evaluation Agent Service",
    description="Evaluation pipeline orchestrator coordinating 6 LLM Judge Agents powered by gpt-oss:120b-cloud.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8443",
        "http://127.0.0.1:8443",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Router
app.include_router(evaluations_router)


@app.get("/")
async def root():
    return {
        "service": "JudgeAI Evaluation Agent Service",
        "version": "1.0.0",
        "planned_judge_model": EvaluationOrchestrator.PLANNED_JUDGE_MODEL,
        "docs": "/docs",
        "health": "/evaluations/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
