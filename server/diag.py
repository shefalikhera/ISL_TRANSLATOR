import sys
import os

print("--- ISL BRIDGE DIAGNOSTIC START ---")

try:
    print("STEP 1: Testing CV2 import...")
    import cv2
    print("STEP 1: OK")
except Exception as e:
    print(f"STEP 1: FAILED - {e}")

try:
    print("STEP 2: Testing Numpy import...")
    import numpy as np
    print("STEP 2: OK")
except Exception as e:
    print(f"STEP 2: FAILED - {e}")

try:
    print("STEP 3: Testing MediaPipe import...")
    import mediapipe as mp
    print("STEP 3: OK")
except Exception as e:
    print("STEP 3: FAILED (This often causes the sys.excepthook crash)")
    import traceback
    traceback.print_exc()

try:
    print("STEP 4: Testing gTTS import...")
    from gtts import gTTS
    print("STEP 4: OK")
except Exception as e:
    print(f"STEP 4: FAILED - {e}")

try:
    print("STEP 5: Testing Model Path...")
    MODEL_PATH = os.path.join("models", "mediapipe_model.pkl")
    if os.path.exists(MODEL_PATH):
        print(f"STEP 5: OK (Found model at {MODEL_PATH})")
    else:
        print(f"STEP 5: FAILED (Model NOT found at {MODEL_PATH})")
        print(f"Current Directory: {os.getcwd()}")
except Exception as e:
    print(f"STEP 5: FAILED - {e}")

try:
    print("STEP 6: Testing Model Loading (Pickle)...")
    import pickle
    with open(os.path.join("models", "mediapipe_model.pkl"), "rb") as f:
        model = pickle.load(f)
    print("STEP 6: OK")
except Exception as e:
    print("STEP 6: FAILED")
    import traceback
    traceback.print_exc()

print("--- DIAGNOSTIC COMPLETE ---")
print("If you see this, the core libraries are OK. The issue may be in FastAPI or WebSockets.")
