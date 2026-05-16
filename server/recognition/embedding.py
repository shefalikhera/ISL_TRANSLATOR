import numpy as np

def build_landmark_embedding(hand_landmarks_list):
    """
    V43 TWO-HANDED MASTER Embedding Logic.
    Matches exactly the training features of the V43 ExtraTrees model.
    """
    extracted_hands = []
    
    # In MediaPipe Tasks API, hand_landmarks_list is a list of Landmark objects
    for lms in hand_landmarks_list:
        coords = np.array([[lm.x, lm.y, lm.z] for lm in lms], dtype=np.float32)
        wrist = coords[0]
        # Standard normalization: move wrist to origin and scale to max dist
        coords = coords - wrist
        max_dist = np.max(np.linalg.norm(coords, axis=1)) + 1e-6
        coords = coords / max_dist
        
        extracted_hands.append({
            "x_root": lms[0].x,
            "features": coords.flatten().tolist(),
            "wrist": wrist,
            "scale": max_dist,
            "tips": np.array([[lms[i].x, lms[i].y, lms[i].z] for i in [4, 8, 12, 16, 20]])
        })
    
    # Sort hands by x-coordinate (left to right) for consistent f1/f2 assignment
    extracted_hands.sort(key=lambda h: h["x_root"])
    
    f1, f2 = [0.0] * 63, [0.0] * 63
    rel = [0.0, 0.0, 0.0, 0.0]  # dx, dy, dz, scale_ratio
    rel_tips = [0.0] * 5  # Distance between corresponding fingertips
    
    if len(extracted_hands) >= 1:
        f1 = extracted_hands[0]["features"]
    if len(extracted_hands) >= 2:
        f2 = extracted_hands[1]["features"]
        # Relative wrist vector
        rel_vec = extracted_hands[1]["wrist"] - extracted_hands[0]["wrist"]
        # scale_ratio = h2_scale / h1_scale
        rel = rel_vec.tolist() + [extracted_hands[1]["scale"] / extracted_hands[0]["scale"]]
        # Relative tip distances
        rel_tips = np.linalg.norm(extracted_hands[1]["tips"] - extracted_hands[0]["tips"], axis=1).tolist()
        
    return np.array([f1 + f2 + rel + rel_tips], dtype=np.float32)
