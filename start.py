#!/usr/bin/env python3
"""
Unified launcher for JudgeAI:
- Chat Backend Service (FastAPI / MiniMax / Ollama) on http://localhost:8000
- Agent Swarm Service (FastAPI / Multi-Agent) on http://localhost:5002
- Frontend Web App (Vite + React) on http://localhost:5173
"""

import os
import sys
import subprocess
import signal
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
CHAT_DIR = ROOT_DIR / "backend" / "chat"
SWARM_DIR = ROOT_DIR / "backend" / "agent_swarm"
FRONTEND_DIR = ROOT_DIR / "frontend" / "landing_page"

# Virtual environment python/uvicorn
VENV_BIN = CHAT_DIR / "venv" / "bin"
if os.name == "nt":
    PYTHON_EXE = CHAT_DIR / "venv" / "Scripts" / "python.exe"
    UVICORN_EXE = CHAT_DIR / "venv" / "Scripts" / "uvicorn.exe"
    NPM_CMD = "npm.cmd"
else:
    PYTHON_EXE = VENV_BIN / "python"
    UVICORN_EXE = VENV_BIN / "uvicorn"
    NPM_CMD = "npm"

processes: list[subprocess.Popen] = []


def signal_handler(sig, frame):
    print("\n\033[1;33m[*] Stopping all JudgeAI services...\033[0m")
    for p in processes:
        if p.poll() is None:
            try:
                p.terminate()
            except Exception:
                pass
    time.sleep(0.5)
    for p in processes:
        if p.poll() is None:
            try:
                p.kill()
            except Exception:
                pass
    print("\033[1;32m[✓] All services stopped successfully.\033[0m")
    sys.exit(0)


def check_and_setup_venv():
    if not (CHAT_DIR / "venv").exists():
        print(f"\033[1;34m[*] Setting up virtual environment at {CHAT_DIR / 'venv'}...\033[0m")
        subprocess.run([sys.executable, "-m", "venv", str(CHAT_DIR / "venv")], check=True)
        print("\033[1;34m[*] Installing Python dependencies...\033[0m")
        subprocess.run([str(PYTHON_EXE), "-m", "pip", "install", "-r", str(CHAT_DIR / "requirements.txt")], check=True)
        subprocess.run([str(PYTHON_EXE), "-m", "pip", "install", "-r", str(SWARM_DIR / "requirements.txt")], check=True)


def check_and_setup_frontend():
    if not (FRONTEND_DIR / "node_modules").exists():
        print(f"\033[1;34m[*] Installing frontend node_modules at {FRONTEND_DIR}...\033[0m")
        subprocess.run([NPM_CMD, "install"], cwd=str(FRONTEND_DIR), check=True)


def main():
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    print("\033[1;36m" + "=" * 60)
    print("    ⚖️  JudgeAI Evaluation & Multi-Agent Swarm System      ")
    print("=" * 60 + "\033[0m\n")

    check_and_setup_venv()
    check_and_setup_frontend()

    uvicorn_cmd = str(UVICORN_EXE) if UVICORN_EXE.exists() else "uvicorn"

    # 1. Start Chat Backend
    print("\033[1;34m[*] Launching Chat Backend (Port 8000)...\033[0m")
    p_chat = subprocess.Popen(
        [uvicorn_cmd, "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
        cwd=str(CHAT_DIR),
    )
    processes.append(p_chat)

    # 2. Start Swarm Backend
    print("\033[1;34m[*] Launching Agent Swarm Service (Port 5002)...\033[0m")
    p_swarm = subprocess.Popen(
        [uvicorn_cmd, "main:app", "--host", "0.0.0.0", "--port", "5002", "--reload"],
        cwd=str(SWARM_DIR),
    )
    processes.append(p_swarm)

    # 3. Start Frontend
    print("\033[1;34m[*] Launching Frontend Dev Server...\033[0m")
    p_frontend = subprocess.Popen(
        [NPM_CMD, "run", "dev"],
        cwd=str(FRONTEND_DIR),
    )
    processes.append(p_frontend)

    print("\n\033[1;32m" + "=" * 60)
    print("  🚀 All Services are Running!")
    print("=" * 60 + "\033[0m")
    print("  🌐 \033[1mFrontend:\033[0m     http://localhost:5173 (or Vite allocated port)")
    print("  💬 \033[1mChat API:\033[0m     http://localhost:8000 (Swagger: http://localhost:8000/docs)")
    print("  🐝 \033[1mSwarm API:\033[0m    http://localhost:5002 (Swagger: http://localhost:5002/docs)")
    print("=" * 60)
    print("\033[1;33mPress Ctrl+C to terminate all services.\033[0m\n")

    while True:
        time.sleep(1)
        for p in processes:
            if p.poll() is not None:
                print(f"\033[1;31m[!] Process {p.args} exited with code {p.returncode}\033[0m")
                signal_handler(None, None)


if __name__ == "__main__":
    main()
