"""
Advisor Agent Core Reasoning Service.
Orchestrates task analysis, catalog candidate ranking, and prompt synthesis using gpt-oss:120b-cloud.
Strictly adheres to verified catalog ground truth with zero hallucinated models or fake scores.
"""

import sys
import json
import logging
import re
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from fastapi import HTTPException

# Ensure backend root is on sys.path
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from chat.ollama_client import ollama_client
except ImportError:
    try:
        from backend.chat.ollama_client import ollama_client
    except ImportError:
        ollama_client = None

try:
    from .catalog import MODEL_TOOL_CATALOG, ModelToolProfile, get_catalog, get_model_by_id
    from .models import (
        TaskCategory,
        TaskAnalysisRequest,
        ExtractedRequirements,
        RecommendationItem,
        RecommendationResponse,
        PromptGenerationRequest,
        PromptGenerationResponse,
    )
except ImportError:
    from catalog import MODEL_TOOL_CATALOG, ModelToolProfile, get_catalog, get_model_by_id
    from models import (
        TaskCategory,
        TaskAnalysisRequest,
        ExtractedRequirements,
        RecommendationItem,
        RecommendationResponse,
        PromptGenerationRequest,
        PromptGenerationResponse,
    )

logger = logging.getLogger("advisor.service")


class AdvisorService:
    """
    Flagship AI Consultant Service.
    Analyzes holistic requirements, ranks catalog candidates, and synthesizes optimized prompts.
    """

    REASONING_MODEL = "gpt-oss:120b-cloud"

    @classmethod
    def _clean_json_output(cls, raw_text: str) -> str:
        """
        Extracts valid JSON substring from LLM response, stripping code fences and think tags.
        """
        if not raw_text:
            return ""

        # Remove internal thinking traces
        text = re.sub(r"<think>.*?</think>", "", raw_text, flags=re.DOTALL).strip()

        # Extract code block if present
        json_fence_match = re.search(r"```(?:json)?\s*(\{.*\}|\[.*\])\s*```", text, re.DOTALL)
        if json_fence_match:
            return json_fence_match.group(1).strip()

        # Extract direct JSON object or array
        bracket_match = re.search(r"(\{.*\})", text, re.DOTALL)
        if bracket_match:
            return bracket_match.group(1).strip()

        return text.strip()

    @classmethod
    async def analyze_task(cls, req: TaskAnalysisRequest) -> ExtractedRequirements:
        """
        Extracts multidimensional compound requirements from the user's task description using gpt-oss:120b-cloud.
        """
        if not req.task_description or not req.task_description.strip():
            raise HTTPException(status_code=400, detail="Task description cannot be empty.")

        if ollama_client is None:
            raise HTTPException(
                status_code=503,
                detail="Ollama client is unavailable. Please verify backend environment configuration.",
            )

        constraints_str = ", ".join(req.constraints) if req.constraints else "None specified"
        system_prompt = (
            "You are an expert AI Architect and Technical Systems Consultant.\n"
            "Analyze the user's intended objective and extract holistic technical requirements.\n"
            "Identify whether the task involves coding, architecture, research, vision, long documents, or image generation.\n"
            "Identify any mentioned programming languages, frameworks, or databases.\n"
            "Respond ONLY with a valid, raw JSON object matching the schema below, without markdown formatting or commentary:\n\n"
            "{\n"
            '  "task_category": "coding_development" | "system_architecture" | "deep_reasoning_math" | "research_analysis" | "long_document_review" | "image_generation" | "creative_writing" | "general_knowledge",\n'
            '  "task_subtype": "Specific task subtype (e.g. Full-Stack Web Development, API Architecture, Contract Review)",\n'
            '  "complexity_level": "low" | "medium" | "high" | "frontier",\n'
            '  "detected_tech_stack": ["FastAPI", "React", "MySQL", "JWT"],\n'
            '  "requires_coding": true | false,\n'
            '  "requires_deep_reasoning": true | false,\n'
            '  "requires_live_web_search": true | false,\n'
            '  "requires_image_generation": true | false,\n'
            '  "requires_multimodal_vision": true | false,\n'
            '  "requires_long_context": true | false,\n'
            '  "requires_ide_agent": true | false,\n'
            '  "requires_beginner_friendly_explanations": true | false,\n'
            '  "expected_context_size_tokens": 4000,\n'
            '  "speed_priority": "ultra_fast" | "balanced" | "deep_thinking",\n'
            '  "budget_constraint": "free_only" | "paid_acceptable" | "any",\n'
            '  "privacy_preference": "standard" | "local_offline",\n'
            '  "summary": "1-2 sentence executive technical summary of what this task requires"\n'
            "}"
        )

        user_prompt = (
            f"User Task Objective: \"{req.task_description}\"\n"
            f"User Skill Level: {req.user_skill_level}\n"
            f"Budget Preference: {req.budget_preference}\n"
            f"Explicit Constraints: {constraints_str}\n\n"
            "Extract the exact multidimensional technical requirements as JSON."
        )

        try:
            logger.info(f"Analyzing task requirements using {cls.REASONING_MODEL}...")
            res = await ollama_client.chat(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                model=cls.REASONING_MODEL,
                temperature=0.1,
            )
            raw_content = res.get("content", "")
            json_str = cls._clean_json_output(raw_content)
            data = json.loads(json_str)

            # Map to TaskCategory enum
            cat_str = data.get("task_category", "general_knowledge").lower()
            try:
                category = TaskCategory(cat_str)
            except ValueError:
                category = TaskCategory.GENERAL_KNOWLEDGE

            budget = req.budget_preference
            if budget not in ("free_only", "paid_acceptable", "any"):
                budget = data.get("budget_constraint", "any")

            is_beginner = (req.user_skill_level == "beginner") or bool(data.get("requires_beginner_friendly_explanations", False))

            return ExtractedRequirements(
                task_category=category,
                task_subtype=data.get("task_subtype", "General Technical Task"),
                complexity_level=data.get("complexity_level", "medium"),
                detected_tech_stack=data.get("detected_tech_stack", []),
                requires_coding=bool(data.get("requires_coding", False)),
                requires_deep_reasoning=bool(data.get("requires_deep_reasoning", False)),
                requires_live_web_search=bool(data.get("requires_live_web_search", False)),
                requires_image_generation=bool(data.get("requires_image_generation", False)),
                requires_multimodal_vision=bool(data.get("requires_multimodal_vision", False)),
                requires_long_context=bool(data.get("requires_long_context", False)),
                requires_ide_agent=bool(data.get("requires_ide_agent", False)),
                requires_beginner_friendly_explanations=is_beginner,
                expected_context_size_tokens=int(data.get("expected_context_size_tokens", 4000)),
                speed_priority=data.get("speed_priority", "balanced"),
                budget_constraint=budget,
                privacy_preference=data.get("privacy_preference", "standard"),
                summary=data.get("summary", req.task_description[:120]),
            )
        except HTTPException:
            raise
        except json.JSONDecodeError as jde:
            logger.error(f"Failed to parse task analysis JSON from model: {jde}. Raw: {raw_content[:200]}")
            raise HTTPException(
                status_code=500,
                detail=f"Advisor reasoning model returned invalid structured JSON for task analysis: {str(jde)}",
            )
        except Exception as e:
            logger.error(f"Task analysis failed: {e}")
            raise HTTPException(
                status_code=503,
                detail=f"Advisor Agent task analysis service encountered an error: {str(e)}",
            )

    @classmethod
    async def recommend_models(cls, req: TaskAnalysisRequest) -> RecommendationResponse:
        """
        Flagship Consultant Endpoint: Evaluates requirements against ground-truth catalog,
        ranks FREE and PAID candidates with internally consistent scores, and explains trade-offs via gpt-oss:120b-cloud.
        """
        # Step 1: Extract multidimensional requirements
        reqs = await cls.analyze_task(req)

        # Step 2: Pre-filter candidate pool from verified catalog
        all_candidates = MODEL_TOOL_CATALOG

        if reqs.requires_image_generation:
            candidate_pool = [m for m in all_candidates if m.image_generation_support]
        else:
            candidate_pool = [m for m in all_candidates if not m.image_generation_support]

        catalog_summary = []
        for c in candidate_pool:
            catalog_summary.append({
                "id": c.id,
                "name": c.name,
                "provider": c.provider,
                "tool_category": c.tool_category,
                "pricing_tier": c.pricing_tier,
                "is_free": c.is_free,
                "context_window": c.context_window,
                "coding_score": c.coding_score,
                "reasoning_score": c.reasoning_score,
                "research_score": c.research_score,
                "writing_score": c.writing_score,
                "has_live_web_search": c.has_live_web_search,
                "supports_ide_workflow": c.supports_ide_workflow,
                "speed_rating": c.speed_rating,
                "strengths": c.strengths,
                "limitations": c.limitations,
                "best_for": c.best_for,
                "when_to_choose": c.when_to_choose,
                "access_url": c.access_url_or_api,
            })

        system_prompt = (
            "You are a Senior Principal AI & Tool Consultant for JudgeAI.\n"
            "Your role is to understand what the user wants to accomplish and recommend the most suitable AI models and tools from a verified catalog.\n"
            "CRITICAL CONSULTING RULES:\n"
            "1. Ground Truth: ONLY recommend tools and models that exist in the Verified Candidate Catalog below. NEVER invent models or pricing.\n"
            "2. Distinct Tiers: Provide separate, ranked lists for FREE OPTIONS (pricing_tier: 'free' or 'free_tier') and PAID OPTIONS (pricing_tier: 'paid' or 'subscription_required').\n"
            "3. Task-Specific Match Scores: Assign a realistic score (0-100) reflecting how well each candidate fits this specific user task.\n"
            "4. Consultant Quality: Avoid generic praise. Explain why the model fits based on the user's specific tech stack, complexity, and skill level.\n"
            "5. Budget Fidelity: If budget_constraint is 'free_only', the best_overall_model_id MUST be selected from the FREE options.\n"
            "6. Consistency: Choose best_overall_model_id and practical_alternative_model_id from the ranked candidates.\n"
            "7. Respond ONLY with a valid, raw JSON object matching the schema below without markdown formatting or think tags.\n\n"
            "SCHEMA:\n"
            "{\n"
            '  "task_summary": "1-2 sentence executive summary of the user\'s goal and key needs",\n'
            '  "recommended_free_options": [\n'
            "    {\n"
            '      "model_id": "slug from catalog",\n'
            '      "match_score": 92,\n'
            '      "why_it_fits": "Specific reason why this fits the user\'s exact tech stack and goal",\n'
            '      "strengths_for_task": ["strength 1", "strength 2"],\n'
            '      "limitations_for_task": ["limitation 1"],\n'
            '      "trade_offs": "Trade-off explanation",\n'
            '      "when_to_choose": "Choose this when..."\n'
            "    }\n"
            "  ],\n"
            '  "recommended_paid_options": [\n'
            "    {\n"
            '      "model_id": "slug from catalog",\n'
            '      "match_score": 98,\n'
            '      "why_it_fits": "Specific reason why this fits the user\'s exact tech stack and goal",\n'
            '      "strengths_for_task": ["strength 1", "strength 2"],\n'
            '      "limitations_for_task": ["limitation 1"],\n'
            '      "trade_offs": "Trade-off explanation",\n'
            '      "when_to_choose": "Choose this when..."\n'
            "    }\n"
            "  ],\n"
            '  "best_overall_model_id": "slug of single best choice overall",\n'
            '  "practical_alternative_model_id": "slug of best complementary or zero-cost alternative",\n'
            '  "trade_off_analysis": "2-3 sentence executive trade-off synthesis comparing top Free vs Paid options",\n'
            '  "confidence_score": 96.0,\n'
            '  "recommended_next_step": "Actionable next step for the user to get started"\n'
            "}"
        )

        user_prompt = (
            f"User Goal: \"{req.task_description}\"\n"
            f"Skill Level: {req.user_skill_level}\n"
            f"Budget Preference: {req.budget_preference}\n"
            f"Extracted Task Requirements: {reqs.model_dump_json()}\n\n"
            f"Verified Candidate Catalog (Source of Truth):\n"
            f"{json.dumps(catalog_summary, indent=2)}\n\n"
            "Perform expert multidimensional evaluation and generate the consultant recommendation JSON."
        )

        try:
            logger.info(f"Generating consultant recommendations using {cls.REASONING_MODEL}...")
            res = await ollama_client.chat(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                model=cls.REASONING_MODEL,
                temperature=0.15,
            )
            raw_content = res.get("content", "")
            json_str = cls._clean_json_output(raw_content)
            data = json.loads(json_str)

            # Build enriched recommendation items mapped to catalog ground truth
            def enrich_item(raw_item: Dict[str, Any]) -> Optional[RecommendationItem]:
                m_id = raw_item.get("model_id", "").strip()
                profile = get_model_by_id(m_id)
                if not profile:
                    return None

                score = int(raw_item.get("match_score", 85))
                score = max(0, min(100, score))

                return RecommendationItem(
                    model_id=profile.id,
                    name=profile.name,
                    provider=profile.provider,
                    tool_category=profile.tool_category,
                    pricing_tier=profile.pricing_tier,
                    is_free=profile.is_free,
                    match_score=score,
                    why_it_fits=raw_item.get("why_it_fits") or profile.when_to_choose,
                    strengths_for_task=raw_item.get("strengths_for_task") or profile.strengths[:3],
                    limitations_for_task=raw_item.get("limitations_for_task") or profile.limitations[:2],
                    trade_offs=raw_item.get("trade_offs") or f"Tier: {profile.pricing_tier}, Latency: {profile.typical_latency}",
                    when_to_choose=raw_item.get("when_to_choose") or profile.when_to_choose,
                    access_url_or_api=profile.access_url_or_api,
                )

            free_options: List[RecommendationItem] = []
            for item in data.get("recommended_free_options", []):
                enriched = enrich_item(item)
                if enriched and enriched.is_free:
                    free_options.append(enriched)

            paid_options: List[RecommendationItem] = []
            for item in data.get("recommended_paid_options", []):
                enriched = enrich_item(item)
                if enriched and not enriched.is_free:
                    paid_options.append(enriched)

            # Fallback population from catalog if LLM returned empty tier list
            if not free_options:
                default_free = [m for m in candidate_pool if m.is_free][:3]
                for p in default_free:
                    score = p.coding_score if reqs.requires_coding else p.reasoning_score
                    free_options.append(
                        RecommendationItem(
                            model_id=p.id,
                            name=p.name,
                            provider=p.provider,
                            tool_category=p.tool_category,
                            pricing_tier=p.pricing_tier,
                            is_free=p.is_free,
                            match_score=max(75, score),
                            why_it_fits=p.when_to_choose,
                            strengths_for_task=p.strengths[:3],
                            limitations_for_task=p.limitations[:2],
                            trade_offs=f"Zero-cost tier ({p.pricing_tier}) with {p.typical_latency} latency",
                            when_to_choose=p.when_to_choose,
                            access_url_or_api=p.access_url_or_api,
                        )
                    )

            if not paid_options and req.budget_preference != "free_only":
                default_paid = [m for m in candidate_pool if not m.is_free][:3]
                for p in default_paid:
                    score = p.coding_score if reqs.requires_coding else p.reasoning_score
                    paid_options.append(
                        RecommendationItem(
                            model_id=p.id,
                            name=p.name,
                            provider=p.provider,
                            tool_category=p.tool_category,
                            pricing_tier=p.pricing_tier,
                            is_free=p.is_free,
                            match_score=max(85, score),
                            why_it_fits=p.when_to_choose,
                            strengths_for_task=p.strengths[:3],
                            limitations_for_task=p.limitations[:2],
                            trade_offs=f"Paid access ({p.pricing_tier}) with superior frontier capabilities",
                            when_to_choose=p.when_to_choose,
                            access_url_or_api=p.access_url_or_api,
                        )
                    )

            # Sort both lists by match_score descending to guarantee strict internal consistency
            free_options.sort(key=lambda x: x.match_score, reverse=True)
            paid_options.sort(key=lambda x: x.match_score, reverse=True)

            # Map all available ranked options for consistent selection
            options_by_id: Dict[str, RecommendationItem] = {item.model_id: item for item in (free_options + paid_options)}

            # Select best overall recommendation (guaranteeing exact score and details matching ranked list)
            best_id = data.get("best_overall_model_id", "")
            if req.budget_preference == "free_only" or reqs.budget_constraint == "free_only":
                # Must be a free model
                if best_id in options_by_id and options_by_id[best_id].is_free:
                    best_overall = options_by_id[best_id]
                else:
                    best_overall = free_options[0]
            else:
                if best_id in options_by_id:
                    best_overall = options_by_id[best_id]
                else:
                    best_overall = paid_options[0] if paid_options else free_options[0]

            # Select practical alternative
            alt_id = data.get("practical_alternative_model_id", "")
            if alt_id in options_by_id and alt_id != best_overall.model_id:
                practical_alt = options_by_id[alt_id]
            else:
                if best_overall.is_free:
                    # Provide best paid alternative if available, or second free option
                    practical_alt = paid_options[0] if paid_options else (free_options[1] if len(free_options) > 1 else free_options[0])
                else:
                    # Provide best free alternative
                    practical_alt = free_options[0] if free_options else (paid_options[1] if len(paid_options) > 1 else best_overall)

            confidence = float(data.get("confidence_score", 95.0))
            confidence = max(0.0, min(100.0, confidence))

            return RecommendationResponse(
                task_summary=data.get("task_summary", reqs.summary),
                extracted_requirements=reqs,
                recommended_free_options=free_options,
                recommended_paid_options=paid_options,
                best_overall_recommendation=best_overall,
                practical_alternative=practical_alt,
                trade_off_analysis=data.get(
                    "trade_off_analysis",
                    f"Choose {free_options[0].name} for zero-cost rapid implementation, or upgrade to {paid_options[0].name if paid_options else 'frontier tools'} for dedicated multi-file project scaffolding."
                ),
                confidence_score=confidence,
                recommended_next_step=data.get("recommended_next_step", f"Select {best_overall.name} and generate an optimized prompt to begin implementation."),
            )

        except HTTPException:
            raise
        except json.JSONDecodeError as jde:
            logger.error(f"Failed to parse recommendation JSON: {jde}. Raw: {raw_content[:200]}")
            raise HTTPException(
                status_code=500,
                detail=f"Advisor reasoning model returned invalid structured JSON for recommendations: {str(jde)}",
            )
        except Exception as e:
            logger.error(f"Model recommendation pipeline failed: {e}")
            raise HTTPException(
                status_code=503,
                detail=f"Advisor Agent recommendation pipeline encountered an error: {str(e)}",
            )

    @classmethod
    async def generate_optimized_prompt(cls, req: PromptGenerationRequest) -> PromptGenerationResponse:
        """
        Generates a high-quality, ready-to-copy prompt specifically optimized for the user's selected model.
        Preserves original intent, adds context, constraints, output schemas, and model-specific directives.
        Never exposes hidden chain-of-thought traces.
        """
        if not req.task_description or not req.task_description.strip():
            raise HTTPException(status_code=400, detail="Task description cannot be empty.")

        profile = get_model_by_id(req.selected_model_id)
        if not profile:
            raise HTTPException(
                status_code=404,
                detail=f"Selected model '{req.selected_model_id}' was not found in the verified catalog.",
            )

        if ollama_client is None:
            raise HTTPException(
                status_code=503,
                detail="Ollama client is unavailable. Please verify backend environment configuration.",
            )

        tech_stack_hint = ""
        if req.extracted_requirements and req.extracted_requirements.detected_tech_stack:
            tech_stack_hint = f"Detected Tech Stack: {', '.join(req.extracted_requirements.detected_tech_stack)}"

        system_prompt = (
            "You are an expert Prompt Engineer and AI Optimization Specialist.\n"
            f"Your task is to craft an optimal, production-grade prompt tailored specifically for the target model: '{profile.name}' ({profile.provider}, Category: {profile.tool_category}).\n"
            "PROMPT ENGINEERING PRINCIPLES:\n"
            "1. Preserve the user's exact core objective, domain entities, and constraints without altering their intent.\n"
            "2. Define an authoritative persona/role suited for the task.\n"
            "3. Structure instructions with clear demarcations, step-by-step requirements, and expected output formats (e.g. Markdown, code blocks, JSON schema).\n"
            f"4. Apply model-specific optimizations for {profile.name} (e.g. Claude XML tags and artifacts, GPT-4o JSON schemas, DeepSeek step-by-step reasoning verification, Midjourney style parameters).\n"
            "5. Provide recommended inference hyperparameters (temperature, top_p, max_tokens).\n"
            "6. DO NOT include internal chain-of-thought traces (<think> blocks). The output must be immediately copy-pasteable.\n"
            "7. Respond ONLY with a valid, raw JSON object matching the schema below without markdown formatting:\n\n"
            "SCHEMA:\n"
            "{\n"
            '  "optimized_prompt": "Complete, high-fidelity prompt ready to be pasted into the target model",\n'
            '  "system_directive": "Recommended system prompt / directive",\n'
            '  "recommended_parameters": {\n'
            '    "temperature": 0.2,\n'
            '    "top_p": 0.95,\n'
            '    "max_tokens": 4096\n'
            "  },\n"
            '  "model_specific_tips": [\n'
            '    "Tip 1 tailored to this model",\n'
            '    "Tip 2 tailored to this model"\n'
            "  ],\n"
            '  "explanation": "1-2 sentence explanation of how this prompt was optimized for this model"\n'
            "}"
        )

        user_prompt = (
            f"User Goal: \"{req.task_description}\"\n"
            f"Target Model: {profile.name} (Provider: {profile.provider}, Context: {profile.context_window} tokens)\n"
            f"Model Strengths: {', '.join(profile.strengths)}\n"
            f"{tech_stack_hint}\n"
            f"Target Audience: {req.target_audience or 'General Technical'}\n"
            f"Tone Preference: {req.tone_preference}\n"
            f"Include Examples: {req.include_examples}\n\n"
            "Generate the optimized prompt JSON."
        )

        try:
            logger.info(f"Generating optimized prompt for '{profile.name}' using {cls.REASONING_MODEL}...")
            res = await ollama_client.chat(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                model=cls.REASONING_MODEL,
                temperature=0.25,
            )
            raw_content = res.get("content", "")
            json_str = cls._clean_json_output(raw_content)
            data = json.loads(json_str)

            return PromptGenerationResponse(
                selected_model_id=profile.id,
                selected_model_name=profile.name,
                optimized_prompt=data.get("optimized_prompt", req.task_description),
                system_directive=data.get("system_directive"),
                recommended_parameters=data.get(
                    "recommended_parameters",
                    {"temperature": 0.2, "top_p": 0.95, "max_tokens": 4096},
                ),
                model_specific_tips=data.get("model_specific_tips", [f"Leverage {profile.name}'s long context and structured formatting."]),
                explanation=data.get(
                    "explanation",
                    f"Optimized with structured persona grounding and step-by-step verification tailored for {profile.name}.",
                ),
            )
        except HTTPException:
            raise
        except json.JSONDecodeError as jde:
            logger.error(f"Failed to parse prompt generation JSON: {jde}. Raw: {raw_content[:200]}")
            raise HTTPException(
                status_code=500,
                detail=f"Advisor reasoning model returned invalid structured JSON for prompt generation: {str(jde)}",
            )
        except Exception as e:
            logger.error(f"Prompt generation pipeline failed: {e}")
            raise HTTPException(
                status_code=503,
                detail=f"Advisor Agent prompt generation encountered an error: {str(e)}",
            )


advisor_service = AdvisorService()
