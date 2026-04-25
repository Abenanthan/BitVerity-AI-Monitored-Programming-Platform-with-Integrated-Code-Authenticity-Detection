"""
detection-service/routers/detect.py

POST /detect/analyze  — Full 3-layer AI detection pipeline
POST /detect/explain  — Score explainability challenge answer
GET  /detect/report/{submission_id} — Fetch stored report
"""
from __future__ import annotations

import logging
import uuid
import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres import get_db, DetectionReport, Submission, User, StyleProfile
from models.schemas import DetectionRequest, DetectionResponse
from services import behavioral as behavioral_service
from services import code_pattern as code_pattern_service
from services import fingerprint as fingerprint_service
from services import scorer

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Detection"])


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

async def _save_detection_report(
    submission_id: str,
    result:        scorer.ScorerResult,
    db:            AsyncSession,
) -> None:
    """Persist the DetectionReport and update Submission + User trust score."""

    # Upsert detection report (avoid duplicate on retry)
    existing = await db.execute(
        select(DetectionReport).where(DetectionReport.submissionId == submission_id)
    )
    if existing.scalar_one_or_none():
        logger.warning(f"DetectionReport already exists for {submission_id} — skipping insert")
        return

    report = DetectionReport(
        submissionId        = submission_id,
        behavioralScore     = result.behavioral_score,
        codePatternScore    = result.code_pattern_score,
        fingerprintScore    = result.fingerprint_score,
        explainabilityScore = 0.5,  # placeholder until /explain called
        finalAiScore        = result.final_ai_score,
        aiVerdict           = result.ai_verdict,
        flags               = [f for f in result.flags],
        trustScoreDelta     = result.trust_score_delta,
    )
    db.add(report)

    # Update submission.aiScore + aiVerdict
    await db.execute(
        update(Submission)
        .where(Submission.id == submission_id)
        .values(aiScore=result.final_ai_score, aiVerdict=result.ai_verdict)
    )

    # Update user trust score (clamp to [0, 100])
    sub_row = await db.execute(
        select(Submission.userId).where(Submission.id == submission_id)
    )
    user_id = sub_row.scalar_one_or_none()
    if user_id:
        user_row = await db.execute(select(User).where(User.id == user_id))
        user     = user_row.scalar_one_or_none()
        if user:
            new_trust = max(0.0, min(100.0, user.trustScore + result.trust_score_delta))
            await db.execute(
                update(User).where(User.id == user_id).values(trustScore=new_trust)
            )

    await db.commit()
    logger.info(
        f"[Router] Report saved: submission={submission_id} "
        f"verdict={result.ai_verdict} score={result.final_ai_score:.4f}"
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /detect/analyze
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/analyze", response_model=DetectionResponse, status_code=200)
async def analyze_submission(
    req:              DetectionRequest,
    background_tasks: BackgroundTasks,
    db:               AsyncSession = Depends(get_db),
):
    """
    Full 3-layer AI detection pipeline:
      Layer 1 — Behavioral analysis  (weight 0.35)
      Layer 2 — Code Pattern (CodeBERT + XGBoost)  (weight 0.25)
      Layer 3 — Style Fingerprint (UniXcoder)  (weight 0.25)
    """
    logger.info(f"[/analyze] submissionId={req.submissionId} userId={req.userId} lang={req.language}")

    # ── Layer 1: Behavioral ────────────────────────────────────────────────────
    behav_result = behavioral_service.analyze(req.behaviorLog, req.code)
    # Returns (score: float, flags: list)

    # ── Layer 2: Code Pattern (CodeBERT + XGBoost) ─────────────────────────────
    cp_result = code_pattern_service.analyze(req.code, req.language)
    # Returns (score, codebert_score, xgb_score, flags)

    # ── Layer 3: Style Fingerprint (UniXcoder) ─────────────────────────────────
    fp_result = await fingerprint_service.analyze(req.userId, req.code, req.language, db)
    # Returns (score, flags)

    # ── Final weighted score ────────────────────────────────────────────────────
    final = scorer.calculate(
        behavioral   = behav_result,
        code_pattern = cp_result,
        fingerprint  = fp_result,
    )

    # ── Persist report to PostgreSQL ───────────────────────────────────────────
    try:
        await _save_detection_report(req.submissionId, final, db)
    except Exception as exc:
        logger.error(f"Failed to save detection report: {exc}")
        # Non-fatal — still return result to caller

    # ── Update style profile (background, non-blocking) ────────────────────────
    # Only update on HUMAN or low-suspicion SUSPICIOUS verdicts
    if final.ai_verdict == "HUMAN" or (
        final.ai_verdict == "SUSPICIOUS" and final.final_ai_score < 0.55
    ):
        background_tasks.add_task(
            fingerprint_service.update_profile,
            req.userId, req.code, req.language, db,
        )

    return DetectionResponse(
        submissionId     = req.submissionId,
        behavioralScore  = final.behavioral_score,
        codePatternScore = final.code_pattern_score,
        fingerprintScore = final.fingerprint_score,
        finalAiScore     = final.final_ai_score,
        aiVerdict        = final.ai_verdict,
        flags            = final.flags,
        trustScoreDelta  = final.trust_score_delta,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /detect/explain
# ─────────────────────────────────────────────────────────────────────────────
from pydantic import BaseModel


class ExplainRequest(BaseModel):
    submissionId:  str
    answer:        str
    questionId:    str | None = None


class ExplainResponse(BaseModel):
    submissionId:        str
    explainabilityScore: float
    finalAiScore:        float
    aiVerdict:           str
    trustScoreAdjustment: float
    message:             str


@router.post("/explain", response_model=ExplainResponse)
async def score_explain(
    req: ExplainRequest,
    db:  AsyncSession = Depends(get_db),
):
    """
    Scores a user's code-explanation answer and recomputes the final AI score
    incorporating the explainability component (weight 0.15).
    """
    report_row = await db.execute(
        select(DetectionReport).where(DetectionReport.submissionId == req.submissionId)
    )
    report = report_row.scalar_one_or_none()
    if report is None:
        raise HTTPException(status_code=404, detail="Detection report not found")

    # Fetch the submission code for token comparison
    sub_row = await db.execute(
        select(Submission).where(Submission.id == req.submissionId)
    )
    submission = sub_row.scalar_one_or_none()

    # Score the answer
    import re
    if submission:
        code_tokens  = set(re.findall(r"\b[a-zA-Z_][a-zA-Z0-9_]{2,}\b", ""))
    answer_tokens = re.findall(r"\b[a-zA-Z_][a-zA-Z0-9_]{2,}\b", req.answer.lower())
    length_bonus  = min(len(req.answer.split()) / 50.0, 0.2)
    if submission:
        # Reload code
        pass  # submission.code not in partial model — use answer length proxy
    explain_score = min(0.5 + length_bonus + len(answer_tokens) / 200, 1.0)

    # Recompute final AI score incorporating explainability
    W_EXPLAIN = 0.15
    explain_ai = 1.0 - explain_score
    new_final  = round(
        report.behavioralScore   * float(os.getenv("WEIGHT_BEHAVIORAL",   "0.35")) +
        report.codePatternScore  * float(os.getenv("WEIGHT_CODE_PATTERN", "0.25")) +
        report.fingerprintScore  * float(os.getenv("WEIGHT_FINGERPRINT",  "0.25")) +
        explain_ai               * W_EXPLAIN,
        4,
    )
    new_final = max(0.0, min(1.0, new_final))
    new_verdict = scorer._verdict(new_final)

    trust_adjust = round(explain_score * 5.0, 2)  # up to +5

    # Persist updated scores
    updated_flags = list(report.flags) + [{
        "type":   "explainability_challenge",
        "detail": f"Score={explain_score:.2f}, Q={req.questionId or 'general'}",
    }]
    await db.execute(
        update(DetectionReport)
        .where(DetectionReport.submissionId == req.submissionId)
        .values(
            explainabilityScore = round(explain_score, 4),
            finalAiScore        = new_final,
            aiVerdict           = new_verdict,
            flags               = updated_flags,
        )
    )

    # Adjust trust score
    sub_row2 = await db.execute(
        select(Submission.userId).where(Submission.id == req.submissionId)
    )
    user_id = sub_row2.scalar_one_or_none()
    if user_id:
        user_row = await db.execute(select(User).where(User.id == user_id))
        user     = user_row.scalar_one_or_none()
        if user:
            new_trust = max(0.0, min(100.0, user.trustScore + trust_adjust))
            await db.execute(update(User).where(User.id == user_id).values(trustScore=new_trust))

    await db.commit()

    return ExplainResponse(
        submissionId         = req.submissionId,
        explainabilityScore  = round(explain_score, 4),
        finalAiScore         = new_final,
        aiVerdict            = new_verdict,
        trustScoreAdjustment = trust_adjust,
        message = (
            "Good explanation — trust score improved"
            if explain_score > 0.6
            else "Consider a more detailed explanation"
        ),
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /detect/report/{submission_id}
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/report/{submission_id}")
async def get_report(submission_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(DetectionReport).where(DetectionReport.submissionId == submission_id)
    )
    report = result.scalar_one_or_none()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    return {
        "submissionId":        report.submissionId,
        "behavioralScore":     report.behavioralScore,
        "codePatternScore":    report.codePatternScore,
        "fingerprintScore":    report.fingerprintScore,
        "explainabilityScore": report.explainabilityScore,
        "finalAiScore":        report.finalAiScore,
        "aiVerdict":           report.aiVerdict,
        "flags":               report.flags,
        "trustScoreDelta":     report.trustScoreDelta,
        "createdAt":           str(report.createdAt),
    }
