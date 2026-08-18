"""
FastAPI Router for Advisor Agent Endpoints.
Prefix: /advisor
"""

from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query

try:
    from .catalog import get_catalog, get_model_by_id, ModelToolProfile
    from .models import (
        TaskAnalysisRequest,
        ExtractedRequirements,
        RecommendationResponse,
        PromptGenerationRequest,
        PromptGenerationResponse,
    )
    from .service import AdvisorService
except ImportError:
    from catalog import get_catalog, get_model_by_id, ModelToolProfile
    from models import (
        TaskAnalysisRequest,
        ExtractedRequirements,
        RecommendationResponse,
        PromptGenerationRequest,
        PromptGenerationResponse,
    )
    from service import AdvisorService

router = APIRouter(prefix="/advisor", tags=["Advisor Agent"])


@router.get("/health")
async def advisor_health_check():
    """
    Returns service health status and active reasoning model.
    """
    return {
        "status": "healthy",
        "service": "JudgeAI Advisor Agent",
        "reasoning_model": AdvisorService.REASONING_MODEL,
        "features": [
            "Multidimensional Task Understanding",
            "Verified Free & Paid Catalog Matching",
            "Model & Tool Recommendations",
            "Model-Specific Prompt Optimization",
        ],
    }


@router.get("/models", response_model=List[ModelToolProfile])
async def list_catalog_models(
    tier: Optional[str] = Query(None, description="Filter by pricing tier: free, free_tier, paid, subscription_required"),
    is_free: Optional[bool] = Query(None, description="Filter by free accessibility"),
    supports_vision: Optional[bool] = Query(None, description="Filter by multimodal vision support"),
    supports_images: Optional[bool] = Query(None, description="Filter by image generation capability"),
):
    """
    Returns verified ground-truth AI model and tool profiles from the catalog.
    """
    return get_catalog(
        tier=tier,
        is_free=is_free,
        supports_vision=supports_vision,
        supports_images=supports_images,
    )


@router.get("/models/{model_id}", response_model=ModelToolProfile)
async def get_model_profile(model_id: str):
    """
    Retrieve full verified catalog profile for a single model or tool.
    """
    profile = get_model_by_id(model_id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found in verified catalog")
    return profile


@router.post("/analyze", response_model=ExtractedRequirements)
async def analyze_task_requirements(req: TaskAnalysisRequest):
    """
    Analyzes user task input and extracts structured multidimensional requirements and complexity.
    """
    return await AdvisorService.analyze_task(req)


@router.post("/recommend", response_model=RecommendationResponse)
async def recommend_models_and_tools(req: TaskAnalysisRequest):
    """
    Flagship Endpoint: Evaluates requirements against catalog ground truth and generates ranked FREE and PAID options,
    match scores (0-100), task-specific strengths, limitations, and balanced trade-off analysis using gpt-oss:120b-cloud.
    """
    return await AdvisorService.recommend_models(req)


@router.post("/generate-prompt", response_model=PromptGenerationResponse)
async def generate_model_prompt(req: PromptGenerationRequest):
    """
    Generates a tailored, copy-ready prompt specifically optimized for the user's selected model/tool.
    Preserves user intent, adds domain context, output schemas, and model-specific directives.
    """
    return await AdvisorService.generate_optimized_prompt(req)
