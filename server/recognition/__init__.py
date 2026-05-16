"""ISL sign recognition (MediaPipe + CNN + landmark ensemble)."""

from recognition.lifecycle import init_recognition, shutdown_recognition
from recognition.websocket import register_recognition_routes

__all__ = ["init_recognition", "shutdown_recognition", "register_recognition_routes"]
