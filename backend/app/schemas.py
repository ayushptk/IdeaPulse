"""
Pydantic schemas for API request/response validation and internal data flow.
Strict typing ensures data integrity across the entire pipeline.
"""

import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ─────────────────────────────────────────────────────────────────────────────
# Internal Pipeline Schemas
# ─────────────────────────────────────────────────────────────────────────────

class NormalizedPost(BaseModel):
    """
    Standardized representation of a post from ANY platform.
    Every platform service must emit this format.
    """
    source: str = Field(..., description="Platform name (reddit, twitter, etc.)")
    text: str = Field(..., description="Full text content of the post")
    engagement: int = Field(0, description="Engagement metric (upvotes, likes, etc.)")
    timestamp: str = Field("", description="ISO-8601 timestamp of the post")
    url: Optional[str] = Field(None, description="Original post URL for reference")


class ClusterResult(BaseModel):
    """A cluster of related posts grouped by topic similarity."""
    cluster_id: int
    representative_text: str = Field(..., description="Most representative post in the cluster")
    posts: List[NormalizedPost]
    avg_engagement: float


class GeneratedIdea(BaseModel):
    """
    Raw AI output — one generated SaaS idea.
    The AI prompt is engineered to return exactly this shape.
    """
    problem: str = Field(..., description="The real-world problem identified")
    users: str = Field(..., description="Target user segment")
    idea: str = Field(..., description="Proposed SaaS product concept")
    features: List[str] = Field(default_factory=list, description="MVP feature list")
    monetization: str = Field(..., description="Revenue model suggestion")
    score: float = Field(..., ge=1, le=10, description="Viability score 1–10")


# ─────────────────────────────────────────────────────────────────────────────
# API Response Schemas
# ─────────────────────────────────────────────────────────────────────────────

class IdeaResponse(BaseModel):
    """Public API shape for a single idea."""
    id: int
    platform: str
    problem: str
    users: str
    idea: str
    features: List[str]
    monetization: str
    score: float
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class PlatformIdeasResponse(BaseModel):
    """Wraps the top-N ideas for a given platform."""
    platform: str
    count: int
    ideas: List[IdeaResponse]


class HealthResponse(BaseModel):
    """Health-check response."""
    status: str = "healthy"
    version: str
    database: str = "connected"


class PipelineStatusResponse(BaseModel):
    """Response after triggering a pipeline run."""
    platform: str
    status: str
    ideas_generated: int
    message: str
