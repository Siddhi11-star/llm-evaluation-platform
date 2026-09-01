"""
Ground-Truth Catalog of Verified AI Models, Tools & Applications.
Single source of truth for the Advisor Agent.
Provides explicit distinction between free, free_tier, paid, and subscription_required tools.
"""

from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field


class ModelToolProfile(BaseModel):
    id: str = Field(..., description="Unique slug identifier")
    name: str = Field(..., description="Human-readable model or tool name")
    provider: str = Field(..., description="Organization or vendor (e.g., Anthropic, Google, OpenAI, DeepSeek, Meta)")
    tool_category: Literal[
        "foundation_llm",
        "reasoning_model",
        "coding_specialist",
        "ide_agent_tool",
        "image_synthesis_tool",
        "research_assistant",
    ] = Field(..., description="Primary architectural category of the model or tool")
    pricing_tier: Literal["free", "free_tier", "paid", "subscription_required"] = Field(
        ...,
        description="Explicit verified tier: 'free', 'free_tier', 'paid', or 'subscription_required'",
    )
    is_free: bool = Field(..., description="True if usable without mandatory monetary payment")
    context_window: int = Field(..., description="Maximum context window in tokens")
    strengths: List[str] = Field(..., description="Core architectural and practical strengths")
    limitations: List[str] = Field(..., description="Known operational or capability limitations")
    coding_score: int = Field(..., ge=0, le=100, description="Evaluated coding capability benchmark rating (0-100)")
    reasoning_score: int = Field(..., ge=0, le=100, description="Evaluated complex reasoning benchmark rating (0-100)")
    research_score: int = Field(..., ge=0, le=100, description="Evaluated research and citation capability (0-100)")
    writing_score: int = Field(..., ge=0, le=100, description="Evaluated prose, nuance, and structural clarity rating (0-100)")
    multimodal_support: bool = Field(default=False, description="Supports image/audio/document input understanding")
    image_generation_support: bool = Field(default=False, description="Generates image assets directly")
    has_live_web_search: bool = Field(default=False, description="Has native real-time web browsing and source grounding")
    supports_ide_workflow: bool = Field(default=False, description="Directly integrates as an IDE agent / multi-file editor")
    speed_rating: Literal["ultra_fast", "fast", "moderate", "deliberate"] = Field(
        ...,
        description="Relative inference latency tier",
    )
    typical_latency: str = Field(..., description="Human-readable latency estimate")
    best_for: List[str] = Field(..., description="Primary recommended use cases")
    when_to_choose: str = Field(..., description="Executive guidance on when this option is ideal")
    access_url_or_api: str = Field(..., description="Public endpoint, web console, or provider link")


MODEL_TOOL_CATALOG: List[ModelToolProfile] = [
    # ─── FREE & FREE-TIER OPTIONS ─────────────────────────────────────────────
    ModelToolProfile(
        id="gemini-2.0-flash",
        name="Gemini 2.0 Flash",
        provider="Google",
        tool_category="foundation_llm",
        pricing_tier="free_tier",
        is_free=True,
        context_window=1048576,
        strengths=[
            "Ultra-high generation speed (<1.0s latency)",
            "1,000,000+ token massive context window",
            "Full multimodal vision, audio, and video input processing",
            "Generous free tier on Google AI Studio (15 RPM / 1500 RPD)",
            "Strong general reasoning and Python code synthesis",
        ],
        limitations=[
            "Less nuanced multi-file project refactoring compared to frontier Claude 3.5 Sonnet",
            "Strict rate-limits on free tier during peak hours",
        ],
        coding_score=88,
        reasoning_score=87,
        research_score=89,
        writing_score=86,
        multimodal_support=True,
        image_generation_support=False,
        has_live_web_search=True,
        supports_ide_workflow=False,
        speed_rating="ultra_fast",
        typical_latency="~0.5s - 1.2s",
        best_for=[
            "Fast general assistance and live search",
            "Massive document and log analysis (>100 pages)",
            "Lightweight coding and script writing",
            "Multimodal visual problem solving",
            "Zero-budget high-speed workflows",
        ],
        when_to_choose="Choose Gemini 2.0 Flash when you need instant responses, long-document ingestion, or multimodal vision at zero cost.",
        access_url_or_api="https://aistudio.google.com",
    ),
    ModelToolProfile(
        id="deepseek-v3",
        name="DeepSeek V3",
        provider="DeepSeek",
        tool_category="foundation_llm",
        pricing_tier="free",
        is_free=True,
        context_window=65536,
        strengths=[
            "Leading open-weights architecture with 671B MoE parameters",
            "Outstanding coding synthesis and competitive STEM benchmarks",
            "Freely accessible via official web chat and open-source inference providers",
            "Strong multi-language comprehension and clean code formatting",
        ],
        limitations=[
            "Web interface may experience high traffic congestion during peak hours",
            "No native multimodal image input on standard text endpoints",
        ],
        coding_score=92,
        reasoning_score=91,
        research_score=86,
        writing_score=88,
        multimodal_support=False,
        image_generation_support=False,
        has_live_web_search=False,
        supports_ide_workflow=False,
        speed_rating="fast",
        typical_latency="~1.0s - 2.5s",
        best_for=[
            "General software engineering and full-stack backend development",
            "Technical architecture and database query design (MySQL, PostgreSQL)",
            "Free high-performance coding without subscription",
        ],
        when_to_choose="Choose DeepSeek V3 when you need top-tier coding and mathematical reasoning on a $0 budget.",
        access_url_or_api="https://chat.deepseek.com",
    ),
    ModelToolProfile(
        id="deepseek-r1",
        name="DeepSeek R1",
        provider="DeepSeek",
        tool_category="reasoning_model",
        pricing_tier="free",
        is_free=True,
        context_window=65536,
        strengths=[
            "Frontier open reasoning model utilizing native Reinforcement Learning",
            "Transparent step-by-step thinking traces and mathematical proof verification",
            "Top-tier algorithmic competitive programming scores",
            "Completely free to use on web console and via open-weight providers",
        ],
        limitations=[
            "Longer thinking latency before output streaming begins",
            "Verbose chain-of-thought not suited for rapid conversational queries",
            "No native image generation or image understanding",
        ],
        coding_score=95,
        reasoning_score=96,
        research_score=88,
        writing_score=84,
        multimodal_support=False,
        image_generation_support=False,
        has_live_web_search=False,
        supports_ide_workflow=False,
        speed_rating="deliberate",
        typical_latency="~3.0s - 8.0s (deliberate thinking)",
        best_for=[
            "Complex mathematical reasoning and logic puzzles",
            "Difficult bug root-cause analysis and algorithmic optimization",
            "Formal verification and multi-step theorem proving",
        ],
        when_to_choose="Choose DeepSeek R1 when your problem requires deep mathematical reasoning, algorithmic verification, or complex bug isolation where accuracy outweighs latency.",
        access_url_or_api="https://chat.deepseek.com",
    ),
    ModelToolProfile(
        id="qwen-2.5-coder-32b",
        name="Qwen 2.5 Coder 32B",
        provider="Alibaba / Open Weights",
        tool_category="coding_specialist",
        pricing_tier="free",
        is_free=True,
        context_window=131072,
        strengths=[
            "Specialized code-generation model trained on 5.5 trillion tokens of source code",
            "Exceptional repository-level comprehension, code completion, and refactoring",
            "128k long context support for reading entire source files and libraries",
            "Can be run completely offline/locally via Ollama or free HuggingFace spaces",
            "Patient, clear step-by-step code tutorials for beginners",
        ],
        limitations=[
            "Specialized primarily for code; weaker at creative writing or general humanities",
            "Requires modern GPU (16GB+ VRAM) for self-hosted local deployment",
        ],
        coding_score=94,
        reasoning_score=89,
        research_score=82,
        writing_score=78,
        multimodal_support=False,
        image_generation_support=False,
        has_live_web_search=False,
        supports_ide_workflow=False,
        speed_rating="fast",
        typical_latency="~1.2s - 2.8s",
        best_for=[
            "Zero-budget beginner coding tutorials and full-stack implementation",
            "Local offline coding and enterprise codebases with strict privacy requirements",
            "Multi-language software debugging (Python, TypeScript, React, Go, SQL)",
        ],
        when_to_choose="Choose Qwen 2.5 Coder 32B if you require a dedicated, privacy-friendly, zero-cost coding tutor and implementation specialist.",
        access_url_or_api="https://ollama.com/library/qwen2.5-coder",
    ),
    ModelToolProfile(
        id="meta-llama-3.3-70b",
        name="Llama 3.3 70B",
        provider="Meta / Open Weights",
        tool_category="foundation_llm",
        pricing_tier="free",
        is_free=True,
        context_window=128000,
        strengths=[
            "Flagship 70B open weights model matching previous-generation 405B capabilities",
            "Exceptional instruction following, roleplay, and balanced general intelligence",
            "Freely available across Groq (ultra-fast), Cloudflare, and Together free tiers",
            "Strong multi-turn conversational dialogue and patient explanations",
        ],
        limitations=[
            "Slightly lower frontier coding benchmark scores than Claude 3.5 Sonnet",
            "No native multimodal image processing in standard weights",
        ],
        coding_score=87,
        reasoning_score=88,
        research_score=87,
        writing_score=92,
        multimodal_support=False,
        image_generation_support=False,
        has_live_web_search=False,
        supports_ide_workflow=False,
        speed_rating="ultra_fast",
        typical_latency="~0.6s - 1.5s (via Groq/Cloud providers)",
        best_for=[
            "Beginner guidance, conversational explanations, and educational tutoring",
            "General knowledge and writing assistance",
            "High-throughput automated workflows",
        ],
        when_to_choose="Choose Llama 3.3 70B for fast, well-rounded conversational assistance, tutoring, and technical writing without subscription costs.",
        access_url_or_api="https://llama.meta.com",
    ),
    ModelToolProfile(
        id="glm-5.2-cloud",
        name="GLM 5.2 (Ollama Cloud)",
        provider="Zhipu AI / Ollama Cloud",
        tool_category="foundation_llm",
        pricing_tier="free_tier",
        is_free=True,
        context_window=131072,
        strengths=[
            "Frontier reasoning model with 128k context support",
            "Integrated native Ollama Cloud access in the current platform",
            "Excellent structured tool calling and JSON schema generation",
            "Balanced latency and deep logical analysis",
        ],
        limitations=[
            "Cloud endpoint availability depends on server cluster connectivity",
        ],
        coding_score=89,
        reasoning_score=90,
        research_score=86,
        writing_score=88,
        multimodal_support=False,
        image_generation_support=False,
        has_live_web_search=False,
        supports_ide_workflow=False,
        speed_rating="fast",
        typical_latency="~1.5s - 3.0s",
        best_for=[
            "Structured API payload generation",
            "In-depth technical explanations and logic synthesis",
            "Platform-native free cloud evaluation",
        ],
        when_to_choose="Choose GLM 5.2 when working within the platform's cloud ecosystem for structured, reliable technical tasks.",
        access_url_or_api="https://ollama.com",
    ),

    # ─── PAID & FRONTIER OPTIONS ──────────────────────────────────────────────
    ModelToolProfile(
        id="claude-3.5-sonnet",
        name="Claude 3.5 Sonnet",
        provider="Anthropic",
        tool_category="coding_specialist",
        pricing_tier="paid",
        is_free=False,
        context_window=200000,
        strengths=[
            "Industry benchmark leader in software engineering, refactoring, and code architecture",
            "Outstanding nuanced reasoning, human-like instruction adherence, and patient technical explanations",
            "Artifacts system and multi-file project coherence",
            "Strong vision understanding for UI mockups, architecture diagrams, and OCR",
        ],
        limitations=[
            "Paid API ($3.00/M input, $15.00/M output) or $20/month Claude Pro subscription",
            "Strict 200k context limit (smaller than Gemini's 2M)",
        ],
        coding_score=98,
        reasoning_score=97,
        research_score=93,
        writing_score=98,
        multimodal_support=True,
        image_generation_support=False,
        has_live_web_search=False,
        supports_ide_workflow=False,
        speed_rating="fast",
        typical_latency="~1.0s - 2.5s",
        best_for=[
            "Full-stack production development and complex architecture",
            "Step-by-step beginner mentoring with clear structural reasoning",
            "Nuanced technical writing, legal analysis, and code reviews",
            "UI/UX mockup to frontend code conversion",
        ],
        when_to_choose="Choose Claude 3.5 Sonnet whenever code quality, architectural correctness, and nuanced technical explanations are your highest priorities.",
        access_url_or_api="https://anthropic.com/claude",
    ),
    ModelToolProfile(
        id="gpt-4o",
        name="GPT-4o",
        provider="OpenAI",
        tool_category="foundation_llm",
        pricing_tier="paid",
        is_free=False,
        context_window=128000,
        strengths=[
            "Omni multimodal flagship with native vision, audio, and text comprehension",
            "Broad general knowledge, STEM problem solving, and API ecosystem integration",
            "High token generation speed and strict JSON schema output formatting",
            "Direct web browsing and live search integration in ChatGPT Plus",
        ],
        limitations=[
            "Paid API ($2.50/M input, $10.00/M output) or $20/month ChatGPT Plus subscription",
            "Can occasionally be more concise than requested unless prompted with detailed guidelines",
        ],
        coding_score=94,
        reasoning_score=95,
        research_score=94,
        writing_score=94,
        multimodal_support=True,
        image_generation_support=False,
        has_live_web_search=True,
        supports_ide_workflow=False,
        speed_rating="fast",
        typical_latency="~0.8s - 2.0s",
        best_for=[
            "Multimodal visual analysis and diagram interpretation",
            "General technical problem solving with live web search",
            "Structured JSON data pipelines and tool integrations",
        ],
        when_to_choose="Choose GPT-4o for versatile general problem solving, vision-heavy tasks, or workflows requiring live web browsing.",
        access_url_or_api="https://openai.com/gpt-4o",
    ),
    ModelToolProfile(
        id="o3-mini",
        name="OpenAI o3-mini",
        provider="OpenAI",
        tool_category="reasoning_model",
        pricing_tier="paid",
        is_free=False,
        context_window=200000,
        strengths=[
            "Frontier STEM reasoning and competitive coding model from OpenAI",
            "Configurable reasoning effort (low, medium, high)",
            "Exceptional performance on complex math, competitive programming, and science",
            "Cost-effective frontier reasoning compared to o1 ($1.10/M input, $4.40/M output)",
        ],
        limitations=[
            "Text-only (no vision input or image generation)",
            "Thinking time adds slight latency before generation",
        ],
        coding_score=97,
        reasoning_score=98,
        research_score=90,
        writing_score=85,
        multimodal_support=False,
        image_generation_support=False,
        has_live_web_search=False,
        supports_ide_workflow=False,
        speed_rating="moderate",
        typical_latency="~2.0s - 5.0s (depending on reasoning effort)",
        best_for=[
            "Hard algorithmic programming and competitive coding",
            "Mathematical theorem proving and physics simulations",
            "Complex multi-constraint logic puzzles",
        ],
        when_to_choose="Choose o3-mini when dealing with difficult math, competitive programming, or complex logical puzzles where reasoning depth is critical.",
        access_url_or_api="https://openai.com",
    ),
    ModelToolProfile(
        id="gemini-1.5-pro",
        name="Gemini 1.5 Pro",
        provider="Google",
        tool_category="foundation_llm",
        pricing_tier="paid",
        is_free=False,
        context_window=2097152,
        strengths=[
            "Massive 2,000,000 token context window (can ingest hundreds of files, books, or 1hr video)",
            "Near-perfect 'Needle In A Haystack' factual retrieval across massive documents",
            "Multimodal input across audio, high-resolution video, PDF libraries, and codebases",
            "Deep contextual grounding and cross-document synthesis",
        ],
        limitations=[
            "Higher per-token pricing for large prompt batches ($1.25 - $2.50/M input, $5.00 - $10.00/M output)",
            "Slower generation latency on very large context inputs",
        ],
        coding_score=92,
        reasoning_score=93,
        research_score=97,
        writing_score=92,
        multimodal_support=True,
        image_generation_support=False,
        has_live_web_search=True,
        supports_ide_workflow=False,
        speed_rating="moderate",
        typical_latency="~2.0s - 5.0s",
        best_for=[
            "Massive repository audits and multi-file legacy code migration",
            "Lengthy legal contracts, financial filings, and medical research corpora",
            "Long video and audio transcript analysis",
        ],
        when_to_choose="Choose Gemini 1.5 Pro when your task involves analyzing massive documents (over 100 pages), large codebases, or long videos.",
        access_url_or_api="https://aistudio.google.com",
    ),
    ModelToolProfile(
        id="cursor-composer",
        name="Cursor Composer",
        provider="Cursor / Anysphere",
        tool_category="ide_agent_tool",
        pricing_tier="subscription_required",
        is_free=False,
        context_window=200000,
        strengths=[
            "Dedicated AI code editor natively integrated into VS Code fork",
            "Multi-file automatic file edits, terminal command execution, and codebase indexing",
            "Seamless context retrieval using `@Codebase`, `@Files`, and `@Docs`",
            "Powered by Claude 3.5 Sonnet and GPT-4o under the hood",
        ],
        limitations=[
            "Requires $20/month Cursor Pro subscription",
            "Requires installing the dedicated desktop application",
            "Not a general chat or image assistant",
        ],
        coding_score=99,
        reasoning_score=96,
        research_score=85,
        writing_score=80,
        multimodal_support=True,
        image_generation_support=False,
        has_live_web_search=True,
        supports_ide_workflow=True,
        speed_rating="fast",
        typical_latency="~1.0s - 3.0s",
        best_for=[
            "Full project creation, scaffolding, and multi-file refactoring",
            "Rapid interactive feature development and bug fixing in IDE",
            "Step-by-step project construction with direct workspace file edits",
        ],
        when_to_choose="Choose Cursor Composer if you are building an actual multi-file software application from scratch and want the AI to write and edit project files directly in your IDE.",
        access_url_or_api="https://cursor.com",
    ),
    ModelToolProfile(
        id="perplexity-sonar",
        name="Perplexity Sonar",
        provider="Perplexity AI",
        tool_category="research_assistant",
        pricing_tier="paid",
        is_free=False,
        context_window=128000,
        strengths=[
            "Real-time live web search indexing with verified inline URL citations",
            "Synthesis of up-to-the-minute regulatory policies, news, and scientific publications",
            "High factual accuracy with automated hallucination filtering against search results",
        ],
        limitations=[
            "Paid API access ($1.00/M tokens + $5/1000 searches) or $20/month Perplexity Pro subscription",
            "Not designed for multi-file IDE code writing",
        ],
        coding_score=84,
        reasoning_score=91,
        research_score=99,
        writing_score=92,
        multimodal_support=True,
        image_generation_support=False,
        has_live_web_search=True,
        supports_ide_workflow=False,
        speed_rating="fast",
        typical_latency="~1.2s - 2.5s",
        best_for=[
            "Up-to-date legal, financial, and regulatory compliance research",
            "Fact-checked research reports with real-world source citations",
            "Competitive intelligence and market analysis",
        ],
        when_to_choose="Choose Perplexity Sonar when your primary need is real-time research, up-to-date facts, and verified citations.",
        access_url_or_api="https://perplexity.ai",
    ),
    ModelToolProfile(
        id="midjourney-v6",
        name="Midjourney v6",
        provider="Midjourney",
        tool_category="image_synthesis_tool",
        pricing_tier="subscription_required",
        is_free=False,
        context_window=1000,
        strengths=[
            "State-of-the-art photorealistic image generation and artistic stylization",
            "Exceptional lighting, texture, skin tones, and cinematic compositions",
            "Fine-grained aspect ratio, camera angle, and style parameter controls (`--ar`, `--stylize`)",
            "High-resolution image upscaling and inpainting variations",
        ],
        limitations=[
            "Requires active monthly subscription ($10-$30/month) via Discord / Web",
            "No coding, text reasoning, or document analysis capabilities",
        ],
        coding_score=0,
        reasoning_score=0,
        research_score=0,
        writing_score=0,
        multimodal_support=True,
        image_generation_support=True,
        has_live_web_search=False,
        supports_ide_workflow=False,
        speed_rating="moderate",
        typical_latency="~15s - 45s (image rendering)",
        best_for=[
            "Photorealistic marketing imagery, website hero visuals, and concept art",
            "Product design mockups and graphic asset creation",
        ],
        when_to_choose="Choose Midjourney v6 when your goal is creating high-fidelity visual artwork, product mockups, or photorealistic illustrations.",
        access_url_or_api="https://midjourney.com",
    ),
    ModelToolProfile(
        id="flux-1-schnell",
        name="FLUX.1 [schnell]",
        provider="Black Forest Labs",
        tool_category="image_synthesis_tool",
        pricing_tier="free",
        is_free=True,
        context_window=1000,
        strengths=[
            "Leading open-weights text-to-image synthesis model with 12B parameters",
            "Exceptional prompt adherence and accurate text rendering inside generated images",
            "Fast 4-step distilled inference freely accessible on HuggingFace and local GPUs",
            "High aesthetic quality without mandatory paid subscriptions",
        ],
        limitations=[
            "Local execution requires powerful GPU (12GB+ VRAM)",
            "Specialized strictly for image generation; no text reasoning or coding",
        ],
        coding_score=0,
        reasoning_score=0,
        research_score=0,
        writing_score=0,
        multimodal_support=True,
        image_generation_support=True,
        has_live_web_search=False,
        supports_ide_workflow=False,
        speed_rating="fast",
        typical_latency="~2.0s - 6.0s",
        best_for=[
            "Free high-quality image generation with text rendering",
            "Open-source local image generation pipelines",
        ],
        when_to_choose="Choose FLUX.1 [schnell] for zero-cost, high-quality image generation with accurate typography.",
        access_url_or_api="https://huggingface.co/black-forest-labs/FLUX.1-schnell",
    ),
]


def get_catalog(
    tier: Optional[str] = None,
    is_free: Optional[bool] = None,
    tool_category: Optional[str] = None,
    supports_vision: Optional[bool] = None,
    supports_images: Optional[bool] = None,
    has_live_search: Optional[bool] = None,
) -> List[ModelToolProfile]:
    """
    Returns filtered ground-truth catalog profiles.
    """
    results = MODEL_TOOL_CATALOG
    if tier:
        results = [m for m in results if m.pricing_tier == tier]
    if is_free is not None:
        results = [m for m in results if m.is_free == is_free]
    if tool_category:
        results = [m for m in results if m.tool_category == tool_category]
    if supports_vision is not None:
        results = [m for m in results if m.multimodal_support == supports_vision]
    if supports_images is not None:
        results = [m for m in results if m.image_generation_support == supports_images]
    if has_live_search is not None:
        results = [m for m in results if m.has_live_web_search == has_live_search]
    return results


def get_model_by_id(model_id: str) -> Optional[ModelToolProfile]:
    """
    Look up a single model/tool profile from the verified catalog.
    """
    target = model_id.strip().lower()
    for m in MODEL_TOOL_CATALOG:
        if m.id.lower() == target or m.name.lower() == target:
            return m
    return None
