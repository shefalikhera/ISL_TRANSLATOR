from contextlib import asynccontextmanager
import asyncio
import os
import socket
import sys

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from gtts import gTTS
import tempfile
from fastapi.responses import FileResponse

from recognition import init_recognition, register_recognition_routes, shutdown_recognition
from recognition.lifecycle import is_recognition_initialized


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Heavy TensorFlow/joblib work must not block the event loop during startup.
    if not is_recognition_initialized():
        await asyncio.to_thread(init_recognition)
    print("SERVER: Application startup complete", flush=True)
    yield
    await asyncio.to_thread(shutdown_recognition)


app = FastAPI(lifespan=lifespan)

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_recognition_routes(app)


@app.post("/isl-chat")
async def isl_chat(request: dict):
    messages = request.get("messages", [])
    lang = request.get("lang", "en")
    
    # Prepend system prompt
    is_hindi = (lang == "hi")
    
    system_prompt_hi = """तुम Beyond का ISL सहायक हो — भारतीय सांकेतिक भाषा (ISL) के विशेषज्ञ। तुम उपयोगकर्ताओं को ISL व्याकरण, शब्दावली, इतिहास, भारत में बधिर संस्कृति और Beyond ऐप के बारे में सीखने में मदद करते हो।

Beyond प्रोजेक्ट के बारे में:
- Beyond एक ISL अनुवादक वेबसाइट है जो अंग्रेजी वाक्यों को ISL वीडियो क्लिप में बदलती है
- उपयोगकर्ता अंग्रेजी में टाइप या बोलकर इनपुट दे सकते हैं, फिर "Convert to ISL" दबाएं
- हर शब्द का ISL वीडियो क्रम में चलता है; जो शब्द डेटाबेस में नहीं हैं वो अक्षर-दर-अक्षर स्पेल होते हैं
- शब्दों पर क्लिक करके उस शब्द से चला सकते हैं; प्लेबैक स्पीड बदल सकते हैं
- Beyond में gesture-to-word पहचान भी है — कैमरे से ISL इशारे पहचानता है और सुझाव देता है
- उदाहरण: "I" का इशारा दिखाने पर "I am", "I feel", "I want" जैसे वाक्य सुझाता है

ISL के बारे में:
- ISL भारत में बधिर समुदाय की प्राथमिक सांकेतिक भाषा है
- ISL का व्याकरण बोली जाने वाली भाषाओं से अलग है — Subject-Object-Verb (SOV) क्रम
- ISL ब्रिटिश मैनुअल वर्णमाला पर आधारित एक-हाथ फिंगरस्पेलिंग का उपयोग करता है
- ISLRTC ISL के मानकीकरण पर काम करता है

जवाब संक्षिप्त, मैत्रीपूर्ण और शैक्षिक रखो। मार्कडाउन फॉर्मेटिंग का उपयोग मत करो — सादा पाठ में जवाब दो। गैर-ISL विषयों पर ISL की ओर वापस ले जाओ।"""

    system_prompt_en = """You are Beyond's ISL Assistant — an expert on Indian Sign Language (ISL). You help users learn about ISL grammar, vocabulary, history, deaf culture in India, and how to use the Beyond app.

About the Beyond project:
- Beyond is an ISL translator website that converts English sentences into ISL video clips
- Users can type or speak English input, then press "Convert to ISL" to see the translation
- Each word plays its ISL video sequentially; words not in the dictionary are finger-spelled letter by letter
- Users can click on any word to jump to it, adjust playback speed (0.5x to 2x)
- Speech input is supported — users can tap the mic icon to dictate sentences
- Beyond also has a gesture-to-word recognition feature — it uses the camera to recognize ISL hand gestures and suggests matching words and sentences
- Example: showing the sign for "I" suggests phrases like "I am", "I feel", "I want"

Key ISL facts:
- ISL is the primary sign language used in India by the deaf community
- ISL has its own grammar structure different from spoken languages
- ISL uses one-handed fingerspelling based on the British manual alphabet
- ISL grammar typically follows Subject-Object-Verb (SOV) order
- The Indian Sign Language Research and Training Centre (ISLRTC) works on ISL standardization

IMPORTANT: Do NOT use markdown formatting in your responses. Reply in plain text only. Keep answers concise, friendly, and educational. If asked about non-ISL topics, gently redirect to ISL-related discussion."""

    system_prompt = system_prompt_hi if is_hindi else system_prompt_en
    
    chat_messages = [{"role": "system", "content": system_prompt}] + messages
    
    try:
        import g4f
        from g4f.client import Client

        client = Client()
        response = client.chat.completions.create(
            model="openai",
            provider=g4f.Provider.PollinationsAI,
            messages=chat_messages
        )
        reply = response.choices[0].message.content
        
        # Strip potential pollinations warning
        import re
        reply = re.sub(r'⚠️ \*\*IMPORTANT NOTICE\*\* ⚠️[\s\S]*?continue to work normally\n*', '', reply).strip()
        
    except Exception as e:
        print("g4f error:", e)
        reply = "क्षमा करें, मुझे समझने में समस्या आ रही है।" if is_hindi else "Sorry, I am having trouble connecting to the AI."
        
    return {"reply": reply}

@app.get("/")
async def root():
    return {"message": "ISL Bridge Launcher Hub Active."}

# Global variable to track the desktop process
desktop_process = None

@app.post("/launch-desktop")
async def launch_desktop():
    global desktop_process
    import subprocess
    import os
    
    # If already running, don't start multiple
    if desktop_process and desktop_process.poll() is None:
        return {"status": "success", "message": "Already running"}

    # Pointing to the BIDIRECTIONAL folder as requested
    proj_dir = r"c:\Users\RAH\Desktop\bi-directional-isl-translation\Code\Predict signs"
    script = "Prediction.py"
    # Use the stable venv_fix (created earlier in isl-bridge\isl-text)
    python_path = r"c:\Users\RAH\Desktop\isl-bridge\isl-text\venv_fix\Scripts\python.exe"
    if not os.path.exists(python_path): python_path = "python"
    
    try:
        desktop_process = subprocess.Popen([python_path, script], cwd=proj_dir, creationflags=subprocess.CREATE_NEW_CONSOLE)
        return {"status": "success", "pid": desktop_process.pid}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/stop-desktop")
async def stop_desktop():
    global desktop_process
    import subprocess
    
    if desktop_process:
        try:
            # Force kill the process and its children
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(desktop_process.pid)])
            desktop_process = None
            return {"status": "success", "message": "Module stopped"}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    else:
        # Fallback: kill all python processes in that directory
        subprocess.run(["taskkill", "/F", "/IM", "python.exe", "/T"])
        return {"status": "success", "message": "Cleaned up all processes"}

class TTSRequest(BaseModel):
    text: str
    lang: str = "en"

@app.post("/tts")
async def tts(request: TTSRequest):
    try:
        tts_obj = gTTS(text=request.text, lang=request.lang)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as fp:
            tts_obj.save(fp.name)
            return FileResponse(fp.name, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def _port_in_use(host: str, port: int) -> bool:
    """Return True if something is already listening on this port."""
    check_host = "127.0.0.1" if host in ("0.0.0.0", "::") else host
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.bind((check_host, port))
            return False
        except OSError:
            return True


def run_server() -> None:
    """Load recognition models, then start Uvicorn (use: python main.py)."""
    host = os.getenv("SERVER_HOST", "0.0.0.0")
    port = int(os.getenv("SERVER_PORT", "5000"))
    log_level = os.getenv("UVICORN_LOG_LEVEL", "info")

    print("SERVER: Loading recognition models...", flush=True)
    init_recognition()

    if _port_in_use(host, port):
        print(
            f"SERVER ERROR: Port {port} is already in use. "
            f"Stop the other process or set SERVER_PORT to a free port.",
            flush=True,
        )
        sys.exit(1)

    import uvicorn

    display_host = "127.0.0.1" if host == "0.0.0.0" else host
    print(f"SERVER: Starting Uvicorn on http://{display_host}:{port}", flush=True)

    # Pass app object so `python main.py` serves this module's FastAPI instance.
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level=log_level,
        access_log=True,
    )


if __name__ == "__main__":
    run_server()
