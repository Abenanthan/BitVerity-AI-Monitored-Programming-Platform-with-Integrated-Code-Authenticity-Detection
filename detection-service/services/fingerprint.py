"""
detection-service/services/fingerprint.py

Layer 3 — Style Fingerprint Analyzer (UniXcoder)
─────────────────────────────────────────────────
Computes a code embedding using microsoft/unixcoder-base, compares it
to the user's stored embedding in the StyleProfile table via cosine similarity,
and returns an AI-likelihood score (low similarity = style mismatch = AI suspected).

Also handles profile creation and EMA-based update.
"""
from __future__ import annotations

import logging
import uuid
from functools import lru_cache
from typing import Tuple

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres import StyleProfile

logger = logging.getLogger(__name__)

ALPHA       = 0.15   # EMA weight for new samples
MIN_SAMPLES = 3      # minimum profile samples before fingerprinting is trusted


# ─────────────────────────────────────────────────────────────────────────────
#  UniXcoder model (lazy, cached)
# ─────────────────────────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _load_unixcoder(model_name: str = "microsoft/unixcoder-base"):
    try:
        from transformers import AutoTokenizer, AutoModel
        logger.info(f"Loading UniXcoder: {model_name}")
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model     = AutoModel.from_pretrained(model_name)
        model.eval()
        logger.info("UniXcoder loaded ✅")
        return tokenizer, model
    except Exception as exc:
        logger.warning(f"UniXcoder unavailable ({exc}) — cosine fingerprint disabled")
        return None, None


def get_code_embedding(code: str) -> np.ndarray | None:
    """Returns 768-dim CLS embedding from UniXcoder or None on failure."""
    unixcoder_name = "microsoft/unixcoder-base"
    tokenizer, model = _load_unixcoder(unixcoder_name)
    if tokenizer is None:
        return None
    try:
        import torch
        inputs = tokenizer(
            code, return_tensors="pt",
            max_length=512, truncation=True, padding=True,
        )
        with torch.no_grad():
            out = model(**inputs)
        vec = out.last_hidden_state[:, 0, :].squeeze().numpy()
        # L2-normalise before storage
        norm = np.linalg.norm(vec)
        return (vec / norm).astype(np.float32) if norm > 0 else vec.astype(np.float32)
    except Exception as exc:
        logger.warning(f"UniXcoder inference error: {exc}")
        return None


# ─────────────────────────────────────────────────────────────────────────────
#  DB helpers
# ─────────────────────────────────────────────────────────────────────────────

async def _get_style_profile(user_id: str, db: AsyncSession) -> StyleProfile | None:
    result = await db.execute(
        select(StyleProfile).where(StyleProfile.userId == user_id)
    )
    return result.scalar_one_or_none()


# ─────────────────────────────────────────────────────────────────────────────
#  Public API
# ─────────────────────────────────────────────────────────────────────────────

async def analyze(
    user_id:  str,
    code:     str,
    language: str,
    db:       AsyncSession,
) -> Tuple[float, list]:
    """
    Returns (ai_score: float [0,1], flags: list).
    ai_score = 1 - cosine_similarity(new_embedding, stored_embedding)
    """
    profile = await _get_style_profile(user_id, db)

    # Not enough history → neutral score
    if profile is None or profile.sampleCount < MIN_SAMPLES:
        sample_count = 0 if profile is None else profile.sampleCount
        return 0.5, [{
            "type":   "insufficient_fingerprint_data",
            "detail": f"Only {sample_count} sample(s) in profile — need ≥{MIN_SAMPLES}",
        }]

    new_embedding = get_code_embedding(code)

    if new_embedding is None or not profile.embeddingVector:
        return 0.5, [{"type": "embedding_unavailable", "detail": "UniXcoder not loaded"}]

    stored_vec = np.array(profile.embeddingVector, dtype=np.float32).reshape(1, -1)
    new_vec    = new_embedding.reshape(1, -1)

    similarity = float(cosine_similarity(new_vec, stored_vec)[0][0])
    # Clamp to [0, 1] (numerical rounding can push beyond)
    similarity = max(0.0, min(1.0, similarity))

    # Low similarity = style doesn't match = suspected AI
    ai_score = round(1.0 - similarity, 4)

    flags = []
    if ai_score > 0.55:
        flags.append({
            "type":   "fingerprint_mismatch",
            "detail": f"Style embedding cosine similarity={similarity:.3f} — does not match user profile",
        })
    elif ai_score > 0.35:
        flags.append({
            "type":   "fingerprint_divergence",
            "detail": f"Style similarity={similarity:.3f} — mild divergence from stored profile",
        })

    logger.debug(f"[Fingerprint] userId={user_id} similarity={similarity:.4f} ai_score={ai_score}")
    return ai_score, flags


async def update_profile(
    user_id:  str,
    code:     str,
    language: str,
    db:       AsyncSession,
) -> None:
    """
    Update the user's StyleProfile using an Exponential Moving Average (EMA).
    Called after a HUMAN-verified submission.
    """
    new_embedding = get_code_embedding(code)
    profile       = await _get_style_profile(user_id, db)

    if profile is None:
        # Create new profile
        init_vec = new_embedding.tolist() if new_embedding is not None else []
        new_profile = StyleProfile(
            userId          = user_id,
            embeddingVector = init_vec,
            sampleCount     = 1,
        )
        db.add(new_profile)
        await db.commit()
        logger.info(f"[Fingerprint] Created new StyleProfile for user {user_id}")
        return

    # ── EMA update ────────────────────────────────────────────────────────────
    if new_embedding is not None and profile.embeddingVector:
        old_vec    = np.array(profile.embeddingVector, dtype=np.float32)
        blended    = (1 - ALPHA) * old_vec + ALPHA * new_embedding
        norm       = np.linalg.norm(blended)
        normalised = (blended / norm).tolist() if norm > 0 else blended.tolist()
    elif new_embedding is not None:
        normalised = new_embedding.tolist()
    else:
        normalised = profile.embeddingVector  # no change

    await db.execute(
        update(StyleProfile)
        .where(StyleProfile.userId == user_id)
        .values(
            embeddingVector = normalised,
            sampleCount     = StyleProfile.sampleCount + 1,
        )
    )
    await db.commit()
    logger.info(f"[Fingerprint] Updated StyleProfile for user {user_id} (samples={profile.sampleCount + 1})")
