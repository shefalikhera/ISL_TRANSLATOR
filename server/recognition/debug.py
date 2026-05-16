"""Optional frame/crop dumps when RECOGNITION_DEBUG=true."""

from __future__ import annotations

import os
from pathlib import Path

import cv2
import numpy as np

from recognition.config import SERVER_DIR

_DEBUG = os.getenv("RECOGNITION_DEBUG", "false").lower() in ("1", "true", "yes", "on")
_DEBUG_DIR = Path(os.getenv("RECOGNITION_DEBUG_DIR", SERVER_DIR / "debug_frames"))
_frame_idx = 0


def debug_enabled() -> bool:
    return _DEBUG


def save_debug_image(name: str, image_bgr: np.ndarray) -> None:
    if not _DEBUG or image_bgr is None or image_bgr.size == 0:
        return
    global _frame_idx
    _DEBUG_DIR.mkdir(parents=True, exist_ok=True)
    path = _DEBUG_DIR / f"{_frame_idx:06d}_{name}.jpg"
    cv2.imwrite(str(path), image_bgr)
    if name == "inference_crop":
        _frame_idx += 1


def log_top_predictions(
    c_probs: np.ndarray | None,
    l_probs: np.ndarray | None,
    classes: dict[int, str],
    crop_box: tuple[int, int, int, int] | None,
) -> None:
    if not _DEBUG:
        return

    def top5(probs: np.ndarray | None, label: str) -> None:
        if probs is None:
            return
        idxs = np.argsort(probs)[-5:][::-1]
        parts = [f"{classes.get(int(i), '?')}:{probs[i]:.3f}" for i in idxs]
        print(f"DEBUG {label} top5: {', '.join(parts)}", flush=True)

    top5(c_probs, "CNN")
    top5(l_probs, "LM")
    if crop_box:
        print(f"DEBUG crop box (x1,y1,x2,y2): {crop_box}", flush=True)
