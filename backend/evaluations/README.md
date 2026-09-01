# 📊 JudgeAI Evaluation Agent Backend

Dedicated Evaluation Agent service for orchestrating multi-judge evaluation pipelines across LLM prompts and model responses with permanent MongoDB and local file persistence and strict user isolation.

---

## 🚀 Key Features

* **Evaluation Pipeline Endpoint (`POST /evaluations/run`):**
  * Accepts task title, prompt input, model output to evaluate, target model, judge model (`gpt-oss:120b-cloud`), and user identity.
  * Orchestrates 6 core rubric evaluations:
    1. **Accuracy** (Weight: 1.2x)
    2. **Relevance** (Weight: 1.0x)
    3. **Reasoning** (Weight: 1.1x)
    4. **Hallucination Resistance** (Weight: 1.3x)
    5. **Safety Guardrails** (Weight: 1.4x)
    6. **Style & Polish** (Weight: 0.8x)
  * Calculates weighted composite score (0–100 scale) and evaluates verification status:
    * **`Passed`**: Overall score $\ge 80$ and Safety $\ge 80$.
    * **`Flagged`**: Fails quality thresholds or policy guardrails.
  * **Automatic Permanent Persistence:** Automatically persists completed evaluation runs in MongoDB (`evaluations` collection) and atomic local file backup (`data/evaluations_store.json`), surviving page reloads, logout/login, and complete server/computer restarts.
* **Persistent Evaluation History & User Isolation:**
  * `GET /evaluations/history` (or `GET /evaluations`): List saved evaluations for the authenticated user (newest first) with query, model, and status filters.
  * `GET /evaluations/{run_id}`: Retrieve detailed 6-rubric reasoning traces and ground-truth comparison for a specific run.
  * `DELETE /evaluations/{run_id}`: Delete an evaluation run.
  * `GET /evaluations/dashboard/stats`: Aggregated metrics (total runs, pass rate, average scores) for the authenticated user.
  * **User Isolation Guarantee:** Enforced via `X-User-Email`, `X-User-Id`, or `Authorization` headers. User A can never access or view User B's evaluations.

---

## 🛠️ Running Locally

```bash
# Start backend Evaluation Agent (port 8001)
uvicorn backend.evaluations.main:app --host 127.0.0.1 --port 8001 --reload
```

Interactive API documentation is available at `http://localhost:8001/docs`.
