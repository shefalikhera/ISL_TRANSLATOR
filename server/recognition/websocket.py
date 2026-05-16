"""WebSocket /ws/predict — mirrors bi-directional server main.py frame order."""

from __future__ import annotations

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from recognition.background import apply_background_removal
from recognition.config import RECOGNITION_ENABLED
from recognition.debug import save_debug_image
from recognition.detector import detect_hands
from recognition.frame import parse_frame_message
from recognition.pipeline import predict_sign
from recognition.state import recognition_state


def register_recognition_routes(app: FastAPI) -> None:
    @app.websocket("/ws/predict")
    async def ws_predict(websocket: WebSocket) -> None:
        await websocket.accept()
        frame_received = 0
        resp_sent = 0
        buffer: list[str] = []
        print("RECOGNITION WS: connection opened", flush=True)

        if not RECOGNITION_ENABLED:
            await websocket.send_json(
                {
                    "predictions": [],
                    "hand_detected": "NO",
                    "confidence": 0,
                    "image": None,
                    "error": "Recognition disabled (RECOGNITION_ENABLED=false)",
                }
            )
            await websocket.close()
            return

        try:
            while True:
                try:
                    data = await websocket.receive_text()
                except WebSocketDisconnect:
                    break

                frame_bgr, frame_rgb, remove_bg = parse_frame_message(data)
                if frame_bgr is None:
                    print("DEBUG WS: Failed to parse frame message", flush=True)
                    continue
                
                frame_received += 1
                if frame_received % 50 == 0:
                    print(f"DEBUG WS: Frames received={frame_received} | Responses sent={resp_sent}", flush=True)

                # Same variable mutation pattern as original main.py
                frame = frame_bgr
                original_frame_rgb = frame_rgb

                prediction = None
                hand_state = "NO"
                processed_img_base64 = None

                try:
                    result, _ = detect_hands(frame, original_frame_rgb)
                    if result and result.hand_landmarks:
                        print(f"DEBUG MP: Detected {len(result.hand_landmarks)} hands", flush=True)
                except Exception as exc:
                    print(f"RECOGNITION MP: {exc}", flush=True)
                    result = None

                if remove_bg:
                    save_debug_image("raw", frame) # save before segmentation
                    frame, processed_img_base64 = apply_background_removal(
                        frame, original_frame_rgb, 
                        landmarks=result.hand_landmarks if result else None,
                        encode_preview=True
                    )
                    save_debug_image("segmented", frame)

                if result and result.hand_landmarks and len(result.hand_landmarks) > 0:
                    hand_state = "YES"
                    recognition_state.no_hand_frames = 0
                    
                    if recognition_state.is_locked:
                        # Already predicted for this hand presence
                        prediction = None
                    else:
                        try:
                            prediction, buffer = predict_sign(
                                frame, result.hand_landmarks, buffer
                            )
                        except Exception as exc:
                            print(f"RECOGNITION pipeline: {exc}", flush=True)
                else:
                    hand_state = "NO"
                    buffer = []
                    recognition_state.no_hand_frames += 1
                    if recognition_state.no_hand_frames >= 5:
                        if recognition_state.is_locked:
                            print("DEBUG WS: Hand removed, system RESET", flush=True)
                        recognition_state.is_locked = False
                        recognition_state.stable_frames = 0
                        recognition_state.no_hand_frames = 0

                await websocket.send_json(
                    {
                        "predictions": [prediction] if prediction else [],
                        "hand_detected": hand_state,
                        "confidence": prediction["confidence"] if prediction else 0,
                        "image": processed_img_base64,
                    }
                )
                resp_sent += 1

        except WebSocketDisconnect:
            print("RECOGNITION WS: disconnected", flush=True)
        except Exception as exc:
            print(f"RECOGNITION WS critical: {exc}", flush=True)
        finally:
            print("RECOGNITION WS: closed", flush=True)

    @app.get("/recognition/status")
    async def recognition_status() -> dict:
        return recognition_state.status()
