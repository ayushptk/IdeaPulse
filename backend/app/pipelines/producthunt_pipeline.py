"""Product Hunt pipeline — orchestrates the Product Hunt idea discovery flow."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.pipelines.base_pipeline import run_platform_pipeline
from app.services.producthunt_service import fetch_producthunt_posts


async def run_producthunt_pipeline(session: AsyncSession) -> int:
    """Execute the full Product Hunt pipeline: Fetch → Filter → Cluster → AI → Score → Store."""
    return await run_platform_pipeline(
        fetch_fn=fetch_producthunt_posts,
        platform="producthunt",
        session=session,
    )
