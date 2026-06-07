"""
Convenience launcher — run from the project root:
    python run.py

This is equivalent to:
    backend\venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
"""
import subprocess, sys, os

root = os.path.dirname(os.path.abspath(__file__))
python = os.path.join(root, "backend", "venv", "Scripts", "python.exe")
if not os.path.exists(python):
    python = sys.executable  # fallback to current Python

subprocess.run([
    python, "-m", "uvicorn",
    "backend.main:app",
    "--host", "127.0.0.1",
    "--port", "8000",
    "--reload"
], cwd=root)
