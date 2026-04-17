"""
detection-service/services/scorer.py

Final Weighted Score Calculator
─────────────────────────────────
Combines outputs from all three detection layers using
configurable weights and produces a verdict + trust delta.

Weights:
  Behavioral   = 0.35
  Code Pattern = 0.25
  Fingerprint  = 0.25
  (Explainability reserved = 0.15, applied via /detect/explain endpoint)

Verdict thresholds:
  AI_GENERATED  ≥ 0.75
  SUSPICIOUS    ≥ 0.45
  HUMAN         < 0.45
"""
from __future__ import annotations

import os
from models.schemas import ScorerResult

# ── Weights ────────────────────────────────────────────────────────────────────
W_BEHAVIORAL   = float(os.getenv("WEIGHT_BEHAVIORAL",    "0.35"))
W_CODE_PATTERN = float(os.getenv("WEIGHT_CODE_PATTERN",  "0.25"))
W_FINGERPRINT  = float(os.getenv("WEIGHT_FINGERPRINT",   "0.25"))
# Remaining 0.15 is held for explainability — base score uses 0.85 total

# Normalise weights to ensure they sum correctly without explainability
_TOTAL_BASE = W_BEHAVIORAL + W_CODE_PATTERN + W_FINGERPRINT  # 0.85

# ── Verdict thresholds ─────────────────────────────────────────────────────────
THRESHOLD_AI         = float(os.getenv("THRESHOLD_AI",          "0.75"))
THRESHOLD_SUSPICIOUS = float(os.getenv("THRESHOLD_SUSPICIOUS",  "0.45"))


# ─────────────────────────────────────────────────────────────────────────────

def _verdict(score: float) -> str:
    if score >= THRESHOLD_AI:
        return "AI_GENERATED"
    elif score >= THRESHOLD_SUSPICIOUS:
        return "SUSPICIOUS"
    return "HUMAN"


def _trust_delta(verdict: str, final_score: float) -> float:
    """
    Trust score change (applied to the user's account).
    Range: −20 to +2.
    """
    if verdict == "HUMAN":
        return round(min(2.0, (1.0 - final_score) * 2.5), 2)
    elif verdict == "SUSPICIOUS":
        return round(-5.0 * final_score, 2)
    else:  # AI_GENERATED
        return round(-20.0 * final_score, 2)


def calculate(
    behavioral:   tuple,    # (score: float, flags: list)
    code_pattern: tuple,    # (score: float, cb_score: float, xgb_score: float, flags: list)
    fingerprint:  tuple,    # (score: float, flags: list)
) -> ScorerResult:
    """
    Combine all layer scores into a final weighted result.

    behavioral   → (score, flags)
    code_pattern → (score, codebert_score, xgb_score, flags)
    fingerprint  → (score, flags)
    """
    b_score,  b_flags             = behavioral
    cp_score, cb_score, xgb_score, cp_flags = code_pattern
    fp_score, fp_flags            = fingerprint

    # ── Weighted final score ───────────────────────────────────────────────────
    # Scale weights to the 0.85 base (0.15 held for explainability)
    final = round(
        (W_BEHAVIORAL   / _TOTAL_BASE) * b_score  * _TOTAL_BASE +
        (W_CODE_PATTERN / _TOTAL_BASE) * cp_score * _TOTAL_BASE +
        (W_FINGERPRINT  / _TOTAL_BASE) * fp_score * _TOTAL_BASE,
        4,
    )
    # Simplification — just use direct weighted sum over 0.85
    final = round(
        W_BEHAVIORAL   * b_score  +
        W_CODE_PATTERN * cp_score +
        W_FINGERPRINT  * fp_score,
        4,
    )
    final = max(0.0, min(1.0, final))

    verdict     = _verdict(final)
    trust_delta = _trust_delta(verdict, final)
    all_flags   = b_flags + cp_flags + fp_flags

    return ScorerResult(
        behavioral_score   = round(b_score,  4),
        code_pattern_score = round(cp_score, 4),
        fingerprint_score  = round(fp_score, 4),
        final_ai_score     = final,
        ai_verdict         = verdict,
        flags              = all_flags,
        trust_score_delta  = trust_delta,
    )


def incorporate_explainability(
    result:             ScorerResult,
    explainability_score: float,
) -> ScorerResult:
    """
    Called from the /detect/explain endpoint to incorporate the
    explainability challenge result (weight 0.15).
    Recalculates finalAiScore with all four signals.
    """
    W_EXPLAIN = 0.15
    # Convert explainability score: high explain score → human → low AI signal
    explain_ai_signal = 1.0 - explainability_score

    new_final = round(
        W_BEHAVIORAL   * result.behavioral_score   +
        W_CODE_PATTERN * result.code_pattern_score +
        W_FINGERPRINT  * result.fingerprint_score  +
        W_EXPLAIN      * explain_ai_signal,
        4,
    )
    new_final   = max(0.0, min(1.0, new_final))
    new_verdict = _verdict(new_final)

    return ScorerResult(
        behavioral_score   = result.behavioral_score,
        code_pattern_score = result.code_pattern_score,
        fingerprint_score  = result.fingerprint_score,
        final_ai_score     = new_final,
        ai_verdict         = new_verdict,
        flags              = result.flags,
        trust_score_delta  = _trust_delta(new_verdict, new_final),
    )
