"""
Judge Agent Standalone FastAPI Application.
Run directly with:
    uvicorn backend.judge_agent.main:app --host 0.0.0.0 --port 8002 --reload
"""

import sys
import os
import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure directory is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    from .router import router as judge_router
    from .service import JudgeService
except ImportError:
    from router import router as judge_router
    from service import JudgeService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("judge_agent.main")

app = FastAPI(
    title="JudgeAI Pairwise Judge Agent Service",
    description="Pairwise response evaluation service comparing two model outputs across 6 factors using gpt-oss:120b-cloud.",
    version="1.0.0",
)

# Enable CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Router
app.include_router(judge_router)


@app.get("/")
async def root():
    return {
        "service": "JudgeAI Pairwise Judge Agent Service",
        "version": "1.0.0",
        "judge_model": JudgeService.DEFAULT_JUDGE_MODEL,
        "docs": "/docs",
        "health": "/judge/health",
        "compare": "/judge/compare",
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8002"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("backend.judge_agent.main:app", host=host, port=port, reload=True)
