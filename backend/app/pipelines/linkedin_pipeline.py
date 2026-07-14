"""LinkedIn pipeline — orchestrates the LinkedIn idea discovery flow."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.pipelines.base_pipeline import run_platform_pipeline
from app.services.linkedin_service import fetch_linkedin_posts

async def run_linkedin_pipeline(session: AsyncSession) -> int:
    """Execute the full LinkedIn pipeline: Fetch → Filter → Cluster → AI → Score → Store."""
    return await run_platform_pipeline(
        fetch_fn=fetch_linkedin_posts,
        platform="linkedin",
        session=session,
    )
