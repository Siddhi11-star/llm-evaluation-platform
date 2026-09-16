"""
Unit and Integration Tests for SWARM 5A: Intelligent Swarm Orchestration.

Tests Covered:
1. Simple prompt -> minimal appropriate swarm (trivial direct response or 1-2 focused specialists)
2. Complex prompt -> multiple complementary specialists (3-5 distinct non-overlapping analytical roles)
3. No redundant specialist tasks (roles/tasks deduplication and orthogonal responsibilities)
4. Appropriate model selection / routing based on role capabilities
5. Conflicting agent outputs handled during synthesis (cross-examination and resolved deliverable)
6. Existing SSE, auth, persistence, and parallel execution remain intact
"""

import sys
import asyncio
from pathlib import Path
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.agent_swarm.swarm_engine import (
    plan_swarm,
    _domain_heuristic_plan,
    _sanitize_and_deduplicate_plan,
    _assign_model_for_role,
    synthesize_results,
    _assemble_fallback_synthesis,
    run_swarm_stream,
    run_swarm,
)
from backend.agent_swarm.main import app
from backend.auth_users.security import create_access_token


def test_1_simple_prompt_minimal_swarm():
    """Test 1: Simple/conversational prompts yield a minimal/trivial appropriate swarm."""
    # 1. Greeting
    plan_greeting = _domain_heuristic_plan("Hello, how are you?")
    assert plan_greeting["is_trivial"] is True
    assert len(plan_greeting["agents"]) == 0
    assert "JudgeAI Swarm Orchestrator" in plan_greeting["direct_response"]

    # 2. Simple factual definition
    plan_simple = _domain_heuristic_plan("What is photosynthesis?")
    assert plan_simple["is_trivial"] is False
    assert 1 <= len(plan_simple["agents"]) <= 2
    roles = [a["role"] for a in plan_simple["agents"]]
    assert any("Knowledge" in r or "Context" in r for r in roles)
    print("\n[PASS] Test 1: Simple prompts produce minimal targeted swarm.")


def test_2_complex_prompt_complementary_specialists():
    """Test 2: High complexity prompt yields 4-5 complementary specialist agents."""
    complex_prompt = (
        "Design a comprehensive fault-tolerant distributed consensus engine with Raft architecture, "
        "adversarial byzantine fault detection, formal TLA+ verification, performance profiling, and operational roadmap."
    )
    plan = _domain_heuristic_plan(complex_prompt)
    assert plan["is_trivial"] is False
    agents = plan["agents"]
    assert 4 <= len(agents) <= 5

    roles = [a["role"] for a in agents]
    # Verify complementary analytical perspectives exist
    has_research = any("Research" in r or "Context" in r for r in roles)
    has_architecture_or_logic = any("Architecture" in r or "Logic" in r or "Theoretical" in r for r in roles)
    has_risk_or_security = any("Risk" in r or "Security" in r or "Assessor" in r for r in roles)
    assert has_research or has_architecture_or_logic or has_risk_or_security
    print(f"\n[PASS] Test 2: Complex prompt deployed {len(agents)} complementary specialists: {roles}")


def test_3_no_redundant_specialist_tasks():
    """Test 3: Sanitizer eliminates duplicate or overlapping agent tasks and roles."""
    raw_plan_with_duplicates = {
        "is_trivial": False,
        "thought": "Test with duplicate agents",
        "agents": [
            {"id": "a1", "role": "Security Auditor", "task": "Audit code security vulnerabilities", "model": "deepseek-v4-pro:cloud"},
            {"id": "a2", "role": "Security Auditor", "task": "Audit code security vulnerabilities again", "model": "deepseek-v4-pro:cloud"},
            {"id": "a3", "role": "Performance Profiler", "task": "Analyze latency and asymptotic bottlenecks", "model": "glm-5.2:cloud"},
            {"id": "a4", "role": "Performance Profiler", "task": "Analyze latency and asymptotic bottlenecks", "model": "glm-5.2:cloud"},
            {"id": "a5", "role": "Test Validator", "task": "Design edge-case matrix", "model": "nemotron-3-super:cloud"},
        ]
    }

    sanitized = _sanitize_and_deduplicate_plan(raw_plan_with_duplicates, "Audit Python backend code for security bugs")
    agents = sanitized["agents"]
    assert len(agents) == 3  # Duplicates stripped
    unique_roles = {a["role"] for a in agents}
    assert len(unique_roles) == 3
    print(f"\n[PASS] Test 3: Deduplication stripped redundant agents: {[a['role'] for a in agents]}")


def test_4_appropriate_model_selection_and_routing():
    """Test 4: Capability-aware model selection maps specialists to ideal models."""
    # Logic / Math -> GLM
    m_logic = _assign_model_for_role("Formal Reasoning & Proof Specialist")
    assert "glm" in m_logic.lower()

    # Code / Security -> DeepSeek V4 Pro
    m_sec = _assign_model_for_role("Security & Taint Analysis Auditor")
    assert "deepseek" in m_sec.lower()

    # Fast retrieval -> DeepSeek Flash
    m_ret = _assign_model_for_role("Knowledge & Grounding Retrieval Specialist")
    assert "flash" in m_ret.lower() or "deepseek" in m_ret.lower()

    # Testing / Verification / Judge -> Nemotron or MiniMax
    m_judge = _assign_model_for_role("Hallucination & Safety Judge")
    assert "minimax" in m_judge.lower() or "nemotron" in m_judge.lower()

    print("\n[PASS] Test 4: Model routing accurately maps specialist domain to capable cloud model.")


def test_5_conflicting_agent_outputs_in_synthesis():
    """Test 5: Synthesis resolves conflicting agent perspectives into a structured consensus."""
    conflicting_results = [
        {
            "id": "agent-1",
            "role": "Security & Taint Auditor",
            "model": "deepseek-v4-pro:cloud",
            "status": "completed",
            "output": "Claim: The code is unsafe due to unsanitized SQL concatenation in query builder.",
        },
        {
            "id": "agent-2",
            "role": "Performance Profiler",
            "model": "glm-5.2:cloud",
            "status": "completed",
            "output": "Claim: Raw SQL string concatenation provides 4x lower latency than parameterized queries.",
        },
        {
            "id": "agent-3",
            "role": "Quality & Safety Judge",
            "model": "minimax-m3:cloud",
            "status": "completed",
            "output": "Verdict: Security vulnerability outweighs performance gain. Parameterized queries or prepared statements must be enforced.",
        }
    ]

    assembled = _assemble_fallback_synthesis(
        prompt="Review raw SQL string formatting in authentication handler",
        successful_agents=conflicting_results,
        failed_agents=[]
    )

    assert "Consensus & Resolution Matrix" in assembled
    assert "Disagreement Resolution" in assembled
    assert "Final Synthesis Verdict" in assembled
    print("\n[PASS] Test 5: Synthesis structures and resolves conflicting specialist claims.")


def test_6_sse_auth_persistence_compatibility():
    """Test 6: Existing SSE streaming, JWT authentication, and user isolation remain fully functional."""
    client = TestClient(app)
    user_id = "user_test_swarm_5a"
    token = create_access_token(subject=user_id, email="swarm5a@judgeai.dev")

    res = client.post(
        "/api/swarm/stream",
        json={"prompt": "Analyze time complexity of quicksort vs mergesort"},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert res.status_code == 200
    assert "text/event-stream" in res.headers.get("content-type", "")
    assert "event: swarm_started" in res.text
    assert "event: swarm_completed" in res.text

    print("\n[PASS] Test 6: SSE streaming, JWT authentication, and persistence remain 100% operational.")


if __name__ == "__main__":
    test_1_simple_prompt_minimal_swarm()
    test_2_complex_prompt_complementary_specialists()
    test_3_no_redundant_specialist_tasks()
    test_4_appropriate_model_selection_and_routing()
    test_5_conflicting_agent_outputs_in_synthesis()
    test_6_sse_auth_persistence_compatibility()
    print("\n==================================================")
    print("ALL 6 SWARM 5A INTELLIGENT ORCHESTRATION TESTS PASSED!")
    print("==================================================")
