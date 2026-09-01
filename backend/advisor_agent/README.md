# 🧭 JudgeAI Advisor Agent Backend Service

The **Advisor Agent** is the flagship feature of JudgeAI. It acts as an intelligent AI & Tool Consultant that analyzes the user's intended task, extracts multidimensional technical requirements, evaluates candidate models from a verified ground-truth catalog, delivers ranked **FREE** and **PAID** recommendations with match scores (0–100) and trade-offs via `gpt-oss:120b-cloud`, and synthesizes production-ready, model-optimized prompts.

---

## 🚀 Key Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/advisor/health` | Service health status and `gpt-oss:120b-cloud` Ollama connectivity. |
| `GET` | `/advisor/models` | List full ground-truth catalog with optional `tier`, `is_free`, `supports_vision`, `supports_images` filters. |
| `GET` | `/advisor/models/{id}` | Retrieve catalog details for a single model/tool. |
| `POST` | `/advisor/analyze` | Fast task requirement extraction and complexity classification. |
| `POST` | `/advisor/recommend` | **Flagship Endpoint**: Evaluates requirements against catalog ground truth and generates ranked Free & Paid recommendations with transparent trade-offs. |
| `POST` | `/advisor/generate-prompt` | Generates a tailored, copy-ready prompt specifically optimized for the user's selected model. |

---

## 🛠️ Running Locally

```bash
# Start Advisor Agent backend server on port 8003
uvicorn backend.advisor_agent.main:app --host 127.0.0.1 --port 8003 --reload
```

Interactive OpenAPI documentation is available at `http://localhost:8003/docs`.

---

## 🧪 Example cURL Requests

### 1. Model Recommendation (`POST /advisor/recommend`)
```bash
curl -X POST "http://localhost:8003/advisor/recommend" \
  -H "Content-Type: application/json" \
  -d '{
    "task_description": "I want to build a FastAPI backend with authentication and MySQL. I am a beginner and I want an AI that can help me build the project step by step.",
    "user_skill_level": "beginner",
    "budget_preference": "any"
  }'
```

### 2. Optimized Prompt Generation (`POST /advisor/generate-prompt`)
```bash
curl -X POST "http://localhost:8003/advisor/generate-prompt" \
  -H "Content-Type: application/json" \
  -d '{
    "task_description": "Build a FastAPI backend with JWT authentication and MySQL step by step.",
    "selected_model_id": "claude-3.5-sonnet",
    "tone_preference": "structured and beginner-friendly"
  }'
```
