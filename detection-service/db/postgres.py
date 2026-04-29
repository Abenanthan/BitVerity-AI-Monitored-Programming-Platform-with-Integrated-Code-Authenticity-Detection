"""
detection-service/db/postgres.py

Async SQLAlchemy engine shared across both microservices.
Uses the same PostgreSQL database as the Node.js API.
"""
from __future__ import annotations

import os
from sqlalchemy.ext.asyncio import AsyncAttrs, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import (
    Column, DateTime, Float, ForeignKey,
    Integer, String, Text, JSON,
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.sql import func
import uuid

from dotenv import load_dotenv
import os

load_dotenv()

# ── Engine ─────────────────────────────────────────────────────────────────────
# Uses asyncpg driver:  postgresql+asyncpg://...
_RAW_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/codeverify"
)
# Convert sync URL → async URL if needed
ASYNC_URL = _RAW_URL.replace("postgresql://", "postgresql+asyncpg://").replace(
    "postgresql+psycopg2://", "postgresql+asyncpg://"
)
# Strip query parameters like ?schema=public (unsupported by asyncpg)
if "?" in ASYNC_URL:
    ASYNC_URL = ASYNC_URL.split("?")[0]

engine = create_async_engine(
    ASYNC_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    echo=os.getenv("ENV", "development") == "development",
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


# ── Base ───────────────────────────────────────────────────────────────────────
class Base(AsyncAttrs, DeclarativeBase):
    pass


# ── ORM Models (mirrors Prisma schema) ────────────────────────────────────────

def _uuid() -> str:
    return str(uuid.uuid4())


class StyleProfile(Base):
    """Maps to the style_profiles table created by Prisma."""
    __tablename__ = "style_profiles"

    id                 = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    userId             = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    avgLineLength      = Column(Float, default=0.0)
    camelCaseRatio     = Column(Float, default=0.0)
    snakeCaseRatio     = Column(Float, default=0.0)
    docstringFrequency = Column(Float, default=0.0)
    commentFrequency   = Column(Float, default=0.0)
    avgFuncLength      = Column(Float, default=0.0)
    preferredLoops     = Column(String(10), default="for")
    embeddingVector    = Column(ARRAY(Float), default=list)
    sampleCount        = Column(Integer, default=0)
    updatedAt          = Column(DateTime, default=func.now(), onupdate=func.now())


from sqlalchemy.dialects.postgresql import UUID, ARRAY, ENUM

ai_verdict_enum = ENUM('HUMAN', 'SUSPICIOUS', 'AI_GENERATED', name='AiVerdict', create_type=False)

class DetectionReport(Base):
    """Maps to the detection_reports table created by Prisma."""
    __tablename__ = "detection_reports"

    id                  = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    submissionId        = Column(UUID(as_uuid=False), ForeignKey("submissions.id", ondelete="CASCADE"), unique=True, nullable=False)
    behavioralScore     = Column(Float, nullable=False)
    codePatternScore    = Column(Float, nullable=False)
    fingerprintScore    = Column(Float, nullable=False)
    explainabilityScore = Column(Float, nullable=True, default=None)
    finalAiScore        = Column(Float, nullable=False)
    aiVerdict           = Column(ai_verdict_enum, nullable=False)
    flags               = Column(JSON, nullable=False, default=list)
    trustScoreDelta     = Column(Float, nullable=False)
    createdAt           = Column(DateTime, default=func.now())


class Submission(Base):
    """Partial mirror — only fields we need to update."""
    __tablename__ = "submissions"

    id        = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    userId    = Column(UUID(as_uuid=False), nullable=False)
    aiScore   = Column(Float, nullable=True)
    aiVerdict = Column(ai_verdict_enum, nullable=True)


class User(Base):
    """Partial mirror — only trust score."""
    __tablename__ = "users"

    id         = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    trustScore = Column(Float, default=100.0)


# ── Session Dependency ─────────────────────────────────────────────────────────
async def get_db():
    """FastAPI dependency — yields an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
