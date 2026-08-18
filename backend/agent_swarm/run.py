#!/usr/bin/env python3
"""
Startup script for the JudgeAI Agent Swarm Backend.
Runs on port 5002 by default.

Usage:
  python run.py
  # or
  uvicorn backend.agent_swarm.main:app --port 5002 --reload
"""
import sys
from pathlib import Path

# Ensure both current directory and project root are on sys.path
current_dir = Path(__file__).resolve().parent
project_root = current_dir.parent.parent
sys.path.insert(0, str(current_dir))
sys.path.insert(0, str(project_root))

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=5002,
        reload=True,
        app_dir=str(current_dir),
        log_level="info",
    )
