"""
Data models and schemas for the Judge Agent pairwise comparison service.
"""

from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class JudgeCompareRequest(BaseModel):
    """
    Input request to compare two model responses against the same prompt.
    """
    prompt: str = Field(..., description="The user prompt / task given to both models", min_length=1)
    model_a: str = Field(..., description="Name or identifier of Model A", min_length=1)
    model_b: str = Field(..., description="Name or identifier of Model B", min_length=1)
    response_a: str = Field(..., description="The actual output produced by Model A", min_length=1)
    response_b: str = Field(..., description="The actual output produced by Model B", min_length=1)
    judge_model: Optional[str] = Field("gpt-oss:120b-cloud", description="The LLM judge model to use")


class FactorScore(BaseModel):
    """
    Individual evaluation factor score for both models.
    """
    factor: str = Field(..., description="Unique factor identifier (e.g., accuracy, relevance)")
    label: str = Field(..., description="Human-readable factor title")
    scoreA: int = Field(..., ge=0, le=100, description="Model A score (0-100)")
    scoreB: int = Field(..., ge=0, le=100, description="Model B score (0-100)")
    winner: Literal["A", "B", "Tie"] = Field(..., description="Winner for this specific factor")
    color: str = Field("#38BDF8", description="Theme hex color for frontend rendering")
    rationale: str = Field(..., description="Concise explanation justifying the factor scores")


class JudgeResult(BaseModel):
    """
    Overall verdict and comprehensive comparison result.
    Fully compatible with frontend JudgeResult interface.
    """
    winnerName: str = Field(..., description="Display name of the winning model or 'Tie'")
    winnerKey: Literal["A", "B", "Tie"] = Field(..., description="Key of the winner ('A', 'B', or 'Tie')")
    overallA: int = Field(..., ge=0, le=100, description="Weighted composite score for Model A (0-100)")
    overallB: int = Field(..., ge=0, le=100, description="Weighted composite score for Model B (0-100)")
    margin: int = Field(..., ge=0, le=100, description="Absolute difference between overall scores")
    confidence: int = Field(..., ge=0, le=100, description="Judge confidence percentage in the verdict (0-100)")
    verdictSummary: str = Field(..., description="Concise executive summary of the evaluation decision")
    factors: List[FactorScore] = Field(..., description="Breakdown of all six evaluation factors")
    strengthsA: List[str] = Field(default_factory=list, description="Key strengths identified for Model A")
    weaknessesA: List[str] = Field(default_factory=list, description="Key weaknesses identified for Model A")
    strengthsB: List[str] = Field(default_factory=list, description="Key strengths identified for Model B")
    weaknessesB: List[str] = Field(default_factory=list, description="Key weaknesses identified for Model B")
    judge_model_used: str = Field("gpt-oss:120b-cloud", description="Judge model that performed the evaluation")
    provider: str = Field("ollama", description="Backend provider used for judging")


class HealthResponse(BaseModel):
    """
    Health check response model.
    """
    status: str = "healthy"
    service: str = "JudgeAI Pairwise Judge Agent"
    judge_model: str = "gpt-oss:120b-cloud"
    provider: str = "ollama"
    factors: List[str] = [
        "accuracy",
        "relevance",
        "reasoning",
        "clarity",
        "safety",
        "hallucination",
    ]
