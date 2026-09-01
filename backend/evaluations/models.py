"""
Pydantic Schemas for Evaluation Agent Backend.
Compatible with frontend Evaluations.tsx and EvalDetail.tsx data contracts.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


class RubricScoreModel(BaseModel):
    key: str = Field(..., description="Rubric identifier (accuracy, relevance, reasoning, hallucination, safety, style)")
    label: str = Field(..., description="Human-readable rubric label")
    score: int = Field(..., ge=0, le=100, description="Evaluated score on a 0-100 scale")
    color: str = Field(..., description="Hex or CSS color token for UI rendering")
    weight: float = Field(default=1.0, ge=0.1, le=3.0, description="Rubric weighting multiplier")
    reasoning: str = Field(..., description="Detailed judge rationale and critique")
    judge_model_used: Optional[str] = Field(default="gpt-oss:120b-cloud", description="The LLM judge model used")
    provider: Optional[str] = Field(default="ollama", description="LLM inference provider")


class EvaluationRunRequest(BaseModel):
    task_name: str = Field(..., min_length=1, max_length=200, description="Evaluation task title or benchmark name")
    prompt_input: str = Field(..., min_length=1, description="Prompt, system instructions, or task criteria given to the model")
    model_output: str = Field(..., min_length=1, description="Model-generated response or code to evaluate")
    target_model: Optional[str] = Field(default="claude-3.5-sonnet", description="Target model ID that generated the output")
    judge_model: Optional[str] = Field(default="gpt-oss:120b-cloud", description="Judge model used for evaluation")
    user_id: Optional[str] = Field(default=None, description="Authenticated User ID / Email")
    enabled_rubrics: Optional[List[str]] = Field(
        default=None,
        description="Optional subset of rubrics to evaluate. Defaults to all 6 rubrics.",
    )
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Optional custom metadata tags")


class EvaluationRunResponse(BaseModel):
    id: str = Field(..., description="Unique evaluation run ID")
    user_id: Optional[str] = Field(default=None, description="Authenticated User ID / Email")
    task: str = Field(..., description="Task title")
    model: str = Field(..., description="Evaluated target model ID")
    score: int = Field(..., ge=0, le=100, description="Composite weighted evaluation score (0-100)")
    judges: int = Field(default=6, description="Number of active rubric judges evaluated")
    status: Literal["Passed", "Flagged"] = Field(..., description="Overall verification status")
    ts: str = Field(default="Just now", description="Human-readable relative timestamp")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="UTC timestamp of evaluation run")
    prompt: str = Field(..., description="Evaluated prompt input")
    response: str = Field(..., description="Evaluated model output")
    rubrics: List[RubricScoreModel] = Field(..., description="List of individual 6 rubric score breakdowns")
    judge_model: str = Field(default="gpt-oss:120b-cloud", description="LLM judge model used")
    consensus_confidence: float = Field(default=98.4, description="Statistical judge agreement percentage")
    summary: Optional[str] = Field(None, description="Executive synthesis of evaluation results")


class EvaluationListResponse(BaseModel):
    total: int
    page: int
    limit: int
    runs: List[EvaluationRunResponse]


class DashboardStatsResponse(BaseModel):
    total_evaluations: int
    passed_count: int
    flagged_count: int
    pass_rate: float
    average_score: float
    active_judges_count: int = 6
    planned_judge_model: str = "gpt-oss:120b-cloud"
