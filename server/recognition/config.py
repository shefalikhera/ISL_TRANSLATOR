"""Environment-driven paths and toggles for the recognition service."""

from __future__ import annotations

import os
from pathlib import Path

# server/ (parent of recognition/)
SERVER_DIR = Path(__file__).resolve().parent.parent

# Load server/.env when present (optional; does not override existing env vars)
_env_file = SERVER_DIR / ".env"
if _env_file.is_file():
    try:
        from dotenv import load_dotenv

        load_dotenv(_env_file, override=False)
    except ImportError:
        pass


def _path_from_env(name: str, default: Path) -> Path:
    raw = os.getenv(name, "").strip()
    return Path(raw) if raw else default


MODELS_DIR = _path_from_env("RECOGNITION_MODELS_DIR", SERVER_DIR / "models")
CNN_MODEL_PATH = _path_from_env(
    "RECOGNITION_CNN_MODEL_PATH", MODELS_DIR / "isl_cnn_model.h5"
)
LANDMARK_MODEL_PATH = _path_from_env(
    "RECOGNITION_LANDMARK_MODEL_PATH", MODELS_DIR / "landmark_classifier.joblib"
)
CLASS_NAMES_PATH = _path_from_env(
    "RECOGNITION_CLASS_NAMES_PATH", MODELS_DIR / "class_names.txt"
)
HAND_LANDMARKER_TASK_PATH = _path_from_env(
    "RECOGNITION_HAND_LANDMARKER_TASK", SERVER_DIR / "hand_landmarker.task"
)

RECOGNITION_ENABLED = os.getenv("RECOGNITION_ENABLED", "true").lower() in (
    "1",
    "true",
    "yes",
    "on",
)

# Sliding-window size for sign stabilization (matches bi-directional v38/Prediction.py logic)
PREDICTION_BUFFER_SIZE = int(os.getenv("RECOGNITION_BUFFER_SIZE", "20"))
CONFIDENCE_GATE = float(os.getenv("RECOGNITION_CONFIDENCE_GATE", "0.45"))
