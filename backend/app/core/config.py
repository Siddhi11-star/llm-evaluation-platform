import json
from typing import Annotated, Any, Literal
from pydantic import AnyHttpUrl, BeforeValidator, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_cors_origins(v: Any) -> list[str]:
    """Parse CORS origins from a list, comma-separated string, or JSON array."""
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",") if i.strip()]
    elif isinstance(v, str) and v.startswith("["):
        try:
            return json.loads(v)
        except Exception:
            return [v.strip()]
    elif isinstance(v, list):
        return [str(origin).rstrip("/") for origin in v]
    return []


class Settings(BaseSettings):
    """Application settings loaded from environment and .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    # General App Configuration
    PROJECT_NAME: str = "JudgeAI Evaluation Platform"
    ENVIRONMENT: Literal["development", "staging", "production", "test"] = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # Database Configuration (Async MongoDB / Motor)
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "judgeai_eval"

    # Security & JWT Auth
    JWT_SECRET_KEY: str = "development_jwt_secret_key_change_in_production_judgeai_eval_platform"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # CORS Configuration
    BACKEND_CORS_ORIGINS: Annotated[list[str], BeforeValidator(parse_cors_origins)] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8443",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8443",
    ]

    # MongoDB Atlas Vector Search
    VECTOR_SEARCH_INDEX_NAME: str = "task_embeddings_vector_index"
    TASK_EMBEDDINGS_COLLECTION: str = "task_embeddings"
    EMBEDDING_DIMENSION: int = 1536
    EMBEDDING_SIMILARITY_METRIC: str = "cosine"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


settings = Settings()
