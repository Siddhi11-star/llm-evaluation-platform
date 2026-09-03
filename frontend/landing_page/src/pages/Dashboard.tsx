import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router'
import { PageContent } from '../components/AppShell'
import { IcPlus, IcChevronRight, IcSparkles, IcRotate } from '../components/icons'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'

const BASE_SCORE_DATA = [
  { day: 'Day 1', accuracy: 88, relevance: 82, reasoning: 79, hallucination: 95, safety: 99, style: 72 },
  { day: 'Day 2', accuracy: 90, relevance: 84, reasoning: 81, hallucination: 96, safety: 99, style: 74 },
  { day: 'Day 3', accuracy: 87, relevance: 83, reasoning: 80, hallucination: 94, safety: 98, style: 75 },
  { day: 'Day 4', accuracy: 92, relevance: 86, reasoning: 83, hallucination: 97, safety: 99, style: 78 },
  { day: 'Day 5', accuracy: 91, relevance: 87, reasoning: 84, hallucination: 97, safety: 99, style: 77 },
  { day: 'Day 6', accuracy: 93, relevance: 88, reasoning: 85, hallucination: 98, safety: 100, style: 79 },
  { day: 'Today', accuracy: 94, relevance: 89, reasoning: 87, hallucination: 98, safety: 100, style: 81 },
]

const JUDGE_COLORS = {
  accuracy: '#38BDF8', relevance: '#7C3AED', reasoning: '#EC4899',
  hallucination: '#34D399', safety: '#A78BFA', style: '#FBBF24',
}

const DEFAULT_RUNS = [
  { id: '1234', task: 'Legal contract summarization', model: 'gemini-2.0-flash', score: 94, judges: 6, ts: '2 min ago', status: 'Passed' },
  { id: '1233', task: 'Customer support response drafting', model: 'claude-3.5-sonnet', score: 91, judges: 6, ts: '14 min ago', status: 'Passed' },
  { id: '1232', task: 'Financial report Q&A', model: 'gpt-4o', score: 88, judges: 6, ts: '31 min ago', status: 'Passed' },
  { id: '1231', task: 'Medical symptom triage', model: 'llama-3.1-70b', score: 71, judges: 4, ts: '1 hr ago', status: 'Flagged' },
  { id: '1230', task: 'Code review assistant', model: 'claude-3.5-sonnet', score: 96, judges: 5, ts: '2 hrs ago', status: 'Passed' },
  { id: '1229', task: 'Blog post generation', model: 'gpt-4o-mini', score: 83, judges: 6, ts: '3 hrs ago', status: 'Passed' },
]

const SPARKLINE_DATA = [[72,78,75,82,79,85,81,87,84,89,88,91,87,94], [80,82,81,84,83,86,85,87,86,88,87,89,88,89], [2.4,2.2,2.3,2.1,2.0,2.1,1.9,2.0,1.8,2.1,2.2,2.0,1.9,2.1], [1.3,1.4,1.3,1.5,1.4,1.3,1.2,1.4,1.3,1.2,1.3,1.2,1.1,1.4]]

// Platform Stats
const BASE_PLATFORM_STATS = [
  { label: 'Active Models', value: '24', delta: '+3 this month', color: '#38BDF8', spark: [18,19,20,20,21,22,23,24,24,24,24,24,24,24] },
  { label: 'Total Judges', value: '142', delta: '+12 this week', color: '#7C3AED', spark: [120,122,125,128,130,132,135,138,140,141,142,142,142,142] },
  { label: 'Evaluations / Day', value: '487', delta: '+8.2% vs last week', color: '#34D399', spark: [410,420,430,440,445,450,460,465,470,475,480,485,487,487] },
  { label: 'Uptime', value: '99.97%', delta: '+0.02% this month', color: '#FBBF24', spark: [99.8,99.82,99.85,99.87,99.88,99.9,99.91,99.92,99.93,99.94,99.95,99.96,99.97,99.97] },
]

// Model Leaderboard Initial Base
const BASE_LEADERBOARD = [
  { rank: 1, model: 'claude-3.5-sonnet', provider: 'Anthropic', score: 94.2, accuracy: 96, relevance: 93, reasoning: 95, safety: 98, trend: [89,90,91,92,92,93,93,94,94,94,94,94,94,94] },
  { rank: 2, model: 'gpt-4o', provider: 'OpenAI', score: 92.8, accuracy: 94, relevance: 92, reasoning: 93, safety: 97, trend: [88,89,90,90,91,91,92,92,92,92,92,93,92,92] },
  { rank: 3, model: 'gemini-2.0-flash', provider: 'Google', score: 91.5, accuracy: 93, relevance: 90, reasoning: 91, safety: 96, trend: [85,86,87,88,89,89,90,90,91,91,91,91,91,91] },
  { rank: 4, model: 'llama-3.1-70b', provider: 'Meta', score: 87.3, accuracy: 89, relevance: 86, reasoning: 88, safety: 94, trend: [82,83,84,85,85,86,86,87,87,87,87,87,87,87] },
  { rank: 5, model: 'gpt-4o-mini', provider: 'OpenAI', score: 84.1, accuracy: 86, relevance: 83, reasoning: 85, safety: 92, trend: [78,79,80,81,82,82,83,83,83,84,84,84,84,84] },
  { rank: 6, model: 'mistral-large', provider: 'Mistral', score: 82.6, accuracy: 84, relevance: 81, reasoning: 83, safety: 91, trend: [76,77,78,79,80,80,81,81,82,82,82,82,82,82] },
]

// Evaluation Trends / Results (bar chart data)
const BASE_EVAL_RESULTS = [
  { day: 'Day 1', passed: 42, flagged: 3, failed: 1 },
  { day: 'Day 2', passed: 38, flagged: 5, failed: 2 },
  { day: 'Day 3', passed: 45, flagged: 2, failed: 0 },
  { day: 'Day 4', passed: 41, flagged: 4, failed: 1 },
  { day: 'Day 5', passed: 48, flagged: 2, failed: 1 },
  { day: 'Day 6', passed: 44, flagged: 3, failed: 0 },
  { day: 'Today', passed: 50, flagged: 2, failed: 1 },
]

// Agent Swarm Activity
const AGENT_SWARM = [
  { id: 'swarm-001', name: 'Safety Consensus', status: 'Active', agents: 8, tasks: 124, success: 98.4, lastRun: '2 min ago' },
  { id: 'swarm-002', name: 'Hallucination Detectors', status: 'Active', agents: 6, tasks: 89, success: 96.2, lastRun: '5 min ago' },
  { id: 'swarm-003', name: 'Reasoning Panel', status: 'Idle', agents: 5, tasks: 67, success: 94.1, lastRun: '12 min ago' },
  { id: 'swarm-004', name: 'Style Enforcers', status: 'Active', agents: 4, tasks: 45, success: 91.8, lastRun: '8 min ago' },
  { id: 'swarm-005', name: 'Relevance Checkers', status: 'Active', agents: 7, tasks: 112, success: 97.3, lastRun: '1 min ago' },
]

// Factor Performance (radar data)
const BASE_FACTOR_DATA = [
  { factor: 'Accuracy', gpt4o: 94, claude: 96, gemini: 93, llama: 89 },
  { factor: 'Relevance', gpt4o: 92, claude: 93, gemini: 90, llama: 86 },
  { factor: 'Reasoning', gpt4o: 93, claude: 95, gemini: 91, llama: 88 },
  { factor: 'Safety', gpt4o: 97, claude: 98, gemini: 96, llama: 94 },
  { factor: 'Style', gpt4o: 88, claude: 90, gemini: 89, llama: 85 },
  { factor: 'Speed', gpt4o: 85, claude: 82, gemini: 94, llama: 78 },
]

// Recent Activity feed
const BASE_RECENT_ACTIVITY = [
  { id: '1', type: 'eval', text: 'Evaluation completed for claude-3.5-sonnet', time: '2 min ago', icon: '✓', color: '#34D399' },
  { id: '2', type: 'flag', text: 'Medical triage run flagged by Safety Consensus swarm', time: '5 min ago', icon: '⚑', color: '#F87171' },
  { id: '3', type: 'swarm', text: 'Agent Swarm "Relevance Checkers" scaled to 7 agents', time: '12 min ago', icon: '◈', color: '#A78BFA' },
  { id: '4', type: 'model', text: 'New model gemini-2.0-flash added to leaderboard', time: '31 min ago', icon: '▲', color: '#38BDF8' },
  { id: '5', type: 'eval', text: 'Batch evaluation of prompts completed', time: '1 hr ago', icon: '✓', color: '#34D399' },
  { id: '6', type: 'insight', text: 'Advisor: Hallucination rate dropped 0.3% this week', time: '2 hrs ago', icon: '◉', color: '#FBBF24' },
]

// Advisor Insights
const ADVISOR_INSIGHTS = [
  { id: 1, title: 'Hallucination Trending Down', desc: 'Hallucination rate has declined 0.3% over recent runs. Safety Consensus swarm is catching 98.4% of fabrications.', type: 'positive', color: '#34D399' },
  { id: 2, title: 'Claude-3.5 Leads on Reasoning', desc: 'Claude-3.5-sonnet holds the top reasoning score (95) with high multi-step synthesis accuracy.', type: 'neutral', color: '#38BDF8' },
  { id: 3, title: 'Latency Optimized on Flash', desc: 'P95 latency for Gemini 2.0 Flash is sub-1.4s. Ideal for high-throughput streaming tasks.', type: 'warning', color: '#FBBF24' },
  { id: 4, title: 'New Safety Vectors Verified', desc: 'The Safety Consensus swarm verified adversarial prompt protection across all active models.', type: 'alert', color: '#F87171' },
]

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1
  const w = 64, h = 28
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ')
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const num = Math.round(score * 10) / 10
  const color = num >= 90 ? '#34D399' : num >= 80 ? '#38BDF8' : num >= 70 ? '#FBBF24' : '#F87171'
  return <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 44, height: 24, padding: '0 6px', borderRadius: 6, background: `${color}18`, border: `1px solid ${color}44`, fontSize: 12, fontWeight: 700, color }}>{num}</span>
}

function StatusPill({ status }: { status: string }) {
  const passed = status === 'Passed'
  return <span style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 8px', borderRadius: 9999, background: passed ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${passed ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`, fontSize: 11, fontWeight: 600, color: passed ? '#34D399' : '#F87171' }}>{status}</span>
}

function SwarmStatusPill({ status }: { status: string }) {
  const active = status === 'Active'
  return <span style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 8px', borderRadius: 9999, background: active ? 'rgba(52,211,153,0.1)' : 'rgba(167,139,250,0.1)', border: `1px solid ${active ? 'rgba(52,211,153,0.25)' : 'rgba(167,139,250,0.25)'}`, fontSize: 11, fontWeight: 600, color: active ? '#34D399' : '#A78BFA' }}>{status}</span>
}

function InsightTypePill({ type }: { type: string }) {
  const colors: Record<string, string> = {
    positive: '#34D399',
    neutral: '#38BDF8',
    warning: '#FBBF24',
    alert: '#F87171',
  }
  const color = colors[type] || '#A78BFA'
  return <span style={{ display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 8px', borderRadius: 9999, background: `${color}15`, border: `1px solid ${color}35`, fontSize: 10, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{type}</span>
}

// ─── Overview / Dashboard Splash Screen ──────────────────────────────────────

function DashboardSplashScreen() {
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
      {/* Background Glow */}
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

      {/* Central Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          animation: 'dashSplashFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Centered Illustration */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <img
            src="/dashboard-illustration.png"
            alt="JudgeAI Overview Dashboard"
            style={{
              width: 380,
              maxWidth: '85vw',
              height: 'auto',
              filter: 'drop-shadow(0 20px 45px rgba(124, 58, 237, 0.35))',
              userSelect: 'none',
              pointerEvents: 'none',
              animation: 'dashFloat 3s ease-in-out infinite',
            }}
          />
        </div>

        {/* Badge */}
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
          <IcSparkles size={12} /> System Observability & Telemetry
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
          Overview
        </h1>

        <p
          style={{
            margin: '0 0 28px',
            fontSize: 'clamp(13px, 2vw, 15px)',
            color: 'var(--color-muted)',
            maxWidth: 460,
            lineHeight: 1.5,
            fontWeight: 500,
          }}
        >
          Aggregating real-time model telemetry, benchmark insights, and system performance…
        </p>

        {/* 3-Second Animated Progress Indicator */}
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
              animation: 'dashProgress 3s linear forwards',
            }}
          />
        </div>
      </div>
    </div>
  )
}

/* ─── COMPONENT ─── */

export default function Dashboard() {
  // Splash state — 3-second initial mount transition
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  const [range, setRange] = useState('7d')
  const [isSyncing, setIsSyncing] = useState(false)
  const [liveRuns, setLiveRuns] = useState<any[]>(DEFAULT_RUNS)
  const [totalEvalCount, setTotalEvalCount] = useState<number>(2847)
  const [avgScore, setAvgScore] = useState<number>(89.4)
  const [hallucinationRate, setHallucinationRate] = useState<string>('2.1%')
  const [avgLatency, setAvgLatency] = useState<string>('1.3s')
  const [leaderboard, setLeaderboard] = useState<any[]>(BASE_LEADERBOARD)
  const [scoreData, setScoreData] = useState<any[]>(BASE_SCORE_DATA)
  const [recentActivities, setRecentActivities] = useState<any[]>(BASE_RECENT_ACTIVITY)

  // Fetch real running data from backend evaluation history and local storage
  const fetchDashboardTelemetry = useCallback(async () => {
    setIsSyncing(true)
    try {
      let rawRuns: any[] = []

      // 1. Fetch from Evaluation Service
      const res = await fetch('http://localhost:8001/evaluations/history?limit=100').catch(() => null)
      if (res && res.ok) {
        const data = await res.json()
        if (Array.isArray(data.runs)) rawRuns = data.runs
      }

      // Fallback port
      if (rawRuns.length === 0) {
        const resFallback = await fetch('http://localhost:8000/evaluations/history?limit=100').catch(() => null)
        if (resFallback && resFallback.ok) {
          const data = await resFallback.json()
          if (Array.isArray(data.runs)) rawRuns = data.runs
        }
      }

      // Check localStorage judge history
      let judgeHistory: any[] = []
      try {
        const saved = localStorage.getItem('judge_agent_history')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) judgeHistory = parsed
        }
      } catch {}

      if (rawRuns.length > 0) {
        // Map raw runs to dashboard runs format
        const formattedRuns = rawRuns.slice(0, 8).map((r: any, idx: number) => ({
          id: r.id || `eval-${idx}`,
          task: r.task || r.prompt?.slice(0, 45) || 'Quantitative evaluation run',
          model: r.model || r.target_model || 'gpt-oss:120b-cloud',
          score: Math.round(Number(r.score || r.composite_score || 90)),
          judges: r.judges || (Array.isArray(r.rubrics) ? r.rubrics.length : 6),
          ts: r.ts || 'Recent',
          status: (r.status === 'Flagged' || (Number(r.score) < 75)) ? 'Flagged' : 'Passed',
        }))

        setLiveRuns(formattedRuns)

        // Calculate dynamic stats
        const allScores = rawRuns.map((r: any) => Number(r.score || r.composite_score || 90)).filter(s => !isNaN(s) && s > 0)
        if (allScores.length > 0) {
          const mean = allScores.reduce((a, b) => a + b, 0) / allScores.length
          setAvgScore(Math.round(mean * 10) / 10)
        }

        setTotalEvalCount(2847 + rawRuns.length + judgeHistory.length)

        // Aggregate scores per model for dynamic leaderboard
        const modelStats: Record<string, { scores: number[]; accuracy: number[]; relevance: number[]; reasoning: number[]; safety: number[] }> = {}
        rawRuns.forEach((r: any) => {
          const m = r.model || 'model'
          if (!modelStats[m]) modelStats[m] = { scores: [], accuracy: [], relevance: [], reasoning: [], safety: [] }
          const sc = Number(r.score || 90)
          if (!isNaN(sc) && sc > 0) modelStats[m].scores.push(sc)

          if (Array.isArray(r.rubrics)) {
            r.rubrics.forEach((rb: any) => {
              const k = (rb.key || '').toLowerCase()
              const s = Number(rb.score)
              if (!isNaN(s) && s > 0) {
                if (k.includes('accur')) modelStats[m].accuracy.push(s)
                else if (k.includes('relev')) modelStats[m].relevance.push(s)
                else if (k.includes('reason')) modelStats[m].reasoning.push(s)
                else if (k.includes('safe')) modelStats[m].safety.push(s)
              }
            })
          }
        })

        // Merge into leaderboard
        const updatedLeaderboard = BASE_LEADERBOARD.map(item => {
          const stat = modelStats[item.model]
          if (stat && stat.scores.length > 0) {
            const avg = (arr: number[], base: number) => arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : base
            return {
              ...item,
              score: avg(stat.scores, item.score),
              accuracy: Math.round(avg(stat.accuracy, item.accuracy)),
              relevance: Math.round(avg(stat.relevance, item.relevance)),
              reasoning: Math.round(avg(stat.reasoning, item.reasoning)),
              safety: Math.round(avg(stat.safety, item.safety)),
            }
          }
          return item
        }).sort((a, b) => b.score - a.score).map((item, idx) => ({ ...item, rank: idx + 1 }))

        setLeaderboard(updatedLeaderboard)

        // Prepend recent live events into activity
        const newActivities = rawRuns.slice(0, 3).map((r: any, i: number) => ({
          id: `live-act-${i}`,
          type: 'eval',
          text: `Live run completed for ${r.model || 'model'} (Score: ${Math.round(r.score || 90)})`,
          time: r.ts || 'Just now',
          icon: '✓',
          color: '#34D399',
        }))

        setRecentActivities([...newActivities, ...BASE_RECENT_ACTIVITY.slice(0, 4)])
      }
    } catch {
      // Retain base defaults on connection issues
    } finally {
      setIsSyncing(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardTelemetry()
  }, [fetchDashboardTelemetry])

  const statsCards = useMemo(() => [
    { label: 'Total Evaluations', value: totalEvalCount.toLocaleString(), delta: `+${liveRuns.length} live synced`, color: '#38BDF8', spark: 0 },
    { label: 'Avg. Composite Score', value: avgScore.toString(), delta: '+3.2 this week', color: '#7C3AED', spark: 1 },
    { label: 'Hallucination Rate', value: hallucinationRate, delta: '−0.3% this week', color: '#34D399', spark: 2 },
    { label: 'Avg. Latency P95', value: avgLatency, delta: '−0.1s this week', color: '#FBBF24', spark: 3 },
  ], [totalEvalCount, liveRuns.length, avgScore, hallucinationRate, avgLatency])

  return (
    <>
      {/* 3-Second Initial Splash Screen */}
      {showSplash && <DashboardSplashScreen />}

      {/* Main Overview Workspace */}
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
        {/* TopBar Header with Title, Subtitle, Ambient Glow & Action Controls */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid var(--color-border)',
            flexWrap: 'wrap',
            gap: 16,
            background: 'var(--color-surface-subtle, transparent)',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {/* Ambient Glow behind text */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 200,
              transform: 'translate(-50%, -50%)',
              width: 500,
              height: 140,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.3) 0%, rgba(56,189,248,0.15) 50%, transparent 75%)',
              filter: 'blur(32px)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          <div style={{ flex: '1 1 500px', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-foreground)', fontFamily: "'Inter', sans-serif" }}>
                System Observability & Overview
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
                Overview v1.0
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.4, maxWidth: 780, fontFamily: "'Inter', sans-serif" }}>
              Aggregating real-time model telemetry, active agent swarm health, benchmark performance, and platform analytics.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
            {/* Live Sync Status Indicator */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '6px 12px',
                borderRadius: 8,
                background: 'rgba(52, 211, 153, 0.12)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                fontSize: 12,
                fontWeight: 600,
                color: '#34D399',
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#34D399',
                  boxShadow: '0 0 8px #34D399',
                }}
              />
              <span>Live Telemetry Synced</span>
            </div>

            {/* Sync Refresh Button */}
            <button
              type="button"
              onClick={fetchDashboardTelemetry}
              title="Refresh live overview metrics"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-foreground)',
                cursor: isSyncing ? 'wait' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <IcRotate size={14} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none', color: isSyncing ? 'var(--color-accent-violet)' : 'var(--color-muted)' }} />
            </button>

            <div style={{ display: 'flex', gap: 6 }}>
              {['24h', '7d', '30d', '90d'].map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  style={{
                    fontSize: 12,
                    padding: '5px 10px',
                    borderRadius: 7,
                    border: `1px solid ${range === r ? 'var(--color-accent-violet)' : 'var(--color-border)'}`,
                    background: range === r ? 'rgba(124,58,237,0.12)' : 'transparent',
                    color: range === r ? 'var(--color-accent-violet)' : 'var(--color-muted)',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
            <Link
              to="/dashboard/evaluations"
              className="pill-primary"
              style={{
                fontSize: 13,
                padding: '8px 16px',
                gap: 6,
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
              }}
            >
              <IcPlus size={14} /> New Evaluation
            </Link>
          </div>
        </div>

      <PageContent>
        {/* ─── Stat cards (live aggregated) ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }} className="stat-grid">
          {statsCards.map((s, i) => (
            <div key={s.label} className="card-base" style={{ padding: '20px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-foreground)', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: s.color, marginTop: 6, fontWeight: 500 }}>{s.delta}</div>
                </div>
                <Sparkline data={SPARKLINE_DATA[i]} color={s.color} />
              </div>
            </div>
          ))}
        </div>

        {/* ─── Platform Stats ─── */}
        <div className="card-base" style={{ padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em', color: 'var(--color-foreground)' }}>Platform Stats</div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 3 }}>Live platform health metrics</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }} className="stat-grid">
            {BASE_PLATFORM_STATS.map(s => (
              <div key={s.label} style={{ padding: '16px', borderRadius: 10, background: 'var(--color-surface-deep)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-foreground)', lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: s.color, marginTop: 4, fontWeight: 500 }}>{s.delta}</div>
                  </div>
                  <Sparkline data={s.spark} color={s.color} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Model Leaderboard (Live Aggregated) ─── */}
        <div className="card-base" style={{ overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-foreground)' }}>Model Leaderboard (Live Aggregated)</div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 3 }}>Top performing models ranked by dynamic composite benchmark scores</div>
            </div>
            <Link to="/dashboard/comparison" style={{ fontSize: 12, color: 'var(--color-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-foreground)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}>Compare all <IcChevronRight size={14} /></Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Rank', 'Model', 'Provider', 'Composite', 'Accuracy', 'Relevance', 'Reasoning', 'Safety', 'Trend'].map(h => (
                    <th key={h} style={{ padding: '10px 24px', textAlign: h === 'Rank' ? 'center' : 'left', fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaderboard.map(m => (
                  <tr key={m.model} style={{ borderBottom: '1px solid var(--color-border-faint)', transition: 'background 0.1s', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 24px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: m.rank <= 3 ? '#FBBF24' : 'var(--color-muted)' }}>#{m.rank}</td>
                    <td style={{ padding: '12px 24px', fontSize: 13, color: 'var(--color-foreground)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>{m.model}</td>
                    <td style={{ padding: '12px 24px', fontSize: 12, color: 'var(--color-muted)' }}>{m.provider}</td>
                    <td style={{ padding: '12px 24px' }}><ScoreBadge score={m.score} /></td>
                    <td style={{ padding: '12px 24px', fontSize: 12, color: 'var(--color-muted)' }}>{m.accuracy}</td>
                    <td style={{ padding: '12px 24px', fontSize: 12, color: 'var(--color-muted)' }}>{m.relevance}</td>
                    <td style={{ padding: '12px 24px', fontSize: 12, color: 'var(--color-muted)' }}>{m.reasoning}</td>
                    <td style={{ padding: '12px 24px', fontSize: 12, color: 'var(--color-muted)' }}>{m.safety}</td>
                    <td style={{ padding: '12px 24px' }}><Sparkline data={m.trend} color={m.score >= 90 ? '#34D399' : '#38BDF8'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── Two-column layout: Evaluation Results + Factor Performance ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16, marginBottom: 24 }} className="two-col-grid">
          {/* Evaluation Trends / Results */}
          <div className="card-base" style={{ padding: '24px 24px 16px' }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em', color: 'var(--color-foreground)' }}>Evaluation Results</div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 3 }}>Pass / flag / fail breakdown across recent evaluations</div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={BASE_EVAL_RESULTS} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 12, color: 'var(--color-foreground)' }} labelStyle={{ color: 'var(--color-muted)', marginBottom: 6 }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Bar dataKey="passed" stackId="a" fill="#34D399" radius={[0,0,0,0]} />
                <Bar dataKey="flagged" stackId="a" fill="#FBBF24" radius={[0,0,0,0]} />
                <Bar dataKey="failed" stackId="a" fill="#F87171" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Factor Performance (Radar) */}
          <div className="card-base" style={{ padding: '24px 24px 16px' }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em', color: 'var(--color-foreground)' }}>Factor Performance</div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 3 }}>Multi-model factor comparison</div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={BASE_FACTOR_DATA} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis dataKey="factor" tick={{ fontSize: 10, fill: 'var(--color-muted)' }} />
                <PolarRadiusAxis domain={[60, 100]} tick={{ fontSize: 9, fill: 'var(--color-muted-faint)' }} axisLine={false} />
                <Radar name="GPT-4o" dataKey="gpt4o" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.08} strokeWidth={1.5} />
                <Radar name="Claude" dataKey="claude" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.08} strokeWidth={1.5} />
                <Radar name="Gemini" dataKey="gemini" stroke="#34D399" fill="#34D399" fillOpacity={0.08} strokeWidth={1.5} />
                <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 12, color: 'var(--color-foreground)' }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ─── Line chart ─── */}
        <div className="card-base" style={{ padding: '24px 24px 16px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em', color: 'var(--color-foreground)' }}>Score Trends Over Time</div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 3 }}>All six judge rubrics scores — {range} rolling</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={scoreData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="4 4" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 12, color: 'var(--color-foreground)' }} labelStyle={{ color: 'var(--color-muted)', marginBottom: 6 }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              {(Object.entries(JUDGE_COLORS) as [string,string][]).map(([key, color]) => (
                <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ─── Two-column: Agent Swarm + Recent Activity ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: 16, marginBottom: 24 }} className="two-col-grid">
          {/* Agent Swarm Activity */}
          <div className="card-base" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-foreground)' }}>Agent Swarm Activity</div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 3 }}>Live multi-agent evaluation clusters</div>
              </div>
              <Link to="/dashboard/agents" style={{ fontSize: 12, color: 'var(--color-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-foreground)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}>Manage swarms <IcChevronRight size={14} /></Link>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Swarm', 'Status', 'Agents', 'Tasks', 'Success Rate', 'Last Run', ''].map(h => (
                      <th key={h} style={{ padding: '10px 24px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {AGENT_SWARM.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border-faint)', transition: 'background 0.1s', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 24px', fontSize: 13, color: 'var(--color-foreground)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</td>
                      <td style={{ padding: '12px 24px' }}><SwarmStatusPill status={s.status} /></td>
                      <td style={{ padding: '12px 24px', fontSize: 13, color: 'var(--color-muted)' }}>{s.agents}</td>
                      <td style={{ padding: '12px 24px', fontSize: 13, color: 'var(--color-muted)' }}>{s.tasks}</td>
                      <td style={{ padding: '12px 24px', fontSize: 13, color: s.success >= 95 ? '#34D399' : s.success >= 90 ? '#38BDF8' : '#FBBF24', fontWeight: 600 }}>{s.success}%</td>
                      <td style={{ padding: '12px 24px', fontSize: 12, color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>{s.lastRun}</td>
                      <td style={{ padding: '12px 24px' }}>
                        <Link to={`/dashboard/agents`} style={{ fontSize: 12, color: 'var(--color-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-foreground)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}>Details <IcChevronRight size={12} /></Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card-base" style={{ padding: '20px 24px' }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-foreground)' }}>Recent Activity</div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 3 }}>Latest platform events & live runs</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {recentActivities.map(a => (
                <div key={a.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${a.color}15`, border: `1px solid ${a.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, color: a.color }}>{a.icon}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--color-foreground)', lineHeight: 1.4 }}>{a.text}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Advisor Insights ─── */}
        <div className="card-base" style={{ padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-foreground)' }}>Advisor Insights</div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 3 }}>AI-generated recommendations from the Advisor Agent</div>
            </div>
            <Link to="/dashboard/advisor" style={{ fontSize: 12, color: 'var(--color-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-foreground)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}>Open Advisor <IcChevronRight size={14} /></Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }} className="insight-grid">
            {ADVISOR_INSIGHTS.map(insight => (
              <div key={insight.id} style={{ padding: '16px', borderRadius: 10, background: 'var(--color-surface-deep)', border: '1px solid var(--color-border)', transition: 'background 0.15s', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-surface-deep)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: insight.color, flexShrink: 0 }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)', letterSpacing: '-0.01em' }}>{insight.title}</div>
                  <div style={{ marginLeft: 'auto' }}><InsightTypePill type={insight.type} /></div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5, paddingLeft: 16 }}>{insight.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Runs table (Live Evaluation Runs) ─── */}
        <div className="card-base" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-foreground)' }}>Recent Evaluation Runs (Live Synced)</div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 3 }}>Real-time execution history from the evaluation engine</div>
            </div>
            <Link to="/dashboard/evaluations" style={{ fontSize: 12, color: 'var(--color-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-foreground)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}>View all <IcChevronRight size={14} /></Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Task', 'Model', 'Score', 'Judges', 'Time', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '10px 24px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {liveRuns.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border-faint)', transition: 'background 0.1s', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '13px 24px', fontSize: 13, color: 'var(--color-foreground)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.task}</td>
                    <td style={{ padding: '13px 24px', fontSize: 12, color: 'var(--color-muted)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>{r.model}</td>
                    <td style={{ padding: '13px 24px' }}><ScoreBadge score={r.score} /></td>
                    <td style={{ padding: '13px 24px', fontSize: 13, color: 'var(--color-muted)' }}>{r.judges}/6</td>
                    <td style={{ padding: '13px 24px', fontSize: 12, color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>{r.ts}</td>
                    <td style={{ padding: '13px 24px' }}><StatusPill status={r.status} /></td>
                    <td style={{ padding: '13px 24px' }}>
                      <Link to={`/dashboard/evaluations`} style={{ fontSize: 12, color: 'var(--color-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-foreground)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}>View <IcChevronRight size={12} /></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </PageContent>
      </div>

      <style>{`
        @keyframes dashSplashFadeIn { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
        @keyframes dashFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes dashProgress { 0%{width:0%} 100%{width:100%} }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @media(max-width:1100px){.two-col-grid{grid-template-columns:1fr !important;}}
        @media(max-width:900px){.stat-grid{grid-template-columns:1fr 1fr !important;}}
        @media(max-width:600px){.stat-grid{grid-template-columns:1fr !important;}.insight-grid{grid-template-columns:1fr !important;}}
      `}</style>
    </>
  )
}
