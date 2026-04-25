import subprocess
import os
import sys

# Paths
venv_python = r"c:\Users\RAH\Desktop\isl-bridge\isl-text\venv_fix\Scripts\python.exe"
proj_dir = r"c:\Users\RAH\Desktop\bi-directional-isl-translation\Code\Predict signs"
script = "Prediction.py"

print(f"Testing launch of {script} from {proj_dir} using {venv_python}")

try:
    # Run and capture output to see why it crashes
    result = subprocess.run(
        [venv_python, script],
        cwd=proj_dir,
        capture_output=True,
        text=True
    )
    print("STDOUT:", result.stdout)
    print("STDERR:", result.stderr)
except Exception as e:
    print("LAUNCH ERROR:", e)
