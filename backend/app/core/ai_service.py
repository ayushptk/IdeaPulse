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
from app.schemas import ClusterResult, GeneratedIdea, LinkedInFounderIdea

logger = logging.getLogger(__name__)
settings = get_settings()

_client: genai.Client | None = None

def _get_client() -> genai.Client:
    """Get or create the Gemini client."""
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client

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

LINKEDIN_SYSTEM_PROMPT = """You are an expert SaaS founder, YC startup advisor, and product-market fit specialist.

Your task is to convert real-world problems into high-potential SaaS startup ideas.

Analyze the post deeply like a founder looking for billion-dollar opportunities.

THINK STEP-BY-STEP:
- What frustration is hidden behind the text?
- Is this a repeated problem?
- Is there an inefficient manual process?
- Can this be automated or simplified?

Avoid:
- Generic ideas
- Already saturated markets
- Obvious solutions

Be sharp, practical, and founder-level thinking.

Return ONLY valid JSON."""

def _build_user_prompt(clusters: List[ClusterResult], platform: str) -> str:
    """
    Build the user prompt from clusters.
    Batches multiple clusters into a single prompt to save API calls.
    """
    sections = []
    for i, cluster in enumerate(clusters[:8]):  
        post_samples = "\n".join(
            f"  - \"{p.text[:300]}\" (engagement: {p.engagement})"
            for p in cluster.posts[:5]  
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

def _build_linkedin_user_prompt(clusters: List[ClusterResult]) -> str:
    """
    Build a LinkedIn-specific founder prompt from representative posts.
    Generates exactly 3 ideas with richer strategy-focused fields.
    """
    post_samples = []
    for i, cluster in enumerate(clusters[:6]):
        post_samples.append(
            f"POST {i + 1}:\n\"\"\"\n{cluster.representative_text[:1000]}\n\"\"\""
        )
    posts_blob = "\n\n".join(post_samples)

    return f"""Analyze the following LinkedIn posts:

{posts_blob}

GENERATE ONLY TOP 3 IDEAS.

Each idea must include exactly these fields:
{{
  "problem": "Deep pain point behind the post",
  "users": "Very specific target customer",
  "idea": "Idea Name: <name> | Solution: <clear SaaS solution> | Why this will work: <real-world reasoning> | Competitor gap: <why existing tools fail>",
  "features": ["3-5 core features"],
  "monetization": "Specific monetization model",
  "score": 8.2
}}

Return ONLY a valid JSON array with exactly 3 objects."""

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
    if platform == "linkedin":
        full_prompt = (
            f"{LINKEDIN_SYSTEM_PROMPT}\n\n{_build_linkedin_user_prompt(clusters)}"
        )
    else:
        full_prompt = f"{SYSTEM_PROMPT}\n\n{_build_user_prompt(clusters, platform)}"

    try:
        
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=settings.GEMINI_MAX_TOKENS,
                    response_mime_type="application/json",
                ),
            ),
        )

        raw_content = response.text.strip()
        ideas = _parse_ai_response(raw_content)

        if not ideas:
            logger.warning(f"AI: parsed zero ideas for {platform}, using fallback")
            return _generate_fallback_ideas(clusters, platform)

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
    
    if raw_content.startswith("```"):
        lines = raw_content.splitlines()
        raw_content = "\n".join(
            line for line in lines if not line.strip().startswith("```")
        ).strip()

    try:
        parsed = json.loads(raw_content)

        if isinstance(parsed, dict):
            
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

    max_ideas = 3 if platform == "linkedin" else 5

    for i, cluster in enumerate(clusters[:max_ideas]):
        text = cluster.representative_text[:200]
        ideas.append(GeneratedIdea(
            problem=f"Users on {platform} report: {text}",
            users=f"Professionals encountering this issue on {platform}",
            idea=(
                f"Idea Name: {platform.title()} Ops Optimizer {i + 1} | "
                f"Solution: Automated workspace integration for detected issues | "
                f"Why this will work: teams already pay for productivity and automation | "
                f"Competitor gap: existing tools are fragmented and not workflow-native"
            ) if platform == "linkedin"
            else f"Specialized SaaS solution for {platform} community needs",
            features=[
                "Problem detection dashboard",
                "Automated workflow engine",
                "Analytics & reporting",
            ],
            monetization="Freemium with $19/mo pro tier",
            score=round(min(cluster.avg_engagement / 100, 8.0) + 2, 1),
        ))

    return ideas

async def extract_linkedin_founder_ideas(post_text: str) -> List[LinkedInFounderIdea]:
    """
    Extract top 3 founder-style SaaS ideas from a single LinkedIn post text.
    Uses the user's requested strategy-focused prompt format.
    """
    if len(post_text.strip()) < 20:
        return []

    if not settings.GEMINI_API_KEY:
        logger.error("AI: GEMINI_API_KEY not configured for LinkedIn extraction")
        return []

    client = _get_client()
    user_prompt = f"""POST:
\"\"\"
{post_text[:4000]}
\"\"\"

GENERATE ONLY TOP 3 IDEAS.

Each idea must include:
1. Idea Name
2. Problem (deep pain point)
3. Target Customer (very specific)
4. Solution (clear SaaS product)
5. Core Features (3–5)
6. Why this will work (real-world reasoning)
7. Monetization Model
8. Competitor Gap (why existing tools fail)

Return ONLY a valid JSON array with exactly these keys per object:
{{
  "idea_name": "string",
  "problem": "string",
  "target_customer": "string",
  "solution": "string",
  "core_features": ["string", "string", "string"],
  "why_this_will_work": "string",
  "monetization_model": "string",
  "competitor_gap": "string",
  "score": 8.4
}}"""

    full_prompt = f"{LINKEDIN_SYSTEM_PROMPT}\n\n{user_prompt}"

    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=settings.GEMINI_MAX_TOKENS,
                    response_mime_type="application/json",
                ),
            ),
        )

        raw_content = response.text.strip()
        if raw_content.startswith("```"):
            lines = raw_content.splitlines()
            raw_content = "\n".join(
                line for line in lines if not line.strip().startswith("```")
            ).strip()

        parsed = json.loads(raw_content)
        if isinstance(parsed, dict):
            parsed = [parsed]
        if not isinstance(parsed, list):
            return []

        ideas: List[LinkedInFounderIdea] = []
        for item in parsed[:3]:
            try:
                ideas.append(LinkedInFounderIdea(**item))
            except Exception as e:
                logger.warning(f"AI: skipping invalid LinkedIn founder idea: {e}")
        return ideas
    except Exception as e:
        logger.error(f"AI: LinkedIn founder extraction failed: {e}")
        return []
