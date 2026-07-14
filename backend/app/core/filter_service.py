"""
Filter service — quality gate for raw platform data.

Applies multiple heuristics to drop noise before AI processing:
  - Minimum text length
  - Minimum engagement threshold
  - Language / relevance signals
  - Duplicate detection within a batch
"""

import logging
import re
from typing import List, Set

from app.config import get_settings
from app.schemas import NormalizedPost

logger = logging.getLogger(__name__)
settings = get_settings()

NOISE_PATTERNS = [
    re.compile(r"(buy now|click here|discount|promo code)", re.IGNORECASE),
    re.compile(r"(follow me|subscribe|giveaway|free money)", re.IGNORECASE),
    re.compile(r"(https?://\S+){3,}", re.IGNORECASE),  
    re.compile(r"[🎁🎉💰💵🤑]{2,}"),  
]

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
    
    "wish there was",
    "need a tool",
    "looking for a tool",
    "can't find a good",
    "manual process",
    "time-consuming",
    "someone should build",
    "gap in the market",
    "underserved",
    "no good solution",
    "is there an app",
    "is there a tool",
    "drives me crazy",
    "pulling my hair out",
    "spent hours manually",
    "wasted hours",
    "annoying",
    "tedious",
    "broken",
    "complicated",
    "better way",
    "alternative",
    "struggle",
    "challenge",
    "expensive",
    "difficult",
]

def _is_noise(text: str) -> bool:
    """Check if text matches known spam/noise patterns."""
    return any(pattern.search(text) for pattern in NOISE_PATTERNS)

def _has_problem_signal(text: str) -> bool:
    """Check if text contains keywords indicating a real problem."""
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in PROBLEM_KEYWORDS)

def _text_fingerprint(text: str) -> str:
    """
    Generate a rough fingerprint for deduplication.
    Strips whitespace and lowercases for fuzzy matching.
    """
    cleaned = re.sub(r"\s+", " ", text.lower().strip())
    
    return cleaned[:100]

def filter_posts(posts: List[NormalizedPost]) -> List[NormalizedPost]:
    """
    Main filter pipeline — applies all quality gates in sequence.

    Returns:
        Filtered list of high-quality, relevant, deduplicated posts.
    """
    if not posts:
        logger.warning("Filter: received empty post list")
        return []

    original_count = len(posts)
    seen_fingerprints: Set[str] = set()
    filtered: List[NormalizedPost] = []

    for post in posts:
        
        if len(post.text.strip()) < 30:
            continue

        if _is_noise(post.text):
            continue

        if post.engagement < settings.MIN_ENGAGEMENT_THRESHOLD:
            
            if not _has_problem_signal(post.text):
                continue

        fingerprint = _text_fingerprint(post.text)
        if fingerprint in seen_fingerprints:
            continue
        seen_fingerprints.add(fingerprint)

        filtered.append(post)

    logger.info(
        f"Filter: {original_count} → {len(filtered)} posts "
        f"({original_count - len(filtered)} removed)"
    )
    return filtered
