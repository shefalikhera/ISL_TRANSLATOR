def pred_main():
    # importing necessary libraries
    import cv2
    import imutils
    import numpy as np
    import os
    from os import path
    import pickle
    import imageio
    from scipy import ndimage
    from scipy.spatial import distance
    import pyttsx3
    import tensorflow as tf
    from tensorflow import keras
    import keras
    from threading import Thread
    from tkinter import messagebox
    import tkinter as tk
    import threading
    import queue

    # resolve resource paths relative to this file
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    FILES_DIR = os.path.join(BASE_DIR, "files")
    MODEL_PATH = os.path.join(FILES_DIR, "CNN")
    SIGNS_IMAGE_PATH = os.path.join(FILES_DIR, "signs.png")

    #global variables
    bg=None
    visual_dict={0:'0',1:'1',2:'2',3:'3',4:'4',5:'5',6:'6',7:'7',8:'8',9:'9',10:'a',11:'b',12:'c',13:'d',14:'e',15:'f',16:'g',17:'h',18:'i',19:'j',20:'k',21:'l',22:'m',23:'n',24:'o',25:'p',26:'q',27:'r',
             28:'s',29:'t',30:'u',31:'v',32:'w',33:'x',34:'y',35:'z'}
    aWeight=0.5
    cam = cv2.VideoCapture(0)
    if not cam.isOpened():
        try: cam.release()
        except: pass
        cam = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    if not cam.isOpened():
        for idx in [1, 2, 3]:
            cam = cv2.VideoCapture(idx)
            if cam.isOpened(): break
    if not cam.isOpened():
        messagebox.showerror("Camera missing", "OpenCV could not open your camera.")
        return

    t,r,b,l=100,350,325,575
    num_frames=0
    cur_mode=None
    predict_sign=None
    count=0
    result_list=[]
    words_list=[]
    prev_sign=None
    frames_since_last_sign=0
    PAUSE_THRESHOLD=60
    
    common_words = ['hi', 'hello', 'hey', 'how', 'here', 'help', 'ok', 'okay', 'yes', 'no', 'thanks', 'name', 'need']
    suggestions = []

    # Load Model (RECONSTRUCTION)
    with open(MODEL_PATH, 'rb') as infile:
        legacy_model = pickle.load(infile)
    
    # Pre-patch legacy model
    for attr in ['_distribute_strategy', '_distribution_strategy', '_compiled_trainable_state', '_auto_track_sublayers', '_is_compiled', '_layout_map', 'built', '_call_spec']:
        if not hasattr(legacy_model, attr): 
            val = True if attr == 'built' else None
            setattr(legacy_model, attr, val)

    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import Conv2D, MaxPooling2D, Dropout, Flatten, Dense
    cnn = Sequential([
        Conv2D(32, (3, 3), padding='same', activation='relu', input_shape=(100, 100, 1)),
        Conv2D(32, (3, 3), activation='relu'),
        MaxPooling2D(pool_size=(2, 2)),
        Dropout(0.25),
        Conv2D(64, (3, 3), padding='same', activation='relu'),
        Conv2D(64, (3, 3), activation='relu'),
        MaxPooling2D(pool_size=(2, 2)),
        Dropout(0.25),
        Conv2D(64, (3, 3), padding='same', activation='relu'),
        Conv2D(64, (3, 3), activation='relu'),
        MaxPooling2D(pool_size=(2, 2)),
        Dropout(0.25),
        Flatten(),
        Dense(512, activation='relu'),
        Dropout(0.5),
        Dense(36, activation='softmax')
    ])
    try:
        cnn.set_weights(legacy_model.get_weights())
        print("[DEBUG] Weights transferred.")
    except:
        print("[DEBUG] Top-level transfer failed. Trying layer-by-layer...")
        for i in range(len(cnn.layers)):
            try: cnn.layers[i].set_weights(legacy_model.layers[i].get_weights())
            except: pass
        print("[DEBUG] Layer-by-layer transferred.")
    
    keras.backend.set_image_data_format('channels_last')

    # Speech Queue
    speech_queue = queue.Queue()
    def speech_worker():
        try:
            local_engine = pyttsx3.init()
            while True:
                text = speech_queue.get(); 
                if text is None: break
                local_engine.say(text); local_engine.runAndWait()
        except: pass
    threading.Thread(target=speech_worker, daemon=True).start()
    def say_sign(sign): speech_queue.put(str(sign))

    def get_word_suggestions(prefix):
        if not prefix: return []
        matches = [word for word in common_words if word.lower().startswith(prefix.lower())]
        return sorted(matches, key=len)[:6]

    def get_current_word():
        text = ''.join(words_list)
        last_space = text.rfind(' ')
        return text[last_space+1:]

    def replace_current_word(new_word):
        text = ''.join(words_list)
        last_space = text.rfind(' ')
        words_list.clear()
        if last_space == -1: words_list.extend(list(new_word))
        else: words_list.extend(list(text[:last_space+1] + new_word))

    def run_avg(image, aweight):
        nonlocal bg
        if bg is None: bg = image.copy().astype("float"); return
        cv2.accumulateWeighted(image, bg, aweight)

    def extract_hand(image, threshold=25):
        nonlocal bg
        diff = cv2.absdiff(bg.astype("uint8"), image)
        thresh = cv2.threshold(diff, threshold, 255, cv2.THRESH_BINARY)[1]
        cnts, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if len(cnts) == 0: return None
        return (thresh, max(cnts, key=cv2.contourArea))

    while(cam.isOpened()):
        _, frame = cam.read(cv2.CAP_DSHOW)
        if frame is None: break
        orig_signs = cv2.imread(SIGNS_IMAGE_PATH)
        if orig_signs is not None:
            cv2.imshow("Signs Guide", cv2.resize(orig_signs, (400, 400)))
            
        frame = imutils.resize(frame, width=700)
        frame = cv2.flip(frame, 1)
        clone = frame.copy()
        roi = frame[t:b, r:l]
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (7, 7), 0)

        if num_frames < 30:
            run_avg(gray, aWeight)
            cv2.putText(clone, "Calibrating background...", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        else:
            hand = extract_hand(gray)
            if hand is not None:
                thresh, max_cont = hand
                cv2.imshow("Hand Threshold", thresh)
                
                # Preprocessing for CNN
                final_res = cv2.resize(thresh, (100, 100)) # Using thresh instead of Canny for better detection
                final_res = np.array(final_res, dtype='float32').reshape((-1, 100, 100, 1)) / 255.0
                
                output_raw = cnn(final_res, training=False)
                output = output_raw.numpy() if hasattr(output_raw, 'numpy') else output_raw
                prob = np.amax(output); sign = np.argmax(output); final_sign = visual_dict[sign]
                
                cv2.putText(clone, f"Detect: {final_sign} ({prob:.2f})", (10, 200), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                
                count += 1
                if count > 10 and count <= 30:
                    if prob > 0.85: result_list.append(str(final_sign))
                elif count > 30:
                    count = 0
                    if result_list:
                        stable_sign = max(set(result_list), key=result_list.count)
                        if stable_sign != prev_sign:
                            words_list.append(stable_sign)
                            say_sign(stable_sign)
                            print(f"[RECOGNIZED] {stable_sign}")
                        prev_sign = stable_sign
                        result_list = []
                        frames_since_last_sign = 0
            else:
                frames_since_last_sign += 1

        if frames_since_last_sign > PAUSE_THRESHOLD and words_list and words_list[-1] != ' ':
            words_list.append(' '); frames_since_last_sign = 0

        # Display Text
        current_text = ''.join(words_list)
        cv2.putText(clone, 'Text: ' + current_text, (10, 400), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 0, 0), 2)
        
        # Suggestions
        curr_word = get_current_word()
        if curr_word:
            suggs = get_word_suggestions(curr_word)
            if suggs:
                cv2.putText(clone, 'Suggs: ' + ' | '.join(suggs[:3]), (10, 350), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)

        cv2.rectangle(clone, (r, t), (l, b), (0, 255, 0), 2)
        cv2.imshow("ISL Hub", clone)
        num_frames += 1

        k = cv2.waitKey(1) & 0xFF
        if k == 27: break
        elif k == ord('c'): words_list.clear()
        elif k == ord('s'): say_sign(''.join(words_list))
        elif ord('1') <= k <= ord('3') and suggs:
            replace_current_word(suggs[k-ord('1')])
            words_list.append(' ')

    cam.release(); cv2.destroyAllWindows()

if __name__ == "__main__":
    pred_main()
