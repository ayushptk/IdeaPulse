"""Indie Hackers pipeline — orchestrates the Indie Hackers idea discovery flow."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.pipelines.base_pipeline import run_platform_pipeline
from app.services.indiehackers_service import fetch_indiehackers_posts

async def run_indie_pipeline(session: AsyncSession) -> int:
    """Execute the full Indie Hackers pipeline: Fetch → Filter → Cluster → AI → Score → Store."""
    return await run_platform_pipeline(
        fetch_fn=fetch_indiehackers_posts,
        platform="indiehackers",
        session=session,
    )
