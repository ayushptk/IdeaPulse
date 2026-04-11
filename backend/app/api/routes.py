
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database.db import get_db
from app.models.idea_model import Idea
from app.pipelines.hn_pipeline import run_hn_pipeline
from app.pipelines.indie_pipeline import run_indie_pipeline
from app.pipelines.linkedin_pipeline import run_linkedin_pipeline
from app.pipelines.producthunt_pipeline import run_producthunt_pipeline
from app.pipelines.reddit_pipeline import run_reddit_pipeline
from app.pipelines.twitter_pipeline import run_twitter_pipeline
from app.schemas import (
    HealthResponse,
    IdeaResponse,
    PipelineStatusResponse,
    PlatformIdeasResponse,
)

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter()

# ── Platform registry — maps URL slugs to pipeline functions ──
PLATFORM_PIPELINES = {
    "reddit": run_reddit_pipeline,
    "producthunt": run_producthunt_pipeline,
    "twitter": run_twitter_pipeline,
    "hn": run_hn_pipeline,
    "linkedin": run_linkedin_pipeline,
    "indie": run_indie_pipeline,
}

PLATFORM_ALIASES = {
    "indiehackers": "indie",
    "hackernews": "hn",
    "x": "twitter",
}


def _resolve_platform(platform: str) -> str:
    """Resolve platform aliases to canonical names."""
    platform = platform.lower().strip()
    return PLATFORM_ALIASES.get(platform, platform)


# ─────────────────────────────────────────────────────────────────────────────
# Health Check
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    System health check — verifies database connectivity.
    """
    try:
        await db.execute(select(1))
        db_status = "connected"
    except Exception:
        db_status = "disconnected"

    return HealthResponse(
        status="healthy" if db_status == "connected" else "degraded",
        version=settings.APP_VERSION,
        database=db_status,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Ideas Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/ideas/{platform}",
    response_model=PlatformIdeasResponse,
    tags=["Ideas"],
    summary="Get top ideas for a specific platform",
)
async def get_platform_ideas(
    platform: str,
    limit: int = Query(default=5, ge=1, le=50, description="Number of ideas to return"),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve the top-N highest-scored ideas for a given platform.

    Supported platforms: reddit, producthunt, twitter, hn, linkedin, indie
    """
    resolved = _resolve_platform(platform)

    if resolved not in PLATFORM_PIPELINES:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown platform '{platform}'. "
                   f"Supported: {', '.join(PLATFORM_PIPELINES.keys())}",
        )

    # Query for platform name matching (indie pipeline stores as "indiehackers")
    platform_db_name = "indiehackers" if resolved == "indie" else resolved

    result = await db.execute(
        select(Idea)
        .where(Idea.platform == platform_db_name)
        .order_by(desc(Idea.score), desc(Idea.created_at))
        .limit(limit)
    )
    ideas = result.scalars().all()

    return PlatformIdeasResponse(
        platform=resolved,
        count=len(ideas),
        ideas=[IdeaResponse.model_validate(idea) for idea in ideas],
    )


@router.get(
    "/ideas",
    response_model=list[PlatformIdeasResponse],
    tags=["Ideas"],
    summary="Get top ideas across all platforms",
)
async def get_all_ideas(
    limit: int = Query(default=5, ge=1, le=50, description="Ideas per platform"),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve top ideas from every platform in a single response."""
    all_platforms = []

    for platform_slug in PLATFORM_PIPELINES:
        platform_db_name = "indiehackers" if platform_slug == "indie" else platform_slug

        result = await db.execute(
            select(Idea)
            .where(Idea.platform == platform_db_name)
            .order_by(desc(Idea.score), desc(Idea.created_at))
            .limit(limit)
        )
        ideas = result.scalars().all()

        all_platforms.append(PlatformIdeasResponse(
            platform=platform_slug,
            count=len(ideas),
            ideas=[IdeaResponse.model_validate(idea) for idea in ideas],
        ))

    return all_platforms


# ─────────────────────────────────────────────────────────────────────────────
# Pipeline Trigger Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/pipelines/{platform}/run",
    response_model=PipelineStatusResponse,
    tags=["Pipelines"],
    summary="Manually trigger a platform pipeline",
)
async def trigger_pipeline(
    platform: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Manually trigger the idea discovery pipeline for a specific platform.
    Use this for testing or on-demand refreshes.
    """
    resolved = _resolve_platform(platform)

    if resolved not in PLATFORM_PIPELINES:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown platform '{platform}'. "
                   f"Supported: {', '.join(PLATFORM_PIPELINES.keys())}",
        )

    pipeline_fn = PLATFORM_PIPELINES[resolved]

    try:
        ideas_count = await pipeline_fn(db)
        return PipelineStatusResponse(
            platform=resolved,
            status="success",
            ideas_generated=ideas_count,
            message=f"Pipeline completed. {ideas_count} new ideas generated.",
        )
    except Exception as e:
        logger.error(f"Pipeline [{resolved}] failed: {e}")
        return PipelineStatusResponse(
            platform=resolved,
            status="error",
            ideas_generated=0,
            message=f"Pipeline failed: {str(e)}",
        )


@router.post(
    "/pipelines/run-all",
    response_model=list[PipelineStatusResponse],
    tags=["Pipelines"],
    summary="Trigger all platform pipelines",
)
async def trigger_all_pipelines(
    db: AsyncSession = Depends(get_db),
):
    """
    Run all platform pipelines sequentially.
    Returns status for each platform.
    """
    results = []

    for platform_slug, pipeline_fn in PLATFORM_PIPELINES.items():
        try:
            ideas_count = await pipeline_fn(db)
            results.append(PipelineStatusResponse(
                platform=platform_slug,
                status="success",
                ideas_generated=ideas_count,
                message=f"{ideas_count} new ideas generated.",
            ))
        except Exception as e:
            logger.error(f"Pipeline [{platform_slug}] failed: {e}")
            results.append(PipelineStatusResponse(
                platform=platform_slug,
                status="error",
                ideas_generated=0,
                message=f"Failed: {str(e)}",
            ))

    return results
