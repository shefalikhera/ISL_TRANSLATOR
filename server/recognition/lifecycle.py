"""Startup and shutdown hooks for recognition models."""

from __future__ import annotations

import threading

from recognition.loader import load_recognition_models, unload_recognition_models

_lock = threading.Lock()
_initialized = False


def is_recognition_initialized() -> bool:
    return _initialized


def init_recognition(*, force: bool = False) -> None:
    """Load models once per process (safe to call from lifespan and __main__)."""
    global _initialized
    with _lock:
        if _initialized and not force:
            return
        load_recognition_models()
        _initialized = True


def shutdown_recognition() -> None:
    global _initialized
    with _lock:
        if not _initialized:
            return
        unload_recognition_models()
        _initialized = False
