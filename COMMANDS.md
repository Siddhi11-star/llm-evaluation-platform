# 🚀 Project Run & Execution Guide

This document contains all the commands to start and run the **JudgeAI Evaluation & Swarm System** (Frontend, Chat Backend, and Agent Swarm Backend).

---

## ⚡ Option 1: Run Everything Together (Single Command)

Open a terminal at the root directory of the project:

```bash
cd /Users/hitarthsaparia/Desktop/llm-judge-eval-system
```

Then run either script:

```bash
# Using the Bash script (Recommended for macOS/Linux)
./start.sh
```

*or with Python:*

```bash
python3 start.py
```

> **Note:** Press <kbd>Ctrl</kbd> + <kbd>C</kbd> in that terminal to stop all running services simultaneously.

---

## 🛠️ Option 2: Run Services in Separate Terminals

If you want dedicated terminal tabs for each service:

### 📟 Terminal 1 — Chat Backend (FastAPI / MiniMax & Ollama)
```bash
cd /Users/hitarthsaparia/Desktop/llm-judge-eval-system/backend/chat
./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
* **Local URL:** [http://localhost:8000](http://localhost:8000)
* **Interactive API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Health Check:** [http://localhost:8000/chat/health](http://localhost:8000/chat/health)

---

### 📟 Terminal 2 — Agent Swarm Backend (FastAPI / Multi-Agent)
```bash
cd /Users/hitarthsaparia/Desktop/llm-judge-eval-system/backend/agent_swarm
../chat/venv/bin/uvicorn main:app --host 0.0.0.0 --port 5002 --reload
```
* **Local URL:** [http://localhost:5002](http://localhost:5002)
* **Interactive API Docs:** [http://localhost:5002/docs](http://localhost:5002/docs)
* **Swarm Info:** [http://localhost:5002/](http://localhost:5002/)

---

### 📟 Terminal 3 — Frontend Dashboard (Vite + React)
```bash
cd /Users/hitarthsaparia/Desktop/llm-judge-eval-system/frontend/landing_page
npm run dev
```
* **Web App URL:** [http://localhost:5173](http://localhost:5173) (or the port Vite outputs)

---

## 📦 First-Time Setup & Dependency Installation (If Needed)

If you ever clone the project fresh or rebuild virtual environments:

### 1. Backend Python Virtual Environment
```bash
cd /Users/hitarthsaparia/Desktop/llm-judge-eval-system/backend/chat
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/pip install -r ../agent_swarm/requirements.txt
```

### 2. Frontend Dependencies
```bash
cd /Users/hitarthsaparia/Desktop/llm-judge-eval-system/frontend/landing_page
npm install
```

---

## 📋 Quick Service Reference Summary

| Service | Port | Directory | Command |
| :--- | :--- | :--- | :--- |
| **All Services** | — | `/` | `./start.sh` |
| **Frontend UI** | `5173` | `frontend/landing_page` | `npm run dev` |
| **Chat Backend** | `8000` | `backend/chat` | `./venv/bin/uvicorn main:app --port 8000 --reload` |
| **Agent Swarm** | `5002` | `backend/agent_swarm` | `../chat/venv/bin/uvicorn main:app --port 5002 --reload` |
