"""
detection-service/models/schemas.py
Pydantic v2 models for the CodeVerify detection API.
"""
from __future__ import annotations

from typing import Any, List
from pydantic import BaseModel, Field, model_validator


# ── Inbound ───────────────────────────────────────────────────────────────────

class BehaviorEvent(BaseModel):
    type: str           # "keystroke" | "paste_event" | "tab_switch" | "idle"
    time: int           # unix timestamp in milliseconds
    data: dict[str, Any] = {}  # e.g. {"charCount": 400, "key": "v"}

    @model_validator(mode='before')
    @classmethod
    def transform_event(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Normalize timestamp: 'abs' or 't' (relative) to 'time'
            if 'time' not in data:
                if 'abs' in data:
                    data['time'] = data['abs']
                elif 't' in data:
                    # If only relative time 't' is provided, we might need a base time,
                    # but for now let's just use it as is if 'time' is missing.
                    data['time'] = data['t']
            
            # Map top-level fields into 'data' dict if 'data' is empty or missing
            if 'data' not in data:
                data['data'] = {}
            
            reserved = {'type', 'time', 'data'}
            for k, v in data.items():
                if k not in reserved:
                    data['data'][k] = v
                    
            # Ensure 'charCount' is available for paste events if 'chars' was sent
            if data['type'] == 'paste' and 'chars' in data['data'] and 'charCount' not in data['data']:
                data['data']['charCount'] = data['data']['chars']

        return data


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
