"""
FastAPI Router for Judge Agent Endpoints.
Prefix: /judge
"""

import logging
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException

try:
    from .models import (
        JudgeCompareRequest,
        JudgeResult,
        HealthResponse,
    )
    from .service import JudgeService, COMPARISON_FACTORS
except ImportError:
    from models import (
        JudgeCompareRequest,
        JudgeResult,
        HealthResponse,
    )
    from service import JudgeService, COMPARISON_FACTORS

logger = logging.getLogger("judge_agent.router")

router = APIRouter(prefix="/judge", tags=["Judge Agent"])


@router.post("/compare", response_model=JudgeResult)
async def compare_responses(req: JudgeCompareRequest):
    """
    Execute real LLM pairwise comparison between Model A and Model B responses.
    Evaluates both responses independently across 6 factors concurrently using gpt-oss:120b-cloud.
    """
    try:
        result = await JudgeService.compare(req)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during comparison: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Judge comparison failed: {str(e)}",
        )


@router.get("/health", response_model=HealthResponse)
async def judge_health_check():
    """
    Health and status check for the Judge Agent service.
    """
    return HealthResponse(
        status="healthy",
        service="JudgeAI Pairwise Judge Agent",
        judge_model=JudgeService.DEFAULT_JUDGE_MODEL,
        provider="ollama",
        factors=[f["factor"] for f in COMPARISON_FACTORS],
    )


@router.get("/factors")
async def list_comparison_factors() -> List[Dict[str, Any]]:
    """
    Returns the metadata, description, and weights of the 6 evaluation factors.
    """
    return [
        {
            "factor": f["factor"],
            "label": f["label"],
            "color": f["color"],
            "weight": f["weight"],
            "description": f["description"],
        }
        for f in COMPARISON_FACTORS
    ]
