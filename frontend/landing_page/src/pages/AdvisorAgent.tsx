import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { TopBar, PageContent } from '../components/AppShell'
import {
  IcAdvisor,
  IcSparkles,
  IcArrowRight,
  IcCheck,
  IcCompare,
  IcRotate,
  IcCopy,
  IcExternalLink,
} from '../components/icons'

// ─── API Base URL ─────────────────────────────────────────────────────────────

const ADVISOR_API_BASE = import.meta.env.VITE_ADVISOR_API_URL || 'http://127.0.0.1:8003'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PricingTier = 'free' | 'free_tier' | 'paid' | 'subscription_required'

export type ExtractedRequirements = {
  task_category: string
  task_subtype: string
  complexity_level: 'low' | 'medium' | 'high' | 'frontier'
  detected_tech_stack: string[]
  requires_coding: boolean
  requires_deep_reasoning: boolean
  requires_live_web_search: boolean
  requires_image_generation: boolean
  requires_multimodal_vision: boolean
  requires_long_context: boolean
  requires_ide_agent: boolean
  requires_beginner_friendly_explanations: boolean
  expected_context_size_tokens: number
  speed_priority: 'ultra_fast' | 'balanced' | 'deep_thinking'
  budget_constraint: 'free_only' | 'paid_acceptable' | 'any'
  privacy_preference?: string
  summary: string
}

export type RecommendationItem = {
  model_id: string
  name: string
  provider: string
  tool_category: string
  pricing_tier: PricingTier
  is_free: boolean
  match_score: number
  why_it_fits: string
  strengths_for_task: string[]
  limitations_for_task: string[]
  trade_offs: string
  when_to_choose: string
  access_url_or_api: string
}

export type RecommendationResponse = {
  task_summary: string
  extracted_requirements: ExtractedRequirements
  recommended_free_options: RecommendationItem[]
  recommended_paid_options: RecommendationItem[]
  best_overall_recommendation: RecommendationItem
  practical_alternative: RecommendationItem
  trade_off_analysis: string
  confidence_score: number
  recommended_next_step: string
}

export type PromptGenerationResponse = {
  selected_model_id: string
  selected_model_name: string
  optimized_prompt: string
  system_directive?: string | null
  recommended_parameters: Record<string, any>
  model_specific_tips: string[]
  explanation: string
}

type RecentItem = {
  id: string
  task: string
  model: string
  score: number
  category: string
  ts: string
  color: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getModelColor(provider?: string, modelId?: string): string {
  const p = (provider || '').toLowerCase()
  const m = (modelId || '').toLowerCase()
  if (p.includes('anthropic') || m.includes('claude')) return '#7C3AED'
  if (p.includes('openai') || m.includes('gpt') || m.includes('o3') || m.includes('o1')) return '#10A37F'
  if (p.includes('google') || m.includes('gemini')) return '#38BDF8'
  if (p.includes('deepseek')) return '#F59E0B'
  if (p.includes('meta') || m.includes('llama')) return '#EC4899'
  if (p.includes('cursor')) return '#6366F1'
  if (p.includes('midjourney') || m.includes('flux')) return '#8B5CF6'
  if (p.includes('perplexity') || m.includes('sonar')) return '#06B6D4'
  if (p.includes('alibaba') || m.includes('qwen')) return '#F97316'
  return '#38BDF8'
}

function getTierBadge(tier: PricingTier) {
  switch (tier) {
    case 'free':
      return { label: '100% Free', color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' }
    case 'free_tier':
      return { label: 'Free Tier Available', color: '#38BDF8', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.3)' }
    case 'paid':
      return { label: 'Pay-Per-Token API', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' }
    case 'subscription_required':
      return { label: 'Subscription Required', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' }
    default:
      return { label: 'Verified Tool', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)' }
  }
}

// ─── Suggested Tasks ──────────────────────────────────────────────────────────

const SUGGESTED_TASKS = [
  {
    id: 'fullstack',
    label: 'Full-Stack Web App',
    placeholder: 'I am a beginner and want to build a React + FastAPI + MySQL application with authentication. I have zero budget and need help with coding, debugging, and step-by-step architecture.',
    color: '#38BDF8',
  },
  {
    id: 'architecture',
    label: 'Distributed Architecture',
    placeholder: 'Design a fault-tolerant, event-driven payment processing backend with Apache Kafka, outbox pattern, and PostgreSQL partitioned ledgers.',
    color: '#7C3AED',
  },
  {
    id: 'research',
    label: 'Live Web Research',
    placeholder: 'Synthesize the latest 2026 AI regulation compliance deadlines for high-risk frontier models, comparing liability rules against US state-level privacy mandates with verified citations.',
    color: '#06B6D4',
  },
  {
    id: 'document',
    label: 'Long Document Audit',
    placeholder: 'Analyze a 150-page enterprise software vendor agreement PDF, extract all uncapped liability clauses, and map indemnity obligations across all schedules.',
    color: '#FBBF24',
  },
] as const

const RECENT_INITIAL: RecentItem[] = [
  { id: 'r1', task: 'React + FastAPI + MySQL AI full-stack application', model: 'DeepSeek V3', score: 94, category: 'Coding', ts: '10 min ago', color: '#F59E0B' },
  { id: 'r2', task: 'Distributed Kafka ledgers with outbox pattern', model: 'Claude 3.5 Sonnet', score: 96, category: 'Architecture', ts: '1 hr ago', color: '#7C3AED' },
  { id: 'r3', task: '150-page enterprise vendor contract review', model: 'Gemini 1.5 Pro', score: 95, category: 'Long Document', ts: 'Yesterday', color: '#38BDF8' },
  { id: 'r4', task: '2026 AI regulatory compliance with citations', model: 'Perplexity Sonar', score: 96, category: 'Research', ts: '2 days ago', color: '#06B6D4' },
]

// ─── UI Components ────────────────────────────────────────────────────────────

function ScoreRing({ score, color, size = 88 }: { score: number; color: string; size?: number }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border)" strokeWidth={6} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.26, fontWeight: 800, color: 'var(--color-foreground)', lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: size * 0.11, color: 'var(--color-muted)', fontWeight: 600, letterSpacing: '0.06em' }}>MATCH</span>
      </div>
    </div>
  )
}

function MetricPill({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div
      style={{
        background: 'var(--color-surface, rgba(255,255,255,0.03))',
        borderRadius: 12,
        padding: '12px 16px',
        border: '1px solid var(--color-border)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ fontSize: 10.5, color: 'var(--color-muted)', marginBottom: 4, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: accent ?? 'var(--color-foreground)' }}>{value}</div>
    </div>
  )
}

function TagList({ items, variant }: { items: string[]; variant: 'strength' | 'weakness' }) {
  const color = variant === 'strength' ? '#34D399' : '#F87171'
  const bg = variant === 'strength' ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)'
  const border = variant === 'strength' ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, idx) => (
        <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--color-foreground)', lineHeight: 1.5, opacity: 0.95 }}>
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: bg,
              border: `1px solid ${border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color,
              flexShrink: 0,
              marginTop: 1,
              fontSize: 10,
              fontWeight: 800,
            }}
          >
            {variant === 'strength' ? '✓' : '−'}
          </span>
          {item}
        </li>
      ))}
    </ul>
  )
}

function LoadingState({ message }: { message: string }) {
  return (
    <div
      className="card-base"
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        background: 'var(--color-card, #13111C)',
        border: '1px solid var(--color-border)',
        borderRadius: 16,
        boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
      }}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #7C3AED, #38BDF8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(124,58,237,0.35)',
          }}
        >
          <IcAdvisor size={22} color="#fff" />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#7C3AED',
                animation: `advisorPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--color-muted)', fontWeight: 500 }}>{message}</p>
    </div>
  )
}

// ─── Minimal Splash Screen ────────────────────────────────────────────────────

function AdvisorSplashScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--color-background)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        overflow: 'hidden',
      }}
    >
      {/* Background Radial Glow */}
      <div
        style={{
          position: 'absolute',
          top: '48%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          height: 600,
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.18) 0%, rgba(56, 189, 248, 0.08) 45%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Central Card */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          animation: 'advisorSplashFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Prominent Hero Illustration */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <img
            src="/advisor-illustration.png"
            alt="JudgeAI Advisor Agent"
            style={{
              width: 320,
              maxWidth: '85vw',
              height: 'auto',
              filter: 'drop-shadow(0 20px 45px rgba(124, 58, 237, 0.35))',
              userSelect: 'none',
              pointerEvents: 'none',
              animation: 'advisorFloat 3s ease-in-out infinite',
            }}
          />
        </div>

        {/* Title & Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 999,
            background: 'rgba(124,58,237,0.12)',
            border: '1px solid rgba(124,58,237,0.25)',
            color: '#7C3AED',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          <IcSparkles size={12} /> Strategic Model Routing
        </div>

        <h1
          style={{
            margin: '0 0 8px',
            fontSize: 'clamp(28px, 4.5vw, 38px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--color-foreground)',
            lineHeight: 1.15,
          }}
        >
          Advisor Agent
        </h1>

        <p
          style={{
            margin: '0 0 28px',
            fontSize: 'clamp(13px, 2vw, 15px)',
            color: 'var(--color-muted)',
            maxWidth: 440,
            lineHeight: 1.5,
            fontWeight: 500,
          }}
        >
          Understanding your objective and mapping optimal AI catalog paths…
        </p>

        {/* Polished Loading Bar */}
        <div
          style={{
            width: 220,
            height: 5,
            background: 'var(--color-border-light, rgba(0,0,0,0.08))',
            borderRadius: 999,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, #7C3AED, #38BDF8, #A78BFA)',
              borderRadius: 999,
              animation: 'advisorProgress 3s linear forwards',
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function AdvisorAgentPage() {
  // Splash state — visible for ~3 seconds on first mount
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  // Input & Filter State
  const [task, setTask] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'expert'>('intermediate')
  const [budgetPref, setBudgetPref] = useState<'any' | 'free_only' | 'paid_acceptable'>('any')

  // API State
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [result, setResult] = useState<RecommendationResponse | null>(null)
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)

  // Prompt generation state
  const [promptLoading, setPromptLoading] = useState(false)
  const [promptResult, setPromptResult] = useState<PromptGenerationResponse | null>(null)
  const [copied, setCopied] = useState(false)

  // Recent history
  const [recent, setRecent] = useState<RecentItem[]>(RECENT_INITIAL)

  const handleQuickOption = (opt: typeof SUGGESTED_TASKS[number]) => {
    setActiveCategory(opt.id)
    setTask(opt.placeholder)
    setResult(null)
    setPromptResult(null)
    setErrorMsg(null)
    if (opt.id === 'fullstack') {
      setSkillLevel('beginner')
      setBudgetPref('free_only')
    } else if (opt.id === 'architecture') {
      setSkillLevel('expert')
      setBudgetPref('paid_acceptable')
    } else {
      setSkillLevel('intermediate')
      setBudgetPref('any')
    }
  }

  const handleGetRecommendation = async (taskText?: string) => {
    const text = (taskText ?? task).trim()
    if (!text) return

    setLoading(true)
    setErrorMsg(null)
    setResult(null)
    setPromptResult(null)

    try {
      const resp = await fetch(`${ADVISOR_API_BASE}/advisor/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_description: text,
          user_skill_level: skillLevel,
          budget_preference: budgetPref,
        }),
      })

      if (!resp.ok) {
        let errDetail = `Server error (${resp.status})`
        try {
          const errJson = await resp.json()
          errDetail = errJson.detail || errJson.message || errDetail
        } catch {
          // ignore
        }
        throw new Error(errDetail)
      }

      const data: RecommendationResponse = await resp.json()
      setResult(data)
      setSelectedModelId(data.best_overall_recommendation.model_id)

      // Add to recent
      const best = data.best_overall_recommendation
      setRecent(prev => [
        {
          id: `r-${Date.now()}`,
          task: text.length > 48 ? text.slice(0, 48) + '…' : text,
          model: best.name,
          score: best.match_score,
          category: data.extracted_requirements.task_subtype || 'AI Consultation',
          ts: 'Just now',
          color: getModelColor(best.provider, best.model_id),
        },
        ...prev.slice(0, 4),
      ])
    } catch (err: any) {
      console.error('Advisor recommendation failed:', err)
      setErrorMsg(err.message || 'Failed to connect to Advisor Agent backend at http://127.0.0.1:8003')
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePrompt = async () => {
    if (!task.trim() || !selectedModelId) return

    setPromptLoading(true)
    setErrorMsg(null)

    try {
      const resp = await fetch(`${ADVISOR_API_BASE}/advisor/generate-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_description: task.trim(),
          selected_model_id: selectedModelId,
          extracted_requirements: result?.extracted_requirements,
          tone_preference: 'precise, structured, and production-ready',
        }),
      })

      if (!resp.ok) {
        let errDetail = `Server error (${resp.status})`
        try {
          const errJson = await resp.json()
          errDetail = errJson.detail || errJson.message || errDetail
        } catch {
          // ignore
        }
        throw new Error(errDetail)
      }

      const pData: PromptGenerationResponse = await resp.json()
      setPromptResult(pData)
    } catch (err: any) {
      console.error('Prompt generation failed:', err)
      setErrorMsg(err.message || 'Failed to generate prompt for selected model.')
    } finally {
      setPromptLoading(false)
    }
  }

  const handleCopyPrompt = () => {
    if (!promptResult?.optimized_prompt) return
    navigator.clipboard.writeText(promptResult.optimized_prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const loadRecent = (item: RecentItem) => {
    setTask(item.task)
    setActiveCategory(null)
    handleGetRecommendation(item.task)
  }

  // Active selected model object
  const activeModel = result
    ? (result.recommended_free_options.find(m => m.model_id === selectedModelId) ||
       result.recommended_paid_options.find(m => m.model_id === selectedModelId) ||
       result.best_overall_recommendation)
    : null

  return (
    <>
      {/* 3-Second Initial Splash Screen */}
      {showSplash && <AdvisorSplashScreen />}

      {/* Main Advisor Agent Workspace */}
      <div
        style={{
          opacity: showSplash ? 0 : 1,
          transition: 'opacity 0.45s ease-in-out',
          pointerEvents: showSplash ? 'none' : 'auto',
          minHeight: '100%',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* TopBar Header with Illustration, Title, Subtitle & Action Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--color-border)',
            flexWrap: 'wrap',
            gap: 16,
            background: 'var(--color-surface-subtle, transparent)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 500px' }}>
            {/* Advisor Illustration with Glow */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {/* Ambient Glow */}
              <div
                style={{
                  position: 'absolute',
                  width: 110,
                  height: 70,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(124,58,237,0.45) 0%, rgba(56,189,248,0.25) 60%, transparent 80%)',
                  filter: 'blur(16px)',
                  pointerEvents: 'none',
                }}
              />
              <img
                src="/advisor-illustration.png"
                alt="AI & Tool Consultant"
                style={{
                  height: 82,
                  width: 'auto',
                  maxWidth: 145,
                  objectFit: 'contain',
                  position: 'relative',
                  filter: 'drop-shadow(0 8px 22px rgba(124,58,237,0.55))',
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-foreground)', fontFamily: "'Inter', sans-serif" }}>
                  AI & Tool Consultant
                </h1>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: 'rgba(124,58,237,0.15)',
                    color: 'var(--color-accent-violet, #7C3AED)',
                    border: '1px solid rgba(124,58,237,0.3)',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Advisor v1.0
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.4, maxWidth: 780, fontFamily: "'Inter', sans-serif" }}>
                Formulate your technical objective. The Advisor evaluates your task complexity against verified catalog ground-truth to recommend optimal free and paid architectures with custom prompt synthesis.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 8,
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.25)',
                color: '#10B981',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
              gpt-oss:120b verified
            </div>

            <Link
              to="/dashboard/compare"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                color: 'var(--color-muted)',
                textDecoration: 'none',
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--color-foreground)'
                e.currentTarget.style.borderColor = 'var(--color-accent-violet)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--color-muted)'
                e.currentTarget.style.borderColor = 'var(--color-border)'
              }}
            >
              <IcCompare size={14} /> Compare Models
            </Link>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, minHeight: '100%' }} className="advisor-layout">
          {/* Main Content Column */}
          <PageContent style={{ flex: 1, maxWidth: 'none', paddingBottom: 64 }}>
            {/* Task Input Card */}
            <div
              className="card-base"
              style={{
                padding: 28,
                marginBottom: 24,
                background: 'var(--color-card, #13111C)',
                border: '1px solid var(--color-border)',
                borderRadius: 18,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <label
                  htmlFor="advisor-task"
                  style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-foreground)' }}
                >
                  What are you trying to accomplish?
                </label>
                <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                  Be as specific as possible (mention frameworks, budget, scale)
                </span>
              </div>

              <textarea
                id="advisor-task"
                value={task}
                onChange={e => {
                  setTask(e.target.value)
                  setActiveCategory(null)
                }}
                placeholder="e.g. I am a beginner and want to build a React + FastAPI + MySQL application with authentication. I have zero budget and need help with coding, debugging, and step-by-step architecture…"
                rows={4}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  minHeight: 110,
                  background: 'var(--color-input-bg, rgba(0,0,0,0.25))',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  padding: '16px 18px',
                  fontSize: 14,
                  color: 'var(--color-foreground)',
                  outline: 'none',
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: 1.6,
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--color-accent-violet, #7C3AED)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--color-border)'
                  e.target.style.boxShadow = 'none'
                }}
              />

              {/* User Preferences (Skill Level & Budget) */}
              <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {/* Skill Level Selection */}
                <div
                  style={{
                    background: 'var(--color-surface, rgba(255,255,255,0.02))',
                    borderRadius: 12,
                    padding: '14px 16px',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                    User Skill Level
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(['beginner', 'intermediate', 'expert'] as const).map(lvl => {
                      const isSelected = skillLevel === lvl
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setSkillLevel(lvl)}
                          style={{
                            flex: 1,
                            padding: '8px 10px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            textTransform: 'capitalize',
                            background: isSelected ? 'var(--color-accent-violet, #7C3AED)' : 'var(--color-surface)',
                            color: isSelected ? '#fff' : 'var(--color-muted)',
                            border: `1px solid ${isSelected ? 'var(--color-accent-violet, #7C3AED)' : 'var(--color-border)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {lvl}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Budget Preference Selection */}
                <div
                  style={{
                    background: 'var(--color-surface, rgba(255,255,255,0.02))',
                    borderRadius: 12,
                    padding: '14px 16px',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                    Budget Preference
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { id: 'any', label: 'Any Budget' },
                      { id: 'free_only', label: 'Free Only ($0)' },
                      { id: 'paid_acceptable', label: 'Paid Frontier' },
                    ].map(b => {
                      const isSelected = budgetPref === b.id
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setBudgetPref(b.id as any)}
                          style={{
                            flex: 1,
                            padding: '8px 10px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            background: isSelected ? 'var(--color-accent-violet, #7C3AED)' : 'var(--color-surface)',
                            color: isSelected ? '#fff' : 'var(--color-muted)',
                            border: `1px solid ${isSelected ? 'var(--color-accent-violet, #7C3AED)' : 'var(--color-border)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {b.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Suggested Tasks */}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Suggested Templates
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {SUGGESTED_TASKS.map(opt => {
                    const active = activeCategory === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleQuickOption(opt)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          borderRadius: 10,
                          background: active ? `${opt.color}20` : 'var(--color-surface)',
                          border: `1px solid ${active ? `${opt.color}60` : 'var(--color-border)'}`,
                          color: active ? opt.color : 'var(--color-foreground)',
                          cursor: 'pointer',
                          fontSize: 12.5,
                          fontWeight: 600,
                          transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: opt.color }} />
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleGetRecommendation()}
                  disabled={!task.trim() || loading}
                  className="pill-primary"
                  style={{
                    fontSize: 14,
                    padding: '12px 26px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    opacity: !task.trim() || loading ? 0.45 : 1,
                    transition: 'opacity 0.15s',
                    cursor: !task.trim() || loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
                  }}
                >
                  <IcSparkles size={16} />
                  {loading ? 'Evaluating Requirements…' : 'Get Recommendation'}
                  {!loading && <IcArrowRight size={14} />}
                </button>

                {result && (
                  <button
                    type="button"
                    onClick={() => {
                      setResult(null)
                      setTask('')
                      setActiveCategory(null)
                      setPromptResult(null)
                      setErrorMsg(null)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13,
                      color: 'var(--color-muted)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px 14px',
                      borderRadius: 8,
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-foreground)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
                  >
                    <IcRotate size={14} /> Start Over
                  </button>
                )}
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div
                className="card-base"
                style={{
                  padding: '16px 20px',
                  marginBottom: 24,
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 14,
                  color: '#EF4444',
                  fontSize: 13.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <strong>Advisor Error:</strong> {errorMsg}
                </div>
                <button
                  type="button"
                  onClick={() => handleGetRecommendation()}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    background: '#EF4444',
                    color: '#fff',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading Indicator */}
            {loading && <LoadingState message="Consulting AI Advisor and evaluating catalog models with gpt-oss:120b-cloud…" />}

            {/* Results View */}
            {result && !loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Task Analysis Summary Banner */}
                <div
                  className="card-base"
                  style={{
                    padding: '20px 24px',
                    background: 'var(--color-card, #13111C)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 14,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      Analyzed Objective
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-foreground)', marginTop: 3 }}>
                      {result.task_summary}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '5px 12px',
                        borderRadius: 999,
                        background: 'rgba(124,58,237,0.14)',
                        border: '1px solid rgba(124,58,237,0.3)',
                        color: '#A78BFA',
                        fontWeight: 700,
                      }}
                    >
                      {result.extracted_requirements.task_subtype}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '5px 12px',
                        borderRadius: 999,
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-muted)',
                        textTransform: 'capitalize',
                        fontWeight: 600,
                      }}
                    >
                      {result.extracted_requirements.complexity_level} Complexity
                    </span>
                    {result.extracted_requirements.detected_tech_stack?.length > 0 && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: '5px 12px',
                          borderRadius: 999,
                          background: 'rgba(56,189,248,0.12)',
                          border: '1px solid rgba(56,189,248,0.25)',
                          color: '#38BDF8',
                          fontWeight: 700,
                        }}
                      >
                        {result.extracted_requirements.detected_tech_stack.join(' • ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Best Overall Recommendation Card */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-foreground)', letterSpacing: '-0.01em' }}>
                      Best Overall Recommendation
                    </div>
                  </div>

                  {(() => {
                    const best = result.best_overall_recommendation
                    const color = getModelColor(best.provider, best.model_id)
                    const tier = getTierBadge(best.pricing_tier)
                    const isSelected = selectedModelId === best.model_id

                    return (
                      <div
                        className="card-base"
                        style={{
                          padding: 30,
                          position: 'relative',
                          overflow: 'hidden',
                          borderColor: `${color}60`,
                          background: 'var(--color-card, #13111C)',
                          borderRadius: 20,
                          boxShadow: `0 12px 36px ${color}15`,
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: -60,
                            right: -60,
                            width: 260,
                            height: 260,
                            background: `radial-gradient(circle, ${color}20, transparent 70%)`,
                            pointerEvents: 'none',
                          }}
                        />
                        <div style={{ position: 'relative' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 22, marginBottom: 24, flexWrap: 'wrap' }}>
                            <ScoreRing score={best.match_score} color={color} size={92} />
                            <div style={{ flex: 1, minWidth: 220 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    fontSize: 10.5,
                                    padding: '4px 12px',
                                    borderRadius: 999,
                                    background: `${color}18`,
                                    border: `1px solid ${color}40`,
                                    color,
                                    fontWeight: 800,
                                    letterSpacing: '0.04em',
                                  }}
                                >
                                  TOP RECOMMENDATION
                                </span>
                                <span
                                  style={{
                                    fontSize: 10.5,
                                    padding: '4px 12px',
                                    borderRadius: 999,
                                    background: tier.bg,
                                    border: `1px solid ${tier.border}`,
                                    color: tier.color,
                                    fontWeight: 700,
                                  }}
                                >
                                  {tier.label}
                                </span>
                              </div>
                              <h3 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-foreground)' }}>
                                {best.name}
                              </h3>
                              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--color-muted)' }}>
                                Provider: {best.provider} • Category: {best.tool_category.replace(/_/g, ' ')}
                              </p>
                            </div>

                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                type="button"
                                onClick={() => setSelectedModelId(best.model_id)}
                                style={{
                                  padding: '10px 18px',
                                  borderRadius: 10,
                                  fontSize: 13,
                                  fontWeight: 700,
                                  background: isSelected ? color : 'var(--color-surface)',
                                  color: isSelected ? '#fff' : 'var(--color-foreground)',
                                  border: `1px solid ${isSelected ? color : 'var(--color-border)'}`,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s',
                                }}
                              >
                                {isSelected ? '✓ Selected for Prompt' : 'Select for Prompt'}
                              </button>
                              {best.access_url_or_api && (
                                <a
                                  href={best.access_url_or_api}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    padding: '10px 14px',
                                    borderRadius: 10,
                                    background: 'var(--color-surface)',
                                    border: '1px solid var(--color-border)',
                                    color: 'var(--color-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textDecoration: 'none',
                                  }}
                                  title="Open Provider Link"
                                >
                                  <IcExternalLink size={16} />
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Why It Fits */}
                          <div
                            style={{
                              background: 'var(--color-surface, rgba(255,255,255,0.03))',
                              borderRadius: 12,
                              padding: '16px 20px',
                              border: '1px solid var(--color-border)',
                              marginBottom: 22,
                              fontSize: 14,
                              lineHeight: 1.6,
                              color: 'var(--color-foreground)',
                            }}
                          >
                            <strong style={{ color }}>Why it fits: </strong>
                            {best.why_it_fits}
                          </div>

                          {/* Strengths & Limitations */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
                            <div
                              style={{
                                background: 'var(--color-surface, rgba(255,255,255,0.02))',
                                padding: '16px 18px',
                                borderRadius: 14,
                                border: '1px solid var(--color-border)',
                              }}
                            >
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#34D399', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                                Strengths for Task
                              </div>
                              <TagList items={best.strengths_for_task} variant="strength" />
                            </div>
                            <div
                              style={{
                                background: 'var(--color-surface, rgba(255,255,255,0.02))',
                                padding: '16px 18px',
                                borderRadius: 14,
                                border: '1px solid var(--color-border)',
                              }}
                            >
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#F87171', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                                Limitations to Note
                              </div>
                              <TagList items={best.limitations_for_task} variant="weakness" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* Free Options Section */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-foreground)' }}>
                        Free & Open-Source Options
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          padding: '3px 10px',
                          borderRadius: 999,
                          background: 'rgba(16,185,129,0.14)',
                          color: '#10B981',
                          fontWeight: 700,
                        }}
                      >
                        $0 Budget
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 16 }}>
                    {result.recommended_free_options.map(opt => {
                      const color = getModelColor(opt.provider, opt.model_id)
                      const isSelected = selectedModelId === opt.model_id
                      const tier = getTierBadge(opt.pricing_tier)

                      return (
                        <div
                          key={opt.model_id}
                          className="card-base"
                          style={{
                            padding: 22,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                            background: 'var(--color-card, #13111C)',
                            border: isSelected ? `2px solid ${color}` : '1px solid var(--color-border)',
                            borderRadius: 16,
                            transition: 'border-color 0.15s, transform 0.15s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 6, background: tier.bg, color: tier.color, fontWeight: 700 }}>
                              {tier.label}
                            </span>
                            <span style={{ fontSize: 18, fontWeight: 800, color }}>{opt.match_score}</span>
                          </div>

                          <div>
                            <div style={{ fontSize: 16.5, fontWeight: 700, color: 'var(--color-foreground)' }}>{opt.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{opt.provider}</div>
                          </div>

                          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.55 }}>
                            {opt.why_it_fits}
                          </p>

                          <div style={{ marginTop: 'auto', paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>
                              {opt.strengths_for_task[0] || 'High performance'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedModelId(opt.model_id)}
                              style={{
                                padding: '6px 14px',
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 700,
                                background: isSelected ? color : 'var(--color-surface)',
                                color: isSelected ? '#fff' : 'var(--color-foreground)',
                                border: `1px solid ${isSelected ? color : 'var(--color-border)'}`,
                                cursor: 'pointer',
                              }}
                            >
                              {isSelected ? 'Selected' : 'Select'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Paid Options Section */}
                {result.recommended_paid_options.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-foreground)' }}>
                          Frontier & Paid Options
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            padding: '3px 10px',
                            borderRadius: 999,
                            background: 'rgba(124,58,237,0.14)',
                            color: '#A78BFA',
                            fontWeight: 700,
                          }}
                        >
                          Premium Frontier
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 16 }}>
                      {result.recommended_paid_options.map(opt => {
                        const color = getModelColor(opt.provider, opt.model_id)
                        const isSelected = selectedModelId === opt.model_id
                        const tier = getTierBadge(opt.pricing_tier)

                        return (
                          <div
                            key={opt.model_id}
                            className="card-base"
                            style={{
                              padding: 22,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 12,
                              background: 'var(--color-card, #13111C)',
                              border: isSelected ? `2px solid ${color}` : '1px solid var(--color-border)',
                              borderRadius: 16,
                              transition: 'border-color 0.15s, transform 0.15s',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 6, background: tier.bg, color: tier.color, fontWeight: 700 }}>
                                {tier.label}
                              </span>
                              <span style={{ fontSize: 18, fontWeight: 800, color }}>{opt.match_score}</span>
                            </div>

                            <div>
                              <div style={{ fontSize: 16.5, fontWeight: 700, color: 'var(--color-foreground)' }}>{opt.name}</div>
                              <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{opt.provider}</div>
                            </div>

                            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.55 }}>
                              {opt.why_it_fits}
                            </p>

                            <div style={{ marginTop: 'auto', paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>
                                {opt.strengths_for_task[0] || 'Frontier accuracy'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedModelId(opt.model_id)}
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: 8,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  background: isSelected ? color : 'var(--color-surface)',
                                  color: isSelected ? '#fff' : 'var(--color-foreground)',
                                  border: `1px solid ${isSelected ? color : 'var(--color-border)'}`,
                                  cursor: 'pointer',
                                }}
                              >
                                {isSelected ? 'Selected' : 'Select'}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Trade-Off Analysis Card */}
                <div
                  className="card-base"
                  style={{
                    padding: 28,
                    background: 'var(--color-card, #13111C)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 18,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: 'rgba(124,58,237,0.15)',
                        border: '1px solid rgba(124,58,237,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#A78BFA',
                      }}
                    >
                      <IcAdvisor size={18} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--color-foreground)' }}>
                      Trade-Off Analysis & Recommendations
                    </h3>
                  </div>

                  <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.7 }}>
                    {result.trade_off_analysis}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 20 }}>
                    <MetricPill
                      label="Practical Alternative"
                      value={result.practical_alternative.name}
                      accent={getModelColor(result.practical_alternative.provider, result.practical_alternative.model_id)}
                    />
                    <MetricPill label="Confidence Rating" value={`${result.confidence_score}%`} accent="#34D399" />
                  </div>

                  <div
                    style={{
                      background: 'var(--color-surface, rgba(255,255,255,0.03))',
                      borderRadius: 12,
                      padding: '14px 18px',
                      border: '1px solid var(--color-border)',
                      fontSize: 13.5,
                      color: 'var(--color-foreground)',
                      lineHeight: 1.5,
                    }}
                  >
                    <strong style={{ color: '#A78BFA' }}>Recommended Next Step: </strong>
                    {result.recommended_next_step}
                  </div>
                </div>

                {/* Prompt Generator Section */}
                <div
                  className="card-base"
                  style={{
                    padding: 28,
                    background: 'var(--color-card, #13111C)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 18,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: 'linear-gradient(135deg, #7C3AED, #38BDF8)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                        }}
                      >
                        <IcSparkles size={18} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--color-foreground)' }}>
                          Optimized Prompt Generator
                        </h3>
                        <div style={{ fontSize: 12.5, color: 'var(--color-muted)' }}>
                          Tailor a production prompt for{' '}
                          <strong style={{ color: 'var(--color-foreground)' }}>{activeModel?.name || 'Selected Model'}</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGeneratePrompt}
                      disabled={promptLoading || !selectedModelId}
                      className="pill-primary"
                      style={{
                        fontSize: 13,
                        padding: '10px 22px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: promptLoading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <IcSparkles size={14} />
                      {promptLoading ? 'Generating Prompt…' : `Generate Prompt for ${activeModel?.name || 'Model'}`}
                    </button>
                  </div>

                  {promptLoading && <LoadingState message={`Optimizing prompt directives for ${activeModel?.name}…`} />}

                  {promptResult && !promptLoading && (
                    <div style={{ marginTop: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Ready-to-Copy Prompt
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyPrompt}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            padding: '6px 14px',
                            borderRadius: 8,
                            background: copied ? '#10B981' : 'var(--color-surface)',
                            color: copied ? '#fff' : 'var(--color-foreground)',
                            border: '1px solid var(--color-border)',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {copied ? <IcCheck size={12} /> : <IcCopy size={12} />}
                          {copied ? 'Copied!' : 'Copy Prompt'}
                        </button>
                      </div>

                      <pre
                        style={{
                          background: 'var(--color-input-bg, rgba(0,0,0,0.3))',
                          border: '1px solid var(--color-border)',
                          borderRadius: 12,
                          padding: '18px 20px',
                          fontSize: 13,
                          color: 'var(--color-foreground)',
                          fontFamily: 'JetBrains Mono, monospace',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          lineHeight: 1.6,
                          maxHeight: 380,
                          overflowY: 'auto',
                          margin: 0,
                        }}
                      >
                        {promptResult.optimized_prompt}
                      </pre>

                      {promptResult.system_directive && (
                        <div style={{ marginTop: 14, background: 'var(--color-surface)', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase', marginBottom: 4 }}>
                            System Directive / Persona
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--color-foreground)', lineHeight: 1.5 }}>
                            {promptResult.system_directive}
                          </div>
                        </div>
                      )}

                      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                        <div style={{ background: 'var(--color-surface)', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                            Recommended Parameters
                          </div>
                          <div style={{ fontSize: 12.5, color: 'var(--color-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>
                            {Object.entries(promptResult.recommended_parameters).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                          </div>
                        </div>

                        <div style={{ background: 'var(--color-surface)', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                            Optimization Notes
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                            {promptResult.explanation}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Empty State Hint */}
            {!result && !loading && !errorMsg && (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--color-muted)' }}>
                <p style={{ margin: 0, fontSize: 13.5 }}>
                  Enter your task or project objective above, select your preferences, then click <strong>Get Recommendation</strong>.
                </p>
              </div>
            )}
          </PageContent>

          {/* Recent Recommendations Sidebar */}
          <aside
            className="advisor-recent"
            style={{
              width: 290,
              flexShrink: 0,
              borderLeft: '1px solid var(--color-border)',
              padding: '24px 20px',
              overflowY: 'auto',
              background: 'var(--color-surface, rgba(255,255,255,0.02))',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
              Recent Recommendations
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recent.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => loadRecent(item)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    background: 'var(--color-card, #13111C)',
                    border: '1px solid var(--color-border-faint)',
                    transition: 'all 0.15s',
                    width: '100%',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--color-hover)'
                    e.currentTarget.style.borderColor = 'var(--color-accent-violet)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--color-card, #13111C)'
                    e.currentTarget.style.borderColor = 'var(--color-border-faint)'
                  }}
                >
                  <div style={{ fontSize: 12.5, color: 'var(--color-foreground)', lineHeight: 1.45, marginBottom: 8, fontWeight: 500 }}>
                    {item.task}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: item.color, fontFamily: 'JetBrains Mono, monospace' }}>
                        {item.model}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: 'var(--color-muted)',
                          background: 'var(--color-surface)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          border: '1px solid var(--color-border-faint)',
                        }}
                      >
                        {item.score}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>{item.ts}</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--color-muted)', marginTop: 6 }}>{item.category}</div>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        @keyframes advisorPulse { 0%,100%{opacity:0.3;transform:scale(0.85)} 50%{opacity:1;transform:scale(1)} }
        @keyframes advisorFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes advisorSplashFadeIn { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
        @keyframes advisorProgress { 0%{width:0%} 100%{width:100%} }
        @media (max-width: 960px) {
          .advisor-layout { flex-direction: column !important; }
          .advisor-recent { width: 100% !important; border-left: none !important; border-top: 1px solid var(--color-border) !important; }
        }
      `}</style>
    </>
  )
}
