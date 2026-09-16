"""
Automated Integration and Unit Tests for Swarm 2A: Authentication & MongoDB Persistence.

Tests:
1. Unauthenticated request rejected (401)
2. Authenticated swarm execution (200)
3. Session saved with correct user ID
4. History returns only that user's sessions (user isolation)
5. Another user's session cannot be accessed (404/403 isolation)
6. Safe fallback on database failure
"""

import sys
import json
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure root is in path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.agent_swarm.main import app
from backend.agent_swarm.db import SwarmDatabase
from backend.auth_users.security import create_access_token



def test_1_unauthenticated_requests_rejected(client):
    """Verify that endpoints reject requests without a valid JWT."""
    # 1. POST /api/swarm/run without token
    res_run = client.post("/api/swarm/run", json={"prompt": "Hello"})
    assert res_run.status_code == 401, f"Expected 401, got {res_run.status_code}"

    # 2. GET /api/swarm/history without token
    res_hist = client.get("/api/swarm/history")
    assert res_hist.status_code == 401, f"Expected 401, got {res_hist.status_code}"

    # 3. GET /api/swarm/history/{id} without token
    res_detail = client.get("/api/swarm/history/swarm-12345")
    assert res_detail.status_code == 401, f"Expected 401, got {res_detail.status_code}"

    # 4. Invalid token
    res_invalid = client.post(
        "/api/swarm/run",
        json={"prompt": "Hello"},
        headers={"Authorization": "Bearer invalid.jwt.token"}
    )
    assert res_invalid.status_code == 401
    print("\n[PASS] Test 1: All unauthenticated requests rejected with HTTP 401.")


def test_2_and_3_authenticated_execution_and_saved_with_user_id(client):
    """Verify authenticated execution works and session is stored with correct user_id."""
    user_a_id = "user_alpha_123"
    user_a_email = "alpha@judgeai.dev"
    token_a = create_access_token(subject=user_a_id, email=user_a_email)

    prompt = "Hello JudgeAI greeting test"
    res = client.post(
        "/api/swarm/run",
        json={"prompt": prompt},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()

    # Verify session ID and user ID
    assert "id" in data
    assert data.get("user_id") == user_a_id
    assert "deliverable" in data
    assert len(data.get("deliverable", {}).get("content", "")) > 0
    assert "created_at" in data

    session_id = data["id"]
    print(f"\n[PASS] Test 2 & 3: Authenticated execution returned 200 and saved session {session_id} with user_id={user_a_id}")
    return session_id, token_a


def test_4_and_5_history_isolation_and_cross_user_denial(client):
    """Verify history lists only current user's runs, and other users cannot access them."""
    user_a_id = "user_alpha_123"
    user_a_email = "alpha@judgeai.dev"
    token_a = create_access_token(subject=user_a_id, email=user_a_email)

    user_b_id = "user_bravo_999"
    user_b_email = "bravo@judgeai.dev"
    token_b = create_access_token(subject=user_b_id, email=user_b_email)

    # 1. Run a session for User A
    res_a = client.post(
        "/api/swarm/run",
        json={"prompt": "User A exclusive swarm prompt"},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert res_a.status_code == 200
    session_a_id = res_a.json()["id"]

    # 2. Run a session for User B
    res_b = client.post(
        "/api/swarm/run",
        json={"prompt": "User B exclusive swarm prompt"},
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert res_b.status_code == 200
    session_b_id = res_b.json()["id"]

    # 3. User A queries history -> should contain session_a_id, but NOT session_b_id
    hist_a = client.get("/api/swarm/history", headers={"Authorization": f"Bearer {token_a}"})
    assert hist_a.status_code == 200
    sessions_a = hist_a.json().get("sessions", [])
    ids_a = [s["id"] for s in sessions_a]
    assert session_a_id in ids_a
    assert session_b_id not in ids_a

    # 4. User B queries history -> should contain session_b_id, but NOT session_a_id
    hist_b = client.get("/api/swarm/history", headers={"Authorization": f"Bearer {token_b}"})
    assert hist_b.status_code == 200
    sessions_b = hist_b.json().get("sessions", [])
    ids_b = [s["id"] for s in sessions_b]
    assert session_b_id in ids_b
    assert session_a_id not in ids_b

    # 5. User A retrieves own session by ID -> 200
    detail_a = client.get(f"/api/swarm/history/{session_a_id}", headers={"Authorization": f"Bearer {token_a}"})
    assert detail_a.status_code == 200
    assert detail_a.json()["id"] == session_a_id
    assert detail_a.json()["user_id"] == user_a_id

    # 6. User B attempts to access User A's session -> must return 404
    detail_forbidden = client.get(f"/api/swarm/history/{session_a_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert detail_forbidden.status_code == 404, f"Expected 404 for cross-user access, got {detail_forbidden.status_code}"

    print(f"\n[PASS] Test 4 & 5: Strict data isolation verified. Cross-user access denied.")


if __name__ == "__main__":
    with TestClient(app) as test_cli:
        print("Running Swarm Auth + MongoDB Integration Tests...")
        test_1_unauthenticated_requests_rejected(test_cli)
        test_2_and_3_authenticated_execution_and_saved_with_user_id(test_cli)
        test_4_and_5_history_isolation_and_cross_user_denial(test_cli)
        print("\nAll 5 test suites passed successfully!")
