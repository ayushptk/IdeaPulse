"""
Application configuration loaded from environment variables.
Uses pydantic-settings for type-safe, validated configuration.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Central configuration — all values sourced from .env or environment."""

    APP_NAME: str = "IdeaForge AI — SaaS Idea Discovery Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ideaforge"

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"
    GEMINI_MAX_TOKENS: int = 4096

    REDDIT_CLIENT_ID: str = ""
    REDDIT_CLIENT_SECRET: str = ""
    REDDIT_USER_AGENT: str = "IdeaForge/1.0"

    PRODUCTHUNT_API_KEY: str = ""
    PRODUCTHUNT_API_SECRET: str = ""
    PRODUCTHUNT_API_TOKEN: str = ""  

    LINKEDIN_API_KEY: str = ""

    MAX_POSTS_PER_FETCH: int = 100
    TOP_IDEAS_COUNT: int = 5
    MIN_ENGAGEMENT_THRESHOLD: int = 1
    DUPLICATE_SIMILARITY_THRESHOLD: float = 0.85

    PIPELINE_CRON_HOUR: int = 6  
    PIPELINE_CRON_MINUTE: int = 0

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

@lru_cache()
def get_settings() -> Settings:
    """Cached singleton — avoids re-reading .env on every call."""
    return Settings()
