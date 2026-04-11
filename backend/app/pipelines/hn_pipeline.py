"""Hacker News pipeline — orchestrates the HN idea discovery flow."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.pipelines.base_pipeline import run_platform_pipeline
from app.services.hn_service import fetch_hn_posts


async def run_hn_pipeline(session: AsyncSession) -> int:
    """Execute the full HN pipeline: Fetch → Filter → Cluster → AI → Score → Store."""
    return await run_platform_pipeline(
        fetch_fn=fetch_hn_posts,
        platform="hn",
        session=session,
    )
