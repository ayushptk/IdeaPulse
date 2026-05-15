"""
Async SQLAlchemy engine, session factory, and base model.
Uses asyncpg driver for non-blocking PostgreSQL access.
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()

# ── Engine — connection pool with sensible production defaults ──
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,  # Verify connections before checkout
)

# ── Session factory — each request gets its own isolated session ──
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""
    pass


async def get_db() -> AsyncSession:
    """
    FastAPI dependency — yields a transactional session.
    Commits on success, rolls back on failure, always closes.
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Create all tables and seed initial data on startup."""
    async with engine.begin() as conn:
        from app.models import Idea, Platform, RawPost, user  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Dispose engine pool on shutdown."""
    await engine.dispose()
