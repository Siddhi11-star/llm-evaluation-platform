"""
Advisor Agent Standalone FastAPI Application.
Flagship AI & Tool Consultant Service for JudgeAI.
Run directly with:
    uvicorn backend.advisor_agent.main:app --host 0.0.0.0 --port 8003 --reload
"""

import sys
import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure directory is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    from .router import router as advisor_router
    from .service import AdvisorService
except ImportError:
    from router import router as advisor_router
    from service import AdvisorService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("advisor.main")

app = FastAPI(
    title="JudgeAI Advisor Agent Service",
    description="Flagship AI Consultant recommending verified Free & Paid models and generating optimized prompts powered by gpt-oss:120b-cloud.",
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
app.include_router(advisor_router)


@app.get("/")
async def root():
    return {
        "service": "JudgeAI Advisor Agent Service",
        "version": "1.0.0",
        "reasoning_model": AdvisorService.REASONING_MODEL,
        "docs": "/docs",
        "health": "/advisor/health",
        "catalog": "/advisor/models",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8003, reload=True)
