"""
Scoring service — ranks and deduplicates generated ideas.

Applies a weighted scoring formula that combines:
  - AI-assigned viability score
  - Source engagement signals
  - Problem clarity / specificity
  - Market size indicators
"""

import hashlib
import logging
from typing import List

from app.schemas import GeneratedIdea

logger = logging.getLogger(__name__)

WEIGHT_AI_SCORE = 0.50      
WEIGHT_SPECIFICITY = 0.20   
WEIGHT_FEATURES = 0.15      
WEIGHT_MONETIZATION = 0.15  

MARKET_KEYWORDS = [
    "B2B", "enterprise", "SaaS", "subscription", "recurring",
    "per seat", "per user", "API", "platform", "marketplace",
    "automation", "workflow", "integration", "analytics",
]

def _score_specificity(idea: GeneratedIdea) -> float:
    """
    Score 0–10 based on how specific/actionable the idea is.
    Longer, more detailed problems and ideas score higher.
    """
    problem_words = len(idea.problem.split())
    idea_words = len(idea.idea.split())
    users_words = len(idea.users.split())

    problem_score = min(problem_words / 20, 1.0) * 10
    idea_score = min(idea_words / 15, 1.0) * 10
    users_score = min(users_words / 8, 1.0) * 10

    return (problem_score * 0.4 + idea_score * 0.3 + users_score * 0.3)

def _score_features(idea: GeneratedIdea) -> float:
    """Score 0–10 based on feature list quality."""
    n_features = len(idea.features)
    if n_features == 0:
        return 0.0

    count_score = min(n_features / 4, 1.0) * 5
    avg_length = sum(len(f.split()) for f in idea.features) / n_features
    detail_score = min(avg_length / 5, 1.0) * 5

    return count_score + detail_score

def _score_monetization(idea: GeneratedIdea) -> float:
    """Score 0–10 based on monetization clarity."""
    text = idea.monetization.lower()
    score = 2.0  

    if "$" in text or "per" in text:
        score += 3.0  
    if any(kw in text for kw in ["freemium", "free tier", "trial"]):
        score += 1.5  
    if any(kw in text for kw in ["enterprise", "team", "seat", "user"]):
        score += 1.5  
    if any(kw in text for kw in ["monthly", "annual", "yearly"]):
        score += 1.0  
    if len(text.split()) > 10:
        score += 1.0  

    return min(score, 10.0)

def _market_boost(idea: GeneratedIdea) -> float:
    """
    Additional 0–1.0 boost for ideas targeting known-good markets.
    Added on top of the weighted score.
    """
    combined = f"{idea.idea} {idea.users} {idea.monetization}".lower()
    matches = sum(1 for kw in MARKET_KEYWORDS if kw.lower() in combined)
    return min(matches * 0.15, 1.0)

def score_ideas(ideas: List[GeneratedIdea]) -> List[GeneratedIdea]:
    """
    Score and rank ideas using a weighted multi-factor formula.

    The final score replaces the AI's raw score with a more nuanced
    assessment that considers specificity, features, and monetization.

    Returns:
        Ideas sorted by final score (highest first).
    """
    if not ideas:
        return []

    scored: List[GeneratedIdea] = []
    for idea in ideas:
        ai_score = idea.score
        specificity = _score_specificity(idea)
        features = _score_features(idea)
        monetization = _score_monetization(idea)
        boost = _market_boost(idea)

        final_score = (
            ai_score * WEIGHT_AI_SCORE
            + specificity * WEIGHT_SPECIFICITY
            + features * WEIGHT_FEATURES
            + monetization * WEIGHT_MONETIZATION
            + boost
        )

        final_score = round(max(1.0, min(10.0, final_score)), 1)

        scored.append(GeneratedIdea(
            problem=idea.problem,
            users=idea.users,
            idea=idea.idea,
            features=idea.features,
            monetization=idea.monetization,
            score=final_score,
        ))

    scored.sort(key=lambda x: x.score, reverse=True)

    logger.info(f"Scoring: ranked {len(scored)} ideas, top score: {scored[0].score}")
    return scored

def generate_content_hash(idea: GeneratedIdea) -> str:
    """
    Generate a SHA-256 hash of problem+idea for duplicate detection.
    Two ideas with the same problem statement and solution are considered duplicates.
    """
    content = f"{idea.problem.strip().lower()}|{idea.idea.strip().lower()}"
    return hashlib.sha256(content.encode()).hexdigest()
