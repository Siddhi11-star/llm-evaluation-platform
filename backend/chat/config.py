import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Ollama Configuration
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "minimax-m3:cloud")
    USE_OLLAMA: bool = os.getenv("USE_OLLAMA", "true").lower() in ("true", "1", "t")
    OLLAMA_CLOUD_MODELS: list[str] = [
        "minimax-m3:cloud",
        "glm-5.2:cloud",
        "glm-5.1:cloud",
        "deepseek-v4-flash:cloud",
        "deepseek-v4-pro:cloud",
        "minimax-m2.7:cloud",
        "minimax-m2.5:cloud",
        "gpt-oss:120b-cloud",
        "gpt-oss:20b-cloud",
        "nemotron-3-super:cloud",
        "gemma4:cloud",
    ]

    # MiniMax Cloud API Configuration (Alternative / Fallback)
    MINIMAX_API_KEY: str = os.getenv("MINIMAX_API_KEY", "")
    MINIMAX_GROUP_ID: str = os.getenv("MINIMAX_GROUP_ID", "")
    MINIMAX_BASE_URL: str = os.getenv("MINIMAX_BASE_URL", "https://api.minimax.chat/v1")
    MINIMAX_MODEL: str = os.getenv("MINIMAX_MODEL", "MiniMax-Text-01")

    # MongoDB Configuration
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "judgeai_chat")

    # Server Configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
