"""Reddit pipeline — orchestrates the Reddit idea discovery flow."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.pipelines.base_pipeline import run_platform_pipeline
from app.services.reddit_service import fetch_reddit_posts

async def run_reddit_pipeline(session: AsyncSession) -> int:
    """Execute the full Reddit pipeline: Fetch → Filter → Cluster → AI → Score → Store."""
    return await run_platform_pipeline(
        fetch_fn=fetch_reddit_posts,
        platform="reddit",
        session=session,
    )
