"""
Pydantic Schemas for Advisor Agent Backend.
Defines strict data contracts for Task Analysis, Multidimensional Recommendations, and Prompt Generation.
"""

from enum import Enum
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


class TaskCategory(str, Enum):
    CODING_DEVELOPMENT = "coding_development"
    SYSTEM_ARCHITECTURE = "system_architecture"
    DEEP_REASONING_MATH = "deep_reasoning_math"
    RESEARCH_ANALYSIS = "research_analysis"
    LONG_DOCUMENT_REVIEW = "long_document_review"
    IMAGE_GENERATION = "image_generation"
    CREATIVE_WRITING = "creative_writing"
    GENERAL_KNOWLEDGE = "general_knowledge"


class TaskAnalysisRequest(BaseModel):
    task_description: str = Field(..., min_length=3, max_length=5000, description="User's goal, task, or question")
    user_skill_level: Optional[str] = Field(default="intermediate", description="beginner, intermediate, or expert")
    budget_preference: Optional[str] = Field(default="any", description="free_only, paid_acceptable, or any")
    constraints: Optional[List[str]] = Field(default=None, description="Explicit user constraints or preferences")


class ExtractedRequirements(BaseModel):
    task_category: TaskCategory = Field(..., description="Primary classified domain category")
    task_subtype: str = Field(..., description="Specific sub-domain or task type (e.g. Full-Stack Web Development)")
    complexity_level: Literal["low", "medium", "high", "frontier"] = Field(..., description="Estimated technical complexity")
    detected_tech_stack: List[str] = Field(default_factory=list, description="Identified languages, frameworks, DBs, and tools")
    requires_coding: bool = Field(default=False, description="Whether software programming/syntax is required")
    requires_deep_reasoning: bool = Field(default=False, description="Whether formal logic/math/multi-step reasoning is required")
    requires_live_web_search: bool = Field(default=False, description="Whether up-to-date web/citation research is required")
    requires_image_generation: bool = Field(default=False, description="Whether image asset synthesis is required")
    requires_multimodal_vision: bool = Field(default=False, description="Whether visual diagram/image comprehension is required")
    requires_long_context: bool = Field(default=False, description="Whether large input context (>50k tokens) is required")
    requires_ide_agent: bool = Field(default=False, description="Whether direct multi-file IDE editing is superior to chat")
    requires_beginner_friendly_explanations: bool = Field(default=False, description="Whether beginner-friendly step-by-step breakdown is required")
    expected_context_size_tokens: int = Field(default=4000, description="Estimated input/output token volume")
    speed_priority: Literal["ultra_fast", "balanced", "deep_thinking"] = Field(default="balanced", description="Inference latency vs depth preference")
    budget_constraint: Literal["free_only", "paid_acceptable", "any"] = Field(default="any", description="Extracted budget constraint")
    privacy_preference: Optional[str] = Field(default="standard", description="Local/offline vs cloud execution preference")
    summary: str = Field(..., description="Concise executive summary of task requirements")


class RecommendationItem(BaseModel):
    model_id: str = Field(..., description="Unique model slug in catalog")
    name: str = Field(..., description="Human-readable model name")
    provider: str = Field(..., description="Vendor/organization")
    tool_category: str = Field(default="foundation_llm", description="Architectural category (foundation_llm, ide_agent_tool, etc.)")
    pricing_tier: Literal["free", "free_tier", "paid", "subscription_required"] = Field(..., description="Verified pricing category")
    is_free: bool = Field(..., description="True if no monetary payment required")
    match_score: int = Field(..., ge=0, le=100, description="Evaluated fit score (0-100) reflecting task alignment")
    why_it_fits: str = Field(..., description="Concrete explanation of why this model fits the specific task")
    strengths_for_task: List[str] = Field(..., description="Key advantages for this specific use case")
    limitations_for_task: List[str] = Field(..., description="Potential drawbacks or constraints to keep in mind")
    trade_offs: str = Field(..., description="Cost vs speed vs depth trade-offs for this option")
    when_to_choose: str = Field(..., description="Clear situational trigger for choosing this option")
    access_url_or_api: str = Field(..., description="Link to provider, web interface, or API console")


class RecommendationResponse(BaseModel):
    task_summary: str = Field(..., description="Summary of the analyzed user task")
    extracted_requirements: ExtractedRequirements = Field(..., description="Extracted multidimensional requirements")
    recommended_free_options: List[RecommendationItem] = Field(..., description="Ranked list of best verified FREE and FREE_TIER models")
    recommended_paid_options: List[RecommendationItem] = Field(..., description="Ranked list of best verified PAID and SUBSCRIPTION models")
    best_overall_recommendation: RecommendationItem = Field(..., description="The single best recommended option overall (consistent score & details)")
    practical_alternative: RecommendationItem = Field(..., description="A practical, fast, or zero-cost alternative")
    trade_off_analysis: str = Field(..., description="Executive comparison of Free vs Paid and Speed vs Reasoning trade-offs")
    confidence_score: float = Field(..., ge=0.0, le=100.0, description="Advisor confidence in this recommendation")
    recommended_next_step: str = Field(..., description="Actionable next step for the user")


class PromptGenerationRequest(BaseModel):
    task_description: str = Field(..., min_length=3, description="Original user task or project objective")
    selected_model_id: str = Field(..., min_length=1, description="Selected model slug from the recommendation list")
    extracted_requirements: Optional[ExtractedRequirements] = Field(default=None, description="Optional pre-extracted requirements")
    target_audience: Optional[str] = Field(default=None, description="Target end-user or audience")
    tone_preference: Optional[str] = Field(default="precise, structured, and production-ready", description="Desired tone and output register")
    include_examples: Optional[bool] = Field(default=False, description="Whether to instruct model to provide few-shot examples")


class PromptGenerationResponse(BaseModel):
    selected_model_id: str = Field(..., description="Target model ID")
    selected_model_name: str = Field(..., description="Target model human-readable name")
    optimized_prompt: str = Field(..., description="Ready-to-copy tailored prompt incorporating all task constraints")
    system_directive: Optional[str] = Field(None, description="Optional recommended system prompt")
    recommended_parameters: Dict[str, Any] = Field(default_factory=dict, description="Recommended temperature, top_p, max_tokens")
    model_specific_tips: List[str] = Field(default_factory=list, description="Practical tips for maximizing results on this specific model")
    explanation: str = Field(..., description="Concise explanation of how this prompt was optimized")
