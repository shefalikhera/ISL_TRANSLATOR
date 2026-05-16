# Start Frontend
cd c:\Users\RAH\Desktop\isl-bridge
Start-Process npm -ArgumentList "run dev -- --port 3000"

# Start Backend
cd c:\Users\RAH\Desktop\isl-bridge\server
.\venv\Scripts\python.exe main.py
