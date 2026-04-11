"""Twitter pipeline — orchestrates the Twitter/X idea discovery flow."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.pipelines.base_pipeline import run_platform_pipeline
from app.services.twitter_service import fetch_twitter_posts


async def run_twitter_pipeline(session: AsyncSession) -> int:
    """Execute the full Twitter pipeline: Fetch → Filter → Cluster → AI → Score → Store."""
    return await run_platform_pipeline(
        fetch_fn=fetch_twitter_posts,
        platform="twitter",
        session=session,
    )
