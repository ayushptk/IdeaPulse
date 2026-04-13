"""
Hacker News data collection service.

Uses official Hacker News Firebase API endpoints:
  - /v0/newstories.json
  - /v0/askstories.json
  - /v0/showstories.json
  - /v0/topstories.json
  - /v0/item/{id}.json
"""

import logging
from datetime import datetime, timezone
from typing import List

import httpx

from app.config import get_settings
from app.schemas import NormalizedPost

logger = logging.getLogger(__name__)
settings = get_settings()

HN_BASE_URL = "https://hacker-news.firebaseio.com/v0"
FEED_ENDPOINTS = (
    "newstories",
    "askstories",
    "showstories",
    "topstories",
)


async def _fetch_feed_ids(client: httpx.AsyncClient, feed: str) -> List[int]:
    """Fetch story IDs from a single HN feed endpoint."""
    response = await client.get(f"{HN_BASE_URL}/{feed}.json")
    response.raise_for_status()
    data = response.json()
    return data if isinstance(data, list) else []


async def _fetch_item(client: httpx.AsyncClient, item_id: int) -> dict | None:
    """Fetch details for one HN item by ID."""
    response = await client.get(f"{HN_BASE_URL}/item/{item_id}.json")
    response.raise_for_status()
    item = response.json()
    return item if isinstance(item, dict) else None


def _to_iso_timestamp(unix_ts: int | None) -> str:
    """Convert Unix timestamp (seconds) to ISO-8601 UTC."""
    if not unix_ts:
        return datetime.now(timezone.utc).isoformat()
    return datetime.fromtimestamp(unix_ts, tz=timezone.utc).isoformat()


def _parse_item(item: dict) -> NormalizedPost | None:
    """Convert a Firebase item payload to a NormalizedPost."""
    if item.get("type") != "story":
        return None

    title = (item.get("title") or "").strip()
    body = (item.get("text") or "").strip()

    if not title:
        return None

    combined = f"{title}\n{body}".strip() if body else title
    if len(combined) < 20:
        return None

    score = int(item.get("score") or 0)
    comments = int(item.get("descendants") or 0)
    engagement = score + comments
    item_id = item.get("id")
    item_url = item.get("url") or f"https://news.ycombinator.com/item?id={item_id}"

    return NormalizedPost(
        source="hn",
        text=combined[:2000],
        engagement=engagement,
        timestamp=_to_iso_timestamp(item.get("time")),
        url=item_url,
    )


async def fetch_hn_posts() -> List[NormalizedPost]:
    """
    Main entry point — fetches HN stories from official Firebase feeds.
    Mixes new/ask/show/top feeds for broad discovery and normalizes them.
    """
    posts: List[NormalizedPost] = []
    seen_ids: set[int] = set()
    max_per_feed = max(10, settings.MAX_POSTS_PER_FETCH // len(FEED_ENDPOINTS))

    async with httpx.AsyncClient(timeout=30.0) as client:
        for feed in FEED_ENDPOINTS:
            try:
                ids = await _fetch_feed_ids(client, feed)
                logger.info(f"HN: feed '{feed}' returned {len(ids)} ids")
            except httpx.HTTPError as e:
                logger.error(f"HN: feed '{feed}' fetch failed: {e}")
                continue

            for item_id in ids[:max_per_feed]:
                if item_id in seen_ids:
                    continue
                seen_ids.add(item_id)

                try:
                    item = await _fetch_item(client, item_id)
                except httpx.HTTPError as e:
                    logger.warning(f"HN: item {item_id} fetch failed: {e}")
                    continue

                if not item:
                    continue

                parsed = _parse_item(item)
                if parsed:
                    posts.append(parsed)

                if len(posts) >= settings.MAX_POSTS_PER_FETCH:
                    logger.info(
                        f"HN: hit MAX_POSTS_PER_FETCH={settings.MAX_POSTS_PER_FETCH}"
                    )
                    return posts

    logger.info(f"HN: total {len(posts)} normalized posts collected")
    return posts
