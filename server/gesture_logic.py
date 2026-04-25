import cv2
import sys
import numpy as np
import pickle
import os
try:
    import mediapipe as mp
    print("DEBUG: MediaPipe imported successfully.")
except Exception as e:
    print(f"CRITICAL ERROR: Failed to import MediaPipe: {e}")
    sys.exit(1)

# Direct reference to the validated training folder
SOURCE_DIR = r"c:\Users\RAH\Desktop\bi-directional-isl-translation\Code\Predict signs\files"

class ModelEngine:
    def __init__(self):
        # MediaPipe Setup matching Prediction.py exactly
        self.mp_hands = mp.solutions.hands
        self.mp_drawing = mp.solutions.drawing_utils
        self.hands = self.mp_hands.Hands(
            static_image_mode=False, 
            max_num_hands=1, 
            min_detection_confidence=0.5
        )
        
        # Load the newly trained model
        self.model_path = os.path.join(SOURCE_DIR, "mediapipe_model.pkl")
        print(f"DEBUG: Loading refreshed model from {self.model_path}...")
        with open(self.model_path, 'rb') as f:
            self.model = pickle.load(f)
            
        # Dictionary from Prediction.py wrapper logic
        # Note: The model itself (Random Forest) should handle the prediction output.
        
        self.common_words = [
            'a', 'all', 'and', 'are', 'again', 'away', 'be', 'busy', 'back', 'bye', 'bad', 'best',
            'can', 'come', 'cool', 'call', 'care', 'check', 'do', 'did', 'done', 'dont', 'dear', 'down',
            'eat', 'easy', 'else', 'end', 'ever', 'enjoy', 'fine', 'food', 'friend', 'family', 'fun', 'for',
            'go', 'good', 'great', 'give', 'gone', 'game', 'hi', 'hello', 'hey', 'how', 'here', 'help',
            'i', 'i am', 'i am fine', 'i am ok', 'i know', 'i feel', 'job', 'just', 'joke', 'join', 'joy', 'journey',
            'keep', 'kind', 'know', 'kept', 'knew', 'kid', 'love', 'like', 'life', 'long', 'look', 'let',
            'me', 'my', 'more', 'much', 'made', 'meet', 'no', 'not', 'name', 'need', 'nice', 'next',
            'ok', 'okay', 'on', 'only', 'one', 'open', 'please', 'play', 'put', 'pick', 'peace', 'phone',
            'quick', 'quiet', 'quite', 'question', 'quit', 'queue', 'right', 'read', 'really', 'rest', 'ready', 'reply',
            'sorry', 'see', 'soon', 'sleep', 'safe', 'smile', 'thanks', 'thank', 'take', 'talk', 'today', 'tomorrow',
            'up', 'us', 'use', 'under', 'until', 'usual', 'very', 'visit', 'voice', 'video', 'value', 'view',
            'we', 'what', 'when', 'where', 'who', 'wait', 'xray', 'xmas', 'xtra', 'xoxo', 'yes', 'you', 'your', 'yours', 'yeah', 'yet',
            'zero', 'zone', 'zoom', 'zoo'
        ]

    def get_suggestions(self, prefix):
        if not prefix: return []
        prefix = prefix.lower()
        return [w for w in self.common_words if w.startswith(prefix)][:6]

    def predict(self, frame):
        # We process the ROI inside the full frame (Green Box logic)
        # ROI: 225x225
        t, b = 127, 352
        r, l = 207, 432
        roi = frame[t:b, r:l]
        
        rgb = cv2.cvtColor(roi, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb)
        
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                lms = []
                for lm in hand_landmarks.landmark:
                    lms.extend([lm.x, lm.y, lm.z])
                
                features = np.array([lms])
                prob = np.max(self.model.predict_proba(features))
                sign = self.model.predict(features)[0]
                return sign, float(prob)
        return None, 0.0

class SessionState:
    def __init__(self):
        self.count = 0
        self.result_list = []
        self.prev_sign = None
        self.frames_since_last_sign = 0
        self.PAUSE_THRESHOLD = 30 # Matching Prediction.py
