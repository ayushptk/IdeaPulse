"""
Hacker News data collection service.

Uses the official HN Algolia API (free, no auth required).
Fetches top stories, Show HN posts, and Ask HN discussions.
"""

import logging
from datetime import datetime, timezone
from typing import List

import httpx

from app.config import get_settings
from app.schemas import NormalizedPost

logger = logging.getLogger(__name__)
settings = get_settings()

HN_ALGOLIA_URL = "https://hn.algolia.com/api/v1"

# ── Search categories for diverse problem discovery ──
SEARCH_QUERIES = [
    {"query": "Show HN", "tags": "show_hn"},
    {"query": "Ask HN", "tags": "ask_hn"},
    {"query": "frustrated tool software", "tags": "story"},
    {"query": "I wish there was", "tags": "story"},
    {"query": "looking for alternative", "tags": "story"},
    {"query": "SaaS idea startup", "tags": "story"},
]


async def _search_hn(
    client: httpx.AsyncClient,
    query: str,
    tags: str,
    hits_per_page: int = 20,
) -> List[dict]:
    """Search Hacker News via Algolia API."""
    params = {
        "query": query,
        "tags": tags,
        "hitsPerPage": hits_per_page,
        "numericFilters": "points>5",  # Filter out low-quality posts
    }
    response = await client.get(f"{HN_ALGOLIA_URL}/search_by_date", params=params)
    response.raise_for_status()
    return response.json().get("hits", [])


async def _fetch_top_stories(client: httpx.AsyncClient, limit: int = 30) -> List[dict]:
    """Fetch current top stories from HN front page."""
    response = await client.get(f"{HN_ALGOLIA_URL}/search", params={
        "tags": "front_page",
        "hitsPerPage": limit,
    })
    response.raise_for_status()
    return response.json().get("hits", [])


def _parse_hit(hit: dict) -> NormalizedPost | None:
    """Convert an Algolia hit into a NormalizedPost."""
    title = hit.get("title", "").strip()
    story_text = hit.get("story_text") or hit.get("comment_text") or ""
    text = f"{title}\n{story_text}".strip() if story_text else title

    if len(text) < 20:
        return None

    engagement = hit.get("points", 0) + hit.get("num_comments", 0)

    created = hit.get("created_at", "")
    try:
        timestamp = datetime.fromisoformat(created.replace("Z", "+00:00")).isoformat()
    except (ValueError, AttributeError):
        timestamp = datetime.now(timezone.utc).isoformat()

    object_id = hit.get("objectID", "")
    return NormalizedPost(
        source="hn",
        text=text[:2000],
        engagement=engagement,
        timestamp=timestamp,
        url=f"https://news.ycombinator.com/item?id={object_id}",
    )


async def fetch_hn_posts() -> List[NormalizedPost]:
    """
    Main entry point — fetches posts from Hacker News.
    Combines front-page stories with targeted problem searches.
    """
    posts: List[NormalizedPost] = []
    per_query = max(10, settings.MAX_POSTS_PER_FETCH // (len(SEARCH_QUERIES) + 1))

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Fetch front-page stories
        try:
            top = await _fetch_top_stories(client, limit=per_query)
            for hit in top:
                parsed = _parse_hit(hit)
                if parsed:
                    posts.append(parsed)
            logger.info(f"HN: fetched {len(top)} front-page stories")
        except httpx.HTTPError as e:
            logger.error(f"HN: front-page fetch failed: {e}")

        # Run targeted searches
        for search in SEARCH_QUERIES:
            try:
                hits = await _search_hn(
                    client,
                    query=search["query"],
                    tags=search["tags"],
                    hits_per_page=per_query,
                )
                for hit in hits:
                    parsed = _parse_hit(hit)
                    if parsed:
                        posts.append(parsed)
                logger.info(f"HN: search '{search['query']}' returned {len(hits)} hits")
            except httpx.HTTPError as e:
                logger.error(f"HN: search '{search['query']}' failed: {e}")
                continue

    logger.info(f"HN: total {len(posts)} normalized posts collected")
    return posts[:settings.MAX_POSTS_PER_FETCH]
