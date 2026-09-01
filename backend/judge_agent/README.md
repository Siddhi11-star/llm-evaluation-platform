# Judge Agent — Pairwise Response Evaluator

A backend Judge Agent service that evaluates and compares **two AI model responses** (`Response A` vs `Response B`) against the same user prompt across **six independent evaluation factors** using `gpt-oss:120b-cloud` via Ollama.

## Overview

- **Service Port**: `8002` (configurable via `PORT` environment variable)
- **Primary Endpoint**: `POST /judge/compare`
- **Judge Model**: `gpt-oss:120b-cloud` (at `temperature=0.0`)
- **Execution Architecture**: Concurrent evaluation of all six factors using `asyncio.gather()`

---

## The Six Comparison Factors

Each factor evaluates both responses independently and outputs integer scores (0–100), factor winner (`A`, `B`, or `Tie`), and a concise justification rationale:

| Factor | Key | Weight | Color | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Accuracy & Factuality** | `accuracy` | 1.25 | `#38BDF8` | Correctness, math/code validity, and absence of logical flaws. |
| **Prompt Relevance** | `relevance` | 1.15 | `#7C3AED` | Direct fulfillment of the user prompt without drift or off-topic content. |
| **Reasoning Depth** | `reasoning` | 1.05 | `#EC4899` | Analytical rigor, logical steps, edge case handling, and depth. |
| **Clarity & Formatting** | `clarity` | 0.85 | `#FBBF24` | Readability, structured markdown, and conciseness without verbosity. |
| **Safety & Compliance** | `safety` | 1.30 | `#34D399` | Adherence to safety boundaries, cybersecurity hygiene, and policy. |
| **Hallucination / Grounding** | `hallucination` | 1.20 | `#A78BFA` | Zero fabricated APIs, phantom syntax, false claims, or fake citations. |

---

## API Endpoints

### 1. `POST /judge/compare`

**Request Body:**
```json
{
  "prompt": "Give me Python code for a palindrome number.",
  "model_a": "Claude 3.5 Sonnet",
  "model_b": "GPT-4o",
  "response_a": "def is_palindrome(n):\n    return str(n) == str(n)[::-1]",
  "response_b": "num = int(input())\nif num % 2 == 0:\n    print('Even')\nelse:\n    print('Odd')",
  "judge_model": "gpt-oss:120b-cloud"
}
```

**Response (`JudgeResult`):**
```json
{
  "winnerName": "Claude 3.5 Sonnet",
  "winnerKey": "A",
  "overallA": 96,
  "overallB": 15,
  "margin": 81,
  "confidence": 97,
  "verdictSummary": "Claude 3.5 Sonnet correctly implemented the palindrome check with string slicing, while GPT-4o produced an unrelated even/odd parity checker.",
  "factors": [
    {
      "factor": "accuracy",
      "label": "Accuracy & Factuality",
      "scoreA": 98,
      "scoreB": 10,
      "winner": "A",
      "color": "#38BDF8",
      "rationale": "Model A correctly verifies palindrome condition. Model B checks even/odd numbers instead."
    },
    ...
  ],
  "strengthsA": ["Correct string slicing algorithm", "Clean function signature"],
  "weaknessesA": ["Could add edge case handling for negative numbers"],
  "strengthsB": ["Valid syntax for parity check"],
  "weaknessesB": ["Completely failed palindrome requirement; solved parity problem instead"],
  "judge_model_used": "gpt-oss:120b-cloud",
  "provider": "ollama"
}
```

### 2. `GET /judge/health`
Returns service health and active evaluation factors.

### 3. `GET /judge/factors`
Returns detailed metadata for the six evaluation factors.

---

## Running the Service

```bash
uvicorn backend.judge_agent.main:app --host 0.0.0.0 --port 8002 --reload
```
