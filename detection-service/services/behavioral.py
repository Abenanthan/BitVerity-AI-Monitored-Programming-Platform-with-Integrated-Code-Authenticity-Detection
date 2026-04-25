"""
detection-service/services/behavioral.py

Layer 1 — Behavioral Analyzer
───────────────────────────────
Analyzes the keystroke / interaction log captured by the frontend monitor.

Signals detected:
  1. Large paste event (> 60% of final code length)
  2. Tab switch frequency (> 3 times)
  3. Typing speed anomaly — Isolation Forest on keystroke intervals
  4. Backspace ratio < 1.5% (no corrections → AI-likely)
  5. Zero idle time across the session
  6. Single explosive burst (code appeared in <5 seconds)
"""
from __future__ import annotations

import logging
import statistics
from typing import List, Tuple

import numpy as np
from sklearn.ensemble import IsolationForest

from models.schemas import BehaviorEvent

logger = logging.getLogger(__name__)

# Pre-fitted Isolation Forest (fitted lazily on first call)
_iso_forest: IsolationForest | None = None


def _get_isolation_forest() -> IsolationForest:
    global _iso_forest
    if _iso_forest is None:
        # In production this would be loaded from a saved .pkl file.
        # Here we fit it with synthetic "normal" typing intervals (50–300ms gaps).
        rng = np.random.default_rng(42)
        normal_intervals = rng.uniform(50, 300, size=(500, 1))
        _iso_forest = IsolationForest(
            n_estimators=100,
            contamination=0.05,
            random_state=42,
        )
        _iso_forest.fit(normal_intervals)
    return _iso_forest


def analyze(
    behavior_log: List[BehaviorEvent],
    code: str,
) -> Tuple[float, List[dict]]:
    """
    Returns (ai_score: float [0,1], flags: list[dict]).
    score 0.0 = clearly human, 1.0 = clearly AI.
    """
    if not behavior_log:
        return 0.5, [{"type": "no_behavior_log", "detail": "No keystroke data available"}]

    flags:      List[dict] = []
    suspicion:  float      = 0.0
    checks:     int        = 0

    events = sorted(behavior_log, key=lambda e: e.time)

    # ── 1. Large paste detection ───────────────────────────────────────────────
    paste_events = [e for e in events if e.type == "paste"]
    total_pasted = sum(e.data.get("chars", 0) for e in paste_events)
    code_len     = max(len(code), 1)
    paste_ratio  = total_pasted / code_len

    if paste_ratio > 0.90:
        suspicion += 5.0  # Dominant signal
        flags.append({
            "type":   "full_code_paste",
            "detail": f"Entire code ({total_pasted} chars) arrived in a single paste event",
        })
    elif paste_ratio > 0.60:
        suspicion += 3.0
        flags.append({
            "type":   "large_paste",
            "detail": f"{total_pasted} chars pasted ({paste_ratio:.0%} of code)",
        })
    elif paste_ratio > 0.35:
        suspicion += 1.0
        flags.append({
            "type":   "moderate_paste",
            "detail": f"{paste_ratio:.0%} of code arrived via paste",
        })

    # ── 2. Tab switches ────────────────────────────────────────────────────────
    tab_switches = [e for e in events if e.type == "tab_switch" or e.type == "tab_hidden"]
    if len(tab_switches) >= 3:
        suspicion += 1.0
        flags.append({
            "type":   "tab_switch",
            "detail": f"Switched away/tabs {len(tab_switches)} times — potential external assistance",
        })

    # ── 3. Isolation Forest on keystroke intervals ─────────────────────────────
    keystrokes = [e for e in events if e.type == "keystroke"]
    if len(keystrokes) >= 10:
        intervals = np.array([
            keystrokes[i].time - keystrokes[i - 1].time
            for i in range(1, len(keystrokes))
            if 0 < (keystrokes[i].time - keystrokes[i - 1].time) < 5000
        ]).reshape(-1, 1)

        if len(intervals) >= 5:
            iso = _get_isolation_forest()
            preds = iso.predict(intervals)  # -1 = anomaly, 1 = normal
            anomaly_rate = (preds == -1).sum() / len(preds)

            if anomaly_rate < 0.02:
                # Virtually no anomalies = robotic typing cadence
                suspicion += 1.5
                flags.append({
                    "type":   "robotic_typing_cadence",
                    "detail": f"Keystroke intervals are unnaturally uniform (anomaly_rate={anomaly_rate:.2f})",
                })
            elif anomaly_rate < 0.05:
                suspicion += 0.5

    # ── 4. Backspace / correction ratio ───────────────────────────────────────
    backspace_events = [e for e in keystrokes if e.data.get("key") in ("Backspace", "Delete")]
    backspace_ratio  = len(backspace_events) / max(len(keystrokes), 1)
    if backspace_ratio < 0.015 and len(keystrokes) > 40:
        suspicion += 1.2
        flags.append({
            "type":   "no_corrections",
            "detail": f"Backspace rate {backspace_ratio:.1%} — humans make more mistakes",
        })

    # ── 5. Zero idle time ─────────────────────────────────────────────────────
    idle_events   = [e for e in events if e.type == "idle"]
    total_idle_ms = sum(e.data.get("duration", 0) for e in idle_events)
    if events:
        session_ms = max(events[-1].time - events[0].time, 1)
        idle_ratio = total_idle_ms / session_ms
        if idle_ratio < 0.03 and len(keystrokes) > 30:
            suspicion += 0.8
            flags.append({
                "type":   "zero_idle",
                "detail": "Session has almost no idle time — humans typically pause to think",
            })

    # ── 6. Single explosive burst ─────────────────────────────────────────────
    if events and code_len > 100:
        session_seconds = max((events[-1].time - events[0].time) / 1000, 1)
        chars_per_sec   = code_len / session_seconds
        if chars_per_sec > 100:  # >100 chars/sec ≈ impossible human typing
            suspicion += 6.0  # Massive signal
            flags.append({
                "type":   "explosive_burst",
                "detail": f"Entire code appeared at {chars_per_sec:.0f} chars/sec (paste/generation likely)",
            })
        elif chars_per_sec > 40:
            suspicion += 2.0

    # Normalise: we want suspicion >= 5 to be almost 1.0
    score = min(suspicion / 5.0, 1.0)
    logger.debug(f"[Behavioral] score={score:.4f} suspicion={suspicion}")
    return round(score, 4), flags
