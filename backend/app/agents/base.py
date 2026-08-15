"""Base interface and data structures for JudgeAI evaluation agents."""

from abc import ABC, abstractmethod
from typing import Any
from pydantic import BaseModel, Field


class JudgeEvaluationInput(BaseModel):
    """Input payload provided to a judge agent for evaluation."""
    task_description: str
    output_text: str
    reference_answer: str | None = None
    model_id: str
    rubric_params: dict[str, Any] = Field(default_factory=dict)


class JudgeEvaluationResult(BaseModel):
    """Normalized scoring output produced by a judge agent."""
    rubric_name: str
    score_value: float = Field(..., ge=0.0, le=10.0, description="Normalized score 0-10 or 0-1")
    reasoning: str
    judge_model_used: str
    confidence: float | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class BaseJudgeAgent(ABC):
    """Abstract base class for all rubric-specific judge agents."""

    rubric_name: str = "base"

    @abstractmethod
    async def evaluate(self, eval_input: JudgeEvaluationInput) -> JudgeEvaluationResult:
        """Execute judgment against an LLM output and return structured score and reasoning."""
        pass
