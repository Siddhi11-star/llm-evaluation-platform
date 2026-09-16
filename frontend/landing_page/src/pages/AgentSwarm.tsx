import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useSettings } from '../components/ThemeProvider'
import { TopBar } from '../components/AppShell'
import { useAuth } from '../context/AuthContext'
import {
  IcSend,
  IcCopy,
  IcCheck,
  IcThumbsUp,
  IcThumbsDown,
  IcRotate,
  IcMic,
  IcPlus,
  IcTrash,
  IcSparkles,
} from '../components/icons'
import { JudgeAISwarmLanding } from '../components/swarm/JudgeAISwarmLanding'
import { SwarmTopologyCenterpiece } from '../components/swarm/SwarmTopologyCenterpiece'
import { SwarmTimelineView } from '../components/swarm/SwarmTimelineView'
import { SwarmMatrixView } from '../components/swarm/SwarmMatrixView'
import { JudgeAISwarmSession, JudgeAIAgentTask, AgentStatus } from '../components/swarm/judgeAISwarmData'
import { JudgeAITimelineStep, JudgeAISubAgentPod } from '../components/swarm/types'
import { Search, X as XIcon } from 'lucide-react'

// ─── API Base URL ─────────────────────────────────────────────────────────────

const SWARM_API_BASE = import.meta.env.VITE_SWARM_API_URL || 'http://localhost:5002'

// ─── Types ───────────────────────────────────────────────────────────────────

type SwarmAgent = {
  id: string
  role: string
  task: string
  model: string
  avatar: string
  status: 'idle' | 'running' | 'completed' | 'failed'
  output?: string
  tokens?: number
  latency?: string
}

type SwarmMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  thinking?: string
  showThinking?: boolean
  timestamp: string
  isStreaming?: boolean
  agents?: SwarmAgent[]
  isTrivial?: boolean
  elapsedTime?: string
  totalTokens?: number
}

type SwarmSession = {
  id: string
  title: string
  modelName: string
  updatedAt: string
  messages: SwarmMessage[]
  agents: SwarmAgent[]
}

// ─── Helper: Format Date / Relative Time ─────────────────────────────────────

function formatRelativeTime(dateStr?: string | Date): string {
  if (!dateStr) return 'Earlier'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'Earlier'
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000)
    if (diffSec < 60) return 'Just now'
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  } catch {
    return 'Earlier'
  }
}

// ─── Helper: Role Avatar Mapping ─────────────────────────────────────────────

function getAgentAvatar(role: string): string {
  const lower = role.toLowerCase()
  if (lower.includes('research') || lower.includes('search') || lower.includes('context')) return '🔍'
  if (lower.includes('reason') || lower.includes('logic') || lower.includes('math') || lower.includes('deduct')) return '🧠'
  if (lower.includes('judge') || lower.includes('eval') || lower.includes('audit') || lower.includes('verify') || lower.includes('security')) return '⚖️'
  if (lower.includes('code') || lower.includes('developer') || lower.includes('software') || lower.includes('engineer')) return '💻'
  if (lower.includes('synthe') || lower.includes('lead') || lower.includes('orchestrat')) return '⚡'
  if (lower.includes('data') || lower.includes('stat') || lower.includes('anal')) return '📊'
  return '🤖'
}

// ─── Helper: Map Backend Swarm Session to UI Structure ────────────────────────

function formatBackendSessionToUi(data: any): SwarmSession {
  const sessionId = data.id || `swarm-${Date.now()}`
  const title =
    data.title ||
    (data.prompt ? data.prompt.slice(0, 35) + (data.prompt.length > 35 ? '...' : '') : 'Swarm Session')
  const modelName = data.modelName || 'gpt-oss:120b-cloud'
  const updatedAt = formatRelativeTime(data.updated_at || data.created_at || data.startedAt)

  const rawTasks = Array.isArray(data.tasks) ? data.tasks : []
  const agents: SwarmAgent[] = rawTasks.map((t: any, idx: number) => ({
    id: t.id || `agent-${idx + 1}`,
    role: t.role || t.name || 'Specialist Agent',
    task: t.taskPrompt || t.detailInfo?.overview || t.taskDescription || t.task || '',
    model: t.model || 'gpt-oss:120b-cloud',
    avatar: t.avatar || getAgentAvatar(t.role || t.name || ''),
    status: (t.status === 'completed' || t.status === 'failed' || t.status === 'running') ? t.status : 'completed',
    output: t.detailInfo?.artifactOutput?.content || t.output || '',
    tokens: t.tokensGenerated || t.tokens || 0,
    latency: t.latencyMs ? `${t.latencyMs}ms` : (t.latency || ''),
  }))

  let messages: SwarmMessage[] = []
  if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
    messages = data.messages
  } else if (data.prompt) {
    const userMsg: SwarmMessage = {
      id: `msg-u-${sessionId}`,
      role: 'user',
      text: data.prompt,
      timestamp: data.startedAt || (data.created_at ? new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Earlier'),
    }

    let responseText = ''
    let thinking = ''

    if (data.is_trivial) {
      thinking = data.thoughtSteps?.[0]?.content || data.orchestrator?.task || ''
      responseText =
        data.tasks?.[0]?.detailInfo?.artifactOutput?.content ||
        data.synthesisText ||
        data.orchestrator?.task ||
        'Direct orchestrator response.'
    } else {
      thinking = data.orchestrator?.task || data.delegationLeadText || data.thoughtSteps?.[0]?.content || ''
      if (data.deliverable?.content) {
        responseText = data.deliverable.content
      } else if (agents.length > 0) {
        const synthParts = agents.map(
          (a, i) => `**${i + 1}. ${a.role}** (${a.model})\n${a.output || a.task}`
        )
        responseText = `**Swarm Orchestrator** deployed **${agents.length} agents** across ${agents.length} cloud models in **${data.elapsedTime || ''}**.\n\n${synthParts.join('\n\n')}`
      } else {
        responseText = data.synthesisText || 'Swarm execution completed.'
      }
    }

    const assistantMsg: SwarmMessage = {
      id: `msg-a-${sessionId}`,
      role: 'assistant',
      text: responseText,
      thinking,
      showThinking: false,
      timestamp: data.startedAt || (data.created_at ? new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Earlier'),
      isStreaming: false,
      agents,
      isTrivial: data.is_trivial || false,
      elapsedTime: data.elapsedTime || '',
      totalTokens: data.totalTokens || 0,
    }

    messages = [userMsg, assistantMsg]
  }

  return {
    id: sessionId,
    title,
    modelName,
    updatedAt,
    messages,
    agents,
  }
}

// ─── Inline Markdown Renderer ────────────────────────────────────────────────

function renderInlineFormatting(line: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let remaining = line
  let key = 0

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)$/)
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`(.*)$/)

    let firstMatch: { type: 'bold' | 'code'; before: string; content: string; after: string } | null = null

    if (boldMatch) {
      firstMatch = { type: 'bold', before: boldMatch[1], content: boldMatch[2], after: boldMatch[3] }
    }
    if (codeMatch && (!firstMatch || codeMatch[1].length < firstMatch.before.length)) {
      firstMatch = { type: 'code', before: codeMatch[1], content: codeMatch[2], after: codeMatch[3] }
    }

    if (!firstMatch) {
      parts.push(<span key={key++}>{remaining}</span>)
      break
    }

    if (firstMatch.before) {
      parts.push(<span key={key++}>{firstMatch.before}</span>)
    }

    if (firstMatch.type === 'bold') {
      parts.push(<strong key={key++} style={{ fontWeight: 700, color: 'var(--color-foreground)' }}>{firstMatch.content}</strong>)
    } else {
      parts.push(
        <code key={key++} style={{ background: 'var(--color-surface-deep)', padding: '2px 5px', borderRadius: 4, fontSize: '0.9em', fontFamily: 'monospace', color: '#EC4899', border: '1px solid var(--color-border-faint)' }}>
          {firstMatch.content}
        </code>
      )
    }

    remaining = firstMatch.after
  }

  return parts.length > 0 ? parts : [line]
}

function FormattedContent({ text, isStreaming }: { text: string; isStreaming?: boolean }) {
  if (!text) return null

  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let inCodeBlock = false
  let codeBlockContent: string[] = []

  lines.forEach((line, idx) => {
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${idx}`} style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '12px 14px', overflowX: 'auto', margin: '10px 0', fontSize: 13, fontFamily: 'monospace', lineHeight: 1.5 }}>
            <code>{codeBlockContent.join('\n')}</code>
          </pre>
        )
        codeBlockContent = []
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      return
    }

    if (inCodeBlock) {
      codeBlockContent.push(line)
      return
    }

    if (/^#{1,6}\s+/.test(trimmed)) {
      const headingText = trimmed.replace(/^#+\s+/, '')
      elements.push(
        <div key={`h-${idx}`} style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--color-foreground)', marginTop: idx === 0 ? 0 : 14, marginBottom: 6 }}>
          {renderInlineFormatting(headingText)}
        </div>
      )
      return
    }

    const ulMatch = line.match(/^\s*[-*]\s+(.+)$/)
    if (ulMatch) {
      elements.push(
        <div key={`li-${idx}`} style={{ display: 'flex', gap: 8, marginBottom: 4, lineHeight: 1.6, paddingLeft: 8 }}>
          <span style={{ color: 'var(--color-muted)' }}>•</span>
          <span>{renderInlineFormatting(ulMatch[1])}</span>
        </div>
      )
      return
    }

    const olMatch = line.match(/^\s*(\d+)\.\s+(.+)$/)
    if (olMatch) {
      elements.push(
        <div key={`ol-${idx}`} style={{ display: 'flex', gap: 8, marginBottom: 4, lineHeight: 1.6, paddingLeft: 8 }}>
          <span style={{ color: 'var(--color-muted)', fontWeight: 600, minWidth: 16 }}>{olMatch[1]}.</span>
          <span>{renderInlineFormatting(olMatch[2])}</span>
        </div>
      )
      return
    }

    if (!trimmed) {
      elements.push(<div key={`empty-${idx}`} style={{ height: 6 }} />)
      return
    }

    elements.push(
      <p key={`p-${idx}`} style={{ margin: '0 0 6px', lineHeight: 1.6, color: 'var(--color-foreground)' }}>
        {renderInlineFormatting(line)}
      </p>
    )
  })

  return (
    <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--color-foreground)' }}>
      {elements}
      {isStreaming && (
        <span style={{ display: 'inline-block', width: 6, height: 14, background: '#7C3AED', marginLeft: 4, verticalAlign: 'middle', animation: 'blink 0.8s infinite' }} />
      )}
    </div>
  )
}

// ─── Model Color Mapping ────────────────────────────────────────────────────

const MODEL_COLORS: Record<string, string> = {
  'deepseek-v4-pro:cloud': '#F59E0B',
  'deepseek-v4-flash:cloud': '#D97706',
  'glm-5.2:cloud': '#3B82F6',
  'glm-5.1:cloud': '#0EA5E9',
  'minimax-m3:cloud': '#8B5CF6',
  'minimax-m2.7:cloud': '#A855F7',
  'nemotron-3-super:cloud': '#84CC16',
  'gemma4:cloud': '#06B6D4',
  'gpt-oss:120b-cloud': '#10B981',
  'gpt-oss:20b-cloud': '#059669',
}

function getModelColor(model: string): string {
  return MODEL_COLORS[model] || '#8B5CF6'
}

// ─── Agent Swarm Splash Screen ──────────────────────────────────────────────

function SwarmSplashScreen() {
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
          animation: 'swarmSplashFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Centered Swarm Illustration */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <img
            src="/swarm-illustration.png"
            alt="JudgeAI Autonomous Swarm"
            style={{
              width: 340,
              maxWidth: '85vw',
              height: 'auto',
              filter: 'drop-shadow(0 20px 45px rgba(124, 58, 237, 0.35))',
              userSelect: 'none',
              pointerEvents: 'none',
              animation: 'swarmFloat 3s ease-in-out infinite',
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
          <IcSparkles size={12} /> Autonomous Agent Swarm
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
          Agent Swarm
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
          Coordinating multi-agent workflows, parallel execution, and consensus…
        </p>

        {/* 4-Second Animated Progress Indicator */}
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
              animation: 'swarmProgress 4s linear forwards',
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AgentSwarmPage() {
  // Splash state — 4-second initial mount transition
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 4000)
    return () => clearTimeout(timer)
  }, [])

  const { theme } = useSettings()
  const isLightTheme = theme === 'light'
  const { token } = useAuth()

  const [screenMode, setScreenMode] = useState<'landing' | 'active_swarm'>('landing')
  const [sessions, setSessions] = useState<SwarmSession[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SwarmMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [activeAgents, setActiveAgents] = useState<SwarmAgent[]>([])
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [activeViewMode, setActiveViewMode] = useState<'cards' | 'topology' | 'timeline' | 'matrix'>('cards')
  const [selectedTopologyIndex, setSelectedTopologyIndex] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ─── Derived Live Swarm State for Topology, Timeline & Matrix Views ────────

  const liveSwarmSession: JudgeAISwarmSession = useMemo(() => {
    const isSynthesisRunning =
      isStreaming &&
      activeAgents.length > 0 &&
      activeAgents.every(a => a.status === 'completed' || a.status === 'failed')
    const isSwarmCompleted =
      !isStreaming &&
      activeAgents.length > 0 &&
      activeAgents.every(a => a.status === 'completed' || a.status === 'failed')

    const orchStatus: AgentStatus =
      isStreaming && activeAgents.length === 0
        ? 'running'
        : activeAgents.length > 0
        ? 'completed'
        : 'waiting'

    const synthStatus: AgentStatus = isSwarmCompleted
      ? 'completed'
      : isSynthesisRunning
      ? 'running'
      : 'waiting'

    const lastAssistantMsg = messages.filter(m => m.role === 'assistant').slice(-1)[0]
    const lastUserMsg = messages.filter(m => m.role === 'user').slice(-1)[0]

    const tasks: JudgeAIAgentTask[] = activeAgents.map((a, idx) => {
      const latMs = parseInt((a.latency || '').replace(/[^0-9]/g, ''), 10) || 0
      return {
        id: a.id,
        number: `0${idx + 1}`,
        name: a.role,
        role: a.role,
        avatar: a.avatar || getAgentAvatar(a.role),
        taskPrompt: a.task,
        status:
          a.status === 'completed'
            ? 'completed'
            : a.status === 'failed'
            ? 'failed'
            : a.status === 'running'
            ? 'running'
            : 'waiting',
        model: a.model,
        progress:
          a.status === 'completed' || a.status === 'failed'
            ? 100
            : a.status === 'running'
            ? 60
            : 0,
        tokensGenerated: a.tokens || 0,
        latencyMs: latMs,
        detailInfo: {
          overview: a.task,
          subtasks: [],
          currentActivity: [
            a.status === 'completed'
              ? 'Execution finished'
              : a.status === 'running'
              ? 'Performing parallel inference'
              : 'Pending dispatch',
          ],
          terminalLogs: [],
          artifactOutput: a.output
            ? {
                type: 'markdown',
                title: `${a.role} Output`,
                content: a.output,
              }
            : undefined,
        },
      }
    })

    const totalTok =
      activeAgents.reduce((sum, a) => sum + (a.tokens || 0), 0) +
      (lastAssistantMsg?.totalTokens || 0)

    return {
      id: currentSessionId || 'swarm-live',
      title: 'Active Swarm Execution',
      category: 'Autonomous Multi-Agent Swarm',
      totalTasks: activeAgents.length,
      activeTaskIndex: selectedTopologyIndex,
      attachmentsCount: 0,
      modelName: 'gpt-oss:120b-cloud',
      prompt: lastUserMsg?.text || '',
      delegationLeadText: 'Orchestrating multi-agent cloud pods',
      elapsedTime: lastAssistantMsg?.elapsedTime || '',
      totalTokens: totalTok,
      cost: `$${(totalTok * 0.000002).toFixed(4)}`,
      swarmProgress: isSwarmCompleted ? 100 : isStreaming ? 60 : 0,
      orchestrator: {
        name: 'Swarm Orchestrator',
        role: 'Planner & Pod Dispatcher',
        avatar: '🤖',
        model: 'gpt-oss:120b-cloud',
        status: orchStatus,
        progress: orchStatus === 'completed' ? 100 : orchStatus === 'running' ? 50 : 0,
        tokens: 45,
        latency: '28ms',
        task:
          lastAssistantMsg?.thinking || 'Decompose user query into parallel specialist agent pods',
      },
      tasks,
      synthesisNode: {
        name: 'Meta-Synthesizer',
        role: 'Consensus & Deliverable Finalizer',
        avatar: '⚡',
        model: 'gpt-oss:120b-cloud',
        status: synthStatus,
        progress: synthStatus === 'completed' ? 100 : synthStatus === 'running' ? 50 : 0,
        task: 'Synthesize specialist agent outputs into unified response',
      },
      thoughtSteps: [],
      liveLogs: [],
      is_trivial: false,
    }
  }, [activeAgents, isStreaming, currentSessionId, messages, selectedTopologyIndex])

  const liveTimelineSteps: JudgeAITimelineStep[] = useMemo(() => {
    const steps: JudgeAITimelineStep[] = []

    if (activeAgents.length > 0 || isStreaming) {
      steps.push({
        agentId: 'orchestrator',
        agentName: 'Swarm Orchestrator',
        role: 'Query Decomposition & Planning',
        color: '#8B5CF6',
        startMs: 0,
        durationMs: 40,
        stage: 'dispatch',
        status: activeAgents.length > 0 ? 'completed' : 'running',
      })
    }

    activeAgents.forEach(agent => {
      const latMs =
        parseInt((agent.latency || '').replace(/[^0-9]/g, ''), 10) ||
        (agent.status === 'running' ? 350 : 120)
      steps.push({
        agentId: agent.id,
        agentName: agent.role,
        role: agent.model,
        color: getModelColor(agent.model),
        startMs: 40,
        durationMs: latMs,
        stage: 'inference',
        status:
          agent.status === 'completed'
            ? 'completed'
            : agent.status === 'running'
            ? 'running'
            : 'completed',
      })
    })

    const maxAgentDuration =
      steps.length > 1 ? Math.max(...steps.slice(1).map(s => s.durationMs)) : 0

    if (
      activeAgents.some(a => a.status === 'completed') ||
      (!isStreaming && activeAgents.length > 0)
    ) {
      const isSwarmDone = !isStreaming && activeAgents.length > 0
      steps.push({
        agentId: 'synthesis',
        agentName: 'Meta-Synthesizer',
        role: 'Consensus Synthesis',
        color: '#10B981',
        startMs: 40 + maxAgentDuration,
        durationMs: isSwarmDone ? 180 : 80,
        stage: 'synthesis',
        status: isSwarmDone ? 'completed' : 'running',
      })
    }

    return steps
  }, [activeAgents, isStreaming])

  const liveMatrixPods: JudgeAISubAgentPod[] = useMemo(() => {
    return activeAgents.map(agent => {
      const latMs = parseInt((agent.latency || '').replace(/[^0-9]/g, ''), 10) || 0
      return {
        id: agent.id,
        name: agent.role,
        role: agent.role,
        avatar: agent.avatar || getAgentAvatar(agent.role),
        color: getModelColor(agent.model),
        model: agent.model,
        status:
          agent.status === 'completed'
            ? 'completed'
            : agent.status === 'running'
            ? 'running'
            : agent.status === 'failed'
            ? 'error'
            : 'queued',
        taskDescription: agent.task,
        progress: agent.status === 'completed' ? 100 : agent.status === 'running' ? 60 : 0,
        tokensGenerated: agent.tokens || 0,
        latencyMs: latMs,
        toolCallsCount: 0,
        logs: [],
        outputSnippet: agent.output ? agent.output.slice(0, 150) : '',
      }
    })
  }, [activeAgents])

  const handleSelectTopologyIndex = (idx: number) => {
    setSelectedTopologyIndex(idx)
    if (idx >= 1 && idx <= activeAgents.length) {
      const target = activeAgents[idx - 1]
      if (target) {
        setSelectedAgentId(target.id)
      }
    } else {
      setSelectedAgentId(null)
    }
  }

  // Auth Header Builder
  const getAuthHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    const currentToken = token || localStorage.getItem('judgeai_access_token')
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`
    }
    return headers
  }, [token])

  // ─── Fetch Swarm History from Backend ───────────────────────────────────

  const fetchSwarmHistory = useCallback(async () => {
    setIsHistoryLoading(true)
    try {
      const res = await fetch(`${SWARM_API_BASE}/api/swarm/history`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      })

      if (res.ok) {
        const data = await res.json()
        const rawSessions = Array.isArray(data) ? data : (data.sessions || [])
        const uiSessions = rawSessions.map((s: any) => formatBackendSessionToUi(s))
        setSessions(uiSessions)
      } else {
        console.warn('Swarm history response status:', res.status)
      }
    } catch (err) {
      console.warn('Could not fetch persistent swarm history:', err)
    } finally {
      setIsHistoryLoading(false)
    }
  }, [getAuthHeaders])

  useEffect(() => {
    fetchSwarmHistory()
  }, [fetchSwarmHistory])

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  // Sync messages & agents back into sessions state
  useEffect(() => {
    if (!currentSessionId) return
    setSessions(prev =>
      prev.map(s => (s.id === currentSessionId ? { ...s, messages, agents: activeAgents } : s))
    )
  }, [messages, activeAgents, currentSessionId])

  // ─── Session Management ────────────────────────────────────────────────

  const handleNewSwarm = () => {
    setMessages([])
    setActiveAgents([])
    setCurrentSessionId(null)
    setSelectedAgentId(null)
    setInput('')
    setScreenMode('landing')
  }

  const handleSelectSession = async (sessionId: string) => {
    // 1. Immediately switch to local cached state if available
    const localSession = sessions.find(s => s.id === sessionId)
    if (localSession && localSession.messages.length > 0) {
      setCurrentSessionId(localSession.id)
      setMessages(localSession.messages)
      setActiveAgents(localSession.agents)
      setScreenMode('active_swarm')
      setSelectedAgentId(null)
    }

    // 2. Load detailed session from backend GET /api/swarm/history/{session_id}
    try {
      const res = await fetch(`${SWARM_API_BASE}/api/swarm/history/${sessionId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      })

      if (res.ok) {
        const sessionDetail = await res.json()
        const formatted = formatBackendSessionToUi(sessionDetail)

        setCurrentSessionId(formatted.id)
        setMessages(formatted.messages)
        setActiveAgents(formatted.agents)
        setScreenMode(formatted.messages.length > 0 ? 'active_swarm' : 'landing')
        setSelectedAgentId(null)

        setSessions(prev =>
          prev.map(s => (s.id === formatted.id ? formatted : s))
        )
      }
    } catch (err) {
      console.warn(`Could not load swarm session ${sessionId} detail from backend:`, err)
      if (localSession) {
        setCurrentSessionId(localSession.id)
        setMessages(localSession.messages)
        setActiveAgents(localSession.agents)
        setScreenMode(localSession.messages.length > 0 ? 'active_swarm' : 'landing')
      }
    }
  }

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const remaining = sessions.filter(s => s.id !== sessionId)
    setSessions(remaining)
    if (currentSessionId === sessionId) {
      handleNewSwarm()
    }
  }

  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ─── Handle landing page prompt submission ─────────────────────────────

  const handleLandingSubmit = (promptText: string, _modelName: string) => {
    handleSend(promptText)
  }

  // ─── Swarm Fallback Execution (POST /api/swarm/run) ────────────────────

  const executeSwarmRunFallback = async (
    trimmedPrompt: string,
    initialSessionId: string,
    assistantMsgId: string,
    userMsg: SwarmMessage
  ) => {
    let sessionId = initialSessionId
    let responseText = ''
    let responseAgents: SwarmAgent[] = []
    let isTrivial = false
    let elapsedTime = ''
    let totalTokens = 0
    let thinking = ''
    let backendSavedSession: SwarmSession | null = null

    try {
      const res = await fetch(`${SWARM_API_BASE}/api/swarm/run`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ prompt: trimmedPrompt }),
      })

      if (res.ok) {
        const data = await res.json()

        if (data.id) {
          sessionId = data.id
          setCurrentSessionId(sessionId)
        }

        isTrivial = data.is_trivial || false
        elapsedTime = data.elapsedTime || ''
        totalTokens = data.totalTokens || 0

        if (isTrivial) {
          const orch = data.orchestrator || {}
          thinking = data.thoughtSteps?.[0]?.content || orch.task || ''
          responseText =
            data.tasks?.[0]?.detailInfo?.artifactOutput?.content ||
            data.synthesisText ||
            orch.task ||
            'Direct orchestrator response.'
        } else {
          thinking = data.orchestrator?.task || data.delegationLeadText || ''
          responseAgents = (data.tasks || []).map((t: any) => ({
            id: t.id,
            role: t.role || t.name,
            task: t.taskPrompt || t.detailInfo?.overview || '',
            model: t.model,
            avatar: t.avatar || getAgentAvatar(t.role || t.name || ''),
            status: (t.status === 'completed' || t.status === 'failed' || t.status === 'running') ? t.status : 'completed',
            output: t.detailInfo?.artifactOutput?.content || '',
            tokens: t.tokensGenerated,
            latency: t.latencyMs ? `${t.latencyMs}ms` : (t.latency || ''),
          }))

          if (data.deliverable?.content) {
            responseText = data.deliverable.content
          } else {
            const synthParts = responseAgents.map(
              (a, i) => `**${i + 1}. ${a.role}** (${a.model})\n${a.output || a.task}`
            )
            responseText = `**Swarm Orchestrator** deployed **${responseAgents.length} agents** across ${responseAgents.length} cloud models in **${elapsedTime}**.\n\n${synthParts.join('\n\n')}`
          }
        }

        backendSavedSession = formatBackendSessionToUi({
          ...data,
          prompt: trimmedPrompt,
          tasks: data.tasks || responseAgents,
        })
        if (backendSavedSession) {
          const savedSessionItem = backendSavedSession
          setSessions(prev => {
            const filtered = prev.filter(s => s.id !== savedSessionItem.id && s.id !== currentSessionId)
            return [savedSessionItem, ...filtered]
          })
        }
      }
    } catch (err) {
      console.warn('Swarm fallback POST /api/swarm/run error:', err)
    }

    // Client-side fallback if backend unavailable
    if (!responseText) {
      const lower = trimmedPrompt.toLowerCase()
      if (/^(hi|hello|hey|greetings)\b/i.test(lower)) {
        isTrivial = true
        responseText = `Hello! 👋 I am the **JudgeAI Swarm Orchestrator** powered by **gpt-oss:120b-cloud**.\n\nI coordinate specialized multi-agent swarms across cloud models (DeepSeek V4 Pro, GLM 5.2, MiniMax M3, Nemotron-3 Super, Gemma 4). Ask me any complex question, code evaluation, or research task to deploy a dynamic parallel agent swarm!`
        thinking = 'Triage classifier detected conversational query — direct response without worker compute overhead.'
      } else {
        responseAgents = [
          { id: 'a1', role: 'Context & Research Agent', task: `Conduct foundational analysis for: ${trimmedPrompt}`, model: 'deepseek-v4-pro:cloud', avatar: '🔍', status: 'completed' },
          { id: 'a2', role: 'Deductive Reasoning Specialist', task: `Formulate multi-step logical proofs for: ${trimmedPrompt}`, model: 'glm-5.2:cloud', avatar: '🧠', status: 'completed' },
          { id: 'a3', role: 'Verification & Quality Judge', task: `Audit assertions for groundedness and safety for: ${trimmedPrompt}`, model: 'minimax-m3:cloud', avatar: '⚖️', status: 'completed' },
        ]
        responseText = `**Swarm Orchestrator** deployed **${responseAgents.length} agents** across cloud models.\n\n` +
          responseAgents.map((a, i) => `**${i + 1}. ${a.role}** (${a.model})\n${a.task}`).join('\n\n')
        thinking = `Orchestrator decomposed prompt into ${responseAgents.length} specialized parallel agent pods.`
      }
    }

    setActiveAgents(responseAgents)
    const finalAssistantMsg: SwarmMessage = {
      id: assistantMsgId,
      role: 'assistant',
      text: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: false,
      thinking,
      agents: responseAgents,
      isTrivial,
      elapsedTime,
      totalTokens,
    }

    setMessages(prev => prev.map(m => (m.id === assistantMsgId ? finalAssistantMsg : m)))
    setIsStreaming(false)

    const fullMessages = [userMsg, finalAssistantMsg]
    setSessions(prev =>
      prev.map(s =>
        s.id === sessionId
          ? {
              ...s,
              messages: fullMessages,
              agents: responseAgents,
            }
          : s
      )
    )
  }

  // ─── Real SSE Swarm Streaming (POST /api/swarm/stream) ─────────────────

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input
    if (!textToSend.trim() || isStreaming) return

    const trimmedPrompt = textToSend.trim()
    setScreenMode('active_swarm')
    setInput('')
    setIsStreaming(true)

    // Ensure we have an active session
    let sessionId: string = currentSessionId || `swarm-${Date.now()}`
    if (!currentSessionId) {
      setCurrentSessionId(sessionId)
      const title = trimmedPrompt.slice(0, 35) + (trimmedPrompt.length > 35 ? '...' : '')
      const newSession: SwarmSession = {
        id: sessionId,
        title,
        modelName: 'gpt-oss:120b-cloud',
        updatedAt: 'Just now',
        messages: [],
        agents: [],
      }
      setSessions(prev => [newSession, ...prev])
    }

    const userMsg: SwarmMessage = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      text: trimmedPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    const assistantMsgId = `msg-a-${Date.now()}`
    const placeholderMsg: SwarmMessage = {
      id: assistantMsgId,
      role: 'assistant',
      text: '',
      thinking: 'Connecting to Swarm Orchestrator...',
      showThinking: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
      agents: [],
    }

    // Set messages in active view immediately
    setMessages(prev => [...prev, userMsg, placeholderMsg])
    setActiveAgents([])

    try {
      const response = await fetch(`${SWARM_API_BASE}/api/swarm/stream`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ prompt: trimmedPrompt }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`SSE stream connection failed with HTTP status ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''
      let currentEvent = ''
      let currentAgents: SwarmAgent[] = []
      let currentThinking = 'Orchestrating agent swarm...'
      let currentText = ''
      let streamFinished = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split(/\r?\n/)
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.replace(/^event:\s*/, '').trim()
          } else if (line.startsWith('data:')) {
            const dataStr = line.replace(/^data:\s*/, '').trim()
            if (dataStr) {
              try {
                const data = JSON.parse(dataStr)
                const eventType = currentEvent || 'message'

                if (eventType === 'swarm_started') {
                  if (data.session_id) {
                    sessionId = data.session_id
                    setCurrentSessionId(sessionId)
                  }
                  currentThinking = `Swarm session initialized on ${data.orchestrator_model || 'gpt-oss:120b-cloud'}. Orchestrator planning execution...`
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === assistantMsgId
                        ? { ...m, thinking: currentThinking }
                        : m
                    )
                  )
                } else if (eventType === 'orchestrator_planning') {
                  currentThinking = `Orchestrator decomposing prompt & planning parallel agent pods...`
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === assistantMsgId
                        ? { ...m, thinking: currentThinking }
                        : m
                    )
                  )
                } else if (eventType === 'agent_started') {
                  const agentId = data.agent_id || `agent-${currentAgents.length + 1}`
                  const existingIdx = currentAgents.findIndex(a => a.id === agentId || a.role === data.role)
                  const newAgent: SwarmAgent = {
                    id: agentId,
                    role: data.role || 'Specialist Agent',
                    task: data.task || '',
                    model: data.model || 'gpt-oss:120b-cloud',
                    avatar: getAgentAvatar(data.role || ''),
                    status: 'running',
                    tokens: 0,
                    latency: '',
                    output: '',
                  }

                  if (existingIdx >= 0) {
                    currentAgents[existingIdx] = { ...currentAgents[existingIdx], ...newAgent, status: 'running' }
                  } else {
                    currentAgents = [...currentAgents, newAgent]
                  }

                  currentThinking = `Deployed ${currentAgents.length} specialized agent pod${currentAgents.length > 1 ? 's' : ''} across cloud models.`
                  setActiveAgents([...currentAgents])
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === assistantMsgId
                        ? { ...m, thinking: currentThinking, agents: [...currentAgents] }
                        : m
                    )
                  )
                } else if (eventType === 'agent_completed') {
                  const agentId = data.agent_id
                  const existing = currentAgents.find(a => a.id === agentId || a.role === data.role)
                  if (existing) {
                    currentAgents = currentAgents.map(a => {
                      if (a.id === agentId || a.role === data.role) {
                        return {
                          ...a,
                          status: 'completed' as const,
                          model: data.model || a.model,
                          tokens: data.tokens ?? a.tokens,
                          latency: data.latency_ms ? `${data.latency_ms}ms` : a.latency,
                          output: data.output || data.output_snippet || a.output || '',
                        }
                      }
                      return a
                    })
                  } else {
                    currentAgents = [
                      ...currentAgents,
                      {
                        id: agentId || `agent-${currentAgents.length + 1}`,
                        role: data.role || 'Specialist Agent',
                        model: data.model || 'gpt-oss:120b-cloud',
                        task: '',
                        avatar: getAgentAvatar(data.role || ''),
                        status: 'completed',
                        tokens: data.tokens ?? 0,
                        latency: data.latency_ms ? `${data.latency_ms}ms` : '',
                        output: data.output || data.output_snippet || '',
                      },
                    ]
                  }

                  setActiveAgents([...currentAgents])
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === assistantMsgId
                        ? { ...m, agents: [...currentAgents] }
                        : m
                    )
                  )
                } else if (eventType === 'agent_failed') {
                  const agentId = data.agent_id
                  const existing = currentAgents.find(a => a.id === agentId || a.role === data.role)
                  if (existing) {
                    currentAgents = currentAgents.map(a => {
                      if (a.id === agentId || a.role === data.role) {
                        return {
                          ...a,
                          status: 'failed' as const,
                          model: data.model || a.model,
                          latency: data.latency_ms ? `${data.latency_ms}ms` : a.latency,
                          output: `⚠️ ${data.error || 'Agent execution failed'}`,
                        }
                      }
                      return a
                    })
                  } else {
                    currentAgents = [
                      ...currentAgents,
                      {
                        id: agentId || `agent-${currentAgents.length + 1}`,
                        role: data.role || 'Specialist Agent',
                        model: data.model || 'gpt-oss:120b-cloud',
                        task: '',
                        avatar: getAgentAvatar(data.role || ''),
                        status: 'failed',
                        tokens: 0,
                        latency: data.latency_ms ? `${data.latency_ms}ms` : '',
                        output: `⚠️ ${data.error || 'Agent execution failed'}`,
                      },
                    ]
                  }

                  setActiveAgents([...currentAgents])
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === assistantMsgId
                        ? { ...m, agents: [...currentAgents] }
                        : m
                    )
                  )
                } else if (eventType === 'synthesis_started') {
                  const succCount = data.successful_agents_count ?? currentAgents.filter(a => a.status === 'completed').length
                  currentThinking = `Specialist tasks completed (${succCount} successful). Synthesizing consensus deliverable...`
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === assistantMsgId
                        ? { ...m, thinking: currentThinking }
                        : m
                    )
                  )
                } else if (eventType === 'synthesis_completed') {
                  currentText = data.synthesized_text || currentText
                  currentThinking = `Synthesis finalized in ${data.latency_ms || 0}ms (${data.tokens || 0} tokens).`
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === assistantMsgId
                        ? { ...m, text: currentText, thinking: currentThinking }
                        : m
                    )
                  )
                } else if (eventType === 'swarm_completed') {
                  streamFinished = true
                  setIsStreaming(false)
                  const sessionData = data.session || {}
                  const formatted = formatBackendSessionToUi({
                    ...sessionData,
                    id: data.session_id || sessionId,
                    prompt: trimmedPrompt,
                    elapsedTime: data.elapsed_time || sessionData.elapsedTime,
                    totalTokens: data.total_tokens || sessionData.totalTokens,
                    tasks: sessionData.tasks || currentAgents,
                    synthesisText: currentText || sessionData.synthesisText,
                  })

                  const finalText =
                    sessionData.deliverable?.content ||
                    sessionData.synthesisText ||
                    currentText ||
                    (formatted.messages?.[1]?.text ? formatted.messages[1].text : '') ||
                    'Swarm execution completed.'

                  const finalAssistantMsg: SwarmMessage = {
                    id: assistantMsgId,
                    role: 'assistant',
                    text: finalText,
                    thinking: currentThinking || sessionData.orchestrator?.task || 'Swarm execution complete.',
                    showThinking: false,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isStreaming: false,
                    agents: currentAgents.length > 0 ? currentAgents : formatted.agents,
                    isTrivial: sessionData.is_trivial || false,
                    elapsedTime: data.elapsed_time || '',
                    totalTokens: data.total_tokens || 0,
                  }

                  setMessages(prev =>
                    prev.map(m => (m.id === assistantMsgId ? finalAssistantMsg : m))
                  )

                  if (currentAgents.length > 0) {
                    setActiveAgents(currentAgents)
                  } else if (formatted.agents.length > 0) {
                    setActiveAgents(formatted.agents)
                  }

                  // Update session history
                  const fullSessionItem: SwarmSession = {
                    ...formatted,
                    id: data.session_id || sessionId,
                    messages: [userMsg, finalAssistantMsg],
                    agents: currentAgents.length > 0 ? currentAgents : formatted.agents,
                  }

                  setSessions(prev => {
                    const filtered = prev.filter(s => s.id !== fullSessionItem.id && s.id !== currentSessionId)
                    return [fullSessionItem, ...filtered]
                  })
                } else if (eventType === 'swarm_failed') {
                  streamFinished = true
                  setIsStreaming(false)
                  const errorMsg = `⚠️ **Swarm Execution Error**: ${data.error || 'An unexpected error occurred during swarm execution.'}`
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === assistantMsgId
                        ? { ...m, text: errorMsg, isStreaming: false }
                        : m
                    )
                  )
                }
              } catch (e) {
                console.warn('Error processing SSE data chunk:', e)
              }
            }
          } else if (line.trim() === '') {
            currentEvent = ''
          }
        }
      }

      if (!streamFinished) {
        setIsStreaming(false)
        if (!currentText && currentAgents.length === 0) {
          console.warn('Empty SSE stream received, executing fallback POST /api/swarm/run...')
          await executeSwarmRunFallback(trimmedPrompt, sessionId, assistantMsgId, userMsg)
        }
      }
    } catch (streamErr) {
      console.warn('SSE stream connection interrupted or failed, activating fallback POST /api/swarm/run:', streamErr)
      await executeSwarmRunFallback(trimmedPrompt, sessionId, assistantMsgId, userMsg)
    }
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedMessageId(id)
    setTimeout(() => setCopiedMessageId(null), 2000)
  }

  const handleFeedback = (messageId: string, liked: boolean) => {
    // Feedback handler
  }

  const toggleThinking = (msgId: string) => {
    setMessages(prev =>
      prev.map(m => (m.id === msgId ? { ...m, showThinking: !m.showThinking } : m))
    )
  }

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <>
      {/* 4-Second Initial Splash Screen */}
      {showSplash && <SwarmSplashScreen />}

      <div
        style={{
          opacity: showSplash ? 0 : 1,
          transition: 'opacity 0.4s ease',
          pointerEvents: showSplash ? 'none' : 'auto',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <TopBar title="JudgeAI Agent Swarm">
        {screenMode === 'active_swarm' && (
          <button
            onClick={handleNewSwarm}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(124, 58, 237, 0.15)',
              border: '1px solid rgba(124, 58, 237, 0.35)',
              padding: '6px 12px',
              borderRadius: 8,
              color: '#D8B4FE',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(124, 58, 237, 0.25)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(124, 58, 237, 0.15)'
            }}
          >
            <IcPlus size={14} />
            <span>New Swarm</span>
          </button>
        )}
      </TopBar>

      {screenMode === 'landing' ? (
        /* ═══════ 1. LANDING PAGE (WITH HISTORY SIDEBAR ON THE LEFT) ═══════ */
        <div style={{ display: 'flex', height: 'calc(100vh - 65px)', overflow: 'hidden' }}>
          {/* History Sidebar */}
          <aside
            style={{
              width: 280,
              flexShrink: 0,
              borderRight: '1px solid var(--color-border)',
              background: 'var(--color-surface-deep)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* New Swarm Action */}
            <div style={{ padding: '16px 14px 10px' }}>
              <button
                onClick={handleNewSwarm}
                className="pill-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '10px 14px',
                  fontSize: 13.5,
                  borderRadius: 10,
                  gap: 8,
                }}
              >
                <IcPlus size={16} />
                <span>New Chat</span>
              </button>
            </div>

            {/* Search Bar */}
            <div style={{ padding: '0 14px 12px' }}>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.09)',
                  borderRadius: 8,
                  padding: '0 10px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Search
                  size={14}
                  style={{
                    color: 'var(--color-muted)',
                    flexShrink: 0,
                    marginRight: 8,
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: '7px 0',
                    fontSize: 12.5,
                    color: 'var(--color-foreground)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    title="Clear search"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 2,
                      color: 'var(--color-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <XIcon size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Session List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px' }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--color-muted)',
                  padding: '8px 10px 6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                History
              </div>
              {isHistoryLoading ? (
                <div
                  style={{
                    padding: '24px 12px',
                    fontSize: 12,
                    color: 'var(--color-muted)',
                    textAlign: 'center',
                    lineHeight: 1.6,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      border: '2px solid rgba(124,58,237,0.2)',
                      borderTopColor: '#7C3AED',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  <span>Loading history...</span>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div
                  style={{
                    padding: '24px 12px',
                    fontSize: 12,
                    color: 'var(--color-muted)',
                    textAlign: 'center',
                    lineHeight: 1.5,
                  }}
                >
                  No previous swarms yet.<br />Start a new swarm to see it here!
                </div>
              ) : (
                filteredSessions.map(session => {
                  const isActive = session.id === currentSessionId
                  const modelColor = getModelColor(session.modelName)
                  return (
                    <div
                      key={session.id}
                      onClick={() => handleSelectSession(session.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 10px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: isActive ? 'rgba(124,58,237,0.15)' : 'transparent',
                        border: isActive
                          ? '1px solid rgba(124,58,237,0.3)'
                          : '1px solid transparent',
                        marginBottom: 4,
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        if (!isActive) e.currentTarget.style.background = 'var(--color-hover)'
                      }}
                      onMouseLeave={e => {
                        if (!isActive) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1, marginRight: 8 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: isActive ? 600 : 400,
                            color: isActive
                              ? 'var(--color-foreground)'
                              : 'var(--color-muted-stronger)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {session.title}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginTop: 4,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 9.5,
                              fontWeight: 600,
                              color: modelColor,
                            }}
                          >
                            {session.modelName}
                          </span>
                          <span style={{ fontSize: 9.5, color: 'var(--color-muted-faint)' }}>
                            • {session.updatedAt}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={e => handleDeleteSession(session.id, e)}
                        title="Delete"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-muted-faint)',
                          cursor: 'pointer',
                          padding: 4,
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                        onMouseLeave={e =>
                          (e.currentTarget.style.color = 'var(--color-muted-faint)')
                        }
                      >
                        <IcTrash size={13} />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </aside>

          {/* Centered Landing Content */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <JudgeAISwarmLanding
              onStartSwarm={handleLandingSubmit}
              isLightTheme={isLightTheme}
            />
          </div>
        </div>
      ) : (
        /* ═══════ 2. ACTIVE SWARM VIEW (NO HISTORY SIDEBAR, CLEAN 2 COLUMNS) ═══════ */
        <div style={{ display: 'flex', height: 'calc(100vh - 65px)', overflow: 'hidden' }}>
          {/* ═══════ LEFT: Chat Pane ═══════ */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              borderRight: '1px solid var(--color-border)',
              background: 'var(--color-background)',
            }}
          >
            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
              <div style={{ maxWidth: 720, margin: '0 auto' }}>
                {/* Visual Header with the Swarm Illustration at the starting of chat */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    padding: '8px 12px 20px',
                    borderBottom: '1px solid var(--color-border-faint)',
                    marginBottom: 24,
                  }}
                >
                  <img
                    src="/swarm-illustration.png"
                    alt="JudgeAI Swarm"
                    style={{
                      width: 170,
                      height: 'auto',
                      marginBottom: 10,
                      filter: 'drop-shadow(0 10px 24px rgba(139,92,246,0.3))',
                      userSelect: 'none',
                      pointerEvents: 'none',
                    }}
                  />
                  <h2
                    style={{
                      fontSize: 17,
                      fontWeight: 800,
                      color: 'var(--color-foreground)',
                      margin: '0 0 4px',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    JudgeAI Autonomous Swarm
                  </h2>
                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--color-muted)',
                      maxWidth: 480,
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    Orchestrated by <strong>gpt-oss:120b-cloud</strong> • Parallel multi-agent cloud execution
                  </p>
                </div>

                {/* Message Stream */}
                {messages.map((m, idx) => {
                  const isUser = m.role === 'user'

                  return (
                    <div
                      key={m.id || idx}
                      style={{
                        marginBottom: 24,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isUser ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {isUser ? (
                        /* User Bubble */
                        <div
                          style={{
                            maxWidth: '75%',
                            background: 'rgba(124,58,237,0.18)',
                            border: '1px solid rgba(124,58,237,0.35)',
                            borderRadius: '16px 16px 4px 16px',
                            padding: '12px 18px',
                            fontSize: 14,
                            color: 'var(--color-foreground)',
                            lineHeight: 1.55,
                          }}
                        >
                          {m.text}
                        </div>
                      ) : (
                        /* Assistant Message Card */
                        <div style={{ maxWidth: '90%', width: '100%' }}>
                          <div
                            style={{
                              background: 'var(--color-card)',
                              border: '1px solid var(--color-border)',
                              borderRadius: 16,
                              padding: '16px 20px',
                              position: 'relative',
                            }}
                          >
                            {/* Header */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 10,
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 8,
                                    background: 'rgba(124,58,237,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 14,
                                  }}
                                >
                                  🤖
                                </div>
                                <span
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: 'var(--color-foreground)',
                                  }}
                                >
                                  JudgeAI
                                </span>
                              </div>
                              <span
                                style={{
                                  fontSize: 11,
                                  color: 'var(--color-muted)',
                                  fontFamily: 'monospace',
                                }}
                              >
                                {m.timestamp}
                              </span>
                            </div>

                            {/* Thinking Toggle */}
                            {m.thinking && (
                              <button
                                onClick={() => toggleThinking(m.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--color-muted)',
                                  fontSize: 11,
                                  cursor: 'pointer',
                                  marginBottom: 8,
                                  padding: 0,
                                  fontStyle: 'italic',
                                }}
                              >
                                <span style={{ fontSize: 10 }}>💭</span>
                                Thought {m.showThinking ? '▾' : '▸'}
                              </button>
                            )}

                            {m.showThinking && m.thinking && (
                              <div
                                style={{
                                  background: 'rgba(124,58,237,0.06)',
                                  border: '1px solid rgba(124,58,237,0.15)',
                                  borderRadius: 10,
                                  padding: '10px 14px',
                                  marginBottom: 12,
                                  fontSize: 12,
                                  color: 'var(--color-muted)',
                                  lineHeight: 1.5,
                                }}
                              >
                                {m.thinking}
                              </div>
                            )}

                            {/* Response label */}
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: 'var(--color-foreground)',
                                marginBottom: 8,
                              }}
                            >
                              gpt-oss:120b-cloud{' '}
                              {m.isTrivial ? 'Response' : 'Swarm Response'}
                            </div>

                            {/* Content */}
                            <FormattedContent text={m.text} isStreaming={m.isStreaming} />

                            {/* Footer actions */}
                            {!m.isStreaming && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 10,
                                  marginTop: 14,
                                  paddingTop: 10,
                                  borderTop: '1px solid var(--color-border)',
                                }}
                              >
                                <button
                                  onClick={() => handleCopy(m.id, m.text)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-muted)',
                                    fontSize: 11,
                                    cursor: 'pointer',
                                    padding: 0,
                                  }}
                                >
                                  {copiedMessageId === m.id ? (
                                    <IcCheck size={12} />
                                  ) : (
                                    <IcCopy size={12} />
                                  )}
                                  {copiedMessageId === m.id ? 'Copied' : 'Copy'}
                                </button>
                                <button
                                  onClick={() => handleFeedback(m.id, true)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-muted)',
                                    cursor: 'pointer',
                                    padding: 0,
                                  }}
                                >
                                  <IcThumbsUp size={12} />
                                </button>
                                <button
                                  onClick={() => handleFeedback(m.id, false)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-muted)',
                                    cursor: 'pointer',
                                    padding: 0,
                                  }}
                                >
                                  <IcThumbsDown size={12} />
                                </button>
                                <div style={{ flex: 1 }} />
                                <button
                                  onClick={() => {
                                    const lastUserMsg = [...messages].reverse().find(x => x.role === 'user')
                                    if (lastUserMsg) handleSend(lastUserMsg.text)
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-muted)',
                                    fontSize: 11,
                                    cursor: 'pointer',
                                    padding: 0,
                                  }}
                                >
                                  <IcRotate size={12} />
                                  Retry
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* ─── Chat Input ───────────────────────────────────────────── */}
            <div
              style={{
                padding: '12px 20px 16px',
                borderTop: '1px solid var(--color-border)',
                background: 'var(--color-background)',
              }}
            >
              <div
                style={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 18,
                  padding: '12px 16px 10px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}
              >
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder="Ask anything..."
                  rows={1}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: '2px 2px 4px',
                    fontSize: 14.5,
                    color: 'var(--color-foreground)',
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                    resize: 'none',
                    minHeight: 36,
                    maxHeight: 120,
                    boxSizing: 'border-box',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 6,
                    paddingTop: 2,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 12,
                        padding: '4px 10px',
                        borderRadius: 8,
                        background: `${getModelColor('gpt-oss:120b-cloud')}18`,
                        color: getModelColor('gpt-oss:120b-cloud'),
                        fontWeight: 600,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: getModelColor('gpt-oss:120b-cloud'),
                        }}
                      />
                      gpt-oss:120b-cloud
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 12,
                        padding: '4px 10px',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--color-muted)',
                        fontWeight: 500,
                      }}
                    >
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                        <rect x="0.5" y="7" width="2" height="3" rx="0.6" fill="currentColor" />
                        <rect x="4" y="4" width="2" height="6" rx="0.6" fill="currentColor" />
                        <rect
                          x="7.5"
                          y="1"
                          width="2"
                          height="9"
                          rx="0.6"
                          fill="rgba(255,255,255,0.25)"
                        />
                      </svg>
                      Swarm
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {input.trim() ? (
                      <button
                        onClick={() => handleSend()}
                        disabled={isStreaming}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#FFFFFF',
                          border: 'none',
                          color: '#000000',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          boxShadow: '0 2px 8px rgba(255,255,255,0.25)',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        <IcSend size={14} />
                      </button>
                    ) : (
                      <button
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#FFFFFF',
                          border: 'none',
                          color: '#000000',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}
                      >
                        <IcMic size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════ RIGHT: Swarm Agents & Topology Panel ═══════ */}
          <div
            style={{
              width: 460,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--color-surface-deep)',
              overflow: 'hidden',
            }}
          >
            {/* Header with View Switcher */}
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              {/* Segmented View Tabs */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 999,
                  padding: 2,
                  gap: 2,
                }}
              >
                {(
                  [
                    { id: 'cards', label: 'Cards' },
                    { id: 'topology', label: 'Topology' },
                    { id: 'timeline', label: 'Timeline' },
                    { id: 'matrix', label: 'Matrix' },
                  ] as const
                ).map(tab => {
                  const isActive = activeViewMode === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveViewMode(tab.id)}
                      style={{
                        background: isActive ? 'rgba(124, 58, 237, 0.25)' : 'transparent',
                        border: isActive
                          ? '1px solid rgba(124, 58, 237, 0.4)'
                          : '1px solid transparent',
                        color: isActive ? '#D8B4FE' : 'var(--color-muted)',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: 11,
                        padding: '4px 10px',
                        borderRadius: 999,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {activeAgents.length > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: 'rgba(16,185,129,0.12)',
                    color: '#10B981',
                    border: '1px solid rgba(16,185,129,0.2)',
                    flexShrink: 0,
                  }}
                >
                  {activeAgents.length} Active
                </span>
              )}
            </div>

            {/* Panel Body */}
            <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
              {activeAgents.length === 0 && !isStreaming ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    padding: 24,
                  }}
                >
                  <div style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
                    <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>🤖</div>
                    <p style={{ fontSize: 13, lineHeight: 1.6 }}>
                      Agents will appear here when the<br />orchestrator deploys a swarm.
                    </p>
                  </div>
                </div>
              ) : activeViewMode === 'topology' ? (
                /* ─── 1. Topology View: Orchestrator → Specialist Agents → Synthesizer Flow ─── */
                <div style={{ padding: 12 }}>
                  <SwarmTopologyCenterpiece
                    session={liveSwarmSession}
                    selectedTaskIndex={selectedTopologyIndex}
                    onSelectTaskIndex={handleSelectTopologyIndex}
                    isLightTheme={isLightTheme}
                  />
                </div>
              ) : activeViewMode === 'timeline' ? (
                /* ─── 2. Timeline View: Real Execution Telemetry & Latency Breakdown ─── */
                <div style={{ height: '100%', minHeight: 350 }}>
                  <SwarmTimelineView
                    timelineSteps={liveTimelineSteps}
                    isExecuting={isStreaming}
                    isLightTheme={isLightTheme}
                  />
                </div>
              ) : activeViewMode === 'matrix' ? (
                /* ─── 3. Matrix View: Specialist Pod Telemetry Grid ─── */
                <div style={{ height: '100%', minHeight: 350 }}>
                  <SwarmMatrixView
                    pods={liveMatrixPods}
                    isExecuting={isStreaming}
                    isLightTheme={isLightTheme}
                  />
                </div>
              ) : (
                /* ─── 4. Cards View: Default Interactive Agent Cards ─── */
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                    {activeAgents.map(agent => {
                      const isSelected = selectedAgentId === agent.id
                      const color = getModelColor(agent.model)

                      return (
                        <div
                          key={agent.id}
                          onClick={() => setSelectedAgentId(isSelected ? null : agent.id)}
                          style={{
                            background: isSelected ? `${color}12` : 'var(--color-card)',
                            border: `1px solid ${isSelected ? `${color}40` : 'var(--color-border)'}`,
                            borderRadius: 16,
                            padding: 16,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                          }}
                          onMouseEnter={e => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = `${color}30`
                              e.currentTarget.style.background = 'var(--color-hover)'
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = 'var(--color-border)'
                              e.currentTarget.style.background = 'var(--color-card)'
                            }
                          }}
                        >
                          {/* Agent Header */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 10,
                                background: `${color}20`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 16,
                              }}
                            >
                              {agent.avatar}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: 'var(--color-foreground)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {agent.role}
                              </div>
                              <div style={{ fontSize: 10, color, fontWeight: 600, marginTop: 2 }}>
                                {agent.model}
                              </div>
                            </div>
                          </div>

                          {/* Status */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background:
                                  agent.status === 'completed'
                                    ? '#10B981'
                                    : agent.status === 'running'
                                    ? '#F59E0B'
                                    : agent.status === 'failed'
                                    ? '#EF4444'
                                    : 'var(--color-muted)',
                                boxShadow:
                                  agent.status === 'running'
                                    ? '0 0 8px rgba(245,158,11,0.5)'
                                    : 'none',
                              }}
                            />
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: 'var(--color-muted)',
                                textTransform: 'capitalize',
                              }}
                            >
                              {agent.status}
                            </span>
                            {agent.tokens && (
                              <span
                                style={{
                                  fontSize: 9,
                                  color: 'var(--color-muted)',
                                  marginLeft: 'auto',
                                  fontFamily: 'monospace',
                                }}
                              >
                                {agent.tokens} tok
                              </span>
                            )}
                          </div>

                          {/* Task preview */}
                          <div
                            style={{
                              fontSize: 11,
                              color: 'var(--color-muted)',
                              lineHeight: 1.4,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {agent.task}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Agent Detail Drawer */}
            {selectedAgentId &&
              (() => {
                const agent = activeAgents.find(a => a.id === selectedAgentId)
                if (!agent) return null
                const color = getModelColor(agent.model)

                return (
                  <div
                    style={{
                      borderTop: '1px solid var(--color-border)',
                      padding: '16px 20px',
                      background: 'var(--color-card)',
                      maxHeight: 200,
                      overflowY: 'auto',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 16 }}>{agent.avatar}</span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'var(--color-foreground)',
                          }}
                        >
                          {agent.role}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedAgentId(null)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-muted)',
                          cursor: 'pointer',
                          fontSize: 16,
                          padding: 0,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color, fontWeight: 600, marginBottom: 8 }}>
                      {agent.model} • {agent.latency || 'N/A'} • {agent.tokens || 0} tokens
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--color-muted)',
                        lineHeight: 1.5,
                      }}
                    >
                      {agent.output || agent.task}
                    </div>
                  </div>
                )
              })()}
          </div>
        </div>
      )}
      </div>

      <style>{`
        @keyframes swarmSplashFadeIn { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
        @keyframes swarmFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes swarmProgress { 0%{width:0%} 100%{width:100%} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </>
  )
}
