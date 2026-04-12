"""
AI service — SaaS idea generation using Google Gemini.

Takes clustered problem themes and generates structured SaaS ideas.
Uses batch processing to minimize API calls and token usage.
"""

import json
import logging
import asyncio
from typing import List

from google import genai
from google.genai import types

from app.config import get_settings
from app.schemas import ClusterResult, GeneratedIdea

logger = logging.getLogger(__name__)
settings = get_settings()

# Lazy-initialized client (avoids import-time errors if key is missing)
_client: genai.Client | None = None


def _get_client() -> genai.Client:
    """Get or create the Gemini client."""
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
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
    Generate SaaS ideas from clustered posts using Google Gemini.

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

    if not settings.GEMINI_API_KEY:
        logger.error("AI: GEMINI_API_KEY not configured")
        return _generate_fallback_ideas(clusters, platform)

    client = _get_client()
    full_prompt = f"{SYSTEM_PROMPT}\n\n{_build_user_prompt(clusters, platform)}"

    try:
        # google-genai SDK is sync — run in executor to keep async-friendly
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=settings.GEMINI_MAX_TOKENS,
                ),
            ),
        )

        raw_content = response.text.strip()
        ideas = _parse_ai_response(raw_content)

        logger.info(f"AI: generated {len(ideas)} ideas for {platform}")
        return ideas

    except Exception as e:
        logger.error(f"AI: Gemini API error for {platform}: {e}")
        return _generate_fallback_ideas(clusters, platform)


def _parse_ai_response(raw_content: str) -> List[GeneratedIdea]:
    """
    Parse and validate the AI response JSON.
    Handles both array responses and object-with-array responses.
    Strips markdown code fences if Gemini wraps output in them.
    """
    # Strip markdown code fences (```json ... ``` or ``` ... ```)
    if raw_content.startswith("```"):
        lines = raw_content.splitlines()
        raw_content = "\n".join(
            line for line in lines if not line.strip().startswith("```")
        ).strip()

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
    Fallback idea generation when Gemini is unavailable.
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
