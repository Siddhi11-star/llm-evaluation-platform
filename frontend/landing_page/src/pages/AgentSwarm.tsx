import { useState, useEffect, useRef } from 'react'
import { TopBar } from '../components/AppShell'
import {
  IcSparkles,
  IcCheck,
  IcChevronDown,
  IcPlay,
  IcPause,
  IcCpu,
  IcDownload,
  IcCopy,
  IcArrowRight,
  IcRotate,
  IcSearch,
  IcFilter,
  IcSend,
  IcMic,
  IcPlus,
  IcTrash,
} from '../components/icons'
import { MeshGradientSVG } from '../components/ui/shader-svg'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Swarm Models ───────────────────────────────────────────────────────────

export type SwarmModel = {
  id: string
  name: string
  provider: string
  tag: string
  badgeColor: string
  description: string
}

const MODELS: SwarmModel[] = [
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    tag: 'Recommended',
    badgeColor: '#7C3AED',
    description: 'Industry-leading code generation, analytical depth & formal verification',
  },
  {
    id: 'judgeai-swarm-core',
    name: 'JudgeAI Swarm Core',
    provider: 'JudgeAI',
    tag: 'Flagship',
    badgeColor: '#8B5CF6',
    description: '4-Agent parallel decomposition with 0% hallucination verification',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    tag: 'Multimodal',
    badgeColor: '#10A37F',
    description: 'High intelligence multimodal reasoning for complex tasks',
  },
  {
    id: 'gemini-2-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    tag: 'Fast',
    badgeColor: '#38BDF8',
    description: 'Ultra-low latency & cost-effective general task processing',
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    tag: 'Efficient',
    badgeColor: '#F59E0B',
    description: 'State-of-the-art open weight reasoning and mathematical precision',
  },
]

// ─── 4 Specialized Swarm Agents ─────────────────────────────────────────────

type SwarmAgent = {
  id: string
  name: string
  role: string
  avatar: string
  color: string
  assignedPacket: string
  status: 'idle' | 'decomposing' | 'executing' | 'verifying' | 'completed'
  progress: number
  logs: string[]
  outputSnippet: string
}

type SwarmHistoryItem = {
  id: string
  title: string
  updatedAt: string
  modelId: string
  prompt: string
}

const INITIAL_HISTORY: SwarmHistoryItem[] = [
  {
    id: 'sw-1',
    title: '100 Math Word Problem Benchmark',
    updatedAt: 'Just now',
    modelId: 'claude-3-5-sonnet',
    prompt: 'Generate 100 math word problems with step-by-step calculus & algebra proofs and 0% hallucination verification.',
  },
  {
    id: 'sw-2',
    title: 'SEC 10-K CapEx Multi-Page Audit',
    updatedAt: '2 hours ago',
    modelId: 'judgeai-swarm-core',
    prompt: 'Audit Fortune 500 annual 10-K filings for enterprise AI infrastructure capital expenditures with primary citations.',
  },
  {
    id: 'sw-3',
    title: 'Next.js Full-Stack App Vibe Coding',
    updatedAt: 'Yesterday',
    modelId: 'gpt-4o',
    prompt: 'Architect and generate a production-ready Next.js application with Tailwind styling, Prisma ORM schema, and JWT auth.',
  },
]

const QUICK_ACTIONS = [
  { icon: IcSparkles, label: 'Compare models', prompt: 'Evaluate GPT-4o vs Claude 3.5 Sonnet for code generation' },
  { icon: IcCheck, label: 'Reduce hallucination', prompt: 'How can I reduce hallucination in medical QA systems?' },
  { icon: IcCopy, label: 'Build a rubric', prompt: 'Draft a multi-criteria rubric for LLM output evaluation' },
  { icon: IcRotate, label: 'Cost efficiency', prompt: 'Compare cost efficiency across open vs closed source models' },
]

const INITIAL_4_AGENTS: SwarmAgent[] = [
  {
    id: 'agent-1',
    name: 'Architect Prime',
    role: 'Packet Decomposer & Schema Architect',
    avatar: '📐',
    color: '#8B5CF6',
    assignedPacket: 'Packet 1: Task Scope, Constraints & Boundary Axioms',
    status: 'completed',
    progress: 100,
    logs: [
      'Received major objective from orchestrator.',
      'Decomposed objective into 4 isolated compute packets.',
      'Constructed strict JSON verification schema.',
      'Dispatched Packet 2 to Deep Generator and Packet 3 to Citation Guard.',
    ],
    outputSnippet: JSON.stringify({
      packet_id: 'PKT-01',
      objective_decomposition: {
        total_sub_units: 4,
        constraint_mode: 'ZERO_HALLUCINATION',
        domain_parameters: ['kinematics', 'discrete_probability', 'quadratic_opt', 'calculus_rates'],
        target_format: 'JSON_SCHEMA_STRICT',
      },
    }, null, 2),
  },
  {
    id: 'agent-2',
    name: 'Deep Generator',
    role: 'Core Synthesis & Compute Specialist',
    avatar: '⚡',
    color: '#38BDF8',
    assignedPacket: 'Packet 2: Core Math & Reasoning Problem Generation',
    status: 'executing',
    progress: 85,
    logs: [
      'Processing generation stream for algebra & rate kinematics.',
      'Constructing step-by-step mathematical reasoning chains.',
      'Calculating exact collision coordinates and derivative rates.',
      'Streaming intermediate solution vectors to Citation Guard.',
    ],
    outputSnippet: JSON.stringify({
      packet_id: 'PKT-02',
      items_generated: 25,
      batch_sample: {
        problem: 'Two trains start simultaneously from Station A and B, 450 km apart, traveling toward each other at 60 km/h and 90 km/h. When and where do they meet?',
        step_1: 'Relative approach speed = 60 + 90 = 150 km/h',
        step_2: 'Time to intercept = 450 / 150 = 3.0 hours',
        step_3: 'Distance from Station A = 60 * 3.0 = 180 km',
        final_answer: '3 hours, 180 km from Station A',
      },
    }, null, 2),
  },
  {
    id: 'agent-3',
    name: 'Citation & Logic Guard',
    role: '0% Hallucination & Proof Verifier',
    avatar: '🛡️',
    color: '#34D399',
    assignedPacket: 'Packet 3: Double-Blind Proof Verification & Citation Check',
    status: 'executing',
    progress: 70,
    logs: [
      'Running formal verification on Packet 2 step-by-step derivations.',
      'Checking dimensional units and arithmetic boundary conditions.',
      'Cross-referencing primary reference dataset for collision proofs.',
      'Passed 23/25 items with 0 logic discrepancies.',
    ],
    outputSnippet: JSON.stringify({
      packet_id: 'PKT-03',
      verification_scorecard: {
        proof_soundness: '100% VALIDATED',
        hallucination_rate: '0.00%',
        boundary_violations: 0,
        confidence_interval: [0.994, 0.999],
      },
    }, null, 2),
  },
  {
    id: 'agent-4',
    name: 'Synthesis Lead',
    role: 'Packet Aggregator & Final Delivery',
    avatar: '📦',
    color: '#F43F5E',
    assignedPacket: 'Packet 4: Final JSON Assembly & Artifact Packaging',
    status: 'decomposing',
    progress: 45,
    logs: [
      'Awaiting verified vectors from Citation Guard.',
      'Formatting final normalized payload into strict dataset JSON array.',
      'Generating export bundles (CSV, JSON, Markdown).',
      'Preparing delivery package for user download.',
    ],
    outputSnippet: JSON.stringify({
      packet_id: 'PKT-04',
      assembly_status: 'IN_PROGRESS',
      validated_records_queued: 23,
      export_formats_ready: ['JSON', 'CSV', 'MARKDOWN'],
    }, null, 2),
  },
]

export default function AgentSwarm() {
  const [hasStarted, setHasStarted] = useState(false)
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [input, setInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [history, setHistory] = useState<SwarmHistoryItem[]>(INITIAL_4_AGENTS ? INITIAL_HISTORY : [])
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null)
  
  const [selectedModelId, setSelectedModelId] = useState<string>('claude-3-5-sonnet')
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [showTopModelDropdown, setShowTopModelDropdown] = useState(false)
  const [isListening, setIsListening] = useState(false)
  
  const [agents, setAgents] = useState<SwarmAgent[]>(INITIAL_4_AGENTS)
  const [selectedAgent, setSelectedAgent] = useState<SwarmAgent>(INITIAL_4_AGENTS[0])
  const [isRunning, setIsRunning] = useState(true)
  const [activeTab, setActiveTab] = useState<'packets' | 'logs' | 'output'>('packets')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [globalProgress, setGlobalProgress] = useState(75)

  const selectedModel = MODELS.find(m => m.id === selectedModelId) || MODELS[0]

  // Simulation timer for 4 agents working on the packets
  useEffect(() => {
    let timer: any
    if (hasStarted && isRunning) {
      timer = setInterval(() => {
        setAgents(prevAgents =>
          prevAgents.map(ag => {
            if (ag.progress >= 100) return ag
            const nextProgress = Math.min(100, ag.progress + Math.floor(Math.random() * 6) + 2)
            const nextStatus =
              nextProgress === 100 ? 'completed' : nextProgress > 60 ? 'verifying' : 'executing'
            return {
              ...ag,
              progress: nextProgress,
              status: nextStatus,
            }
          })
        )
      }, 1500)
    }
    return () => clearInterval(timer)
  }, [hasStarted, isRunning])

  // Recalculate global progress
  useEffect(() => {
    if (agents.length > 0) {
      const avg = Math.round(agents.reduce((acc, a) => acc + a.progress, 0) / agents.length)
      setGlobalProgress(avg)
    }
  }, [agents])

  const handleStartTask = (promptText?: string) => {
    const textToSend = promptText || input
    if (!textToSend.trim()) return

    const trimmed = textToSend.trim()
    setCurrentPrompt(trimmed)
    setInput('')
    setHasStarted(true)
    setIsRunning(true)

    // Add to history if new
    const newHistoryItem: SwarmHistoryItem = {
      id: `sw-${Date.now()}`,
      title: trimmed.length > 32 ? `${trimmed.slice(0, 32)}...` : trimmed,
      updatedAt: 'Just now',
      modelId: selectedModelId,
      prompt: trimmed,
    }
    setHistory(prev => [newHistoryItem, ...prev.filter(h => h.id !== activeHistoryId)])
    setActiveHistoryId(newHistoryItem.id)

    // Reset agents to initial progressing state for the new prompt
    setAgents(
      INITIAL_4_AGENTS.map((ag, idx) => ({
        ...ag,
        progress: idx === 0 ? 100 : idx === 1 ? 40 : idx === 2 ? 20 : 10,
        status: idx === 0 ? 'completed' : 'executing',
        logs: [
          `Received task: "${trimmed.slice(0, 60)}..."`,
          `Allocated Packet ${idx + 1} to ${ag.name}.`,
          'Executing parallel compute pipeline.',
        ],
      }))
    )
    setSelectedAgent(INITIAL_4_AGENTS[0])

    setToastMessage('Task decomposed into 4 parallel compute packets!')
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleNewChat = () => {
    setHasStarted(false)
    setCurrentPrompt('')
    setInput('')
    setActiveHistoryId(null)
  }

  const handleSelectHistory = (item: SwarmHistoryItem) => {
    setActiveHistoryId(item.id)
    setSelectedModelId(item.modelId)
    handleStartTask(item.prompt)
  }

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setHistory(prev => prev.filter(h => h.id !== id))
    if (activeHistoryId === id) {
      handleNewChat()
    }
  }

  const handleExportJSON = () => {
    const exportData = {
      major_prompt: currentPrompt || 'Default Math Benchmark Task',
      orchestration_model: selectedModel.name,
      total_agents: 4,
      global_progress: `${globalProgress}%`,
      execution_timestamp: new Date().toISOString(),
      agent_packets: agents.map(a => ({
        agent_name: a.name,
        role: a.role,
        packet: a.assignedPacket,
        progress: `${a.progress}%`,
        status: a.status,
        output_payload: JSON.parse(a.outputSample),
      })),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agent-swarm-packets-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    setToastMessage('Exported 4-Agent Swarm Packet JSON!')
    setTimeout(() => setToastMessage(null), 2500)
  }

  const filteredHistory = history.filter(h =>
    h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top Header Bar matching Chat */}
      <TopBar title="JudgeAI Chatbot">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {toastMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                padding: '5px 12px',
                borderRadius: 999,
                background: 'rgba(52,211,153,0.15)',
                color: '#34D399',
                border: '1px solid rgba(52,211,153,0.3)',
              }}
            >
              <IcCheck size={13} color="#34D399" />
              {toastMessage}
            </div>
          )}

          {/* Model Selector Pill in Top Right */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowTopModelDropdown(!showTopModelDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--color-surface-deep)',
                border: '1px solid var(--color-border)',
                borderRadius: 999,
                padding: '6px 14px',
                color: 'var(--color-foreground)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-surface-deep)')}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: selectedModel.badgeColor }} />
              <span>{selectedModel.name}</span>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: `${selectedModel.badgeColor}25`, color: selectedModel.badgeColor, fontWeight: 700 }}>
                {selectedModel.provider}
              </span>
              <IcChevronDown size={14} style={{ color: 'var(--color-muted)', marginLeft: 2 }} />
            </button>

            {showTopModelDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '115%',
                  right: 0,
                  width: 320,
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
                  zIndex: 100,
                  padding: 6,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', padding: '8px 10px 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Select Active Model
                </div>
                {MODELS.map(m => {
                  const isSelected = m.id === selectedModelId
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSelectedModelId(m.id)
                        setShowTopModelDropdown(false)
                        setToastMessage(`Switched engine to ${m.name}`)
                        setTimeout(() => setToastMessage(null), 2500)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(124,58,237,0.15)' : 'transparent',
                        border: isSelected ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
                        marginBottom: 2,
                      }}
                    >
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.badgeColor, marginTop: 4, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)' }}>{m.name}</span>
                          <span style={{ fontSize: 10, color: m.badgeColor, fontWeight: 600 }}>{m.tag}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.35, marginTop: 2 }}>{m.description}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </TopBar>

      {/* Main Container with Left History Sidebar & Center Stage */}
      <div style={{ display: 'flex', height: 'calc(100vh - 65px)', overflow: 'hidden' }}>
        
        {/* ═════════════════════════════════════════════════════════════════
            LEFT HISTORY SIDEBAR (EXACT MATCH TO CHAT PAGE)
            ═════════════════════════════════════════════════════════════════ */}
        <aside
          style={{
            width: 280,
            flexShrink: 0,
            borderRight: '1px solid var(--color-border)',
            background: 'var(--color-surface-deep)',
            display: 'flex',
            flexDirection: 'column',
          }}
          className="chat-history-sidebar"
        >
          {/* New Chat Action Button */}
          <div style={{ padding: '16px 14px 10px' }}>
            <button
              onClick={handleNewChat}
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
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--color-input-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  padding: '7px 10px 7px 32px',
                  fontSize: 12,
                  color: 'var(--color-foreground)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <IcSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
            </div>
          </div>

          {/* Conversations / Swarms History List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', padding: '8px 10px 6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              History
            </div>
            {filteredHistory.map(item => {
              const isActive = item.id === activeHistoryId
              const itemModel = MODELS.find(m => m.id === item.modelId) || selectedModel
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectHistory(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: isActive ? 'rgba(124,58,237,0.15)' : 'transparent',
                    border: isActive ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
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
                        color: isActive ? 'var(--color-foreground)' : 'var(--color-foreground)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: 3,
                      }}
                    >
                      {item.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: itemModel.badgeColor, fontWeight: 600 }}>{itemModel.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>• {item.updatedAt}</span>
                    </div>
                  </div>

                  <button
                    onClick={e => handleDeleteHistory(item.id, e)}
                    title="Delete"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-muted)',
                      cursor: 'pointer',
                      padding: 4,
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
                  >
                    <IcTrash size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        </aside>

        {/* ═════════════════════════════════════════════════════════════════
            RIGHT STAGE: INITIAL CHAT OR 2-PANE 4-AGENT SPLIT SCREEN
            ═════════════════════════════════════════════════════════════════ */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', background: 'var(--color-background)' }}>
          <AnimatePresence mode="wait">
            {!hasStarted ? (
              /* ===== Empty / Initial Welcome Mascot State (Matches Screenshot) ===== */
              <motion.div
                key="welcome-chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}
              >
                <div style={{ width: '100%', maxWidth: 680 }}>
                  
                  {/* Centered Cute Glowing Ghost Mascot & Title */}
                  <div style={{ textAlign: 'center', marginBottom: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <MeshGradientSVG size={145} />
                    </div>
                    <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 6px', color: 'var(--color-foreground)' }}>
                      Welcome to JudgeAI Chatbot
                    </h1>
                  </div>

                  {/* Centered Model Selector Pill */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18, position: 'relative' }}>
                    <button
                      onClick={() => setShowModelDropdown(!showModelDropdown)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'var(--color-surface-deep)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 999,
                        padding: '7px 14px',
                        color: 'var(--color-foreground)',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-surface-deep)')}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: selectedModel.badgeColor }} />
                      <span>{selectedModel.name}</span>
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: `${selectedModel.badgeColor}25`, color: selectedModel.badgeColor, fontWeight: 700 }}>
                        {selectedModel.provider}
                      </span>
                      <IcChevronDown size={14} style={{ color: 'var(--color-muted)', marginLeft: 2 }} />
                    </button>

                    {showModelDropdown && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '115%',
                          width: 320,
                          background: 'var(--color-card)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 12,
                          boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                          zIndex: 100,
                          padding: 6,
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', padding: '8px 10px 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Select Active Model
                        </div>
                        {MODELS.map(m => {
                          const isSelected = m.id === selectedModelId
                          return (
                            <div
                              key={m.id}
                              onClick={() => {
                                setSelectedModelId(m.id)
                                setShowModelDropdown(false)
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 10,
                                padding: '10px 12px',
                                borderRadius: 8,
                                cursor: 'pointer',
                                background: isSelected ? 'rgba(124,58,237,0.15)' : 'transparent',
                                border: isSelected ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
                                marginBottom: 2,
                                transition: 'background 0.15s',
                              }}
                              onMouseEnter={e => {
                                if (!isSelected) e.currentTarget.style.background = 'var(--color-hover)'
                              }}
                              onMouseLeave={e => {
                                if (!isSelected) e.currentTarget.style.background = 'transparent'
                              }}
                            >
                              <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.badgeColor, marginTop: 4, flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)' }}>{m.name}</span>
                                  <span style={{ fontSize: 10, color: m.badgeColor, fontWeight: 600 }}>{m.tag}</span>
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.35, marginTop: 2 }}>{m.description}</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Prompt Box Card matching Chat */}
                  <div className="card-base" style={{ padding: 12, borderRadius: 18 }}>
                    <textarea
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleStartTask()
                        }
                      }}
                      placeholder={`Message ${selectedModel.name}... (Shift+Enter for newline)`}
                      rows={3}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        padding: '8px 8px 4px',
                        fontSize: 14,
                        color: 'var(--color-foreground)',
                        outline: 'none',
                        fontFamily: 'Inter, sans-serif',
                        resize: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                      {/* Voice input control */}
                      <button
                        onClick={() => setIsListening(l => !l)}
                        title={isListening ? 'Stop voice input' : 'Start voice input'}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: isListening ? 'rgba(239,68,68,0.15)' : 'var(--color-surface-deep)',
                          border: `1px solid ${isListening ? 'rgba(239,68,68,0.4)' : 'var(--color-border)'}`,
                          color: isListening ? '#EF4444' : 'var(--color-muted)',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <IcMic size={15} />
                      </button>

                      <button
                        onClick={() => handleStartTask()}
                        disabled={!input.trim()}
                        className="pill-primary"
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          opacity: !input.trim() ? 0.35 : 1,
                          transition: 'opacity 0.15s',
                        }}
                      >
                        <IcSend size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Quick Action Pills matching Chat */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 20 }}>
                    {QUICK_ACTIONS.map(qa => {
                      const Icon = qa.icon
                      return (
                        <button
                          key={qa.label}
                          onClick={() => handleStartTask(qa.prompt)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 7,
                            padding: '9px 14px',
                            borderRadius: 999,
                            background: 'var(--color-card)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-foreground)',
                            fontSize: 12.5,
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(124,58,237,0.12)'
                            e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'var(--color-card)'
                            e.currentTarget.style.borderColor = 'var(--color-border)'
                          }}
                        >
                          <Icon size={13} style={{ opacity: 0.7 }} />
                          <span>{qa.label}</span>
                        </button>
                      )
                    })}
                  </div>

                </div>
              </motion.div>
            ) : (
              /* ===== Split Screen 2-Pane View when Swarm is Running ===== */
              <motion.div
                key="running-swarm"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                style={{
                  flex: 1,
                  padding: 20,
                  display: 'grid',
                  gridTemplateColumns: '380px 1fr',
                  gap: 18,
                  overflow: 'hidden',
                }}
              >
                {/* ─────────────────────────────────────────────────────────────
                    LEFT VERTICAL RECTANGLE: PROMPT & EXECUTION CONTEXT
                    ───────────────────────────────────────────────────────────── */}
                <div
                  className="card-base"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 0,
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      padding: '14px 18px',
                      borderBottom: '1px solid var(--color-border-faint)',
                      background: 'var(--color-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: globalProgress === 100 ? '#34D399' : '#8B5CF6',
                          boxShadow: `0 0 8px ${globalProgress === 100 ? '#34D399' : '#8B5CF6'}`,
                        }}
                      />
                      <span style={{ fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-foreground)' }}>
                        Task Objective
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: 'rgba(139, 92, 246, 0.15)',
                        color: 'var(--color-accent-violet)',
                      }}
                    >
                      4 Agents Active
                    </span>
                  </div>

                  {/* Main Scrollable Prompt View & Parameters */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '16px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                    }}
                  >
                    {/* Full Prompt Display Box */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                        Submitted Prompt
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          lineHeight: 1.55,
                          fontWeight: 500,
                          color: 'var(--color-foreground)',
                          background: 'var(--color-surface)',
                          padding: '14px 16px',
                          borderRadius: 10,
                          border: '1px solid var(--color-border-faint)',
                          whiteSpace: 'pre-wrap',
                          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                        }}
                      >
                        {currentPrompt || 'Generate 100 math word problems with step-by-step calculus & algebra proofs.'}
                      </div>
                    </div>

                    {/* Swarm Execution Parameters */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                        Execution Strategy
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border-faint)',
                            borderRadius: 8,
                            padding: '10px 12px',
                          }}
                        >
                          <div style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>Orchestrator</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-foreground)', marginTop: 2 }}>
                            {selectedModel.name}
                          </div>
                        </div>

                        <div
                          style={{
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border-faint)',
                            borderRadius: 8,
                            padding: '10px 12px',
                          }}
                        >
                          <div style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>Concurrency</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-accent-violet)', marginTop: 2 }}>
                            4 Parallel Workers
                          </div>
                        </div>

                        <div
                          style={{
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border-faint)',
                            borderRadius: 8,
                            padding: '10px 12px',
                          }}
                        >
                          <div style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>Hallucination Guard</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#34D399', marginTop: 2 }}>
                            0% Strict Proof
                          </div>
                        </div>

                        <div
                          style={{
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border-faint)',
                            borderRadius: 8,
                            padding: '10px 12px',
                          }}
                        >
                          <div style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>Execution Speed</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#38BDF8', marginTop: 2 }}>
                            4.5x Throughput
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Overall Swarm Telemetry */}
                    <div
                      style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border-faint)',
                        borderRadius: 10,
                        padding: '12px 14px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-foreground)' }}>
                          Overall Task Completion
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: globalProgress === 100 ? '#34D399' : 'var(--color-accent-violet)' }}>
                          {globalProgress}%
                        </span>
                      </div>

                      <div style={{ height: 6, borderRadius: 999, background: 'var(--color-surface-deep)', overflow: 'hidden', marginBottom: 8 }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${globalProgress}%`,
                            background: 'linear-gradient(90deg, #8B5CF6, #38BDF8, #34D399)',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-muted)' }}>
                        <span>4 Workstreams Active</span>
                        <span>0% Discrepancies</span>
                      </div>
                    </div>
                  </div>

                  {/* Left Bottom Quick Prompt Input */}
                  <div
                    style={{
                      padding: '12px 14px',
                      borderTop: '1px solid var(--color-border-faint)',
                      background: 'var(--color-surface)',
                    }}
                  >
                    <form
                      onSubmit={e => {
                        e.preventDefault()
                        if (input.trim()) handleStartTask()
                      }}
                      style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                    >
                      <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Refine or dispatch new prompt..."
                        style={{
                          flex: 1,
                          background: 'var(--color-input-bg)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 8,
                          padding: '8px 12px',
                          fontSize: 12.5,
                          color: 'var(--color-foreground)',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={!input.trim()}
                        className="pill-primary"
                        style={{
                          padding: '8px 14px',
                          borderRadius: 8,
                          opacity: !input.trim() ? 0.4 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: input.trim() ? 'pointer' : 'default',
                        }}
                      >
                        <IcSend size={13} />
                      </button>
                    </form>
                  </div>
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    RIGHT SQUARE CANVAS: 4 SPECIALIZED AGENTS WORKING IN PARALLEL
                    ───────────────────────────────────────────────────────────── */}
                <div
                  className="card-base"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 0,
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {/* Top Retro Computer Bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 20px',
                      borderBottom: '1px solid var(--color-border-faint)',
                      background: 'var(--color-surface)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>🖥️</span>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--color-foreground)' }}>
                          {selectedModel.name} · 4 Parallel Agents Working
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 6px #34D399' }} />
                          Active Stream: 4 Compute Packets in Flight (0% Hallucination Guard)
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={handleExportJSON}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--color-border)',
                          background: 'var(--color-surface-deep)',
                          color: 'var(--color-foreground)',
                          fontSize: 11.5,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <IcDownload size={13} /> Export JSON
                      </button>

                      <button
                        onClick={() => setIsRunning(!isRunning)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          background: 'var(--color-surface-deep)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-foreground)',
                          fontSize: 11.5,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {isRunning ? <IcPause size={12} /> : <IcPlay size={12} />}
                        {isRunning ? 'Pause' : 'Resume'}
                      </button>
                    </div>
                  </div>

                  {/* 2x2 Square Grid of 4 Specialized Agents */}
                  <div
                    style={{
                      flex: 1,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gridTemplateRows: 'repeat(2, 1fr)',
                      gap: 14,
                      padding: 16,
                      background: 'radial-gradient(ellipse at center, rgba(124, 58, 237, 0.04) 0%, transparent 70%)',
                      overflowY: 'auto',
                    }}
                  >
                    {agents.map((agent, i) => {
                      const isSelected = selectedAgent.id === agent.id
                      return (
                        <div
                          key={agent.id}
                          onClick={() => setSelectedAgent(agent)}
                          style={{
                            borderRadius: 14,
                            background: isSelected ? 'var(--color-surface)' : 'var(--color-card)',
                            border: `1.5px solid ${isSelected ? agent.color : 'var(--color-border-faint)'}`,
                            padding: 16,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: isSelected ? `0 0 20px ${agent.color}20` : 'none',
                          }}
                        >
                          {/* Top Header inside Agent Box */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div
                                  style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: 10,
                                    background: `${agent.color}15`,
                                    border: `1px solid ${agent.color}40`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 18,
                                  }}
                                >
                                  {agent.avatar}
                                </div>

                                <div>
                                  <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--color-foreground)' }}>
                                    {agent.name}
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                                    {agent.role}
                                  </div>
                                </div>
                              </div>

                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  background: `${agent.color}15`,
                                  color: agent.color,
                                  border: `1px solid ${agent.color}30`,
                                }}
                              >
                                Agent {i + 1}
                              </span>
                            </div>

                            <div
                              style={{
                                fontSize: 11.5,
                                color: 'var(--color-muted)',
                                lineHeight: 1.45,
                                marginBottom: 12,
                                background: 'var(--color-surface-deep)',
                                padding: '8px 10px',
                                borderRadius: 8,
                              }}
                            >
                              <span style={{ fontWeight: 600, color: 'var(--color-foreground)' }}>Packet Directive:</span> {agent.assignedPacket}
                            </div>
                          </div>

                          {/* Bottom Live Activity Feed & Progress */}
                          <div>
                            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ animation: 'spin 2s linear infinite' }}>⟳</span>
                              {agent.logs[agent.logs.length - 1]}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--color-surface-deep)', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${agent.progress}%`,
                                    background: agent.color,
                                    transition: 'width 0.3s ease',
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: agent.color }}>
                                {agent.progress}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Bottom Inspector Drawer for Selected Agent */}
                  <div
                    style={{
                      borderTop: '1px solid var(--color-border-faint)',
                      background: 'var(--color-surface)',
                      padding: '12px 18px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14 }}>{selectedAgent.avatar}</span>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-foreground)' }}>
                          {selectedAgent.name} · Live Packet Output & Telemetry
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        {(['packets', 'logs', 'output'] as const).map(tab => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                              padding: '3px 9px',
                              borderRadius: 6,
                              border: 'none',
                              background: activeTab === tab ? 'var(--color-nav-active-bg)' : 'transparent',
                              color: activeTab === tab ? 'var(--color-accent-violet)' : 'var(--color-muted)',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              textTransform: 'capitalize',
                            }}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div
                      style={{
                        background: 'var(--color-input-bg)',
                        borderRadius: 8,
                        border: '1px solid var(--color-border-faint)',
                        padding: 10,
                        maxHeight: 110,
                        overflowY: 'auto',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 11.5,
                        color: 'var(--color-foreground)',
                        lineHeight: 1.45,
                      }}
                    >
                      {activeTab === 'packets' && selectedAgent.assignedPacket}
                      {activeTab === 'logs' && selectedAgent.logs.join('\n')}
                      {activeTab === 'output' && selectedAgent.outputSnippet}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
