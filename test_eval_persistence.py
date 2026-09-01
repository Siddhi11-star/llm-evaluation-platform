"""
Comprehensive Persistence & User Isolation Verification Test for Evaluation Agent.
Tests:
1. Evaluation persistence in MongoDB and local backup store.
2. User isolation (User A cannot see User B's history).
3. Server restart / reboot survival (database reload test).
4. FastAPI endpoints with authentication headers.
"""

import sys
import asyncio
from pathlib import Path
from datetime import datetime

# Add project root to sys.path
root_dir = str(Path(__file__).resolve().parent)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from backend.evaluations.models import EvaluationRunRequest
from backend.evaluations.service import EvaluationOrchestrator
from backend.evaluations.db import EvaluationDatabase, FILE_STORE_PATH
from fastapi.testclient import TestClient
from backend.evaluations.main import app


async def test_persistence_and_isolation():
    print("\n" + "="*70)
    print("STEP 1: Initializing Database Connection...")
    print("="*70)
    await EvaluationDatabase.connect()
    db_connected = EvaluationDatabase.get_db() is not None
    print(f"MongoDB Status: {'CONNECTED' if db_connected else 'FILE BACKUP ACTIVE'}")
    print(f"File Store Path: {FILE_STORE_PATH}")

    user_a = "alice@acme.ai"
    user_b = "bob@cybertech.org"

    print("\n" + "="*70)
    print("STEP 2: Creating Evaluation for User A (Alice)...")
    print("="*70)
    req_a = EvaluationRunRequest(
        task_name="TCP vs UDP Network Latency Evaluation",
        prompt_input="Explain latency and reliability tradeoffs between TCP and UDP.",
        model_output="TCP provides reliable, ordered stream delivery with 3-way handshakes and retransmission, introducing latency. UDP provides connectionless, best-effort datagrams with minimal header overhead and zero handshake latency, ideal for real-time video and gaming.",
        target_model="gpt-4o",
        judge_model="gpt-oss:120b-cloud",
        user_id=user_a,
    )
    res_a = await EvaluationOrchestrator.run_evaluation(req_a, user_id=user_a)
    print(f"User A Run Created: ID={res_a.id}, Task='{res_a.task}', Score={res_a.score}/100, Status={res_a.status}")

    print("\n" + "="*70)
    print("STEP 3: Creating Evaluation for User B (Bob)...")
    print("="*70)
    req_b = EvaluationRunRequest(
        task_name="SQL Duplicate Record Detection",
        prompt_input="Write a SQL query to find duplicate emails in users table.",
        model_output="SELECT email, COUNT(*) as count FROM users GROUP BY email HAVING COUNT(*) > 1;",
        target_model="claude-3.5-sonnet",
        judge_model="gpt-oss:120b-cloud",
        user_id=user_b,
    )
    res_b = await EvaluationOrchestrator.run_evaluation(req_b, user_id=user_b)
    print(f"User B Run Created: ID={res_b.id}, Task='{res_b.task}', Score={res_b.score}/100, Status={res_b.status}")

    print("\n" + "="*70)
    print("STEP 4: Verifying Strict User Isolation...")
    print("="*70)
    history_a = await EvaluationOrchestrator.list_evaluations(user_id=user_a)
    history_b = await EvaluationOrchestrator.list_evaluations(user_id=user_b)

    runs_a_ids = [r.id for r in history_a.runs]
    runs_b_ids = [r.id for r in history_b.runs]

    print(f"User A History IDs ({len(runs_a_ids)}): {runs_a_ids}")
    print(f"User B History IDs ({len(runs_b_ids)}): {runs_b_ids}")

    assert res_a.id in runs_a_ids, "User A must see their own evaluation!"
    assert res_b.id not in runs_a_ids, "CRITICAL: User A must NEVER see User B's evaluation!"
    assert res_b.id in runs_b_ids, "User B must see their own evaluation!"
    assert res_a.id not in runs_b_ids, "CRITICAL: User B must NEVER see User A's evaluation!"
    print(">>> PASS: User isolation verified successfully!")

    print("\n" + "="*70)
    print("STEP 5: Simulating Application Restart & System Reboot...")
    print("="*70)
    # Close database connection and clear in-memory cache
    await EvaluationDatabase.close()
    EvaluationDatabase._memory_store.clear()
    EvaluationDatabase._is_initialized = False

    # Reconnect and reload from disk/MongoDB
    await EvaluationDatabase.connect()
    print("Reconnected to database after simulated full restart.")

    reloaded_history_a = await EvaluationOrchestrator.list_evaluations(user_id=user_a)
    reloaded_runs_a = [r.id for r in reloaded_history_a.runs]
    print(f"User A Reloaded IDs: {reloaded_runs_a}")

    assert res_a.id in reloaded_runs_a, "Evaluation must survive project restart!"
    reloaded_detail_a = await EvaluationOrchestrator.get_evaluation_by_id(res_a.id, user_id=user_a)
    assert reloaded_detail_a is not None, "Detail must be retrievable after restart!"
    assert reloaded_detail_a.task == res_a.task, "Task name must match!"
    assert len(reloaded_detail_a.rubrics) == 6, "All 6 rubrics must be preserved!"
    print(">>> PASS: Permanent persistence across restarts verified successfully!")

    print("\n" + "="*70)
    print("STEP 6: Testing FastAPI HTTP Endpoints via TestClient...")
    print("="*70)
    client = TestClient(app)

    # 1. GET /evaluations/history with User A headers
    resp = client.get("/evaluations/history", headers={"X-User-Email": user_a})
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    data = resp.json()
    assert any(r["id"] == res_a.id for r in data["runs"]), "User A history endpoint must return run A!"
    assert not any(r["id"] == res_b.id for r in data["runs"]), "User A history endpoint must not return run B!"
    print(f"GET /evaluations/history for User A returned {len(data['runs'])} records.")

    # 2. GET /evaluations/{run_id}
    detail_resp = client.get(f"/evaluations/{res_a.id}", headers={"X-User-Email": user_a})
    assert detail_resp.status_code == 200
    assert detail_resp.json()["id"] == res_a.id
    print(f"GET /evaluations/{res_a.id} returned status 200 with full rubric scores.")

    # 3. GET /evaluations/{run_id} for unauthorized user (User B trying to access User A's run)
    unauth_resp = client.get(f"/evaluations/{res_a.id}", headers={"X-User-Email": user_b})
    assert unauth_resp.status_code == 404, "User B must not be allowed to access User A's run!"
    print(f"GET /evaluations/{res_a.id} with User B headers correctly returned 404 Not Found.")

    # 4. GET /evaluations/dashboard/stats
    stats_resp = client.get("/evaluations/dashboard/stats", headers={"X-User-Email": user_a})
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    print(f"User A Dashboard Stats: Total={stats['total_evaluations']}, Pass Rate={stats['pass_rate']}%")

    print("\n" + "="*70)
    print("ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! [100% PASS]")
    print("="*70 + "\n")


if __name__ == "__main__":
    asyncio.run(test_persistence_and_isolation())
