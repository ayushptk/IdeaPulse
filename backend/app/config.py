"""
Application configuration loaded from environment variables.
Uses pydantic-settings for type-safe, validated configuration.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Central configuration — all values sourced from .env or environment."""

    # ── Application ──
    APP_NAME: str = "IdeaForge AI — SaaS Idea Discovery Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ── Database ──
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ideaforge"

    # ── OpenAI ──
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_MAX_TOKENS: int = 4096

    # ── Reddit API ──
    REDDIT_CLIENT_ID: str = ""
    REDDIT_CLIENT_SECRET: str = ""
    REDDIT_USER_AGENT: str = "IdeaForge/1.0"

    # ── Twitter / X API ──
    TWITTER_BEARER_TOKEN: str = ""

    # ── Product Hunt API ──
    PRODUCTHUNT_API_TOKEN: str = ""

    # ── LinkedIn (via Proxycurl or similar) ──
    LINKEDIN_API_KEY: str = ""

    # ── Pipeline Settings ──
    MAX_POSTS_PER_FETCH: int = 100
    TOP_IDEAS_COUNT: int = 5
    MIN_ENGAGEMENT_THRESHOLD: int = 10
    DUPLICATE_SIMILARITY_THRESHOLD: float = 0.85

    # ── Scheduling ──
    PIPELINE_CRON_HOUR: int = 6  # Run daily at 6 AM UTC
    PIPELINE_CRON_MINUTE: int = 0

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    """Cached singleton — avoids re-reading .env on every call."""
    return Settings()
