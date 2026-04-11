"""
Reddit data collection service.

Fetches top posts from problem-focused subreddits using Reddit's OAuth2 API.
Falls back to public JSON endpoints if credentials are unavailable.
"""

import logging
from datetime import datetime, timezone
from typing import List

import httpx

from app.config import get_settings
from app.schemas import NormalizedPost

logger = logging.getLogger(__name__)
settings = get_settings()

# ── Subreddits known for real user pain points ──
TARGET_SUBREDDITS = [
    "SaaS",
    "startups",
    "Entrepreneur",
    "smallbusiness",
    "webdev",
    "software",
    "ProductManagement",
    "indiehackers",
    "microsaas",
    "SideProject",
]


async def _get_oauth_token(client: httpx.AsyncClient) -> str | None:
    """Authenticate with Reddit's OAuth2 API and return bearer token."""
    if not settings.REDDIT_CLIENT_ID or not settings.REDDIT_CLIENT_SECRET:
        return None

    try:
        response = await client.post(
            "https://www.reddit.com/api/v1/access_token",
            auth=(settings.REDDIT_CLIENT_ID, settings.REDDIT_CLIENT_SECRET),
            data={"grant_type": "client_credentials"},
            headers={"User-Agent": settings.REDDIT_USER_AGENT},
        )
        response.raise_for_status()
        return response.json().get("access_token")
    except httpx.HTTPError as e:
        logger.warning(f"Reddit OAuth failed, falling back to public API: {e}")
        return None


async def _fetch_subreddit_oauth(
    client: httpx.AsyncClient, subreddit: str, token: str, limit: int = 25
) -> List[dict]:
    """Fetch posts from a subreddit using the authenticated API."""
    headers = {
        "Authorization": f"Bearer {token}",
        "User-Agent": settings.REDDIT_USER_AGENT,
    }
    response = await client.get(
        f"https://oauth.reddit.com/r/{subreddit}/hot",
        params={"limit": limit},
        headers=headers,
    )
    response.raise_for_status()
    return response.json().get("data", {}).get("children", [])


async def _fetch_subreddit_public(
    client: httpx.AsyncClient, subreddit: str, limit: int = 25
) -> List[dict]:
    """Fallback: fetch from Reddit's public JSON API (rate-limited)."""
    response = await client.get(
        f"https://www.reddit.com/r/{subreddit}/hot.json",
        params={"limit": limit},
        headers={"User-Agent": settings.REDDIT_USER_AGENT},
    )
    response.raise_for_status()
    return response.json().get("data", {}).get("children", [])


def _parse_post(post: dict) -> NormalizedPost | None:
    """Convert a raw Reddit post into a NormalizedPost. Returns None if unusable."""
    data = post.get("data", {})
    title = data.get("title", "").strip()
    body = data.get("selftext", "").strip()
    text = f"{title}\n{body}" if body else title

    # Skip very short or media-only posts
    if len(text) < 30:
        return None

    engagement = data.get("ups", 0) + data.get("num_comments", 0)
    created_utc = data.get("created_utc", 0)
    timestamp = datetime.fromtimestamp(created_utc, tz=timezone.utc).isoformat() if created_utc else ""

    return NormalizedPost(
        source="reddit",
        text=text[:2000],  # Cap text length to control token usage
        engagement=engagement,
        timestamp=timestamp,
        url=f"https://reddit.com{data.get('permalink', '')}",
    )


async def fetch_reddit_posts() -> List[NormalizedPost]:
    """
    Main entry point — fetches posts from all target subreddits.
    Uses OAuth when possible, public API otherwise.
    """
    posts: List[NormalizedPost] = []
    per_sub_limit = max(5, settings.MAX_POSTS_PER_FETCH // len(TARGET_SUBREDDITS))

    async with httpx.AsyncClient(timeout=30.0) as client:
        token = await _get_oauth_token(client)

        for subreddit in TARGET_SUBREDDITS:
            try:
                if token:
                    raw_posts = await _fetch_subreddit_oauth(client, subreddit, token, per_sub_limit)
                else:
                    raw_posts = await _fetch_subreddit_public(client, subreddit, per_sub_limit)

                for raw in raw_posts:
                    parsed = _parse_post(raw)
                    if parsed:
                        posts.append(parsed)

                logger.info(f"Reddit: fetched {len(raw_posts)} posts from r/{subreddit}")
            except httpx.HTTPError as e:
                logger.error(f"Reddit: failed to fetch r/{subreddit}: {e}")
                continue

    logger.info(f"Reddit: total {len(posts)} normalized posts collected")
    return posts[:settings.MAX_POSTS_PER_FETCH]
