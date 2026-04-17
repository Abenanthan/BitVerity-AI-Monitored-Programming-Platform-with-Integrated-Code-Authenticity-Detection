"""
detection-service/services/code_pattern.py

Layer 2 — Code Pattern Analyzer (CodeBERT + XGBoost)
──────────────────────────────────────────────────────
Two separate scoring paths:

  Path A — CodeBERT Semantic (weight 0.70)
    Extracts the CLS-token embedding from microsoft/codebert-base.
    In production a fine-tuned linear classifier head would sit on top.
    Here we use the L2-norm heuristic + vocabulary probe as a proxy.

  Path B — XGBoost Structural (weight 0.30)
    Extracts hand-crafted AST / style features and runs them through
    an XGBoost binary classifier trained on human vs AI-generated code.
    Falls back to a deterministic rule-based scorer if the model file
    is not found on disk.

Combined: codebert_score * 0.70 + xgb_score * 0.30
"""
from __future__ import annotations

import ast
import logging
import math
import os
import re
from functools import lru_cache
from typing import Tuple

import numpy as np

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
#  CodeBERT (lazy load, cached)
# ─────────────────────────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _load_codebert(model_name: str = "microsoft/codebert-base"):
    try:
        from transformers import AutoTokenizer, AutoModel
        logger.info(f"Loading CodeBERT: {model_name}")
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model     = AutoModel.from_pretrained(model_name)
        model.eval()
        logger.info("CodeBERT loaded ✅")
        return tokenizer, model
    except Exception as exc:
        logger.warning(f"CodeBERT unavailable ({exc}) — heuristic fallback active")
        return None, None


def get_codebert_embedding(code: str) -> np.ndarray | None:
    """Returns 768-dim CLS embedding or None on failure."""
    tokenizer, model = _load_codebert()
    if tokenizer is None:
        return None
    try:
        import torch
        inputs = tokenizer(
            code, return_tensors="pt",
            max_length=512, truncation=True, padding=True,
        )
        with torch.no_grad():
            outputs = model(**inputs)
        return outputs.last_hidden_state[:, 0, :].squeeze().numpy()
    except Exception as exc:
        logger.warning(f"CodeBERT inference error: {exc}")
        return None


def _codebert_score(code: str) -> float:
    """AI-likelihood score from CodeBERT embedding (0 = human, 1 = AI)."""
    embedding = get_codebert_embedding(code)
    if embedding is None:
        return _heuristic_vocab_score(code)

    norm = float(np.linalg.norm(embedding))
    # Human code spans a wider embedding space (higher norm).
    # AI-generated code clusters centrally (lower norm ~6–10).
    score = max(0.0, min(1.0, (12.0 - norm) / 12.0))

    # Blend with vocabulary probe
    vocab_score = _heuristic_vocab_score(code)
    return round(0.75 * score + 0.25 * vocab_score, 4)


# ── AI vocabulary probe ───────────────────────────────────────────────────────
_AI_WORDS = {
    "efficient", "optimal", "utilizing", "approach", "straightforward",
    "iterate", "maintains", "ensures", "considers", "leverage",
    "elegant", "idiomatic", "traverse", "implementation", "perform",
}
_HUMAN_WORDS = {"tmp", "temp", "todo", "fixme", "debug", "hack", "wtf", "blah"}


def _heuristic_vocab_score(code: str) -> float:
    words = set(re.findall(r"\b[a-zA-Z]{4,}\b", code.lower()))
    if not words:
        return 0.5
    ai_hits    = len(words & _AI_WORDS)
    human_hits = len(words & _HUMAN_WORDS)
    raw = (ai_hits * 2 - human_hits * 3) / max(len(words), 1)
    return max(0.0, min(1.0, raw * 5 + 0.3))


# ─────────────────────────────────────────────────────────────────────────────
#  AST Feature Extraction
# ─────────────────────────────────────────────────────────────────────────────

def extract_ast_features(code: str, language: str) -> dict:
    """Extract structural features from code. Language-aware."""
    features: dict = {
        "has_docstring":          0.0,
        "avg_var_name_len":       0.0,
        "comment_ratio":          0.0,
        "edge_case_handling":     0.0,
        "cyclomatic_complexity":  1.0,
        "avg_line_length":        0.0,
        "line_stddev":            0.0,
        "camel_case_ratio":       0.0,
        "snake_case_ratio":       0.0,
        "has_debug_print":        0.0,
        "blank_ratio":            0.0,
        "avg_func_length":        0.0,
    }

    lines     = code.splitlines()
    non_empty = [l for l in lines if l.strip()]
    if not non_empty:
        return features

    # ── Universal (regex-based) features ──────────────────────────────────────
    lengths = [len(l) for l in non_empty]
    features["avg_line_length"] = sum(lengths) / len(lengths)
    variance = sum((l - features["avg_line_length"]) ** 2 for l in lengths) / len(lengths)
    features["line_stddev"]     = math.sqrt(variance)
    features["blank_ratio"]     = (len(lines) - len(non_empty)) / max(len(lines), 1)

    identifiers = re.findall(r"\b([a-zA-Z_][a-zA-Z0-9_]{2,})\b", code)
    if identifiers:
        features["avg_var_name_len"] = sum(len(i) for i in identifiers) / len(identifiers)
        camel  = sum(1 for i in identifiers if re.match(r"^[a-z]+[A-Z]", i))
        snake  = sum(1 for i in identifiers if "_" in i and i == i.lower())
        total  = len(identifiers)
        features["camel_case_ratio"] = camel / total
        features["snake_case_ratio"] = snake / total

    comment_lines = sum(1 for l in lines if re.match(r"^\s*(#|//|/\*|\*)", l))
    features["comment_ratio"] = comment_lines / max(len(non_empty), 1)

    debug_pats = [r"print\s*\(", r"console\.log", r"System\.out\.print", r"printf\s*\("]
    features["has_debug_print"] = float(any(re.search(p, code) for p in debug_pats))

    # Edge case handling: try/except, if not, if len == 0, etc.
    edge_pats = [r"try\s*:", r"except\s+", r"if\s+not\b", r"if\s+len\(", r"if\s+\w+\s*==\s*0"]
    features["edge_case_handling"] = min(sum(len(re.findall(p, code)) for p in edge_pats) / 5, 1.0)

    # ── Python-specific AST ────────────────────────────────────────────────────
    if language == "python":
        try:
            tree = ast.parse(code)

            # Docstrings
            docstrings = [
                node for node in ast.walk(tree)
                if isinstance(node, ast.Expr)
                and isinstance(node.value, ast.Constant)
                and isinstance(node.value.value, str)
            ]
            features["has_docstring"] = float(bool(docstrings))

            # Cyclomatic complexity proxy: count branches
            branch_types = (ast.If, ast.For, ast.While, ast.ExceptHandler,
                            ast.With, ast.Assert, ast.comprehension)
            branches = sum(1 for node in ast.walk(tree) if isinstance(node, branch_types))
            features["cyclomatic_complexity"] = min(1 + branches, 20) / 20

            # Average function length
            func_defs = [n for n in ast.walk(tree) if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]
            if func_defs:
                func_lengths = []
                for fn in func_defs:
                    start = fn.lineno
                    end   = max(
                        (getattr(n, "lineno", start) for n in ast.walk(fn)),
                        default=start,
                    )
                    func_lengths.append(end - start + 1)
                features["avg_func_length"] = sum(func_lengths) / len(func_lengths)
        except SyntaxError:
            pass

    return features


# ─────────────────────────────────────────────────────────────────────────────
#  XGBoost Classifier (lazy load)
# ─────────────────────────────────────────────────────────────────────────────

_XGB_MODEL = None
_XGB_FEATURE_ORDER = [
    "has_docstring", "avg_var_name_len", "comment_ratio",
    "edge_case_handling", "cyclomatic_complexity", "avg_line_length",
    "line_stddev", "camel_case_ratio", "snake_case_ratio",
    "has_debug_print", "blank_ratio", "avg_func_length",
]


def _load_xgb_model():
    global _XGB_MODEL
    if _XGB_MODEL is not None:
        return _XGB_MODEL
    model_path = os.getenv("XGB_MODEL_PATH", "models/xgb_code_detector.json")
    if os.path.exists(model_path):
        try:
            import xgboost as xgb
            _XGB_MODEL = xgb.XGBClassifier()
            _XGB_MODEL.load_model(model_path)
            logger.info(f"XGBoost model loaded from {model_path} ✅")
            return _XGB_MODEL
        except Exception as exc:
            logger.warning(f"XGBoost load failed: {exc}")
    logger.info("XGBoost model not found — using rule-based structural scorer")
    return None


def _rule_based_xgb_score(features: dict) -> float:
    """
    Deterministic rule-based scorer used when no trained XGBoost model exists.
    Encodes the same domain knowledge that XGBoost would learn from data.
    """
    score = 0.0

    # High comment ratio + has docstring → AI pattern
    if features["comment_ratio"] > 0.25:
        score += 0.4
    if features["has_docstring"] == 1.0:
        score += 0.2

    # Uniform line lengths → AI pattern
    if features["line_stddev"] < 8 and features["avg_line_length"] > 30:
        score += 0.3

    # No debug prints → AI pattern
    if features["has_debug_print"] == 0.0:
        score += 0.15

    # Very little edge case handling → AI pattern
    if features["edge_case_handling"] < 0.1:
        score += 0.2

    # Long variable names → AI pattern
    if features["avg_var_name_len"] > 10:
        score += 0.15

    # High naming consistency → AI pattern
    if (features["camel_case_ratio"] + features["snake_case_ratio"]) > 0.92:
        score += 0.2

    return min(score, 1.0)


def _xgb_score(code: str, language: str) -> float:
    features   = extract_ast_features(code, language)
    xgb_model  = _load_xgb_model()

    if xgb_model is not None:
        try:
            feature_vec = np.array(
                [[features.get(k, 0.0) for k in _XGB_FEATURE_ORDER]]
            )
            prob = xgb_model.predict_proba(feature_vec)[0][1]  # P(AI)
            return round(float(prob), 4)
        except Exception as exc:
            logger.warning(f"XGBoost inference error: {exc}")

    return round(_rule_based_xgb_score(features), 4)


# ─────────────────────────────────────────────────────────────────────────────
#  Public API
# ─────────────────────────────────────────────────────────────────────────────

def analyze(code: str, language: str) -> Tuple[float, float, float, list]:
    """
    Returns (final_score, codebert_score, xgb_score, flags).
    final_score = codebert_score * 0.70 + xgb_score * 0.30
    """
    cb_score  = _codebert_score(code)
    xgb       = _xgb_score(code, language)
    combined  = round(cb_score * 0.70 + xgb * 0.30, 4)

    flags = []
    if combined > 0.70:
        flags.append({
            "type":   "code_pattern_high_ai",
            "detail": f"CodeBERT={cb_score:.3f}, XGBoost={xgb:.3f}, combined={combined:.3f}",
        })
    elif combined > 0.45:
        flags.append({
            "type":   "code_pattern_suspicious",
            "detail": f"Code structure shows mild AI patterns (score={combined:.3f})",
        })

    logger.debug(f"[CodePattern] cb={cb_score:.4f} xgb={xgb:.4f} final={combined:.4f}")
    return combined, cb_score, xgb, flags
