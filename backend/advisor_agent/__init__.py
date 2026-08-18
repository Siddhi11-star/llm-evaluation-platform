"""
Advisor Agent Package for AI & Model Recommendations and Prompt Optimization.
"""

from .catalog import MODEL_TOOL_CATALOG, get_catalog, get_model_by_id
from .models import (
    TaskAnalysisRequest,
    ExtractedRequirements,
    RecommendationItem,
    RecommendationResponse,
    PromptGenerationRequest,
    PromptGenerationResponse,
)
from .service import AdvisorService, advisor_service

__all__ = [
    "MODEL_TOOL_CATALOG",
    "get_catalog",
    "get_model_by_id",
    "TaskAnalysisRequest",
    "ExtractedRequirements",
    "RecommendationItem",
    "RecommendationResponse",
    "PromptGenerationRequest",
    "PromptGenerationResponse",
    "AdvisorService",
    "advisor_service",
]
