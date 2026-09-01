"""
Evaluation Agent Backend Package
Provides evaluation orchestration, rubric aggregation, and run history.
"""

from .models import (
    RubricScoreModel,
    EvaluationRunRequest,
    EvaluationRunResponse,
    EvaluationListResponse,
    DashboardStatsResponse,
)
from .service import EvaluationOrchestrator, evaluation_service
from .router import router

__all__ = [
    "RubricScoreModel",
    "EvaluationRunRequest",
    "EvaluationRunResponse",
    "EvaluationListResponse",
    "DashboardStatsResponse",
    "EvaluationOrchestrator",
    "evaluation_service",
    "router",
]
