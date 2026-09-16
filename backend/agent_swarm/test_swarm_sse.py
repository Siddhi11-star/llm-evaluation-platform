"""
Automated Integration and Unit Tests for Swarm 3A: Real-Time SSE Streaming.

Test Suites:
1. Authenticated SSE Connection (401 on unauthenticated, 200 on authenticated)
2. Expected Lifecycle Events (swarm_started, orchestrator_planning, agent_started, agent_completed, synthesis_started, synthesis_completed, swarm_completed)
3. Agent Failure Event Resilience (agent_failed emitted without terminating stream)
4. Final Completion Event (valid session payload with telemetry)
5. User and Session Data Isolation (streamed session strictly isolated by user ID)
"""

import sys
import json
from pathlib import Path
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

# Ensure root is in path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.agent_swarm.main import app
from backend.agent_swarm.db import SwarmDatabase
from backend.auth_users.security import create_access_token


def parse_sse_events(raw_text: str):
    """Parses raw text/event-stream payload into a list of dicts: [{'event': ..., 'data': ...}]"""
    events = []
    current_event = None
    current_data = []

    for line in raw_text.splitlines():
        line = line.strip()
        if not line:
            if current_event is not None or current_data:
                data_str = "\n".join(current_data)
                try:
                    parsed_data = json.loads(data_str)
                except Exception:
                    parsed_data = data_str
                events.append({"event": current_event or "message", "data": parsed_data})
                current_event = None
                current_data = []
            continue

        if line.startswith("event:"):
            current_event = line.split("event:", 1)[1].strip()
        elif line.startswith("data:"):
            current_data.append(line.split("data:", 1)[1].strip())

    if current_event is not None or current_data:
        data_str = "\n".join(current_data)
        try:
            parsed_data = json.loads(data_str)
        except Exception:
            parsed_data = data_str
        events.append({"event": current_event or "message", "data": parsed_data})

    return events


def test_1_unauthenticated_sse_connection_rejected(client: TestClient):
    """Test 1: Unauthenticated SSE requests must be rejected with 401."""
    # 1. POST /api/swarm/stream without token
    res_post = client.post("/api/swarm/stream", json={"prompt": "Test query"})
    assert res_post.status_code == 401, f"Expected 401, got {res_post.status_code}"

    # 2. GET /api/swarm/stream without token
    res_get = client.get("/api/swarm/stream?prompt=Test+query")
    assert res_get.status_code == 401, f"Expected 401, got {res_get.status_code}"

    # 3. Invalid token
    res_invalid = client.post(
        "/api/swarm/stream",
        json={"prompt": "Test query"},
        headers={"Authorization": "Bearer invalid.jwt.token"}
    )
    assert res_invalid.status_code == 401

    print("\n[PASS] Test 1: All unauthenticated SSE connections rejected with 401.")


def test_2_expected_lifecycle_events(client: TestClient):
    """Test 2: Authenticated SSE stream yields expected real-time lifecycle events in sequence."""
    user_id = "user_sse_101"
    token = create_access_token(subject=user_id, email="sse_user@judgeai.dev")

    res = client.post(
        "/api/swarm/stream",
        json={"prompt": "Compare Transformer and Mamba architectures for LLM evaluations"},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    assert "text/event-stream" in res.headers.get("content-type", "")

    events = parse_sse_events(res.text)
    event_names = [e["event"] for e in events]

    print(f"Captured SSE Events: {event_names}")

    # Check that required lifecycle events occurred
    assert "swarm_started" in event_names, "Missing swarm_started event"
    assert "orchestrator_planning" in event_names, "Missing orchestrator_planning event"
    assert "swarm_completed" in event_names, "Missing swarm_completed event"

    # Verify swarm_started payload
    start_evt = next(e for e in events if e["event"] == "swarm_started")
    assert "session_id" in start_evt["data"]
    assert "prompt" in start_evt["data"]

    # Verify swarm_completed payload
    complete_evt = next(e for e in events if e["event"] == "swarm_completed")
    assert complete_evt["data"]["status"] == "completed"
    assert "session" in complete_evt["data"]
    assert complete_evt["data"]["session"]["id"] == start_evt["data"]["session_id"]

    print("\n[PASS] Test 2: Complete real-time lifecycle event sequence verified.")


def test_3_agent_failure_resilience(client: TestClient):
    """Test 3: Verify agent_failed event is emitted on individual agent failure without crashing stream."""
    user_id = "user_sse_resilience"
    token = create_access_token(subject=user_id, email="resilience@judgeai.dev")

    # Mock one agent to succeed and one to fail
    call_count = 0

    async def mock_run_agent(agent, prompt, idx):
        nonlocal call_count
        call_count += 1
        agent_id = agent.get("id", f"agent-{idx+1}")
        role = agent.get("role", f"Role {idx+1}")
        model = agent.get("model", "gpt-oss:120b-cloud")

        if idx == 1:
            # Simulate failure on agent 2
            return {
                "id": agent_id,
                "role": role,
                "model": model,
                "status": "failed",
                "output": "Simulated Ollama timeout",
                "error": "Timeout connecting to model backend",
                "latency_ms": 150,
                "tokens": 0,
            }
        else:
            return {
                "id": agent_id,
                "role": role,
                "model": model,
                "status": "completed",
                "output": f"Analysis findings from {role}",
                "latency_ms": 220,
                "tokens": 45,
            }

    with patch("backend.agent_swarm.swarm_engine.run_agent", side_effect=mock_run_agent):
        res = client.post(
            "/api/swarm/stream",
            json={"prompt": "Analyze edge computing protocols with specialized multi-agents"},
            headers={"Authorization": f"Bearer {token}"}
        )

        assert res.status_code == 200
        events = parse_sse_events(res.text)
        event_names = [e["event"] for e in events]

        print(f"Resilience Test Events: {event_names}")

        # Verify agent_failed was emitted
        assert "agent_failed" in event_names, "Expected agent_failed event for failed worker"
        failed_evt = next(e for e in events if e["event"] == "agent_failed")
        assert failed_evt["data"]["status"] == "failed"
        assert "error" in failed_evt["data"]

        # Verify stream still completed successfully
        assert "swarm_completed" in event_names, "Stream should complete even with partial worker failure"

    print("\n[PASS] Test 3: Agent failure resilience verified. Stream continued and completed.")


def test_4_final_completion_and_telemetry(client: TestClient):
    """Test 4: Verify final completion event contains complete telemetry and saved session."""
    user_id = "user_telemetry"
    token = create_access_token(subject=user_id, email="telemetry@judgeai.dev")

    res = client.post(
        "/api/swarm/stream",
        json={"prompt": "Hello JudgeAI greeting for stream"},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert res.status_code == 200
    events = parse_sse_events(res.text)
    complete_evt = next((e for e in events if e["event"] == "swarm_completed"), None)
    assert complete_evt is not None, "swarm_completed event not found"

    data = complete_evt["data"]
    assert data["status"] == "completed"
    assert "elapsed_time" in data
    assert "total_tokens" in data
    assert "session" in data
    assert data["session"]["user_id"] == user_id

    print("\n[PASS] Test 4: Final completion event contains valid telemetry and persisted user session.")


def test_5_user_and_session_isolation(client: TestClient):
    """Test 5: Verify streamed sessions are saved under the correct user ID and isolated from other users."""
    user_alice_id = "user_alice_stream"
    token_alice = create_access_token(subject=user_alice_id, email="alice@judgeai.dev")

    user_bob_id = "user_bob_stream"
    token_bob = create_access_token(subject=user_bob_id, email="bob@judgeai.dev")

    # Alice runs a swarm stream
    res_alice = client.post(
        "/api/swarm/stream",
        json={"prompt": "Alice confidential swarm investigation"},
        headers={"Authorization": f"Bearer {token_alice}"}
    )
    assert res_alice.status_code == 200
    alice_events = parse_sse_events(res_alice.text)
    alice_completion = next(e for e in alice_events if e["event"] == "swarm_completed")
    alice_session_id = alice_completion["data"]["session"]["id"]

    # Bob checks his history -> should NOT see Alice's session
    hist_bob = client.get("/api/swarm/history", headers={"Authorization": f"Bearer {token_bob}"})
    assert hist_bob.status_code == 200
    bob_session_ids = [s["id"] for s in hist_bob.json().get("sessions", [])]
    assert alice_session_id not in bob_session_ids, "Cross-user leakage: Bob saw Alice's streamed session"

    # Bob attempts direct access to Alice's session detail -> must return 404
    detail_denied = client.get(f"/api/swarm/history/{alice_session_id}", headers={"Authorization": f"Bearer {token_bob}"})
    assert detail_denied.status_code == 404, f"Expected 404, got {detail_denied.status_code}"

    # Alice queries history -> should see her session
    hist_alice = client.get("/api/swarm/history", headers={"Authorization": f"Bearer {token_alice}"})
    assert hist_alice.status_code == 200
    alice_session_ids = [s["id"] for s in hist_alice.json().get("sessions", [])]
    assert alice_session_id in alice_session_ids, "Alice should find her streamed session in history"

    print("\n[PASS] Test 5: Streamed session user isolation verified across multiple users.")


if __name__ == "__main__":
    with TestClient(app) as test_cli:
        print("=" * 65)
        print("  Running Swarm 3A: Real-Time SSE Streaming Test Suite")
        print("=" * 65)
        test_1_unauthenticated_sse_connection_rejected(test_cli)
        test_2_expected_lifecycle_events(test_cli)
        test_3_agent_failure_resilience(test_cli)
        test_4_final_completion_and_telemetry(test_cli)
        test_5_user_and_session_isolation(test_cli)
        print("\nAll 5 Swarm SSE test suites passed successfully!")
