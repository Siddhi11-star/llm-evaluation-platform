"""
Comprehensive 10-Scenario Automated Test Suite for the Advisor Agent Backend.
Covers:
1. Beginner Coding (React + FastAPI + MySQL + JWT, beginner, free only)
2. Deep Reasoning (Mathematical logic theorem proving / formal verification)
3. Live Research (Latest 2026 AI regulatory compliance with verified sources)
4. Long Document (300-page enterprise software contract risk audit)
5. Image Generation (Photorealistic cinematic AI visual generation)
6. IDE Workflow (AI editing and modifying multi-file codebase in workspace)
7. Free-Only Constraint ($0 budget enforcement)
8. Any Budget Objective Comparison
9. Ambiguous Request ("Help me with my project")
10. Prompt Generation (Model-specific, tech stack embedded, 0 think tags)
"""

import sys
import asyncio
import json
from pathlib import Path

# Add project root to sys.path
root_dir = str(Path(__file__).resolve().parent)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

from backend.advisor_agent.catalog import get_catalog, get_model_by_id
from backend.advisor_agent.models import (
    TaskAnalysisRequest,
    PromptGenerationRequest,
)
from backend.advisor_agent.service import AdvisorService
from fastapi.testclient import TestClient
from backend.advisor_agent.main import app

client = TestClient(app)


def verify_internal_consistency(res):
    """
    Verifies that best_overall_recommendation and practical_alternative
    strictly match the details and scores in recommended_free_options or recommended_paid_options.
    """
    all_options = res.recommended_free_options + res.recommended_paid_options
    all_by_id = {item.model_id: item for item in all_options}

    assert res.best_overall_recommendation.model_id in all_by_id, (
        f"Best overall '{res.best_overall_recommendation.name}' is not in ranked candidate list!"
    )
    matched_best = all_by_id[res.best_overall_recommendation.model_id]
    assert res.best_overall_recommendation.match_score == matched_best.match_score, (
        f"Score mismatch! Best overall has {res.best_overall_recommendation.match_score}, "
        f"but ranked list has {matched_best.match_score}"
    )

    if res.extracted_requirements.budget_constraint == "free_only":
        assert res.best_overall_recommendation.is_free is True, "Must be free when budget_constraint is free_only"

    # Verify sorting
    free_scores = [item.match_score for item in res.recommended_free_options]
    paid_scores = [item.match_score for item in res.recommended_paid_options]
    assert free_scores == sorted(free_scores, reverse=True), "Free options must be sorted descending by match_score"
    assert paid_scores == sorted(paid_scores, reverse=True), "Paid options must be sorted descending by match_score"


async def run_all_tests():
    print("\n" + "="*80)
    print("🚀 STARTING ADVISOR AGENT COMPREHENSIVE 10-SCENARIO TEST SUITE")
    print("="*80)

    # ──────────────────────────────────────────────────────────────────────────
    # Test 0: Catalog Ground-Truth Integrity Check
    # ──────────────────────────────────────────────────────────────────────────
    catalog = get_catalog()
    assert len(catalog) >= 10, f"Expected at least 10 catalog entries, found {len(catalog)}"
    free_models = [m for m in catalog if m.is_free]
    paid_models = [m for m in catalog if not m.is_free]
    print(f"Verified Catalog: {len(catalog)} total tools ({len(free_models)} Free/Free-Tier, {len(paid_models)} Paid/Subscription)")
    assert len(free_models) >= 4, "Must have verified free models"
    assert len(paid_models) >= 4, "Must have verified paid models"

    # ──────────────────────────────────────────────────────────────────────────
    # Test 1: Beginner Coding (React + FastAPI + MySQL + JWT, Free Only)
    # ──────────────────────────────────────────────────────────────────────────
    print("\n" + "-"*80)
    print("TEST 1: Beginner Coding (React + FastAPI + MySQL + JWT, $0 Budget)")
    print("-"*80)
    req1 = TaskAnalysisRequest(
        task_description="I am a beginner and want to build a React + FastAPI + MySQL AI application with authentication. I have zero budget and need help with coding, debugging, and step-by-step guidance.",
        user_skill_level="beginner",
        budget_preference="free_only",
    )
    res1 = await AdvisorService.recommend_models(req1)
    print(f"Task Summary: {res1.task_summary}")
    print(f"Detected Tech Stack: {res1.extracted_requirements.detected_tech_stack}")
    print(f"Step-by-Step Required: {res1.extracted_requirements.requires_beginner_friendly_explanations}")
    print(f"Best Overall: {res1.best_overall_recommendation.name} (Score: {res1.best_overall_recommendation.match_score}, Free: {res1.best_overall_recommendation.is_free})")
    verify_internal_consistency(res1)
    assert res1.extracted_requirements.requires_coding is True
    assert res1.best_overall_recommendation.is_free is True, "Paid models cannot be overall winner for free_only"
    print(">>> PASS: Beginner full-stack zero-budget task verified.")

    # ──────────────────────────────────────────────────────────────────────────
    # Test 2: Deep Reasoning (Mathematical / Formal Verification)
    # ──────────────────────────────────────────────────────────────────────────
    print("\n" + "-"*80)
    print("TEST 2: Deep Reasoning (Formal Logic & Mathematical Proof Verification)")
    print("-"*80)
    req2 = TaskAnalysisRequest(
        task_description="Solve this complex discrete mathematics combinatorial optimization problem with formal inductive proof and algorithmic time complexity verification.",
        user_skill_level="expert",
        budget_preference="any",
    )
    res2 = await AdvisorService.recommend_models(req2)
    print(f"Best Overall: {res2.best_overall_recommendation.name} (Category: {res2.best_overall_recommendation.tool_category})")
    verify_internal_consistency(res2)
    assert res2.extracted_requirements.requires_deep_reasoning is True
    assert res2.best_overall_recommendation.model_id in ("deepseek-r1", "o3-mini", "claude-3.5-sonnet", "gpt-4o")
    print(">>> PASS: Deep reasoning task verified.")

    # ──────────────────────────────────────────────────────────────────────────
    # Test 3: Live Research (2026 AI Regulation Comparison with Citations)
    # ──────────────────────────────────────────────────────────────────────────
    print("\n" + "-"*80)
    print("TEST 3: Live Research (2026 AI Regulatory Compliance with Citations)")
    print("-"*80)
    req3 = TaskAnalysisRequest(
        task_description="Synthesize the latest 2026 EU AI Act compliance deadlines for high-risk frontier models, comparing liability rules against US state-level privacy mandates with verified sources and citations.",
        user_skill_level="expert",
        budget_preference="any",
    )
    res3 = await AdvisorService.recommend_models(req3)
    print(f"Best Overall: {res3.best_overall_recommendation.name} (Tool Category: {res3.best_overall_recommendation.tool_category})")
    verify_internal_consistency(res3)
    assert res3.extracted_requirements.requires_live_web_search or res3.extracted_requirements.requires_deep_reasoning
    print(">>> PASS: Live research task verified.")

    # ──────────────────────────────────────────────────────────────────────────
    # Test 4: Long Document Analysis (300-Page Contract Audit)
    # ──────────────────────────────────────────────────────────────────────────
    print("\n" + "-"*80)
    print("TEST 4: Long Document Analysis (300-Page Contract Clause Audit)")
    print("-"*80)
    req4 = TaskAnalysisRequest(
        task_description="Analyze a 300-page enterprise software vendor agreement PDF, extract all uncapped liability clauses, and map indemnity obligations across all schedules.",
        user_skill_level="intermediate",
        budget_preference="any",
    )
    res4 = await AdvisorService.recommend_models(req4)
    print(f"Best Overall: {res4.best_overall_recommendation.name} (Context: {get_model_by_id(res4.best_overall_recommendation.model_id).context_window} tokens)")
    verify_internal_consistency(res4)
    assert res4.extracted_requirements.requires_long_context is True
    assert res4.best_overall_recommendation.model_id in ("gemini-1.5-pro", "gemini-2.0-flash", "claude-3.5-sonnet")
    print(">>> PASS: Long document analysis verified.")

    # ──────────────────────────────────────────────────────────────────────────
    # Test 5: Image Generation Request
    # ──────────────────────────────────────────────────────────────────────────
    print("\n" + "-"*80)
    print("TEST 5: Image Generation Request (Photorealistic Visual)")
    print("-"*80)
    req5 = TaskAnalysisRequest(
        task_description="Create a photorealistic cinematic 8k hero image of a futuristic neon cyber-city with rain reflections on asphalt.",
        user_skill_level="intermediate",
        budget_preference="any",
    )
    res5 = await AdvisorService.recommend_models(req5)
    print(f"Best Overall: {res5.best_overall_recommendation.name} (Tool Category: {res5.best_overall_recommendation.tool_category})")
    verify_internal_consistency(res5)
    assert res5.extracted_requirements.requires_image_generation is True
    assert res5.best_overall_recommendation.model_id in ("midjourney-v6", "flux-1-schnell")
    print(">>> PASS: Image generation task verified.")

    # ──────────────────────────────────────────────────────────────────────────
    # Test 6: IDE Workflow (Direct Codebase & Project File Edits)
    # ──────────────────────────────────────────────────────────────────────────
    print("\n" + "-"*80)
    print("TEST 6: IDE Workflow (Direct Multi-File Workspace Editing)")
    print("-"*80)
    req6 = TaskAnalysisRequest(
        task_description="I want an AI tool integrated directly into my VS Code editor that can index my repository, run terminal commands, and edit multiple files across my codebase automatically.",
        user_skill_level="expert",
        budget_preference="paid_acceptable",
    )
    res6 = await AdvisorService.recommend_models(req6)
    print(f"Best Overall: {res6.best_overall_recommendation.name} (Tool Category: {res6.best_overall_recommendation.tool_category})")
    verify_internal_consistency(res6)
    assert res6.best_overall_recommendation.model_id in ("cursor-composer", "claude-3.5-sonnet")
    print(">>> PASS: IDE workflow task verified.")

    # ──────────────────────────────────────────────────────────────────────────
    # Test 7: Free-Only Requirement ($0 Budget)
    # ──────────────────────────────────────────────────────────────────────────
    print("\n" + "-"*80)
    print("TEST 7: Explicit Free-Only Requirement ($0 Budget)")
    print("-"*80)
    req7 = TaskAnalysisRequest(
        task_description="Build a REST API in Python. I have zero budget and strictly need free tools.",
        budget_preference="free_only",
    )
    res7 = await AdvisorService.recommend_models(req7)
    print(f"Best Overall: {res7.best_overall_recommendation.name} (Is Free: {res7.best_overall_recommendation.is_free})")
    verify_internal_consistency(res7)
    assert res7.best_overall_recommendation.is_free is True
    print(">>> PASS: Free-only constraint verified.")

    # ──────────────────────────────────────────────────────────────────────────
    # Test 8: Any Budget Objective Comparison
    # ──────────────────────────────────────────────────────────────────────────
    print("\n" + "-"*80)
    print("TEST 8: Any Budget Objective Comparison (Distributed Kafka Ledgers)")
    print("-"*80)
    req8 = TaskAnalysisRequest(
        task_description="Design a fault-tolerant, event-driven payment processing backend with Apache Kafka, outbox pattern, and PostgreSQL partitioned ledgers.",
        user_skill_level="expert",
        budget_preference="any",
    )
    res8 = await AdvisorService.recommend_models(req8)
    print(f"Best Overall: {res8.best_overall_recommendation.name}")
    print(f"Trade-Off Analysis: {res8.trade_off_analysis}")
    verify_internal_consistency(res8)
    assert len(res8.recommended_free_options) > 0
    assert len(res8.recommended_paid_options) > 0
    print(">>> PASS: Any budget comparison verified.")

    # ──────────────────────────────────────────────────────────────────────────
    # Test 9: Ambiguous Request ("Help me with my project")
    # ──────────────────────────────────────────────────────────────────────────
    print("\n" + "-"*80)
    print("TEST 9: Ambiguous Request ('Help me with my project')")
    print("-"*80)
    req9 = TaskAnalysisRequest(
        task_description="Help me with my software project.",
        user_skill_level="intermediate",
    )
    res9 = await AdvisorService.recommend_models(req9)
    print(f"Extracted Category: {res9.extracted_requirements.task_category}")
    print(f"Confidence Score: {res9.confidence_score}%")
    verify_internal_consistency(res9)
    assert res9.confidence_score > 0
    print(">>> PASS: Ambiguous task handling verified.")

    # ──────────────────────────────────────────────────────────────────────────
    # Test 10: Prompt Generation for Selected Model
    # ──────────────────────────────────────────────────────────────────────────
    print("\n" + "-"*80)
    print("TEST 10: Prompt Generation (Claude 3.5 Sonnet)")
    print("-"*80)
    prompt_req = PromptGenerationRequest(
        task_description="Build a React + FastAPI + MySQL application with JWT authentication step by step.",
        selected_model_id="claude-3.5-sonnet",
        tone_preference="structured, beginner-friendly, with complete runnable code",
    )
    prompt_res = await AdvisorService.generate_optimized_prompt(prompt_req)
    print(f"Selected Model: {prompt_res.selected_model_name}")
    print(f"Explanation: {prompt_res.explanation}")
    print(f"Recommended Parameters: {prompt_res.recommended_parameters}")
    print(f"Prompt Preview (First 200 chars):\n{prompt_res.optimized_prompt[:200]}...")
    assert len(prompt_res.optimized_prompt) > 50
    assert "<think>" not in prompt_res.optimized_prompt
    assert "<think>" not in prompt_res.explanation
    print(">>> PASS: Optimized prompt generation verified.")

    # ──────────────────────────────────────────────────────────────────────────
    # Test 11: FastAPI Endpoints Verification
    # ──────────────────────────────────────────────────────────────────────────
    print("\n" + "-"*80)
    print("TEST 11: FastAPI Endpoints (/advisor/health, /advisor/models)")
    print("-"*80)
    health_resp = client.get("/advisor/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["status"] == "healthy"
    print("GET /advisor/health -> 200 OK")

    models_resp = client.get("/advisor/models?is_free=true")
    assert models_resp.status_code == 200
    free_items = models_resp.json()
    assert len(free_items) >= 4
    assert all(m["is_free"] is True for m in free_items)
    print(f"GET /advisor/models?is_free=true -> 200 OK ({len(free_items)} models)")

    print("\n" + "="*80)
    print("🎉 ALL 10 ADVISOR AGENT SCENARIO TESTS PASSED SUCCESSFULLY! [100% PASS]")
    print("="*80 + "\n")


if __name__ == "__main__":
    asyncio.run(run_all_tests())
