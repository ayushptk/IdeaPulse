"""
Models for storing raw data from various platforms.
These models act as a staging area before AI processing.
"""

import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID as pgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.db import Base


class Platform(Base):
    """Represents a source platform (e.g., reddit, producthunt)."""
    __tablename__ = "platforms"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    posts: Mapped[list["RawPost"]] = relationship("RawPost", back_populates="platform")


class RawPost(Base):
    """Stores raw data fetched from a platform before it is processed into an Idea."""
    __tablename__ = "raw_posts"

    id: Mapped[UUID] = mapped_column(pgUUID(as_uuid=True), primary_key=True)
    platform_id: Mapped[str] = mapped_column(String(50), ForeignKey("platforms.id"), index=True)
    external_id: Mapped[str] = mapped_column(String(100), index=True)  # ID from the platform (e.g., tweet id)
    
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    author: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    upvotes: Mapped[int] = mapped_column(Integer, default=0)
    comments_count: Mapped[int] = mapped_column(Integer, default=0)
    
    posted_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), index=True)
    fetched_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=datetime.datetime.now(datetime.timezone.utc).isoformat()  # Fallback
    )
    
    raw_json: Mapped[dict] = mapped_column(JSONB, nullable=True)

    platform: Mapped["Platform"] = relationship("Platform", back_populates="posts")
