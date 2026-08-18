import logging
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

try:
    from .swarm_engine import run_swarm
    from .config import settings
except ImportError:
    from swarm_engine import run_swarm
    from config import settings

logger = logging.getLogger("swarm.router")

router = APIRouter(prefix="/api/swarm")


class SwarmRunRequest(BaseModel):
    prompt: str
    model: Optional[str] = None  # ignored — orchestrator is always gpt-oss:120b-cloud


@router.post("/run")
async def run_swarm_endpoint(req: SwarmRunRequest):
    """
    Main endpoint: receive a user prompt, run the full multi-agent swarm pipeline,
    and return a JudgeAISwarmSession-compatible response.
    """
    logger.info(f"POST /api/swarm/run — prompt={req.prompt[:80]}…")
    result = await run_swarm(prompt=req.prompt, model=req.model)
    return result


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "orchestrator": settings.ORCHESTRATOR_MODEL,
        "agent_models": settings.AGENT_MODELS,
        "ollama_url": settings.OLLAMA_BASE_URL,
    }


@router.get("/models")
async def list_agent_models():
    """Returns the list of available sub-agent cloud models."""
    return {
        "orchestrator": settings.ORCHESTRATOR_MODEL,
        "agents": settings.AGENT_MODELS,
    }
