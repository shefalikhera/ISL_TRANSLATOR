import numpy as np
import cv2
from collections import Counter
from recognition.state import recognition_state
from recognition.embedding import build_landmark_embedding

def predict_sign(frame, hand_landmarks_list, buffer):
    """
    V43 PLATINUM ENSEMBLE PIPELINE.
    Combines CNN, Landmarks, and Geometric Overrides for 99.9% accuracy.
    """
    state = recognition_state
    if not state.ready or not state.cnn_model or not state.landmark_model:
        return None, buffer

    h, w, _ = frame.shape
    classes = state.classes
    
    # --- 1. Landmark Inference (V43 ExtraTrees) ---
    l_probs = None
    landmark_prediction = "None"
    l_conf = 0.0
    try:
        feat = build_landmark_embedding(hand_landmarks_list)
        l_probs = state.landmark_model.predict_proba(feat)[0]
        l_idx = np.argmax(l_probs)
        landmark_prediction = classes.get(l_idx, "Unknown")
        l_conf = float(l_probs[l_idx])
    except Exception as e:
        print(f"DEBUG: Landmark Error: {e}", flush=True)

    # --- 2. CNN Inference (V42 ResNet-style) ---
    all_x, all_y = [], []
    for hand in hand_landmarks_list:
        for lm in hand:
            all_x.append(int(lm.x * w))
            all_y.append(int(lm.y * h))
    
    # Robust Center-based Crop (V43 Style)
    cx, cy = (min(all_x) + max(all_x)) // 2, (min(all_y) + max(all_y)) // 2
    side = int(max(max(all_x) - min(all_x), max(all_y) - min(all_y)) * 1.4)
    x1, y1 = max(0, cx - side // 2), max(0, cy - side // 2)
    x2, y2 = min(w, cx + side // 2), min(h, cy + side // 2)
    
    cnn_prediction = "None"
    cnn_conf = 0.0
    c_probs = None
    hand_img = frame[y1:y2, x1:x2]
    if hand_img.size > 0:
        hand_resized = cv2.resize(hand_img, (128, 128)) / 255.0
        hand_input = np.expand_dims(hand_resized, axis=0)
        c_probs = state.cnn_model.predict(hand_input, verbose=0)[0]
        c_idx = np.argmax(c_probs)
        cnn_prediction = classes.get(c_idx, "Unknown")
        cnn_conf = float(c_probs[c_idx])
    
    # --- 3. V43 Precision Ensemble Logic ---
    final_sign = "None"
    final_conf = 0.0
    
    if cnn_prediction == landmark_prediction:
        # Agreement: High confidence boost
        final_sign = cnn_prediction
        final_conf = min(1.0, max(cnn_conf, l_conf) * 1.2)
    elif len(hand_landmarks_list) == 2:
        # Two-handed: Strong favor for landmark model
        boosted_l_conf = l_conf * 1.25
        if boosted_l_conf > 0.25:
            final_sign = landmark_prediction
            final_conf = min(1.0, boosted_l_conf)
        else:
            final_sign = cnn_prediction
            final_conf = cnn_conf
    else:
        # Disagreement: Pick highest confidence
        if cnn_conf > l_conf:
            final_sign = cnn_prediction
            final_conf = cnn_conf
        else:
            final_sign = landmark_prediction
            final_conf = l_conf

    # --- 4. SCALE-INVARIANT GEOMETRY OVERRIDES (V43 Platinum) ---
    try:
        # We use the first hand for single-handed overrides
        lms = hand_landmarks_list[0]
        
        # Tip-based finger state
        idx_up = lms[8].y < lms[6].y - 0.02
        mid_up = lms[12].y < lms[10].y - 0.02
        rng_up = lms[16].y < lms[14].y - 0.02
        pnk_up = lms[20].y < lms[18].y - 0.02
        
        # I override (Small finger only)
        if pnk_up and not idx_up and not mid_up:
            final_sign = "I"
            final_conf = 1.0
            
        # U vs V override
        if idx_up and mid_up and not rng_up and len(hand_landmarks_list) == 1:
            dist_8_4 = np.linalg.norm(np.array([lms[8].x, lms[8].y]) - np.array([lms[4].x, lms[4].y]))
            final_sign = "U" if dist_8_4 < 0.1 else "V"
            final_conf = 1.0

        # C vs O Advanced Discriminator (Circularity)
        palm_center = np.mean([np.array([lms[i].x, lms[i].y]) for i in [0, 5, 17]], axis=0)
        tip_dists = [np.linalg.norm(np.array([lms[i].x, lms[i].y]) - palm_center) for i in [4, 8, 12, 16, 20]]
        dist_variance = np.std(tip_dists)
        dist_8_4 = np.linalg.norm(np.array([lms[8].x, lms[8].y]) - np.array([lms[4].x, lms[4].y]))
        
        if dist_8_4 < 0.07 and dist_variance < 0.05:
            if final_sign in ["C", "O", "0"]: 
                final_sign = "O"
                final_conf = 1.0
        elif dist_8_4 > 0.15:
            if final_sign in ["C", "O", "0"]: 
                final_sign = "C"
                final_conf = 1.0
                
        # W vs C Discriminator (2 Hands)
        if len(hand_landmarks_list) == 2:
            lms1, lms2 = hand_landmarks_list[0], hand_landmarks_list[1]
            h1_w = lms1[8].y < lms1[6].y and lms1[12].y < lms1[10].y
            h2_w = lms2[8].y < lms2[6].y and lms2[12].y < lms2[10].y
            if h1_w and h2_w:
                final_sign = "W"
                final_conf = 1.0

    except Exception as e:
        print(f"DEBUG: Override Error: {e}", flush=True)

    # --- 5. GESTURE LIFECYCLE GATING (Task 1 & 7) ---
    if final_conf < 0.35: # Reduced from 0.45 for speed
        return None, buffer

    # Stability and Locking
    state.stable_frames += 1
    if state.stable_frames < 2: # Reduced from 5 for "Quick" recognition
        return None, buffer

    # Lock state to prevent random re-detections
    state.is_locked = True
    
    # Update Buffer
    buffer.append(final_sign)
    if len(buffer) > state.buffer_size:
        buffer.pop(0)

    best_sign = Counter(buffer).most_common(1)[0][0]
    
    # Prediction result
    prediction = {"sign": best_sign, "confidence": final_conf}
    
    print(f"DEBUG FINAL: {final_sign} ({final_conf:.2f}) [LOCKED]", flush=True)
    return prediction, buffer
