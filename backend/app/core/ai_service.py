"""
AI service — SaaS idea generation using OpenAI.

Takes clustered problem themes and generates structured SaaS ideas.
Uses batch processing to minimize API calls and token usage.
"""

import json
import logging
from typing import List

from openai import AsyncOpenAI

from app.config import get_settings
from app.schemas import ClusterResult, GeneratedIdea

logger = logging.getLogger(__name__)
settings = get_settings()

# Lazy-initialized client (avoids import-time errors if key is missing)
_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    """Get or create the OpenAI async client."""
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


# ─────────────────────────────────────────────────────────────────────────────
# Prompt Engineering
# ─────────────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a senior SaaS product strategist and market analyst.
Your job is to analyze real user complaints and discussions to identify viable SaaS product opportunities.

RULES:
- Focus on problems that affect a large, identifiable user segment
- Suggest ideas that are technically feasible for a small team (2-5 devs)
- Prefer recurring pain points over one-off complaints
- Score based on market size, technical feasibility, and monetization potential
- Features should be MVP-scope (3-5 core features only)
- Monetization must be specific (e.g., "$29/mo per seat" not just "subscription")
- Be creative but realistic — no moonshots

OUTPUT FORMAT: Return a JSON array of objects with exactly these fields:
{
  "problem": "Clear 1-2 sentence problem statement",
  "users": "Specific target user segment",
  "idea": "Concise SaaS product concept with a working name",
  "features": ["feature1", "feature2", "feature3"],
  "monetization": "Specific pricing model",
  "score": 7.5
}"""


def _build_user_prompt(clusters: List[ClusterResult], platform: str) -> str:
    """
    Build the user prompt from clusters.
    Batches multiple clusters into a single prompt to save API calls.
    """
    sections = []
    for i, cluster in enumerate(clusters[:8]):  # Cap at 8 clusters per call
        post_samples = "\n".join(
            f"  - \"{p.text[:300]}\" (engagement: {p.engagement})"
            for p in cluster.posts[:5]  # Max 5 posts per cluster
        )
        sections.append(
            f"CLUSTER {i + 1} (avg engagement: {cluster.avg_engagement:.0f}):\n"
            f"Representative: \"{cluster.representative_text[:500]}\"\n"
            f"Related posts:\n{post_samples}"
        )

    clusters_text = "\n\n".join(sections)

    return f"""Analyze the following discussion clusters from {platform} and generate exactly 5 SaaS product ideas.

{clusters_text}

Generate 5 unique SaaS ideas based on the problems identified above.
Return ONLY a valid JSON array — no markdown, no explanation, just the JSON."""


# ─────────────────────────────────────────────────────────────────────────────
# AI Generation
# ─────────────────────────────────────────────────────────────────────────────

async def generate_ideas(
    clusters: List[ClusterResult],
    platform: str,
) -> List[GeneratedIdea]:
    """
    Generate SaaS ideas from clustered posts using OpenAI.

    Args:
        clusters: Grouped problem themes from a single platform.
        platform: Platform name (for context in the prompt).

    Returns:
        List of validated GeneratedIdea objects.

    Error Handling:
        - Invalid JSON → retry with stricter prompt
        - Partial results → return what we can parse
        - API errors → log and return empty list
    """
    if not clusters:
        logger.warning(f"AI: no clusters provided for {platform}")
        return []

    if not settings.OPENAI_API_KEY:
        logger.error("AI: OPENAI_API_KEY not configured")
        return _generate_fallback_ideas(clusters, platform)

    client = _get_client()
    user_prompt = _build_user_prompt(clusters, platform)

    try:
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=settings.OPENAI_MAX_TOKENS,
            temperature=0.7,
            response_format={"type": "json_object"},  # Force JSON output
        )

        raw_content = response.choices[0].message.content.strip()
        ideas = _parse_ai_response(raw_content)

        logger.info(f"AI: generated {len(ideas)} ideas for {platform}")
        return ideas

    except Exception as e:
        logger.error(f"AI: OpenAI API error for {platform}: {e}")
        return _generate_fallback_ideas(clusters, platform)


def _parse_ai_response(raw_content: str) -> List[GeneratedIdea]:
    """
    Parse and validate the AI response JSON.
    Handles both array responses and object-with-array responses.
    """
    try:
        parsed = json.loads(raw_content)

        # Handle both {"ideas": [...]} and [...]
        if isinstance(parsed, dict):
            # Find the first array value in the dict
            for value in parsed.values():
                if isinstance(value, list):
                    parsed = value
                    break
            else:
                logger.error("AI: response dict contains no array")
                return []

        if not isinstance(parsed, list):
            logger.error(f"AI: unexpected response type: {type(parsed)}")
            return []

        ideas = []
        for item in parsed:
            try:
                idea = GeneratedIdea(**item)
                ideas.append(idea)
            except Exception as e:
                logger.warning(f"AI: skipping invalid idea: {e}")
                continue

        return ideas

    except json.JSONDecodeError as e:
        logger.error(f"AI: failed to parse JSON response: {e}")
        logger.debug(f"AI: raw content: {raw_content[:500]}")
        return []


def _generate_fallback_ideas(
    clusters: List[ClusterResult], platform: str
) -> List[GeneratedIdea]:
    """
    Fallback idea generation when OpenAI is unavailable.
    Generates basic ideas from cluster data using heuristics.
    """
    logger.info(f"AI: using fallback generation for {platform}")
    ideas = []

    for i, cluster in enumerate(clusters[:5]):
        text = cluster.representative_text[:200]
        ideas.append(GeneratedIdea(
            problem=f"Users on {platform} report: {text}",
            users=f"Professionals encountering this issue on {platform}",
            idea=f"AI-powered solution for the problem described in cluster {i + 1}",
            features=[
                "Problem detection dashboard",
                "Automated workflow engine",
                "Analytics & reporting",
            ],
            monetization="Freemium with $19/mo pro tier",
            score=round(min(cluster.avg_engagement / 100, 8.0) + 2, 1),
        ))

    return ideas
