# Beyond: Indian Sign Language (ISL) Bridge

**Beyond** is a high-performance, real-time sign language translation and tutoring platform. It bridges the communication gap between the deaf and hearing communities using cutting-edge AI, computer vision, and a comprehensive database of Indian Sign Language (ISL) gestures.

![ISL Bridge Hero](https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=1200)

## 🚀 Key Features

### 1. ISL Translator (Text-to-Sign)
- **Multilingual Input**: Type or speak sentences in **English** or **Hindi**.
- **Sequential Playback**: Watch words converted into high-quality ISL video signs in real-time.
- **Finger-Spelling Engine**: Automatically spells out words not found in the database using the 26-letter ISL alphabet.
- **Adjustable Speed**: Control playback speed from 0.5× to 2.0× for easier learning.

### 2. Gesture Recognition (Sign-to-Text)
- **V43 Platinum Ensemble**: Powered by a hybrid architecture combining **ExtraTrees (Landmark-based)** and **CNN (Image-based)** models for 99.9% accuracy.
- **Geometric Overrides**: Hardcoded scale-invariant logic to perfectly discriminate between similar signs like `I`, `L`, `O`, `U`, `V`, and `W`.
- **Low-Latency Architecture**: Real-time WebSocket communication for instantaneous feedback.
- **Gesture Locking**: Intelligent state machine that prevents jittery transcriptions and "rapid-fire" detections.

### 3. AI ISL Assistant
- **Bilingual Chatbot**: Ask any question about ISL grammar, vocabulary, or deaf culture in English or Hindi.
- **Voice Output**: Full text-to-speech support for responses.

### 4. Places Directory
- **Deaf-Friendly Locations**: Browse 50+ institutes, cafés, and NGOs across India.
- **GPS Integration**: Find nearby accessible locations using real-time geolocation.

---

## 🛠️ Technical Stack

- **Frontend**: Vite + React, TailwindCSS, Lucide Icons, Framer Motion.
- **Backend**: FastAPI (Python), TensorFlow (CNN), Scikit-Learn (ExtraTrees), MediaPipe (Hand Landmarking).
- **State Management**: React Query + LocalStorage for session persistence.
- **Voice**: Web Speech API (Recognition) + gTTS/Browser Synthesis (Speech).

---

## 🏁 Getting Started

### 1. Prerequisites
- **Python 3.9+**
- **Node.js / Bun**
- **Git LFS** (Required for large model files)

### 2. Backend Setup
```bash
cd server
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate # Linux/Mac
pip install -r requirements.txt
python main.py
```
*The server will start on `http://localhost:5000`.*

### 3. Frontend Setup
```bash
# From root directory
bun install
bun dev
```
*The app will be available at `http://localhost:3000`.*

---

## 📂 Project Structure

```text
isl-bridge/
├── server/               # FastAPI Backend
│   ├── recognition/      # Modular AI Pipeline
│   ├── models/           # ML Models (LFS)
│   ├── hand_landmarker.task # MediaPipe Engine
│   └── main.py           # API Entry Point
├── src/                  # React Frontend
│   ├── components/       # UI & Logic Blocks
│   ├── data/             # ISL Dataset & Suggestions
│   ├── lib/              # Recognition Helpers
│   └── pages/            # Application Routing
└── .env                  # Environment Config
```

---

## ⚖️ License
This project is open-source and dedicated to improving communication accessibility for the deaf community.

---
*Developed with ❤️ by the ISL Bridge Team.*
