"""
Configuration for Python AI Worker
Loads environment variables and provides settings
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load .env from project root
project_root = Path(__file__).parent.parent
load_dotenv(project_root / ".env")


class Settings(BaseSettings):
    """Application settings"""

    # Redis Configuration
    redis_host: str = os.getenv("REDIS_HOST", "localhost")
    redis_port: int = int(os.getenv("REDIS_PORT", "6379"))
    redis_db: int = int(os.getenv("REDIS_DB", "0"))

    # Celery Configuration
    celery_broker_url: str = f"redis://{redis_host}:{redis_port}/{redis_db}"
    celery_result_backend: str = f"redis://{redis_host}:{redis_port}/{redis_db}"

    # Anthropic API
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")

    # Vector Store
    chroma_persist_directory: str = os.getenv(
        "CHROMA_PERSIST_DIR",
        str(project_root / "data" / "chroma")
    )

    # Document Processing
    max_document_size_mb: int = int(os.getenv("MAX_DOCUMENT_SIZE_MB", "50"))

    # LLM Settings
    default_model: str = os.getenv("DEFAULT_MODEL", "claude-3-5-sonnet-20241022")
    max_tokens: int = int(os.getenv("MAX_TOKENS", "8000"))
    temperature: float = float(os.getenv("TEMPERATURE", "0.7"))

    class Config:
        case_sensitive = False


# Singleton settings instance
settings = Settings()


# Celery configuration dict
celery_config = {
    "broker_url": settings.celery_broker_url,
    "result_backend": settings.celery_result_backend,
    "task_serializer": "json",
    "accept_content": ["json"],
    "result_serializer": "json",
    "timezone": "UTC",
    "enable_utc": True,
    "task_track_started": True,
    "task_time_limit": 3600,  # 1 hour max per task
    "worker_prefetch_multiplier": 1,
}
