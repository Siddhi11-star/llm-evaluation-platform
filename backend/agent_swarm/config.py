import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Ollama Configuration
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    # The single orchestrator model that plans and synthesizes
    ORCHESTRATOR_MODEL: str = "gpt-oss:120b-cloud"

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

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
