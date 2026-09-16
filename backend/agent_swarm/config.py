import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Ollama Configuration
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    # The orchestrator model that plans and synthesizes
    ORCHESTRATOR_MODEL: str = os.getenv("SWARM_ORCHESTRATOR_MODEL", os.getenv("OLLAMA_MODEL", "gpt-oss:120b-cloud"))

    # Available sub-agent cloud models (assigned by orchestrator)
    AGENT_MODELS: list[str] = [
        "deepseek-v4-pro:cloud",
        "glm-5.2:cloud",
        "minimax-m3:cloud",
        "deepseek-v4-flash:cloud",
        "glm-5.1:cloud",
        "nemotron-3-super:cloud",
        "gemma4:cloud",
        "minimax-m2.7:cloud",
    ]

    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "5002"))

    # MongoDB Configuration
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_SWARM_DB_NAME", os.getenv("MONGODB_DB_NAME", "judgeai_swarm"))
    MONGODB_COLLECTION: str = os.getenv("MONGODB_SWARM_COLLECTION", "swarm_sessions")

    # JWT Authentication
    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY",
        "judgeai-dev-secret-key-change-in-production-e938bf8c991a47290bc"
    )
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    COOKIE_ACCESS_NAME: str = os.getenv("COOKIE_ACCESS_NAME", "judgeai_access_token")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

