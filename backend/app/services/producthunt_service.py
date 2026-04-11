"""
Product Hunt data collection service.

Fetches recent launched products and discussions via Product Hunt's GraphQL API.
Focuses on extracting pain points from product descriptions and comments.
"""

import logging
from datetime import datetime, timezone
from typing import List

import httpx

from app.config import get_settings
from app.schemas import NormalizedPost

logger = logging.getLogger(__name__)
settings = get_settings()

# Product Hunt GraphQL endpoint
PH_API_URL = "https://api.producthunt.com/v2/api/graphql"

# GraphQL query for recent posts with discussions
POSTS_QUERY = """
query($first: Int!, $order: PostsOrder!) {
  posts(first: $first, order: $order) {
    edges {
      node {
        id
        name
        tagline
        description
        votesCount
        commentsCount
        createdAt
        url
        topics {
          edges {
            node { name }
          }
        }
      }
    }
  }
}
"""


async def _fetch_with_api(client: httpx.AsyncClient, limit: int = 50) -> List[dict]:
    """Fetch posts from Product Hunt's official GraphQL API."""
    if not settings.PRODUCTHUNT_API_TOKEN:
        logger.warning("Product Hunt: no API token configured, using scrape fallback")
        return []

    headers = {
        "Authorization": f"Bearer {settings.PRODUCTHUNT_API_TOKEN}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    payload = {
        "query": POSTS_QUERY,
        "variables": {"first": limit, "order": "NEWEST"},
    }

    response = await client.post(PH_API_URL, json=payload, headers=headers)
    response.raise_for_status()
    data = response.json()
    edges = data.get("data", {}).get("posts", {}).get("edges", [])
    return [edge["node"] for edge in edges]


async def _fetch_homepage_fallback(client: httpx.AsyncClient) -> List[dict]:
    """
    Fallback: scrape Product Hunt's public API-like endpoints.
    Returns a simplified structure when no API token is available.
    """
    try:
        response = await client.get(
            "https://www.producthunt.com/frontend/graphql",
            params={"operation": "HomefeedQuery"},
            headers={"Accept": "application/json"},
        )
        if response.status_code == 200:
            return response.json().get("data", {}).get("homefeed", {}).get("edges", [])
    except Exception as e:
        logger.warning(f"Product Hunt fallback scrape failed: {e}")
    return []


def _parse_product(product: dict) -> NormalizedPost | None:
    """Convert a Product Hunt node into a NormalizedPost."""
    name = product.get("name", "").strip()
    tagline = product.get("tagline", "").strip()
    description = product.get("description", "").strip()

    text = f"{name}: {tagline}\n{description}" if description else f"{name}: {tagline}"

    if len(text) < 20:
        return None

    votes = product.get("votesCount", 0)
    comments = product.get("commentsCount", 0)
    engagement = votes + comments

    created = product.get("createdAt", "")
    try:
        timestamp = datetime.fromisoformat(created.replace("Z", "+00:00")).isoformat()
    except (ValueError, AttributeError):
        timestamp = datetime.now(timezone.utc).isoformat()

    return NormalizedPost(
        source="producthunt",
        text=text[:2000],
        engagement=engagement,
        timestamp=timestamp,
        url=product.get("url", ""),
    )


async def fetch_producthunt_posts() -> List[NormalizedPost]:
    """Main entry point — collects recent Product Hunt launches."""
    posts: List[NormalizedPost] = []

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            raw_products = await _fetch_with_api(client, limit=settings.MAX_POSTS_PER_FETCH)

            if not raw_products:
                raw_products = await _fetch_homepage_fallback(client)

            for product in raw_products:
                parsed = _parse_product(product)
                if parsed:
                    posts.append(parsed)

            logger.info(f"Product Hunt: collected {len(posts)} normalized posts")
        except httpx.HTTPError as e:
            logger.error(f"Product Hunt API error: {e}")
        except Exception as e:
            logger.error(f"Product Hunt unexpected error: {e}")

    return posts[:settings.MAX_POSTS_PER_FETCH]
