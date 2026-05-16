"""Decode client webcam frames from WebSocket payloads."""

from __future__ import annotations

import base64
import json

import cv2
import numpy as np


def parse_frame_message(data: str) -> tuple[np.ndarray | None, np.ndarray | None, bool]:
    """
    Parse a WebSocket text message into BGR frame, RGB frame, and removeBg flag.

    Accepts raw base64 or JSON: {"image": "...", "removeBg": false}.
    """
    remove_bg = False
    try:
        parsed = json.loads(data)
        img_data = parsed.get("image", "")
        remove_bg = bool(parsed.get("removeBg", False))
        if "," in img_data:
            img_data = img_data.split(",", 1)[1]
    except (json.JSONDecodeError, TypeError, AttributeError):
        img_data = data
        if "," in img_data:
            img_data = img_data.split(",", 1)[1]

    missing_padding = len(img_data) % 4
    if missing_padding:
        img_data += "=" * (4 - missing_padding)

    frame_data = base64.b64decode(img_data)
    frame_bgr = cv2.imdecode(np.frombuffer(frame_data, np.uint8), cv2.IMREAD_COLOR)
    if frame_bgr is None:
        return None, None, remove_bg

    frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    return frame_bgr, frame_rgb, remove_bg
