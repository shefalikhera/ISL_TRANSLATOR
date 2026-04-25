from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import sys
import traceback
from gtts import gTTS
import tempfile
from fastapi.responses import FileResponse

app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
