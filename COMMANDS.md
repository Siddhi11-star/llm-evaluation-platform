# 🚀 JudgeAI — Complete Run & Execution Guide

This document contains all instructions and commands to start and run the combined **JudgeAI Evaluation, Multi-Agent Swarm, and Consultant System**.

---

## ⚡ Option 1: Run All Services Together (Single Command)

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

> **Note:** Press <kbd>Ctrl</kbd> + <kbd>C</kbd> to stop all running services simultaneously.

---

## 🛠️ Option 2: Run Services in Separate Terminals

If you want dedicated terminal tabs for each service:

### 📟 Terminal 1 — Frontend Dashboard & Web App (React + Vite)
```bash
cd /Users/hitarthsaparia/Desktop/llm-judge-eval-system/frontend/landing_page
npm run dev
```
* **Local Web App:** [http://localhost:5173](http://localhost:5173) (or assigned port)

---

### 📟 Terminal 2 — Chat Backend (FastAPI / MiniMax & Ollama)
```bash
cd /Users/hitarthsaparia/Desktop/llm-judge-eval-system/backend/chat
./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
* **API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Health Check:** [http://localhost:8000/chat/health](http://localhost:8000/chat/health)

---

### 📟 Terminal 3 — Evaluation Agent Service (FastAPI / 6 Rubrics)
```bash
cd /Users/hitarthsaparia/Desktop/llm-judge-eval-system/backend/evaluations
../chat/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```
* **API Docs:** [http://localhost:8001/docs](http://localhost:8001/docs)
* **Health Check:** [http://localhost:8001/evaluations/health](http://localhost:8001/evaluations/health)

---

### 📟 Terminal 4 — Pairwise Judge Agent Service (FastAPI)
```bash
cd /Users/hitarthsaparia/Desktop/llm-judge-eval-system/backend/judge_agent
../chat/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```
* **API Docs:** [http://localhost:8002/docs](http://localhost:8002/docs)
* **Health Check:** [http://localhost:8002/judge/health](http://localhost:8002/judge/health)

---

### 📟 Terminal 5 — Advisor Agent Service (FastAPI / Model Consultant)
```bash
cd /Users/hitarthsaparia/Desktop/llm-judge-eval-system/backend/advisor_agent
../chat/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8003 --reload
```
* **API Docs:** [http://localhost:8003/docs](http://localhost:8003/docs)
* **Health Check:** [http://localhost:8003/advisor/health](http://localhost:8003/advisor/health)

---

### 📟 Terminal 6 — Agent Swarm Service (FastAPI / Multi-Agent Swarm)
```bash
cd /Users/hitarthsaparia/Desktop/llm-judge-eval-system/backend/agent_swarm
../chat/venv/bin/uvicorn main:app --host 0.0.0.0 --port 5002 --reload
```
* **API Docs:** [http://localhost:5002/docs](http://localhost:5002/docs)
* **Health Check:** [http://localhost:5002/api/swarm/health](http://localhost:5002/api/swarm/health)

---

## 📋 Microservices Architecture Summary

| Service | Port | Directory | Description |
| :--- | :--- | :--- | :--- |
| **Frontend** | `5173` | `frontend/landing_page` | Unified React Dashboard & Landing Page |
| **Chat Backend** | `8000` | `backend/chat` | AI Chat with MiniMax M3, Ollama & Memory |
| **Evaluations** | `8001` | `backend/evaluations` | Multi-Criteria Evaluation Pipeline (6 Rubrics) |
| **Judge Agent** | `8002` | `backend/judge_agent` | Pairwise Model Output Comparison |
| **Advisor Agent** | `8003` | `backend/advisor_agent` | Model & Tool Recommendation Consultant |
| **Agent Swarm** | `5002` | `backend/agent_swarm` | Multi-Agent Swarm Orchestrator (`gpt-oss:120b`) |
