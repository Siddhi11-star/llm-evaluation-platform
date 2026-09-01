#!/usr/bin/env bash
# ==============================================================================
# JudgeAI / LLM Evaluation System — Unified Startup Script
# Starts:
#   1. Chat Backend Service (Port 8000)       -> http://localhost:8000
#   2. Evaluations Service (Port 8001)        -> http://localhost:8001
#   3. Judge Agent Service (Port 8002)        -> http://localhost:8002
#   4. Advisor Agent Service (Port 8003)      -> http://localhost:8003
#   5. Agent Swarm Service (Port 5002)        -> http://localhost:5002
#   6. Frontend Web App (Vite + React)        -> http://localhost:5173 (or next free port)
# ==============================================================================

set -e

# Determine repository root
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# Color helpers
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BOLD}${CYAN}"
echo "============================================================"
echo "    ⚖️  JudgeAI Evaluation, Multi-Agent & Swarm System      "
echo "============================================================"
echo -e "${NC}"

# Python virtual environment check
VENV_DIR="$ROOT_DIR/backend/chat/venv"
if [ ! -d "$VENV_DIR" ]; then
    echo -e "${YELLOW}[!] Python virtual environment not found at $VENV_DIR. Creating...${NC}"
    python3 -m venv "$VENV_DIR"
    echo -e "${BLUE}[*] Installing backend dependencies...${NC}"
    "$VENV_DIR/bin/pip" install -r "$ROOT_DIR/backend/chat/requirements.txt"
    "$VENV_DIR/bin/pip" install -r "$ROOT_DIR/backend/agent_swarm/requirements.txt"
fi

PYTHON_BIN="$VENV_DIR/bin/python"
UVICORN_BIN="$VENV_DIR/bin/uvicorn"

# Frontend dependencies check
if [ ! -d "$ROOT_DIR/frontend/landing_page/node_modules" ]; then
    echo -e "${YELLOW}[!] node_modules not found in frontend/landing_page. Installing...${NC}"
    (cd "$ROOT_DIR/frontend/landing_page" && npm install)
fi

# Track child process IDs
PIDS=()

cleanup() {
    echo -e "\n${YELLOW}[*] Shutting down all services...${NC}"
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
        fi
    done
    wait 2>/dev/null || true
    echo -e "${GREEN}[✓] All services stopped cleanly.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 1. Start Chat Backend (Port 8000)
echo -e "${BLUE}[*] Starting Chat Backend on http://localhost:8000...${NC}"
(
    cd "$ROOT_DIR/backend/chat"
    exec "$UVICORN_BIN" main:app --host 0.0.0.0 --port 8000 --reload
) &
PIDS+=($!)

# 2. Start Evaluations Service (Port 8001)
echo -e "${BLUE}[*] Starting Evaluations Service on http://localhost:8001...${NC}"
(
    cd "$ROOT_DIR/backend/evaluations"
    exec "$UVICORN_BIN" main:app --host 0.0.0.0 --port 8001 --reload
) &
PIDS+=($!)

# 3. Start Judge Agent Service (Port 8002)
echo -e "${BLUE}[*] Starting Judge Agent Service on http://localhost:8002...${NC}"
(
    cd "$ROOT_DIR/backend/judge_agent"
    exec "$UVICORN_BIN" main:app --host 0.0.0.0 --port 8002 --reload
) &
PIDS+=($!)

# 4. Start Advisor Agent Service (Port 8003)
echo -e "${BLUE}[*] Starting Advisor Agent Service on http://localhost:8003...${NC}"
(
    cd "$ROOT_DIR/backend/advisor_agent"
    exec "$UVICORN_BIN" main:app --host 0.0.0.0 --port 8003 --reload
) &
PIDS+=($!)

# 5. Start Agent Swarm Service (Port 5002)
echo -e "${BLUE}[*] Starting Agent Swarm Service on http://localhost:5002...${NC}"
(
    cd "$ROOT_DIR/backend/agent_swarm"
    exec "$UVICORN_BIN" main:app --host 0.0.0.0 --port 5002 --reload
) &
PIDS+=($!)

# 6. Start Frontend
echo -e "${BLUE}[*] Starting Frontend Vite Dev Server...${NC}"
(
    cd "$ROOT_DIR/frontend/landing_page"
    exec npm run dev
) &
PIDS+=($!)

echo -e "\n${BOLD}${GREEN}============================================================${NC}"
echo -e "${BOLD}${GREEN}  🚀 All 6 Services Started Successfully!                    ${NC}"
echo -e "${BOLD}${GREEN}============================================================${NC}"
echo -e "  🌐 ${BOLD}Frontend:${NC}     http://localhost:5173"
echo -e "  💬 ${BOLD}Chat API:${NC}     http://localhost:8000 (Docs: http://localhost:8000/docs)"
echo -e "  📊 ${BOLD}Evals API:${NC}    http://localhost:8001 (Docs: http://localhost:8001/docs)"
echo -e "  ⚖️  ${BOLD}Judge API:${NC}    http://localhost:8002 (Docs: http://localhost:8002/docs)"
echo -e "  💡 ${BOLD}Advisor API:${NC}  http://localhost:8003 (Docs: http://localhost:8003/docs)"
echo -e "  🐝 ${BOLD}Swarm API:${NC}    http://localhost:5002 (Docs: http://localhost:5002/docs)"
echo -e "============================================================"
echo -e "${YELLOW}Press [Ctrl + C] to stop all services simultaneously.${NC}\n"

# Wait indefinitely for background jobs
wait
