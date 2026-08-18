import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    from .config import settings
    from .router import router as swarm_router
except ImportError:
    from config import settings
    from router import router as swarm_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("swarm.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        f"JudgeAI Agent Swarm Service starting — "
        f"Orchestrator: {settings.ORCHESTRATOR_MODEL} — "
        f"Ollama: {settings.OLLAMA_BASE_URL}"
    )
    yield
    logger.info("JudgeAI Agent Swarm Service shutting down")


app = FastAPI(
    title="JudgeAI Agent Swarm Service",
    description=(
        "Multi-agent swarm backend powered by Ollama cloud models. "
        "gpt-oss:120b-cloud orchestrates 2-6 specialized sub-agents in parallel."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(swarm_router)


@app.get("/")
async def root():
    return {
        "service": "JudgeAI Agent Swarm",
        "orchestrator": settings.ORCHESTRATOR_MODEL,
        "agent_models": settings.AGENT_MODELS,
        "docs": "/docs",
        "health": "/api/swarm/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
