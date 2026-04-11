"""
Base pipeline — shared orchestration logic for all platforms.

Every platform pipeline follows the same flow:
  Fetch → Filter → Cluster → Generate Ideas → Score → Store

This module implements the shared Store step and the orchestration template.
"""

import logging
from typing import Callable, Coroutine, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ai_service import generate_ideas
from app.core.cluster_service import cluster_posts
from app.core.filter_service import filter_posts
from app.core.scoring_service import generate_content_hash, score_ideas
from app.config import get_settings
from app.models.idea_model import Idea
from app.schemas import GeneratedIdea, NormalizedPost

logger = logging.getLogger(__name__)
settings = get_settings()


async def store_ideas(
    session: AsyncSession,
    ideas: List[GeneratedIdea],
    platform: str,
) -> int:
    """
    Persist scored ideas to the database.
    Skips duplicates using content hash.

    Returns:
        Number of new ideas stored.
    """
    stored_count = 0

    for idea in ideas[:settings.TOP_IDEAS_COUNT]:
        content_hash = generate_content_hash(idea)

        # Check for existing duplicate
        existing = await session.execute(
            select(Idea).where(Idea.content_hash == content_hash)
        )
        if existing.scalar_one_or_none():
            logger.debug(f"Store: skipping duplicate idea (hash={content_hash[:12]}...)")
            continue

        db_idea = Idea(
            platform=platform,
            problem=idea.problem,
            users=idea.users,
            idea=idea.idea,
            features=idea.features,
            monetization=idea.monetization,
            score=idea.score,
            content_hash=content_hash,
        )
        session.add(db_idea)
        stored_count += 1

    await session.commit()
    logger.info(f"Store: saved {stored_count} new ideas for {platform}")
    return stored_count


async def run_platform_pipeline(
    fetch_fn: Callable[[], Coroutine[None, None, List[NormalizedPost]]],
    platform: str,
    session: AsyncSession,
) -> int:
    """
    Universal pipeline orchestrator.

    Args:
        fetch_fn: Async function that returns NormalizedPost list.
        platform: Platform identifier string.
        session: Active database session.

    Returns:
        Number of ideas generated and stored.

    Flow:
        1. Fetch raw posts from platform
        2. Filter for quality and relevance
        3. Cluster by topic similarity
        4. Generate SaaS ideas via AI
        5. Score and rank ideas
        6. Store top ideas to database
    """
    logger.info(f"Pipeline [{platform}]: starting...")

    # Step 1: Fetch
    try:
        posts = await fetch_fn()
        if not posts:
            logger.warning(f"Pipeline [{platform}]: no posts fetched")
            return 0
        logger.info(f"Pipeline [{platform}]: fetched {len(posts)} posts")
    except Exception as e:
        logger.error(f"Pipeline [{platform}]: fetch failed: {e}")
        return 0

    # Step 2: Filter
    filtered = filter_posts(posts)
    if not filtered:
        logger.warning(f"Pipeline [{platform}]: all posts filtered out")
        return 0
    logger.info(f"Pipeline [{platform}]: {len(filtered)} posts passed filters")

    # Step 3: Cluster
    clusters = cluster_posts(filtered)
    if not clusters:
        logger.warning(f"Pipeline [{platform}]: clustering produced no results")
        return 0
    logger.info(f"Pipeline [{platform}]: {len(clusters)} clusters formed")

    # Step 4: Generate ideas via AI
    ideas = await generate_ideas(clusters, platform)
    if not ideas:
        logger.warning(f"Pipeline [{platform}]: AI generated no ideas")
        return 0
    logger.info(f"Pipeline [{platform}]: {len(ideas)} ideas generated")

    # Step 5: Score and rank
    scored_ideas = score_ideas(ideas)
    logger.info(f"Pipeline [{platform}]: ideas scored, top={scored_ideas[0].score}")

    # Step 6: Store
    stored = await store_ideas(session, scored_ideas, platform)
    logger.info(f"Pipeline [{platform}]: complete — {stored} new ideas stored")

    return stored
