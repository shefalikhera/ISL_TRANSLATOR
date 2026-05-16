"""Shared runtime state for loaded models and MediaPipe detector."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class RecognitionState:
    cnn_model: Any | None = None
    landmark_model: Any | None = None
    classes: dict[int, str] = field(default_factory=dict)
    detector: Any | None = None
    bg_segmenter: Any | None = None
    ready: bool = False

    # Gesture Lifecycle State (Task 1 & 4)
    is_locked: bool = False
    stable_frames: int = 0
    no_hand_frames: int = 0
    last_predicted_sign: str | None = None
    confidence_gate: float = 0.7  # Increased from 0.4
    buffer_size: int = 5

    def status(self) -> dict[str, Any]:
        from recognition.config import (
            CLASS_NAMES_PATH,
            CNN_MODEL_PATH,
            HAND_LANDMARKER_TASK_PATH,
            LANDMARK_MODEL_PATH,
            MODELS_DIR,
            RECOGNITION_ENABLED,
        )

        return {
            "enabled": RECOGNITION_ENABLED,
            "ready": self.ready,
            "cnn_loaded": self.cnn_model is not None,
            "landmark_loaded": self.landmark_model is not None,
            "class_count": len(self.classes),
            "detector_loaded": self.detector is not None,
            "models_dir": str(MODELS_DIR),
            "paths": {
                "cnn": str(CNN_MODEL_PATH),
                "landmark": str(LANDMARK_MODEL_PATH),
                "class_names": str(CLASS_NAMES_PATH),
                "hand_landmarker_task": str(HAND_LANDMARKER_TASK_PATH),
            },
        }


# Module singleton used by detector, pipeline, and websocket handler
recognition_state = RecognitionState()
