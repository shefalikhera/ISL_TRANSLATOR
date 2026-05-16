"""Selfie segmentation — same mask logic as bi-directional server main.py."""

from __future__ import annotations

import base64
import os

import cv2
import mediapipe as mp
import numpy as np

from recognition.state import recognition_state

# Original behavior used black (0,0,0) for segmentation.
_bg = os.getenv("RECOGNITION_BG_BGR", "0,0,0").split(",")
SEGMENTATION_BG_BGR = (int(_bg[0]), int(_bg[1]), int(_bg[2]))


def apply_background_removal(
    frame_bgr: np.ndarray,
    frame_rgb: np.ndarray,
    *,
    landmarks: Any = None,
    encode_preview: bool = True,
) -> tuple[np.ndarray, str | None]:
    """
    Mutate frame in place like original: foreground kept, background -> solid black.
    Returns (frame_bgr, base64 webp preview).
    """
    try:
        if recognition_state.bg_segmenter is None:
            from mediapipe.solutions import selfie_segmentation
            recognition_state.bg_segmenter = selfie_segmentation.SelfieSegmentation(
                model_selection=0
            )
        seg_results = recognition_state.bg_segmenter.process(frame_rgb)
        
        condition = np.stack((seg_results.segmentation_mask,) * 3, axis=-1) > 0.1
        bg_image = np.zeros(frame_bgr.shape, dtype=np.uint8)
        bg_image[:] = SEGMENTATION_BG_BGR
        isolated = np.where(condition, frame_bgr, bg_image)

        preview_img = isolated
        if landmarks:
            # Draw landmarks on the preview image for the frontend
            preview_img = isolated.copy()
            from mediapipe.solutions import drawing_utils as mp_drawing
            from mediapipe.solutions import hands as mp_hands
            for hand_landmarks in landmarks:
                mp_drawing.draw_landmarks(
                    preview_img,
                    hand_landmarks,
                    mp_hands.HAND_CONNECTIONS,
                    mp_drawing.DrawingSpec(color=(255, 255, 255), thickness=2, circle_radius=2),
                    mp_drawing.DrawingSpec(color=(235, 131, 52), thickness=2, circle_radius=2),
                )

        preview_b64 = None
        if encode_preview:
            ok, buffer_img = cv2.imencode(
                ".webp", preview_img, [cv2.IMWRITE_WEBP_QUALITY, 50]
            )
            if ok:
                preview_b64 = base64.b64encode(buffer_img).decode("utf-8")

        return isolated, preview_b64
    except Exception as exc:
        print(f"RECOGNITION BG: {exc}", flush=True)
        return frame_bgr, None
