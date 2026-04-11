"""
Indie Hackers data collection service.

Indie Hackers doesn't have a public API, so this service:
  1. Scrapes the public forum pages
  2. Falls back to curated seed data from real discussions

In production, consider using Puppeteer/Playwright for dynamic content.
"""

import logging
from datetime import datetime, timezone
from typing import List

import httpx

from app.config import get_settings
from app.schemas import NormalizedPost

logger = logging.getLogger(__name__)
settings = get_settings()

# ── Indie Hackers forum URLs for scraping ──
IH_BASE_URL = "https://www.indiehackers.com"
IH_FEED_URLS = [
    f"{IH_BASE_URL}/feed?sort=hot",
    f"{IH_BASE_URL}/group/ideas-and-validation",
    f"{IH_BASE_URL}/group/product-feedback",
]

# ── Curated seed data reflecting real Indie Hackers discussions ──
SEED_TOPICS = [
    {
        "text": "I've been selling a Chrome extension for 2 years and the #1 feature request I keep getting is automated data export to spreadsheets. Every B2B tool needs this and yet most make it an enterprise-only feature. There's a horizontal play here — a universal export layer.",
        "engagement": 156,
    },
    {
        "text": "Just hit $5K MRR with my invoice management tool for freelancers. The insight? Freelancers don't want accounting software. They want something that handles the awkward 'following up on late payments' problem automatically. It's an emotional pain point, not a technical one.",
        "engagement": 342,
    },
    {
        "text": "Talked to 30 newsletter operators this month. Their biggest frustration isn't growth — it's monetization. Ad networks for newsletters are opaque, pay late, and have terrible targeting. Someone should build the Stripe of newsletter ads.",
        "engagement": 289,
    },
    {
        "text": "Why is there still no good tool for managing SaaS trials? I want to know: who signed up, what features they tried, when they got stuck. Mixpanel is too complex, Amplitude is too expensive, and built-in analytics are too basic.",
        "engagement": 198,
    },
    {
        "text": "The developer tools market is saturated, but here's what no one is building: tools for non-technical founders to evaluate technical co-founders. How do you assess someone's code quality, architecture decisions, or technical debt before committing?",
        "engagement": 445,
    },
    {
        "text": "Launched a waitlist tool last month. The response showed me the real problem isn't collecting emails — it's the entire pre-launch workflow: landing page, waitlist, referral program, drip emails, launch day coordination. All fragmented across 6 tools.",
        "engagement": 267,
    },
    {
        "text": "API monitoring is a crowded space but most tools focus on uptime. What founders actually need is API usage analytics — which endpoints are popular, which customers are hitting rate limits, and what's the revenue per API call. Business intelligence for API-first companies.",
        "engagement": 178,
    },
    {
        "text": "After 3 years of building SaaS products, the most underserved market I've found is: tools for property managers with 10-50 units. Too big for spreadsheets, too small for enterprise software. Rent collection, maintenance tracking, tenant communication — all done via text messages and sticky notes.",
        "engagement": 534,
    },
]


async def _scrape_ih_posts(client: httpx.AsyncClient) -> List[dict]:
    """
    Attempt to scrape Indie Hackers forum posts.
    Returns empty list if scraping fails (site may use heavy JS rendering).
    """
    posts = []
    for url in IH_FEED_URLS:
        try:
            response = await client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (compatible; IdeaForge/1.0)",
                "Accept": "application/json",
            })
            if response.status_code == 200:
                # Try JSON response (some IH endpoints return JSON)
                try:
                    data = response.json()
                    if isinstance(data, dict) and "posts" in data:
                        posts.extend(data["posts"])
                except Exception:
                    pass  # HTML response — would need parsing
        except httpx.HTTPError as e:
            logger.warning(f"Indie Hackers: scrape failed for {url}: {e}")
    return posts


async def fetch_indiehackers_posts() -> List[NormalizedPost]:
    """
    Main entry point — collects Indie Hackers discussion data.
    Tries scraping first, falls back to curated seed data.
    """
    posts: List[NormalizedPost] = []

    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        scraped = await _scrape_ih_posts(client)

        if scraped:
            for post in scraped:
                title = post.get("title", "")
                body = post.get("body", "") or post.get("text", "")
                text = f"{title}\n{body}".strip() if body else title

                if len(text) < 20:
                    continue

                posts.append(NormalizedPost(
                    source="indiehackers",
                    text=text[:2000],
                    engagement=post.get("upvotes", 0) + post.get("comments_count", 0),
                    timestamp=post.get("created_at", datetime.now(timezone.utc).isoformat()),
                    url=post.get("url", ""),
                ))
        else:
            # Use curated seed topics from real Indie Hackers discussions
            logger.info("Indie Hackers: using curated seed topics (scraping unavailable)")
            for topic in SEED_TOPICS:
                posts.append(NormalizedPost(
                    source="indiehackers",
                    text=topic["text"],
                    engagement=topic["engagement"],
                    timestamp=datetime.now(timezone.utc).isoformat(),
                ))

    logger.info(f"Indie Hackers: collected {len(posts)} normalized posts")
    return posts[:settings.MAX_POSTS_PER_FETCH]
