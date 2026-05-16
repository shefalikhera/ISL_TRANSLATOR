"""Load CNN, landmark classifier, and class names at startup."""

from __future__ import annotations

import joblib
try:
    from tensorflow.keras.models import load_model
except ImportError:
    try:
        from keras.models import load_model
    except ImportError:
        # Some versions of TF 2.15 + Keras 2 might need this
        import tensorflow as tf
        load_model = tf.keras.models.load_model

from recognition.config import (
    CLASS_NAMES_PATH,
    CNN_MODEL_PATH,
    HAND_LANDMARKER_TASK_PATH,
    LANDMARK_MODEL_PATH,
    RECOGNITION_ENABLED,
)
from recognition.state import recognition_state


def load_recognition_models() -> None:
    """Load ML assets into recognition_state (idempotent)."""
    if not RECOGNITION_ENABLED:
        print("RECOGNITION: disabled via RECOGNITION_ENABLED", flush=True)
        recognition_state.ready = False
        return

    print("RECOGNITION: Initializing models...", flush=True)

    try:
        if CNN_MODEL_PATH.is_file():
            recognition_state.cnn_model = load_model(str(CNN_MODEL_PATH))
            print(f"RECOGNITION: CNN loaded ({CNN_MODEL_PATH.name})", flush=True)
        else:
            print(f"RECOGNITION: CNN not found at {CNN_MODEL_PATH}", flush=True)

        if LANDMARK_MODEL_PATH.is_file():
            recognition_state.landmark_model = joblib.load(str(LANDMARK_MODEL_PATH))
            print(
                f"RECOGNITION: Landmark model loaded ({LANDMARK_MODEL_PATH.name})",
                flush=True,
            )
        else:
            print(
                f"RECOGNITION: Landmark model not found at {LANDMARK_MODEL_PATH}",
                flush=True,
            )

        if CLASS_NAMES_PATH.is_file():
            with open(CLASS_NAMES_PATH, encoding="utf-8") as f:
                # Must match original: index = line number (no filtering).
                recognition_state.classes = {
                    i: n.strip() for i, n in enumerate(f.readlines())
                }
            print(
                f"RECOGNITION: {len(recognition_state.classes)} class names loaded",
                flush=True,
            )
        else:
            print(f"RECOGNITION: class_names not found at {CLASS_NAMES_PATH}", flush=True)

        if not HAND_LANDMARKER_TASK_PATH.is_file():
            print(
                f"RECOGNITION: hand_landmarker.task missing at {HAND_LANDMARKER_TASK_PATH}",
                flush=True,
            )

        recognition_state.ready = bool(
            recognition_state.classes
            and (
                recognition_state.cnn_model is not None
                or recognition_state.landmark_model is not None
            )
            and HAND_LANDMARKER_TASK_PATH.is_file()
        )
        if recognition_state.ready:
            print("RECOGNITION: Ready", flush=True)
        else:
            print("RECOGNITION: Partial load — WebSocket will run with reduced capability", flush=True)

    except Exception as exc:
        print(f"RECOGNITION: Boot error: {exc}", flush=True)
        recognition_state.ready = False
        raise


def unload_recognition_models() -> None:
    recognition_state.cnn_model = None
    recognition_state.landmark_model = None
    recognition_state.classes = {}
    if recognition_state.detector is not None:
        try:
            recognition_state.detector.close()
        except Exception:
            pass
    recognition_state.detector = None
    recognition_state.bg_segmenter = None
    recognition_state.ready = False
