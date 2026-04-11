"""
Twitter / X data collection service.

Fetches recent tweets about SaaS pain points using Twitter API v2.
Searches for problem-indicator keywords and high-engagement discussions.
"""

import logging
from datetime import datetime, timezone
from typing import List

import httpx

from app.config import get_settings
from app.schemas import NormalizedPost

logger = logging.getLogger(__name__)
settings = get_settings()

TWITTER_SEARCH_URL = "https://api.twitter.com/2/tweets/search/recent"

# ── Search queries targeting SaaS pain points ──
SEARCH_QUERIES = [
    '"I wish there was" SaaS',
    '"need a tool" software',
    '"frustrated with" app',
    '"looking for" alternative',
    '"pain point" startup',
    '"someone should build"',
    '"why is there no" tool',
    '"biggest challenge" business software',
]


async def _search_tweets(
    client: httpx.AsyncClient, query: str, max_results: int = 20
) -> List[dict]:
    """Execute a single search query against Twitter API v2."""
    headers = {
        "Authorization": f"Bearer {settings.TWITTER_BEARER_TOKEN}",
    }
    params = {
        "query": f"{query} -is:retweet lang:en",
        "max_results": min(max_results, 100),
        "tweet.fields": "created_at,public_metrics,author_id,text",
    }

    response = await client.get(TWITTER_SEARCH_URL, headers=headers, params=params)
    response.raise_for_status()
    return response.json().get("data", [])


def _parse_tweet(tweet: dict) -> NormalizedPost | None:
    """Convert a Twitter API v2 tweet into a NormalizedPost."""
    text = tweet.get("text", "").strip()

    if len(text) < 20:
        return None

    metrics = tweet.get("public_metrics", {})
    engagement = (
        metrics.get("like_count", 0)
        + metrics.get("retweet_count", 0)
        + metrics.get("reply_count", 0)
        + metrics.get("quote_count", 0)
    )

    created = tweet.get("created_at", "")
    try:
        timestamp = datetime.fromisoformat(created.replace("Z", "+00:00")).isoformat()
    except (ValueError, AttributeError):
        timestamp = datetime.now(timezone.utc).isoformat()

    return NormalizedPost(
        source="twitter",
        text=text[:2000],
        engagement=engagement,
        timestamp=timestamp,
        url=f"https://twitter.com/i/status/{tweet.get('id', '')}",
    )


async def fetch_twitter_posts() -> List[NormalizedPost]:
    """
    Main entry point — searches Twitter for SaaS pain point discussions.
    Runs multiple queries to capture diverse problem signals.
    """
    if not settings.TWITTER_BEARER_TOKEN:
        logger.warning("Twitter: no bearer token configured, skipping")
        return []

    posts: List[NormalizedPost] = []
    per_query = max(10, settings.MAX_POSTS_PER_FETCH // len(SEARCH_QUERIES))

    async with httpx.AsyncClient(timeout=30.0) as client:
        for query in SEARCH_QUERIES:
            try:
                raw_tweets = await _search_tweets(client, query, max_results=per_query)

                for tweet in raw_tweets:
                    parsed = _parse_tweet(tweet)
                    if parsed:
                        posts.append(parsed)

                logger.info(f"Twitter: query '{query[:40]}...' returned {len(raw_tweets)} tweets")
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:
                    logger.warning("Twitter: rate limit hit, stopping search")
                    break
                logger.error(f"Twitter API error for query '{query[:30]}': {e}")
            except httpx.HTTPError as e:
                logger.error(f"Twitter: network error: {e}")
                continue

    logger.info(f"Twitter: total {len(posts)} normalized posts collected")
    return posts[:settings.MAX_POSTS_PER_FETCH]
