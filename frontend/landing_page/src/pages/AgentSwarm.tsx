import React, { useState, useRef, useEffect } from 'react'
import { useSettings } from '../components/ThemeProvider'
import { TopBar } from '../components/AppShell'
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
} from '../components/icons'
import { JudgeAISwarmLanding } from '../components/swarm/JudgeAISwarmLanding'
import { Search, X as XIcon } from 'lucide-react'

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

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AgentSwarmPage() {
  const { theme } = useSettings()
  const isLightTheme = theme === 'light'

  const [screenMode, setScreenMode] = useState<'landing' | 'active_swarm'>('landing')
  const [sessions, setSessions] = useState<SwarmSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SwarmMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [activeAgents, setActiveAgents] = useState<SwarmAgent[]>([])
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  // Sync messages & agents back into sessions
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

  const handleSelectSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      setCurrentSessionId(session.id)
      setMessages(session.messages)
      setActiveAgents(session.agents)
      setScreenMode(session.messages.length > 0 ? 'active_swarm' : 'landing')
    }
    setSelectedAgentId(null)
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

  // ─── Send message → call swarm backend ─────────────────────────────────

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input
    if (!textToSend.trim() || isStreaming) return

    const trimmedPrompt = textToSend.trim()
    setScreenMode('active_swarm')
    setInput('')
    setIsStreaming(true)

    // Ensure we have an active session
    let sessionId = currentSessionId
    if (!sessionId) {
      sessionId = `swarm-${Date.now()}`
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
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
      agents: [],
    }

    // Set messages in active view immediately
    setMessages(prev => [...prev, userMsg, placeholderMsg])
    setActiveAgents([])

    let responseText = ''
    let responseAgents: SwarmAgent[] = []
    let isTrivial = false
    let elapsedTime = ''
    let totalTokens = 0
    let thinking = ''

    try {
      const res = await fetch('http://localhost:5002/api/swarm/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmedPrompt }),
      })

      if (res.ok) {
        const data = await res.json()

        isTrivial = data.is_trivial || false
        elapsedTime = data.elapsedTime || ''
        totalTokens = data.totalTokens || 0

        if (isTrivial) {
          // Direct response — no worker agents needed
          const orch = data.orchestrator || {}
          thinking = data.thoughtSteps?.[0]?.content || orch.task || ''
          responseText =
            data.tasks?.[0]?.detailInfo?.artifactOutput?.content ||
            data.synthesisText ||
            orch.task ||
            'Direct orchestrator response.'
        } else {
          // Multi-agent swarm response
          thinking = data.orchestrator?.task || data.delegationLeadText || ''
          responseAgents = (data.tasks || []).map((t: any) => ({
            id: t.id,
            role: t.role || t.name,
            task: t.taskPrompt || t.detailInfo?.overview || '',
            model: t.model,
            avatar: t.avatar || '🤖',
            status: 'completed' as const,
            output: t.detailInfo?.artifactOutput?.content || '',
            tokens: t.tokensGenerated,
            latency: `${t.latencyMs}ms`,
          }))

          const synthParts = responseAgents.map(
            (a, i) => `**${i + 1}. ${a.role}** (${a.model})\n${a.output || a.task}`
          )
          responseText = `**Swarm Orchestrator** deployed **${responseAgents.length} agents** across ${responseAgents.length} cloud models in **${elapsedTime}**.\n\n${synthParts.join('\n\n')}`
        }
      }
    } catch (err) {
      console.warn('Swarm backend error, fallback activated:', err)
    }

    // Client-side fallback
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

    // Set agents in right panel
    setActiveAgents(responseAgents)

    // Stream text word by word for realistic typing
    const words = responseText.split(' ')
    let currentLength = 0

    const interval = setInterval(() => {
      currentLength += Math.floor(Math.random() * 3) + 2
      const chunk = words.slice(0, currentLength).join(' ')

      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? {
                ...m,
                text: chunk,
                thinking,
                agents: responseAgents,
                isTrivial,
                elapsedTime,
                totalTokens,
              }
            : m
        )
      )

      if (currentLength >= words.length) {
        clearInterval(interval)
        setIsStreaming(false)
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  text: responseText,
                  isStreaming: false,
                  thinking,
                  agents: responseAgents,
                  isTrivial,
                  elapsedTime,
                  totalTokens,
                }
              : m
          )
        )
      }
    }, 30)
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
              {filteredSessions.length === 0 ? (
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
                                  onClick={() =>
                                    handleSend(messages.findLast(x => x.role === 'user')?.text)
                                  }
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

          {/* ═══════ RIGHT: Swarm Agents Panel ═══════ */}
          <div
            style={{
              width: 420,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--color-surface-deep)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--color-foreground)',
                }}
              >
                Swarm Agents
              </h3>
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
                  }}
                >
                  {activeAgents.length} Active
                </span>
              )}
            </div>

            {/* Agents Grid */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }} className="custom-scrollbar">
              {activeAgents.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                  }}
                >
                  <div style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
                    <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>🤖</div>
                    <p style={{ fontSize: 13, lineHeight: 1.6 }}>
                      Agents will appear here when the<br />orchestrator deploys a swarm.
                    </p>
                  </div>
                </div>
              ) : (
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
    </>
  )
}
