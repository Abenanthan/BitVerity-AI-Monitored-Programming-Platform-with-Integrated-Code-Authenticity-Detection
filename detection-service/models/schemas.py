"""
detection-service/models/schemas.py
Pydantic v2 models for the CodeVerify detection API.
"""
from __future__ import annotations

from typing import Any, List
from pydantic import BaseModel, Field


# ── Inbound ───────────────────────────────────────────────────────────────────

class BehaviorEvent(BaseModel):
    type: str           # "keystroke" | "paste_event" | "tab_switch" | "idle"
    time: int           # unix timestamp in milliseconds
    data: dict[str, Any] = {}  # e.g. {"charCount": 400, "key": "v"}


class DetectionRequest(BaseModel):
    submissionId: str
    userId:       str
    code:         str
    language:     str   # python | java | cpp | javascript
    behaviorLog:  List[BehaviorEvent] = []


# ── Sub-scores (internal) ─────────────────────────────────────────────────────

class BehavioralResult(BaseModel):
    score: float = Field(ge=0.0, le=1.0)
    flags: List[dict] = []


class CodePatternResult(BaseModel):
    score:           float = Field(ge=0.0, le=1.0)
    codebert_score:  float = Field(ge=0.0, le=1.0)
    xgboost_score:   float = Field(ge=0.0, le=1.0)
    flags:           List[dict] = []


class FingerprintResult(BaseModel):
    score:     float = Field(ge=0.0, le=1.0)
    similarity: float | None = None
    flags:     List[dict] = []


class ScorerResult(BaseModel):
    behavioral_score:   float
    code_pattern_score: float
    fingerprint_score:  float
    final_ai_score:     float
    ai_verdict:         str    # HUMAN | SUSPICIOUS | AI_GENERATED
    flags:              List[dict]
    trust_score_delta:  float


# ── Outbound ──────────────────────────────────────────────────────────────────

class DetectionResponse(BaseModel):
    submissionId:      str
    behavioralScore:   float
    codePatternScore:  float
    fingerprintScore:  float
    finalAiScore:      float
    aiVerdict:         str
    flags:             List[dict]
    trustScoreDelta:   float
