from datetime import datetime, timezone
from typing import Any
from pydantic import BaseModel, Field


class DatabaseHealth(BaseModel):
    status: str
    latency_ms: float | None = None
    database_name: str | None = None


class HealthResponse(BaseModel):
    status: str = "healthy"
    project: str
    version: str = "0.1.0"
    environment: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    database: DatabaseHealth
    details: dict[str, Any] = Field(default_factory=dict)
