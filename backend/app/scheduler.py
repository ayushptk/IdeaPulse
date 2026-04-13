"""
Task scheduler — runs platform pipelines on a cron schedule.

Uses APScheduler with async support for non-blocking background jobs.
Default: all pipelines run daily at 6:00 AM UTC.
"""

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.config import get_settings
from app.database.db import async_session_factory

logger = logging.getLogger(__name__)
settings = get_settings()

scheduler = AsyncIOScheduler()


async def _run_all_pipelines_job():
    """
    Scheduled job — runs all configured platform pipelines sequentially.
    Creates its own database session (independent of request lifecycle).
    """
    from app.pipelines.hn_pipeline import run_hn_pipeline
    from app.pipelines.indie_pipeline import run_indie_pipeline
    from app.pipelines.linkedin_pipeline import run_linkedin_pipeline
    from app.pipelines.producthunt_pipeline import run_producthunt_pipeline
    from app.pipelines.reddit_pipeline import run_reddit_pipeline

    pipelines = [
        ("reddit", run_reddit_pipeline),
        ("producthunt", run_producthunt_pipeline),
        ("hn", run_hn_pipeline),
        ("linkedin", run_linkedin_pipeline),
        ("indie", run_indie_pipeline),
    ]

    logger.info("Scheduler: starting daily pipeline run...")
    total_ideas = 0

    for name, pipeline_fn in pipelines:
        async with async_session_factory() as session:
            try:
                count = await pipeline_fn(session)
                total_ideas += count
                logger.info(f"Scheduler: [{name}] generated {count} ideas")
            except Exception as e:
                logger.error(f"Scheduler: [{name}] failed: {e}")

    logger.info(f"Scheduler: daily run complete — {total_ideas} total new ideas")


def start_scheduler():
    """Start the background scheduler with configured cron trigger."""
    trigger = CronTrigger(
        hour=settings.PIPELINE_CRON_HOUR,
        minute=settings.PIPELINE_CRON_MINUTE,
        timezone="UTC",
    )

    scheduler.add_job(
        _run_all_pipelines_job,
        trigger=trigger,
        id="daily_pipeline_run",
        name="Daily SaaS Idea Discovery",
        replace_existing=True,
        max_instances=1,  # Prevent overlapping runs
    )

    scheduler.start()
    logger.info(
        f"Scheduler: started — running daily at "
        f"{settings.PIPELINE_CRON_HOUR:02d}:{settings.PIPELINE_CRON_MINUTE:02d} UTC"
    )


def stop_scheduler():
    """Gracefully shut down the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler: stopped")
