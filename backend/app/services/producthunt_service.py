"""
Product Hunt data collection service.

Fetches recent launched products and discussions via Product Hunt's GraphQL API.
Uses OAuth2 client_credentials flow to exchange API Key + Secret for a bearer token.
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

PH_TOKEN_URL = "https://api.producthunt.com/v2/oauth/token"
PH_API_URL = "https://api.producthunt.com/v2/api/graphql"

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

COMMENTS_QUERY = """
query($postId: ID!, $first: Int!) {
  post(id: $postId) {
    comments(first: $first, order: NEWEST) {
      edges {
        node {
          id
          body
          votesCount
          createdAt
        }
      }
    }
  }
}
"""

_cached_token: str | None = None

async def _get_access_token(client: httpx.AsyncClient) -> str | None:
    """
    Exchange API Key + Secret for a bearer token via OAuth2 client_credentials.
    Caches the token for the lifetime of the process.
    """
    global _cached_token
    if _cached_token:
        return _cached_token

    if settings.PRODUCTHUNT_API_TOKEN:
        _cached_token = settings.PRODUCTHUNT_API_TOKEN
        return _cached_token

    if not settings.PRODUCTHUNT_API_KEY or not settings.PRODUCTHUNT_API_SECRET:
        logger.warning("Product Hunt: no API credentials configured")
        return None

    payload = {
        "client_id": settings.PRODUCTHUNT_API_KEY,
        "client_secret": settings.PRODUCTHUNT_API_SECRET,
        "grant_type": "client_credentials",
    }

    try:
        resp = await client.post(
            PH_TOKEN_URL,
            json=payload,
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            timeout=15.0,
        )
        resp.raise_for_status()
        token_data = resp.json()
        _cached_token = token_data.get("access_token")
        if _cached_token:
            logger.info("Product Hunt: successfully obtained bearer token")
        else:
            logger.error(f"Product Hunt: token response missing access_token: {token_data}")
        return _cached_token
    except httpx.HTTPStatusError as e:
        logger.error(f"Product Hunt: OAuth token request failed {e.response.status_code}: {e.response.text}")
        return None
    except Exception as e:
        logger.error(f"Product Hunt: OAuth token request error: {e}")
        return None

async def _graphql(
    client: httpx.AsyncClient,
    token: str,
    query: str,
    variables: dict,
) -> dict:
    """Execute a GraphQL query against the Product Hunt API."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    resp = await client.post(
        PH_API_URL,
        json={"query": query, "variables": variables},
        headers=headers,
        timeout=30.0,
    )
    resp.raise_for_status()
    return resp.json()

async def _fetch_posts(client: httpx.AsyncClient, token: str, limit: int) -> List[dict]:
    """Fetch the latest Product Hunt posts."""
    data = await _graphql(
        client, token, POSTS_QUERY,
        {"first": min(limit, 50), "order": "RANKING"},
    )
    edges = data.get("data", {}).get("posts", {}).get("edges", [])
    return [edge["node"] for edge in edges if edge.get("node")]

async def _fetch_comments(client: httpx.AsyncClient, token: str, post_id: str) -> List[str]:
    """Fetch top comments for a post to enrich the pain-point text."""
    try:
        data = await _graphql(
            client, token, COMMENTS_QUERY,
            {"postId": post_id, "first": 5},
        )
        edges = data.get("data", {}).get("post", {}).get("comments", {}).get("edges", [])
        return [
            edge["node"]["body"].strip()
            for edge in edges
            if edge.get("node", {}).get("body", "").strip()
        ]
    except Exception as e:
        logger.debug(f"Product Hunt: failed to fetch comments for {post_id}: {e}")
        return []

def _parse_product(product: dict, comments: List[str] | None = None) -> NormalizedPost | None:
    """Convert a Product Hunt node (+ optional comments) into a NormalizedPost."""
    name = product.get("name", "").strip()
    tagline = product.get("tagline", "").strip()
    description = product.get("description", "").strip()

    parts = [f"{name}: {tagline}"]
    if description:
        parts.append(description)
    if comments:
        parts.append("User feedback: " + " | ".join(comments[:3]))

    text = "\n".join(parts)

    if len(text) < 20:
        return None

    votes = product.get("votesCount", 0) or 0
    comments_count = product.get("commentsCount", 0) or 0
    engagement = votes + comments_count

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
    """Main entry point — collects recent Product Hunt launches with comments."""
    posts: List[NormalizedPost] = []

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            token = await _get_access_token(client)
            if not token:
                logger.error("Product Hunt: cannot fetch without a valid token")
                return []

            raw_products = await _fetch_posts(client, token, limit=settings.MAX_POSTS_PER_FETCH)
            logger.info(f"Product Hunt: fetched {len(raw_products)} raw products")

            for product in raw_products:
                post_id = product.get("id", "")
                comments: List[str] = []

                if post_id and (product.get("commentsCount") or 0) > 0:
                    comments = await _fetch_comments(client, token, post_id)

                parsed = _parse_product(product, comments)
                if parsed:
                    posts.append(parsed)

            logger.info(f"Product Hunt: collected {len(posts)} normalized posts")

        except httpx.HTTPStatusError as e:
            logger.error(f"Product Hunt API HTTP error {e.response.status_code}: {e.response.text[:300]}")
        except httpx.HTTPError as e:
            logger.error(f"Product Hunt API error: {e}")
        except Exception as e:
            logger.error(f"Product Hunt unexpected error: {e}", exc_info=True)

    return posts[:settings.MAX_POSTS_PER_FETCH]
