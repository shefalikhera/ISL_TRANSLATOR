"""MediaPipe HandLandmarker (Python tasks API)."""

from __future__ import annotations

import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision

from recognition.config import HAND_LANDMARKER_TASK_PATH
from recognition.state import recognition_state


def get_hand_detector() -> mp_vision.HandLandmarker:
    if recognition_state.detector is None:
        if not HAND_LANDMARKER_TASK_PATH.is_file():
            raise FileNotFoundError(
                f"Hand landmarker task file not found: {HAND_LANDMARKER_TASK_PATH}"
            )
        base_options = mp_python.BaseOptions(
            model_asset_path=str(HAND_LANDMARKER_TASK_PATH)
        )
        options = mp_vision.HandLandmarkerOptions(
            base_options=base_options,
            running_mode=mp_vision.RunningMode.IMAGE,
            num_hands=2,
            min_hand_detection_confidence=0.7,
            min_hand_presence_confidence=0.7,
        )
        recognition_state.detector = mp_vision.HandLandmarker.create_from_options(
            options
        )
    return recognition_state.detector


def detect_hands(frame_bgr, frame_rgb):
    """Run hand detection on an RGB frame; returns (result, mp.Image)."""
    if frame_bgr.shape[0] < 10 or frame_bgr.shape[1] < 10:
        return None, None
    detector = get_hand_detector()
    mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
    return detector.detect(mp_img), mp_img
