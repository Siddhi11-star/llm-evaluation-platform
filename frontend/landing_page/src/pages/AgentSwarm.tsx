import { useState, useEffect, useRef } from 'react'
import { TopBar, PageContent } from '../components/AppShell'
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
} from '../components/icons'
import { AnimatedAIChat } from '../components/ui/animated-ai-chat'
import { motion, AnimatePresence } from 'framer-motion'

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

type WorkPacket = {
  id: string
  packetNumber: number
  title: string
  assignedTo: string
  status: 'pending' | 'in_progress' | 'verified' | 'completed'
  progress: number
  description: string
  output: string
}

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
  const [agents, setAgents] = useState<SwarmAgent[]>(INITIAL_4_AGENTS)
  const [selectedAgent, setSelectedAgent] = useState<SwarmAgent>(INITIAL_4_AGENTS[0])
  const [isRunning, setIsRunning] = useState(true)
  const [activeTab, setActiveTab] = useState<'packets' | 'logs' | 'output'>('packets')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [globalProgress, setGlobalProgress] = useState(75)

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

  const handleStartTask = (promptText: string) => {
    if (!promptText.trim()) return
    setCurrentPrompt(promptText)
    setHasStarted(true)
    setIsRunning(true)

    // Reset agents to initial progressing state for the new prompt
    setAgents(
      INITIAL_4_AGENTS.map((ag, idx) => ({
        ...ag,
        progress: idx === 0 ? 100 : idx === 1 ? 40 : idx === 2 ? 20 : 10,
        status: idx === 0 ? 'completed' : 'executing',
        logs: [
          `Received new major task: "${promptText.slice(0, 60)}..."`,
          `Allocated Packet ${idx + 1} to ${ag.name}.`,
          'Executing parallel compute pipeline.',
        ],
      }))
    )
    setSelectedAgent(INITIAL_4_AGENTS[0])

    setToastMessage('Task decomposed into 4 parallel compute packets!')
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleResetToChat = () => {
    setHasStarted(false)
    setCurrentPrompt('')
  }

  const handleExportJSON = () => {
    const exportData = {
      major_prompt: currentPrompt || 'Default Math Benchmark Task',
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

  return (
    <>
      <TopBar title="Agent Swarm Orchestrator">
        {hasStarted && (
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

            <button
              onClick={handleExportJSON}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-foreground)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <IcDownload size={13} /> Export JSON
            </button>

            <button
              onClick={handleResetToChat}
              className="pill-primary"
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              + New Major Task
            </button>
          </div>
        )}
      </TopBar>

      <PageContent style={{ padding: '20px 24px', maxWidth: 1440, margin: '0 auto', minHeight: 'calc(100vh - 100px)' }}>
        <AnimatePresence mode="wait">
          {/* ═════════════════════════════════════════════════════════════════
              STATE 1: INITIAL CENTERED CHATBOX VIEW
              ═════════════════════════════════════════════════════════════════ */}
          {!hasStarted ? (
            <motion.div
              key="chat-screen"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{
                minHeight: '75vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <div style={{ width: '100%', maxWidth: 780, margin: '0 auto' }}>
                <AnimatedAIChat
                  title="Assign Major Task to Agent Swarm"
                  subtitle="Your prompt will be autonomously partitioned into 4 parallel compute packets across specialized sub-agents."
                  placeholder="e.g. Create a 100-question math & reasoning benchmark with formal step derivations and 0% hallucination verification..."
                  onTaskAssign={handleStartTask}
                />
              </div>

              {/* Sample Quick Presets */}
              <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                {[
                  'Generate 100 math word problems with step-by-step calculus & algebra proofs',
                  'Audit 50 SEC 10-K filings for enterprise AI CapEx with double-checked citations',
                  'Build a full-stack Next.js web application with JWT auth, Tailwind, and Prisma schema',
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleStartTask(preset)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 9999,
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border-faint)',
                      color: 'var(--color-muted)',
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--color-accent-violet)'
                      e.currentTarget.style.color = 'var(--color-foreground)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--color-border-faint)'
                      e.currentTarget.style.color = 'var(--color-muted)'
                    }}
                  >
                    ⚡ {preset}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            /* ═════════════════════════════════════════════════════════════════
                STATE 2: SPLIT SCREEN (LEFT VERTICAL RECTANGLE + RIGHT SQUARE CANVAS)
                ═════════════════════════════════════════════════════════════════ */
            <motion.div
              key="split-screen"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              style={{
                display: 'grid',
                gridTemplateColumns: '420px 1fr',
                gap: 20,
                height: 'calc(100vh - 130px)',
                minHeight: 650,
              }}
            >
              {/* ─────────────────────────────────────────────────────────────
                  LEFT VERTICAL RECTANGLE: PROMPT & PACKET WORKFLOW DETAILS
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
                  boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                }}
              >
                {/* Header with Task Directive */}
                <div
                  style={{
                    padding: '16px 18px',
                    borderBottom: '1px solid var(--color-border-faint)',
                    background: 'var(--color-surface)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: globalProgress === 100 ? '#34D399' : '#8B5CF6',
                          boxShadow: `0 0 8px ${globalProgress === 100 ? '#34D399' : '#8B5CF6'}`,
                        }}
                      />
                      <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted)' }}>
                        Major Task Directive
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: 'rgba(139, 92, 246, 0.15)',
                        color: 'var(--color-accent-violet)',
                      }}
                    >
                      4 Packets Allocated
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      lineHeight: 1.5,
                      fontWeight: 600,
                      color: 'var(--color-foreground)',
                      background: 'var(--color-background)',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--color-border-faint)',
                      maxHeight: 90,
                      overflowY: 'auto',
                    }}
                  >
                    {currentPrompt || 'Generate 100 math word problems with step-by-step calculus & algebra proofs.'}
                  </div>

                  {/* Global Progress Bar */}
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>
                      <span>Swarm Progress</span>
                      <span style={{ fontWeight: 700, color: 'var(--color-foreground)' }}>{globalProgress}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, background: 'var(--color-surface-deep)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${globalProgress}%`,
                          background: 'linear-gradient(90deg, #8B5CF6, #38BDF8, #34D399)',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* 4 Partitioned Compute Packets */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '4px 0 2px 2px' }}>
                    Partitioned Compute Packets
                  </div>

                  {agents.map((agent, index) => {
                    const isSelected = selectedAgent.id === agent.id
                    return (
                      <div
                        key={agent.id}
                        onClick={() => setSelectedAgent(agent)}
                        style={{
                          padding: 12,
                          borderRadius: 12,
                          background: isSelected ? 'var(--color-nav-active-bg)' : 'var(--color-surface)',
                          border: `1.5px solid ${isSelected ? agent.color : 'var(--color-border-faint)'}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: '50%',
                                background: `${agent.color}20`,
                                border: `1px solid ${agent.color}50`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 13,
                              }}
                            >
                              {agent.avatar}
                            </div>
                            <div>
                              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-foreground)' }}>
                                Packet {index + 1}: {agent.name}
                              </div>
                            </div>
                          </div>

                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: 6,
                              background:
                                agent.progress === 100
                                  ? 'rgba(52,211,153,0.15)'
                                  : 'rgba(139,92,246,0.15)',
                              color: agent.progress === 100 ? '#34D399' : agent.color,
                            }}
                          >
                            {agent.progress === 100 ? 'Verified' : `${agent.progress}%`}
                          </span>
                        </div>

                        <div style={{ fontSize: 11.5, color: 'var(--color-muted)', lineHeight: 1.4, marginBottom: 8 }}>
                          {agent.assignedPacket}
                        </div>

                        {/* Mini Packet Progress Bar */}
                        <div style={{ height: 4, borderRadius: 999, background: 'var(--color-surface-deep)', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${agent.progress}%`,
                              background: agent.color,
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
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
                      if (currentPrompt.trim()) handleStartTask(currentPrompt)
                    }}
                    style={{ display: 'flex', gap: 8 }}
                  >
                    <input
                      type="text"
                      value={currentPrompt}
                      onChange={e => setCurrentPrompt(e.target.value)}
                      placeholder="Modify or dispatch new prompt..."
                      style={{
                        flex: 1,
                        background: 'var(--color-input-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 12,
                        color: 'var(--color-foreground)',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        background: 'var(--color-accent-violet)',
                        border: 'none',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Run
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
                  boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
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
                        JudgeAI Swarm Core · 4 Parallel Agents Working
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 6px #34D399' }} />
                        Active Stream: 4 Compute Packets in Flight (0% Hallucination Guard)
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
      </PageContent>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
