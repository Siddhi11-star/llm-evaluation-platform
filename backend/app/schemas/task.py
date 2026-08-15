from datetime import datetime, timezone
from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.user import PyObjectId

ProviderType = Literal["ollama_local", "ollama_cloud", "groq", "huggingface", "custom"]


class TaskEmbeddingBase(BaseModel):
    """Schema matching the stable field names contract for JudgeAI."""
    task_description: str
    output_text: str | None = None
    model_id: str
    score_value: float | None = None
    reasoning: str | None = None
    judge_model_used: str | None = None
    cost_per_1k_tokens: float | None = None
    avg_latency_ms: float | None = None
    provider: ProviderType = "groq"


class TaskEmbeddingCreate(TaskEmbeddingBase):
    """Schema for inserting a task embedding into the task_embeddings collection."""
    task_embedding: list[float] = Field(..., description="Vector embedding array (e.g. 1536 dims)")
    metadata: dict[str, Any] = Field(default_factory=dict)


class TaskEmbeddingResponse(TaskEmbeddingBase):
    """Response schema for task embeddings retrieved or similarity-searched."""
    id: PyObjectId = Field(alias="_id")
    similarity_score: float | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class TaskQuery(BaseModel):
    """Schema for querying similar past evaluation tasks via vector similarity."""
    task_description: str
    limit: int = Field(default=5, ge=1, le=50)
    provider_filter: ProviderType | None = None
    model_id_filter: str | None = None
