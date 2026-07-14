"""
Task scheduler — runs platform pipelines on a cron schedule.

Uses APScheduler with async support for non-blocking background jobs.
Default: all pipelines run daily at 6:00 AM UTC.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.config import get_settings
from app.database.db import async_session_factory

logger = logging.getLogger(__name__)
settings = get_settings()

scheduler = AsyncIOScheduler()

_last_run_at: Optional[datetime] = None
_last_run_ideas: int = 0
_last_run_status: str = "never"

async def _run_all_pipelines_job():
    """
    Scheduled job — runs all configured platform pipelines sequentially.
    Creates its own database session (independent of request lifecycle).
    """
    global _last_run_at, _last_run_ideas, _last_run_status

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
    _last_run_status = "running"

    for name, pipeline_fn in pipelines:
        async with async_session_factory() as session:
            try:
                count = await pipeline_fn(session)
                total_ideas += count
                logger.info(f"Scheduler: [{name}] generated {count} ideas")
            except Exception as e:
                logger.error(f"Scheduler: [{name}] failed: {e}")

    _last_run_at = datetime.now(timezone.utc)
    _last_run_ideas = total_ideas
    _last_run_status = "success"
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
        max_instances=1,  
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

def get_scheduler_status() -> dict:
    """
    Return a snapshot of the scheduler state for the status API.
    Includes next_run (ISO timestamp), last_run, countdown_seconds,
    and the status of the last pipeline execution.
    """
    now = datetime.now(timezone.utc)

    next_run_iso: Optional[str] = None
    countdown_seconds: int = 0

    if scheduler.running:
        job = scheduler.get_job("daily_pipeline_run")
        if job and job.next_run_time:
            next_run_iso = job.next_run_time.isoformat()
            delta = job.next_run_time - now
            countdown_seconds = max(0, int(delta.total_seconds()))

    return {
        "scheduler_running": scheduler.running,
        "last_run_at": _last_run_at.isoformat() if _last_run_at else None,
        "last_run_ideas": _last_run_ideas,
        "last_run_status": _last_run_status,
        "next_run_at": next_run_iso,
        "countdown_seconds": countdown_seconds,
        "cron_schedule": f"Daily at {settings.PIPELINE_CRON_HOUR:02d}:{settings.PIPELINE_CRON_MINUTE:02d} UTC",
    }
