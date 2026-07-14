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

class RedditEndpoint(NamedTuple):
    url: str
    label: str          
    limit: int = 50

import xml.etree.ElementTree as ET
import re

REDDIT_ENDPOINTS: List[RedditEndpoint] = [
    
    RedditEndpoint(
        url="https://www.reddit.com/r/SaaS/hot.rss",
        label="r/SaaS (hot)",
        limit=50,
    ),
    
    RedditEndpoint(
        url="https://www.reddit.com/r/Entrepreneur/new.rss",
        label="r/Entrepreneur (new)",
        limit=50,
    ),
    
    RedditEndpoint(
        url="https://www.reddit.com/r/indiehackers/top.rss?t=day",
        label="r/indiehackers (top/day)",
        limit=50,
    ),
    
    RedditEndpoint(
        url="https://www.reddit.com/r/SideProject/hot.rss",
        label="r/SideProject (hot)",
        limit=50,
    ),
    
    RedditEndpoint(
        url="https://www.reddit.com/r/SideProject/new.rss",
        label="r/SideProject (new)",
        limit=30,
    ),
    
    RedditEndpoint(
        url="https://www.reddit.com/r/smallbusiness/hot.rss",
        label="r/smallbusiness (hot)",
        limit=50,
    ),
    
    RedditEndpoint(
        url="https://www.reddit.com/r/smallbusiness/new.rss",
        label="r/smallbusiness (new)",
        limit=30,
    ),
    
    RedditEndpoint(
        url="https://www.reddit.com/r/all/new.rss",
        label="r/all (new)",
        limit=25,
    ),
    
    RedditEndpoint(
        url="https://www.reddit.com/search.rss?q=i+wish+there+was+a+saas&sort=new",
        label="search: 'i wish there was a saas'",
        limit=25,
    ),
    
    RedditEndpoint(
        url="https://www.reddit.com/search.rss?q=anyone+know+a+tool+for&sort=new",
        label="search: 'anyone know a tool'",
        limit=25,
    ),
    
    RedditEndpoint(
        url="https://www.reddit.com/search.rss?q=%22would+pay+for%22+saas&sort=new",
        label="search: 'would pay for' saas",
        limit=25,
    ),
    
    RedditEndpoint(
        url="https://www.reddit.com/search.rss?q=%22why+is+there+no%22+app+OR+tool&sort=new",
        label="search: 'why is there no' tool",
        limit=25,
    ),
    
    RedditEndpoint(
        url="https://www.reddit.com/r/startups/hot.rss",
        label="r/startups (hot)",
        limit=30,
    ),
    
    RedditEndpoint(
        url="https://www.reddit.com/r/microsaas/hot.rss",
        label="r/microsaas (hot)",
        limit=30,
    ),
]

_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

_REQUEST_DELAY = 1.5

def _has_problem_signal(text: str) -> bool:
    """
    Fast first-pass check: does this post contain a problem-indicating keyword?
    Case-insensitive substring match — intentionally cheap before heavier NLP.
    """
    text_lower = text.lower()
    return any(kw in text_lower for kw in PROBLEM_KEYWORDS)

async def _warm_up_session(client: httpx.AsyncClient) -> None:
    """
    Hit the Reddit homepage first to establish a session cookie.
    Without this, subsequent requests may receive 403 challenges.
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
        await asyncio.sleep(2.0)  
    except Exception as e:
        logger.warning(f"Reddit: warm-up failed (continuing anyway): {e}")

async def _fetch_endpoint(
    client: httpx.AsyncClient,
    endpoint: RedditEndpoint,
) -> List[dict]:
    """Fetch raw post children from a single Reddit RSS endpoint."""
    separator = "&" if "?" in endpoint.url else "?"
    url = f"{endpoint.url}{separator}limit={endpoint.limit}"

    headers = {
        "User-Agent": _USER_AGENT,
        "Accept": "text/xml, application/xml, application/atom+xml, text/html, */*",
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

        root = ET.fromstring(response.text)
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        children = []
        for entry in root.findall("atom:entry", ns):
            title = entry.find("atom:title", ns)
            content = entry.find("atom:content", ns)
            link = entry.find("atom:link", ns)
            updated = entry.find("atom:updated", ns)
            
            title_text = title.text if title is not None else ""
            content_text = content.text if content is not None else ""
            if content_text:
                content_text = re.sub(r'<[^>]+>', ' ', content_text).strip()
            link_href = link.attrib.get("href", "") if link is not None else ""
            updated_text = updated.text if updated is not None else ""
            
            children.append({
                "data": {
                    "title": title_text,
                    "selftext": content_text,
                    "permalink": link_href.replace("https://www.reddit.com", ""),
                    "created_utc": updated_text,
                    "ups": 10, 
                    "num_comments": 0
                }
            })
            
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

    if body in ("[deleted]", "[removed]"):
        body = ""

    full_text = f"{title}\n{body}" if body else title

    if len(full_text) < 30:
        return None

    if not _has_problem_signal(full_text):
        return None

    upvotes = data.get("ups", 0) or 0
    comments = data.get("num_comments", 0) or 0
    engagement = upvotes + comments

    created_utc = data.get("created_utc", 0)
    if isinstance(created_utc, str):
        timestamp = created_utc
    else:
        timestamp = (
            datetime.fromtimestamp(created_utc, tz=timezone.utc).isoformat()
            if created_utc
            else ""
        )

    return NormalizedPost(
        source="reddit",
        text=full_text[:2000],  
        engagement=engagement,
        timestamp=timestamp,
        url=f"https://reddit.com{data.get('permalink', '')}",
    )

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

    async with httpx.AsyncClient(
        timeout=25.0,
        follow_redirects=True,
        
    ) as client:
        
        await _warm_up_session(client)

        for i, endpoint in enumerate(REDDIT_ENDPOINTS):
            raw_children = await _fetch_endpoint(client, endpoint)

            keyword_matched = 0
            for child in raw_children:
                parsed = _parse_post(child)
                if parsed is None:
                    continue
                
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

            if i < len(REDDIT_ENDPOINTS) - 1:
                await asyncio.sleep(_REQUEST_DELAY)

    all_posts.sort(key=lambda p: p.engagement, reverse=True)

    total = len(all_posts)
    cap = settings.MAX_POSTS_PER_FETCH
    logger.info(
        f"Reddit: collected {total} problem-signal posts "
        f"(returning top {min(total, cap)})"
    )
    return all_posts[:cap]
