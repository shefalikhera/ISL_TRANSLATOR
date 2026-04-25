import os
import sys

print("STEP 1: Testing CV2...")
import cv2
print("OK")

print("STEP 2: Testing Numpy...")
import numpy as np
print("OK")

print("STEP 3: Testing MediaPipe...")
try:
    import mediapipe as mp
    print("OK")
except Exception as e:
    print(f"FAILED MediaPipe: {e}")

print("STEP 4: Testing Scikit-Learn (Pickle depend)...")
try:
    import sklearn
    from sklearn.ensemble import RandomForestClassifier
    print("OK")
except Exception as e:
    print(f"FAILED Scikit-Learn: {e}")

print("STEP 5: Testing TensorFlow...")
try:
    import tensorflow as tf
    print("OK")
except Exception as e:
    print(f"FAILED TensorFlow: {e}")

print("STEP 6: Checking gesture_logic.py import...")
try:
    import gesture_logic
    print("OK")
except Exception as e:
    print(f"FAILED gesture_logic: {e}")
    import traceback
    traceback.print_exc()

print("\n--- DIAGNOSTIC COMPLETE ---")
