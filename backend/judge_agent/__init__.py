"""
Judge Agent Package.
Provides pairwise evaluation between two AI model responses using gpt-oss:120b-cloud.
"""

from .models import (
    JudgeCompareRequest,
    FactorScore,
    JudgeResult,
    HealthResponse,
)
from .service import JudgeService, COMPARISON_FACTORS
from .router import router

__all__ = [
    "JudgeCompareRequest",
    "FactorScore",
    "JudgeResult",
    "HealthResponse",
    "JudgeService",
    "COMPARISON_FACTORS",
    "router",
]
