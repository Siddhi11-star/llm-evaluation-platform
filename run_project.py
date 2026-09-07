"""
Run all JudgeAI microservices and frontend application concurrently.
Usage:
    python run_project.py
"""

import sys
import os
import time
import subprocess
import signal
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR / "frontend" / "landing_page"

SERVICES = [
    {
        "name": "Chat Service (Port 8000)",
        "cmd": [sys.executable, "-m", "uvicorn", "backend.chat.main:app", "--host", "0.0.0.0", "--port", "8000"],
        "cwd": ROOT_DIR,
    },
    {
        "name": "Evaluations Service (Port 8001)",
        "cmd": [sys.executable, "-m", "uvicorn", "backend.evaluations.main:app", "--host", "0.0.0.0", "--port", "8001"],
        "cwd": ROOT_DIR,
    },
    {
        "name": "Judge Agent Service (Port 8002)",
        "cmd": [sys.executable, "-m", "uvicorn", "backend.judge_agent.main:app", "--host", "0.0.0.0", "--port", "8002"],
        "cwd": ROOT_DIR,
    },
    {
        "name": "Advisor Agent Service (Port 8003)",
        "cmd": [sys.executable, "-m", "uvicorn", "backend.advisor_agent.main:app", "--host", "0.0.0.0", "--port", "8003"],
        "cwd": ROOT_DIR,
    },
    {
        "name": "Auth Service (Port 8004)",
        "cmd": [sys.executable, "-m", "uvicorn", "backend.auth_users.main:app", "--host", "0.0.0.0", "--port", "8004"],
        "cwd": ROOT_DIR,
    },
    {
        "name": "Agent Swarm Service (Port 5002)",
        "cmd": [sys.executable, "-m", "uvicorn", "backend.agent_swarm.main:app", "--host", "0.0.0.0", "--port", "5002"],
        "cwd": ROOT_DIR,
    },
    {
        "name": "Frontend Dev Server (Vite)",
        "cmd": ["npm.cmd" if os.name == "nt" else "npm", "run", "dev"],
        "cwd": FRONTEND_DIR,
    },
]

processes = []

def stop_all(sig=None, frame=None):
    print("\n[Runner] Stopping all services...")
    for item in processes:
        proc = item["proc"]
        name = item["name"]
        try:
            if proc.poll() is None:
                print(f"[Runner] Terminating {name} (PID {proc.pid})...")
                proc.terminate()
                try:
                    proc.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    proc.kill()
        except Exception as e:
            print(f"[Runner] Error stopping {name}: {e}")
    print("[Runner] All services stopped.")
    sys.exit(0)

def main():
    signal.signal(signal.SIGINT, stop_all)
    signal.signal(signal.SIGTERM, stop_all)

    if sys.platform == "win32":
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")

    # Check & start Ollama if not running
    try:
        import urllib.request
        with urllib.request.urlopen("http://localhost:11434/api/tags", timeout=2) as resp:
            pass
    except Exception:
        print("[Runner] Starting local Ollama server...")
        try:
            ollama_proc = subprocess.Popen(["ollama", "serve"], env=os.environ.copy())
            processes.append({"name": "Ollama LLM Engine", "proc": ollama_proc})
            time.sleep(2)
        except Exception as e:
            print(f"[Runner] Notice: could not start ollama binary: {e}")

    print("=" * 65)
    print("           [*] Starting JudgeAI Full-Stack Ecosystem           ")
    print("=" * 65)
    print("  * Frontend Web App:    http://localhost:8443")
    print("  * Chat Service:        http://localhost:8000 (docs: /docs)")
    print("  * Evaluations Service: http://localhost:8001 (docs: /docs)")
    print("  * Judge Agent:         http://localhost:8002 (docs: /docs)")
    print("  * Advisor Agent:       http://localhost:8003 (docs: /docs)")
    print("  * Auth Service:        http://localhost:8004 (docs: /docs)")
    print("  * Agent Swarm:         http://localhost:5002 (docs: /docs)")
    print("  * Ollama LLM Engine:   http://localhost:11434")
    print("=" * 65)
    print("Press Ctrl+C to stop all services.\n")

    for svc in SERVICES:
        print(f"[Runner] Spawning {svc['name']}...")
        try:
            proc = subprocess.Popen(
                svc["cmd"],
                cwd=str(svc["cwd"]),
                env=os.environ.copy()
            )
            processes.append({"name": svc["name"], "proc": proc})
        except Exception as e:
            print(f"[Runner] Failed to start {svc['name']}: {e}")

    # Keep alive and monitor child processes
    try:
        while True:
            for item in processes:
                code = item["proc"].poll()
                if code is not None:
                    print(f"[Runner] Warning: {item['name']} exited with code {code}")
            time.sleep(1)
    except KeyboardInterrupt:
        stop_all()

if __name__ == "__main__":
    main()
