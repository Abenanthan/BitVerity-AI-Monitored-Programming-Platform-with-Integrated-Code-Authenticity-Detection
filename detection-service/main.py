"""
detection-service/main.py

CodeVerify Detection Engine — FastAPI application entry point.

Endpoints available at /detect:
  POST /detect/analyze   → full 3-layer detection pipeline
  POST /detect/explain   → explainability challenge scoring
  GET  /detect/report/{id} → fetch stored detection report
  GET  /health           → liveness check
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import detect
from db.postgres import engine

logging.basicConfig(
    level   = logging.DEBUG if os.getenv("ENV", "development") == "development" else logging.INFO,
    format  = "%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt = "%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Lifespan — warm up ML models at startup ────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀  CodeVerify Detection Engine starting …")

    # Warm up CodeBERT
    try:
        from services.code_pattern import _load_codebert
        _load_codebert()
    except Exception as e:
        logger.warning(f"CodeBERT warm-up skipped: {e}")

    # Warm up UniXcoder
    try:
        from services.fingerprint import _load_unixcoder
        _load_unixcoder()
    except Exception as e:
        logger.warning(f"UniXcoder warm-up skipped: {e}")

    # Warm up Isolation Forest
    try:
        from services.behavioral import _get_isolation_forest
        _get_isolation_forest()
        logger.info("Isolation Forest ready ✅")
    except Exception as e:
        logger.warning(f"IsolationForest warm-up skipped: {e}")

    logger.info("✅  All models warmed up — ready to serve")
    yield

    logger.info("🛑  Detection Engine shutting down")
    await engine.dispose()


# ── FastAPI app ────────────────────────────────────────────────────────────────
app = FastAPI(
    title       = "CodeVerify Detection Engine",
    description = "3-layer AI code authenticity detection: Behavioral + CodeBERT/XGBoost + UniXcoder",
    version     = "2.0.0",
    docs_url    = "/docs"  if os.getenv("ENV", "development") != "production" else None,
    redoc_url   = "/redoc" if os.getenv("ENV", "development") != "production" else None,
    lifespan    = lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins  = ["*"],   # Restrict to Node.js API origin in production
    allow_methods  = ["GET", "POST"],
    allow_headers  = ["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(detect.router, prefix="/detect")


# ── Health check ───────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "ok",
        "service": "CodeVerify Detection Engine",
        "version": "2.0.0",
        "at": datetime.now(timezone.utc).isoformat(),
    }


# ── Run directly ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host   = "0.0.0.0",
        port   = int(os.getenv("PORT", "8000")),
        reload = os.getenv("ENV", "development") == "development",
    )
