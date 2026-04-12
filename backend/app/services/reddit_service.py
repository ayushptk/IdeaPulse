"""
Reddit data collection service.

Fetches posts from problem-focused subreddits using Reddit's PUBLIC .json
endpoints — no API key or OAuth required (2026-safe approach).

Endpoint strategy:
  - /hot.json    → popular posts in SaaS, Entrepreneur, indiehackers
  - /new.json    → fresh pain-point posts
  - /top.json    → top posts of the day
  - /search.json → targeted pain-point keyword searches
  - /all/new.json → broad discovery across all subreddits

First-pass filter uses PROBLEM_KEYWORDS to drop irrelevant posts before
passing data to the heavier NLP pipeline.
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import List, NamedTuple

import httpx

from app.config import get_settings
from app.schemas import NormalizedPost

logger = logging.getLogger(__name__)
settings = get_settings()

# ─────────────────────────────────────────────────────────────────────────────
# Strong problem-indicating keywords — FIRST quick filter
# Any post matching at least one of these passes to the pipeline.
# ─────────────────────────────────────────────────────────────────────────────
PROBLEM_KEYWORDS = [
    "i wish",
    "i hate",
    "so frustrated",
    "anyone else hate",
    "there should be an app",
    "why is there no",
    "anyone know a tool",
    "this sucks",
    "pain point",
    "biggest problem",
    "i'm struggling with",
    "im struggling with",
    "need something that",
    "would pay for",
    # Additional high-signal phrases
    "looking for a tool",
    "can't find a good",
    "cant find a good",
    "wish someone would build",
    "someone should build",
    "is there an app",
    "is there a tool",
    "dying for a solution",
    "no good solution",
    "manual process",
    "so annoying",
    "drives me crazy",
    "pulling my hair out",
    "wasted hours",
    "spent hours manually",
    "there has to be a better way",
]

# ─────────────────────────────────────────────────────────────────────────────
# Endpoint definitions — (url_template, sort_type, subreddit_label)
# ─────────────────────────────────────────────────────────────────────────────

class RedditEndpoint(NamedTuple):
    url: str
    label: str          # Human-readable label for logging
    limit: int = 50


REDDIT_ENDPOINTS: List[RedditEndpoint] = [
    # ── SaaS hot posts ──
    RedditEndpoint(
        url="https://www.reddit.com/r/SaaS/hot.json",
        label="r/SaaS (hot)",
        limit=50,
    ),
    # ── Entrepreneur new posts ──
    RedditEndpoint(
        url="https://www.reddit.com/r/Entrepreneur/new.json",
        label="r/Entrepreneur (new)",
        limit=50,
    ),
    # ── IndieHackers top of day ──
    RedditEndpoint(
        url="https://www.reddit.com/r/indiehackers/top.json?t=day",
        label="r/indiehackers (top/day)",
        limit=50,
    ),
    # ── SideProject hot ──
    RedditEndpoint(
        url="https://www.reddit.com/r/SideProject/hot.json",
        label="r/SideProject (hot)",
        limit=50,
    ),
    # ── SideProject new ──
    RedditEndpoint(
        url="https://www.reddit.com/r/SideProject/new.json",
        label="r/SideProject (new)",
        limit=30,
    ),
    # ── smallbusiness hot ──
    RedditEndpoint(
        url="https://www.reddit.com/r/smallbusiness/hot.json",
        label="r/smallbusiness (hot)",
        limit=50,
    ),
    # ── smallbusiness new ──
    RedditEndpoint(
        url="https://www.reddit.com/r/smallbusiness/new.json",
        label="r/smallbusiness (new)",
        limit=30,
    ),
    # ── r/all new — broad discovery ──
    RedditEndpoint(
        url="https://www.reddit.com/r/all/new.json",
        label="r/all (new)",
        limit=25,
    ),
    # ── Targeted search: "i wish there was a saas" ──
    RedditEndpoint(
        url="https://www.reddit.com/search.json?q=i+wish+there+was+a+saas&sort=new",
        label="search: 'i wish there was a saas'",
        limit=25,
    ),
    # ── Targeted search: pain point tool ──
    RedditEndpoint(
        url="https://www.reddit.com/search.json?q=anyone+know+a+tool+for&sort=new",
        label="search: 'anyone know a tool'",
        limit=25,
    ),
    # ── Targeted search: would pay for ──
    RedditEndpoint(
        url="https://www.reddit.com/search.json?q=%22would+pay+for%22+saas&sort=new",
        label="search: 'would pay for' saas",
        limit=25,
    ),
    # ── Targeted search: why is there no ──
    RedditEndpoint(
        url="https://www.reddit.com/search.json?q=%22why+is+there+no%22+app+OR+tool&sort=new",
        label="search: 'why is there no' tool",
        limit=25,
    ),
    # ── startups hot ──
    RedditEndpoint(
        url="https://www.reddit.com/r/startups/hot.json",
        label="r/startups (hot)",
        limit=30,
    ),
    # ── microsaas hot ──
    RedditEndpoint(
        url="https://www.reddit.com/r/microsaas/hot.json",
        label="r/microsaas (hot)",
        limit=30,
    ),
]

# Browser-like User-Agent so Reddit's CDN doesn't block us
_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)
# Pause between requests to avoid 429s (seconds)
_REQUEST_DELAY = 1.5


# ─────────────────────────────────────────────────────────────────────────────
# Quick problem-keyword filter
# ─────────────────────────────────────────────────────────────────────────────

def _has_problem_signal(text: str) -> bool:
    """
    Fast first-pass check: does this post contain a problem-indicating keyword?
    Case-insensitive substring match — intentionally cheap before heavier NLP.
    """
    text_lower = text.lower()
    return any(kw in text_lower for kw in PROBLEM_KEYWORDS)


# ─────────────────────────────────────────────────────────────────────────────
# Fetch helpers
# ─────────────────────────────────────────────────────────────────────────────

async def _warm_up_session(client: httpx.AsyncClient) -> None:
    """
    Hit the Reddit homepage first to establish a session cookie.
    Without this, subsequent JSON requests may receive 403 challenges.
    """
    try:
        await client.get(
            "https://www.reddit.com/",
            headers={
                "User-Agent": _USER_AGENT,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
            }
        )
        logger.info("Reddit: session warmed up")
        await asyncio.sleep(2.0)  # Let Reddit's CDN settle
    except Exception as e:
        logger.warning(f"Reddit: warm-up failed (continuing anyway): {e}")


async def _fetch_endpoint(
    client: httpx.AsyncClient,
    endpoint: RedditEndpoint,
) -> List[dict]:
    """Fetch raw post children from a single Reddit JSON endpoint."""
    # Build URL with limit and raw_json params
    separator = "&" if "?" in endpoint.url else "?"
    url = f"{endpoint.url}{separator}limit={endpoint.limit}&raw_json=1"

    headers = {
        "User-Agent": _USER_AGENT,
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.reddit.com/",
    }

    try:
        response = await client.get(url, headers=headers)

        if response.status_code == 429:
            retry_after = int(response.headers.get("x-ratelimit-reset", 60))
            logger.warning(f"Reddit: rate limited on {endpoint.label} (retry after {retry_after}s), skipping")
            return []
        if response.status_code == 403:
            logger.warning(f"Reddit: 403 on {endpoint.label} — may be geo-restricted or quarantined")
            return []
        if response.status_code == 404:
            logger.warning(f"Reddit: 404 on {endpoint.label} — subreddit not found")
            return []

        response.raise_for_status()

        content_type = response.headers.get("content-type", "")
        if "json" not in content_type:
            logger.warning(f"Reddit: non-JSON response on {endpoint.label} (got {content_type[:40]})")
            return []

        data = response.json()
        children = data.get("data", {}).get("children", [])
        logger.info(f"Reddit: fetched {len(children)} posts from {endpoint.label}")
        return children

    except httpx.TimeoutException:
        logger.warning(f"Reddit: timeout on {endpoint.label}")
        return []
    except httpx.HTTPError as e:
        logger.error(f"Reddit: HTTP error on {endpoint.label}: {e}")
        return []
    except Exception as e:
        logger.error(f"Reddit: unexpected error on {endpoint.label}: {e}")
        return []


# ─────────────────────────────────────────────────────────────────────────────
# Post parsing
# ─────────────────────────────────────────────────────────────────────────────

def _parse_post(post: dict) -> NormalizedPost | None:
    """
    Convert a raw Reddit post child into a NormalizedPost.

    Returns None if:
      - Text is too short (< 30 chars)
      - Post is a link-only submission with no self-text
      - Post does NOT match any PROBLEM_KEYWORDS (first quick filter)
    """
    data = post.get("data", {})
    title: str = data.get("title", "").strip()
    body: str = data.get("selftext", "").strip()

    # Skip deleted/removed posts
    if body in ("[deleted]", "[removed]"):
        body = ""

    full_text = f"{title}\n{body}" if body else title

    # Gate 1: minimum length
    if len(full_text) < 30:
        return None

    # Gate 2: PROBLEM_KEYWORDS first filter
    if not _has_problem_signal(full_text):
        return None

    # Compute engagement (upvotes + comments)
    upvotes = data.get("ups", 0) or 0
    comments = data.get("num_comments", 0) or 0
    engagement = upvotes + comments

    # Build timestamp
    created_utc = data.get("created_utc", 0)
    timestamp = (
        datetime.fromtimestamp(created_utc, tz=timezone.utc).isoformat()
        if created_utc
        else ""
    )

    return NormalizedPost(
        source="reddit",
        text=full_text[:2000],  # Cap to control downstream token usage
        engagement=engagement,
        timestamp=timestamp,
        url=f"https://reddit.com{data.get('permalink', '')}",
    )


# ─────────────────────────────────────────────────────────────────────────────
# Main entry point
# ─────────────────────────────────────────────────────────────────────────────

async def fetch_reddit_posts() -> List[NormalizedPost]:
    """
    Main entry point — fetches posts from all configured endpoints.

    Strategy:
      1. Warm up session by hitting the Reddit homepage (establishes cookies)
      2. Hit every endpoint sequentially with polite delays to avoid 403s
      3. Apply PROBLEM_KEYWORDS first-pass filter inside _parse_post
      4. Deduplicate by URL
      5. Return up to MAX_POSTS_PER_FETCH posts, sorted by engagement desc
    """
    all_posts: List[NormalizedPost] = []
    seen_urls: set[str] = set()

    # Use a persistent client so cookies are shared across all requests
    async with httpx.AsyncClient(
        timeout=25.0,
        follow_redirects=True,
        # Keep cookies across requests — critical for avoiding Reddit 403s
    ) as client:
        # Step 0: warm-up handshake to establish Reddit session cookie
        await _warm_up_session(client)

        for i, endpoint in enumerate(REDDIT_ENDPOINTS):
            raw_children = await _fetch_endpoint(client, endpoint)

            keyword_matched = 0
            for child in raw_children:
                parsed = _parse_post(child)
                if parsed is None:
                    continue
                # URL-level deduplication across endpoints
                if parsed.url and parsed.url in seen_urls:
                    continue
                if parsed.url:
                    seen_urls.add(parsed.url)
                all_posts.append(parsed)
                keyword_matched += 1

            logger.info(
                f"Reddit [{endpoint.label}]: "
                f"{keyword_matched}/{len(raw_children)} posts matched problem keywords"
            )

            # Polite delay between requests (skip after last endpoint)
            if i < len(REDDIT_ENDPOINTS) - 1:
                await asyncio.sleep(_REQUEST_DELAY)

    # Sort by engagement descending — most discussed problems first
    all_posts.sort(key=lambda p: p.engagement, reverse=True)

    total = len(all_posts)
    cap = settings.MAX_POSTS_PER_FETCH
    logger.info(
        f"Reddit: collected {total} problem-signal posts "
        f"(returning top {min(total, cap)})"
    )
    return all_posts[:cap]
