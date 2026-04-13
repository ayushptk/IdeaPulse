import logging
from datetime import datetime, time, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.ai_service import extract_linkedin_founder_ideas
from app.database.db import get_db
from app.models.idea_model import Idea
from app.pipelines.hn_pipeline import run_hn_pipeline
from app.pipelines.indie_pipeline import run_indie_pipeline
from app.pipelines.linkedin_pipeline import run_linkedin_pipeline
from app.pipelines.producthunt_pipeline import run_producthunt_pipeline
from app.pipelines.reddit_pipeline import run_reddit_pipeline
from app.schemas import (
    HealthResponse,
    IdeaResponse,
    LinkedInExtractRequest,
    LinkedInFounderIdea,
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
    "hn": run_hn_pipeline,
    "linkedin": run_linkedin_pipeline,
    "indie": run_indie_pipeline,
}

PLATFORM_ALIASES = {
    "indiehackers": "indie",
    "hackernews": "hn",
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
    refresh: bool = Query(
        default=False,
        description="If true, runs the platform pipeline when no ideas exist yet",
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve the top-N highest-scored ideas for a given platform.

    Supported platforms: reddit, producthunt, hn, linkedin, indie
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

    # Optional: run pipeline on-demand for empty platforms
    if refresh and not ideas:
        try:
            pipeline_fn = PLATFORM_PIPELINES[resolved]
            await pipeline_fn(db)
        except Exception as e:
            logger.error(f"Pipeline [{resolved}] refresh failed: {e}")
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


@router.get(
    "/ideas/hn/daily",
    response_model=PlatformIdeasResponse,
    tags=["Ideas"],
    summary="Get today's 5 Hacker News SaaS ideas",
)
async def get_daily_hn_ideas(
    db: AsyncSession = Depends(get_db),
):
    """
    Return up to 5 ideas generated today from the HN pipeline.
    If no ideas were generated today yet, falls back to latest 5 HN ideas.
    """
    utc_today_start = datetime.combine(
        datetime.now(timezone.utc).date(),
        time.min,
        tzinfo=timezone.utc,
    )

    result = await db.execute(
        select(Idea)
        .where(Idea.platform == "hn", Idea.created_at >= utc_today_start)
        .order_by(desc(Idea.score), desc(Idea.created_at))
        .limit(5)
    )
    ideas = result.scalars().all()

    # Fallback so the endpoint always returns useful data.
    if not ideas:
        fallback_result = await db.execute(
            select(Idea)
            .where(Idea.platform == "hn")
            .order_by(desc(Idea.score), desc(Idea.created_at))
            .limit(5)
        )
        ideas = fallback_result.scalars().all()

    return PlatformIdeasResponse(
        platform="hn",
        count=len(ideas),
        ideas=[IdeaResponse.model_validate(idea) for idea in ideas],
    )


@router.post(
    "/ideas/linkedin/extract",
    response_model=list[LinkedInFounderIdea],
    tags=["Ideas"],
    summary="Extract top 3 founder-style SaaS ideas from LinkedIn post text",
)
async def extract_linkedin_ideas(payload: LinkedInExtractRequest):
    """
    Analyze one LinkedIn post with a founder/PMF-focused prompt and
    return exactly the top 3 SaaS opportunities (when available).
    """
    ideas = await extract_linkedin_founder_ideas(payload.post_text)
    if not ideas:
        raise HTTPException(
            status_code=422,
            detail="Could not extract ideas from the provided LinkedIn post text.",
        )
    return ideas


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

