"""
IdeaForge AI — SaaS Idea Discovery Platform
=============================================

Main application entry point.

This FastAPI application:
  - Serves REST API endpoints for retrieving generated SaaS ideas
  - Runs background pipelines on a daily schedule
  - Supports manual pipeline triggers for testing
  - Auto-initializes the database schema on startup

Run with:
    uvicorn app.main:app --reload
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.config import get_settings
from app.database.db import close_db, init_db
from app.scheduler import start_scheduler, stop_scheduler

# ── Configure structured logging ──
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-8s │ %(name)-30s │ %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)
settings = get_settings()


# ─────────────────────────────────────────────────────────────────────────────
# Application Lifespan
# ─────────────────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup/shutdown lifecycle manager.

    Startup:
      1. Initialize database tables
      2. Start the background scheduler

    Shutdown:
      1. Stop the scheduler
      2. Close database connections
    """
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    # Startup
    await init_db()
    logger.info("✅ Database initialized")

    start_scheduler()
    logger.info("✅ Scheduler started")

    yield  # Application runs here

    # Shutdown
    stop_scheduler()
    await close_db()
    logger.info("👋 Shutdown complete")


# ─────────────────────────────────────────────────────────────────────────────
# FastAPI Application
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "AI-powered platform that discovers real-world problems from Reddit, "
        "Product Hunt, Hacker News, LinkedIn, and Indie Hackers — "
        "then generates actionable SaaS product ideas."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS — allow frontend access ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register API routes ──
app.include_router(router, prefix="/api/v1")


# ── Root endpoint ──
@app.get("/", tags=["System"])
async def root():
    """Root endpoint — confirms the API is running."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "api": "/api/v1",
    }