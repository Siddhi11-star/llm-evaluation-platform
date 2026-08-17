import React, { useState, useEffect, useRef } from 'react'
import { TopBar } from '../components/AppShell'
import {
  IcPlus,
  IcPlay,
  IcPause,
  IcDownload,
  IcCopy,
  IcCheck,
  IcSparkles,
  IcChevronDown,
  IcSwarm,
  IcSend,
  IcEye,
  IcCpu,
  IcTable,
  IcDatabase,
  IcSearch,
  IcRotate,
  IcX,
} from '../components/icons'
import { motion, AnimatePresence } from 'framer-motion'

export type SwarmModel = {
  id: string
  name: string
  provider: string
  tag: string
  badgeColor: string
  description: string
}

export const MODELS: SwarmModel[] = [
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
    badgeColor: '#0284C7',
    description: 'High intelligence multimodal reasoning for complex tasks',
  },
  {
    id: 'gemini-2-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    tag: 'Ultra Fast',
    badgeColor: '#10B981',
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

export type AgentStage = 'waiting' | 'thinking' | 'working' | 'verifying' | 'synthesizing' | 'done'

export type SwarmNode = {
  id: string
  name: string
  handle: string
  role: string
  modelName: string
  avatar: string
  color: string
  stage: AgentStage
  progress: number
  tokensGenerated: number
  speed: string
  hallucinationRate: string
  confidenceScore: string
  isMain?: boolean
  description: string
  tools: Array<{ name: string; icon: string }>
  subTasks: Array<{ title: string; done: boolean }>
  assignedPacket: string
  packetConstraints: string
  logs: Array<{ time: string; text: string; level?: 'info' | 'success' | 'warn' }>
}

const INITIAL_NODES: SwarmNode[] = [
  {
    id: 'agent-1',
    name: 'Architect Prime',
    handle: '@ArchitectPrime',
    role: 'Decomposer & Schema Architect',
    modelName: 'Claude 3.5 Sonnet',
    avatar: '⚡',
    color: '#8B5CF6',
    stage: 'waiting',
    progress: 0,
    tokensGenerated: 0,
    speed: '88 tok/s',
    hallucinationRate: '0.00%',
    confidenceScore: '99.9%',
    isMain: true,
    description: 'Autonomous schema architect that decomposes tasks into formal dependency graphs and locks boundary constraints.',
    tools: [
      { name: 'Schema DAG Formulator', icon: '📐' },
      { name: 'Constraint Bounding Engine', icon: '🔒' },
      { name: 'Axiom Dependency Graph', icon: '🕸️' },
      { name: 'Zero-Hallucination Anchor', icon: '🛡️' },
    ],
    subTasks: [
      { title: 'Decompose prompt axioms & constraints', done: false },
      { title: 'Formulate dependency DAG schema', done: false },
      { title: 'Broadcast scope vectors to compute mesh', done: false },
    ],
    assignedPacket: 'Packet 1: Task Scope & Boundary Axioms',
    packetConstraints: 'Strict JSON schema decomposition with dependency DAG graph',
    logs: [
      { time: 'Ready', text: 'Standing by to decompose incoming user task prompt.', level: 'info' },
    ],
  },
  {
    id: 'agent-2',
    name: 'Deep Generator',
    handle: '@DeepGenerator',
    role: 'Core Synthesis & Compute Specialist',
    modelName: 'GPT-4o',
    avatar: '🧠',
    color: '#0284C7',
    stage: 'waiting',
    progress: 0,
    tokensGenerated: 0,
    speed: '96 tok/s',
    hallucinationRate: '0.00%',
    confidenceScore: '99.5%',
    description: 'Generates step-by-step mathematical proofs, closed-form derivations, and deep synthetic reasoning vectors.',
    tools: [
      { name: 'Calculus Proof Engine', icon: '∫' },
      { name: 'Symbolic Algebra Core', icon: '∑' },
      { name: 'Neural Code Generator', icon: '💻' },
    ],
    subTasks: [
      { title: 'Generate closed-form derivations', done: false },
      { title: 'Synthesize intermediate reasoning steps', done: false },
      { title: 'Compute unit test vectors', done: false },
    ],
    assignedPacket: 'Packet 2: Core Math & Reasoning Generation',
    packetConstraints: 'Exhaustive intermediate proofs with verifiable units',
    logs: [
      { time: 'Ready', text: 'Awaiting decomposed schema from Architect Prime.', level: 'info' },
    ],
  },
  {
    id: 'agent-3',
    name: 'Citation & Logic Guard',
    handle: '@CitationGuard',
    role: '0% Hallucination & Fact Verifier',
    modelName: 'JudgeAI Swarm Core',
    avatar: '🛡️',
    color: '#10B981',
    stage: 'waiting',
    progress: 0,
    tokensGenerated: 0,
    speed: '72 tok/s',
    hallucinationRate: '0.00%',
    confidenceScore: '99.9%',
    description: 'Performs double-blind verification against mathematical ground truth to guarantee zero phantom citations.',
    tools: [
      { name: 'Double-Blind Reviewer', icon: '⚖️' },
      { name: 'Ground Truth Anchor', icon: '📌' },
      { name: 'Axiom Proof Checker', icon: '✓' },
    ],
    subTasks: [
      { title: 'Double-blind truth comparison', done: false },
      { title: '0% Hallucination consistency audit', done: false },
      { title: 'Certify proofs with consensus stamp', done: false },
    ],
    assignedPacket: 'Packet 3: Double-Blind Proof Verification',
    packetConstraints: 'Double-blind review against mathematical ground truth',
    logs: [
      { time: 'Ready', text: 'Verification rules and ground truth anchors armed.', level: 'info' },
    ],
  },
  {
    id: 'agent-4',
    name: 'Synthesis Lead',
    handle: '@SynthesisLead',
    role: 'Package Aggregator & Final Delivery',
    modelName: 'DeepSeek V3',
    avatar: '📦',
    color: '#F43F5E',
    stage: 'waiting',
    progress: 0,
    tokensGenerated: 0,
    speed: '80 tok/s',
    hallucinationRate: '0.00%',
    confidenceScore: '99.8%',
    description: 'Aggregates validated streams, performs checksum verification, and compiles the final deliverable report.',
    tools: [
      { name: 'Artifact Packager', icon: '📦' },
      { name: 'Checksum Validator', icon: '🔑' },
      { name: 'Markdown Formatter', icon: '📄' },
    ],
    subTasks: [
      { title: 'Aggregate verified proof packets', done: false },
      { title: 'Perform JSON checksum validation', done: false },
      { title: 'Compile finalized markdown report', done: false },
    ],
    assignedPacket: 'Packet 4: Final Assembly & Packaging',
    packetConstraints: 'Structured JSON schema with checksum validation',
    logs: [
      { time: 'Ready', text: 'Assembly pipeline ready to compile validated outputs.', level: 'info' },
    ],
  },
]

const SWARM_TEMPLATES = [
  {
    id: 'task-1',
    title: '100 Calculus Word Problems',
    category: 'Reasoning & Calculus',
    prompt: 'Generate 100 math word problems with step-by-step calculus & algebra proofs and 0% hallucination verification.',
    modelId: 'claude-3-5-sonnet',
  },
  {
    id: 'task-2',
    title: 'SEC 10-K CapEx Audit',
    category: 'Finance & Compliance',
    prompt: 'Audit Fortune 500 annual 10-K filings for enterprise AI infrastructure capital expenditures with primary citations.',
    modelId: 'judgeai-swarm-core',
  },
  {
    id: 'task-3',
    title: 'Next.js App Architecture',
    category: 'Engineering',
    prompt: 'Architect and generate a production-ready Next.js application with Tailwind styling, Prisma ORM schema, and JWT auth.',
    modelId: 'gpt-4o',
  },
  {
    id: 'task-4',
    title: 'Medical Clinical Protocol',
    category: 'Healthcare',
    prompt: 'Evaluate clinical symptom triage responses against multi-criteria safety and diagnostic accuracy guidelines.',
    modelId: 'gemini-2-flash',
  },
]

export type ChatMessage = {
  id: string
  sender: 'user' | 'orchestrator' | 'agent'
  agentId?: string
  agentName?: string
  agentHandle?: string
  agentAvatar?: string
  agentColor?: string
  text: string
  time: string
  stage?: AgentStage
}

export default function AgentSwarm() {
  const [nodes, setNodes] = useState<SwarmNode[]>(INITIAL_NODES)
  const [selectedNodeId, setSelectedNodeId] = useState<string>('agent-1')
  const [hasActiveTask, setHasActiveTask] = useState<boolean>(false)
  const [inputTask, setInputTask] = useState<string>('')
  const [activePrompt, setActivePrompt] = useState<string>('')
  const [isRunning, setIsRunning] = useState<boolean>(true)
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1)
  const [selectedModelId, setSelectedModelId] = useState<string>('claude-3-5-sonnet')
  const [showModelDropdown, setShowModelDropdown] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false)
  const [showInspector, setShowInspector] = useState<boolean>(true)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [activeTab, setActiveTab] = useState<'editor' | 'executions' | 'output'>('editor')

  const chatContainerRef = useRef<HTMLDivElement>(null)

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0]
  const selectedModel = MODELS.find(m => m.id === selectedModelId) || MODELS[0]

  const globalProgress = Math.round(
    nodes.reduce((acc, a) => acc + a.progress, 0) / nodes.length
  )
  const isSwarmComplete = globalProgress === 100

  const activeNode = nodes.find(n => n.stage !== 'done' && n.stage !== 'waiting') || (isSwarmComplete ? nodes[3] : nodes[0])

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Scroll chat bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])

  // Swarm simulation loop: Thinking → Working → Verifying → Synthesizing → Done
  useEffect(() => {
    if (!hasActiveTask || !isRunning) return

    const intervalTime = Math.max(300, Math.floor(1150 / simulationSpeed))
    const timer = setInterval(() => {
      const nowStr = new Date().toLocaleTimeString().slice(3, 8)

      setNodes(prev => {
        let anyChanged = false

        const updated = prev.map((ag, idx) => {
          if (ag.progress >= 100) return ag

          if (idx === 1 && prev[0].progress < 35) {
            return {
              ...ag,
              stage: 'waiting' as AgentStage,
            }
          }
          if (idx === 2 && prev[1].progress < 35) {
            return {
              ...ag,
              stage: 'waiting' as AgentStage,
            }
          }
          if (idx === 3 && (prev[1].progress < 70 || prev[2].progress < 60)) {
            return {
              ...ag,
              stage: 'waiting' as AgentStage,
            }
          }

          anyChanged = true
          const increment = Math.floor(Math.random() * 8) + 6
          const nextProg = Math.min(100, ag.progress + increment)

          let nextStage: AgentStage = 'thinking'
          let thought = ''

          if (nextProg === 100) {
            nextStage = 'done'
            thought = 'Completed sub-tasks with 0.00% hallucination rate.'
          } else if (nextProg > 85) {
            nextStage = 'synthesizing'
            thought = idx === 3 ? 'Compiling deliverable payload...' : 'Synthesizing output stream...'
          } else if (nextProg > 60) {
            nextStage = 'verifying'
            thought = 'Performing formal double-blind verification...'
          } else if (nextProg > 20) {
            nextStage = 'working'
            thought = `Executing compute batch (${nextProg}%)...`
          } else {
            nextStage = 'thinking'
            thought = `Analyzing constraints (${nextProg}%)...`
          }

          const updatedSubTasks = ag.subTasks.map((st, sIdx) => ({
            ...st,
            done: nextProg >= (sIdx + 1) * 33 || nextProg === 100,
          }))

          let newLogs = [...ag.logs]
          if (nextProg === 100 && ag.progress < 100) {
            newLogs.push({ time: nowStr, text: `✓ [${ag.name}] Stage complete: 100% verified.`, level: 'success' })
          } else if (Math.random() > 0.6) {
            newLogs.push({ time: nowStr, text: `[${ag.name}] ${thought}`, level: 'info' })
          }

          return {
            ...ag,
            progress: nextProg,
            stage: nextStage,
            tokensGenerated: ag.tokensGenerated + Math.floor(Math.random() * 45) + 25,
            subTasks: updatedSubTasks,
            logs: newLogs.slice(-10),
          }
        })

        return updated
      })

      // Chat stream dialogue progression
      setChatMessages(prevMsgs => {
        const count = prevMsgs.length

        if (count === 2 && Math.random() > 0.35) {
          return [
            ...prevMsgs,
            {
              id: 'msg-1',
              sender: 'agent',
              agentId: 'agent-1',
              agentName: 'Architect Prime',
              agentHandle: '@ArchitectPrime',
              agentAvatar: '⚡',
              agentColor: '#8B5CF6',
              time: nowStr,
              stage: 'working',
              text: 'Decomposed the problem into 4 execution pipelines. Task boundaries, parameter bounds, and strict JSON schemas are locked. Dispatching schema to @DeepGenerator.',
            },
          ]
        }

        if (count === 3 && Math.random() > 0.35) {
          return [
            ...prevMsgs,
            {
              id: 'msg-2',
              sender: 'agent',
              agentId: 'agent-2',
              agentName: 'Deep Generator',
              agentHandle: '@DeepGenerator',
              agentAvatar: '🧠',
              agentColor: '#0284C7',
              time: nowStr,
              stage: 'working',
              text: 'Generated 25 closed-form intermediate proof derivations with step-by-step calculus proofs. Sending batch to @CitationGuard for formal verification.',
            },
          ]
        }

        if (count === 4 && Math.random() > 0.35) {
          return [
            ...prevMsgs,
            {
              id: 'msg-3',
              sender: 'agent',
              agentId: 'agent-3',
              agentName: 'Citation & Logic Guard',
              agentHandle: '@CitationGuard',
              agentAvatar: '🛡️',
              agentColor: '#10B981',
              time: nowStr,
              stage: 'verifying',
              text: 'Double-blind formal validation passed. 0.00% hallucination rate certified across all 25 units. Streaming verified vectors to @SynthesisLead.',
            },
          ]
        }

        if (count === 5 && Math.random() > 0.35) {
          return [
            ...prevMsgs,
            {
              id: 'msg-4',
              sender: 'agent',
              agentId: 'agent-4',
              agentName: 'Synthesis Lead',
              agentHandle: '@SynthesisLead',
              agentAvatar: '📦',
              agentColor: '#F43F5E',
              time: nowStr,
              stage: 'done',
              text: 'All validated packets compiled. Final multi-agent deliverable report and JSON schema artifact are assembled and verified with consensus (4/4 Nodes).',
            },
          ]
        }

        return prevMsgs
      })
    }, intervalTime)

    return () => clearInterval(timer)
  }, [hasActiveTask, isRunning, simulationSpeed])

  const handleStartTask = (taskPrompt: string, modelId?: string) => {
    if (!taskPrompt.trim()) return
    const prompt = taskPrompt.trim()
    const chosenModel = modelId || selectedModelId

    setInputTask('')
    setActivePrompt(prompt)
    setHasActiveTask(true)
    setIsRunning(true)
    if (modelId) setSelectedModelId(modelId)

    // Reset nodes
    setNodes([
      {
        ...INITIAL_NODES[0],
        stage: 'thinking',
        progress: 15,
        tokensGenerated: 320,
        logs: [
          { time: '00:01', text: `Initiated swarm run: "${prompt.slice(0, 40)}..."`, level: 'info' },
          { time: '00:02', text: 'Partitioned scope into 4 parallel pipelines.', level: 'success' },
        ],
      },
      {
        ...INITIAL_NODES[1],
        stage: 'waiting',
        progress: 0,
        tokensGenerated: 0,
      },
      {
        ...INITIAL_NODES[2],
        stage: 'waiting',
        progress: 0,
        tokensGenerated: 0,
      },
      {
        ...INITIAL_NODES[3],
        stage: 'waiting',
        progress: 0,
        tokensGenerated: 0,
      },
    ])

    // Initial chat
    setChatMessages([
      {
        id: `u-${Date.now()}`,
        sender: 'user',
        text: prompt,
        time: 'Just now',
      },
      {
        id: `o-${Date.now()}`,
        sender: 'orchestrator',
        text: `Multi-Agent Swarm activated on **${MODELS.find(m => m.id === chosenModel)?.name || 'Claude 3.5 Sonnet'}**. Canvas pipeline executing: Trigger ➔ Architect Prime ➔ Deep Generator ➔ Citation Guard ➔ Synthesis Lead.`,
        time: 'Just now',
        stage: 'thinking',
      },
    ])

    setSelectedNodeId('agent-1')
    triggerToast('🚀 Multi-Agent Workflow Activated!')
  }

  const handleResetWorkspace = () => {
    setHasActiveTask(false)
    setActivePrompt('')
    setInputTask('')
    setNodes(INITIAL_NODES)
    setChatMessages([])
    setSelectedNodeId('agent-1')
    triggerToast('Workflow reset to initial state')
  }

  const handleCopyDeliverable = () => {
    const text = generateFinalMarkdown(activePrompt, selectedModel.name, nodes)
    navigator.clipboard.writeText(text)
    setCopiedPayload(true)
    triggerToast('✓ Copied Full Deliverable to Clipboard!')
    setTimeout(() => setCopiedPayload(false), 2000)
  }

  const handleExportJSON = () => {
    const exportData = {
      task_objective: activePrompt,
      orchestrator_model: selectedModel.name,
      overall_progress: `${globalProgress}%`,
      execution_timestamp: new Date().toISOString(),
      hallucination_rate: '0.00%',
      overall_soundness: '99.85%',
      swarm_nodes: nodes.map(a => ({
        id: a.id,
        name: a.name,
        role: a.role,
        model: a.modelName,
        stage: a.stage,
        progress: `${a.progress}%`,
        tokens_generated: a.tokensGenerated,
      })),
      chat_transcript: chatMessages,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `judgeai-workflow-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    triggerToast('✓ Exported Swarm JSON Artifact!')
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 'calc(100vh - 65px)',
        background: 'var(--color-background)',
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
      }}
    >
      {/* ─── TOP BAR CONTROLS ─── */}
      <TopBar title="Interactive AI Swarm Workspace">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {toastMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                padding: '6px 14px',
                borderRadius: 999,
                background: 'rgba(124, 58, 237, 0.15)',
                border: '1px solid var(--color-accent-violet)',
                color: 'var(--color-foreground)',
              }}
            >
              <IcSparkles size={13} color="var(--color-accent-violet)" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Model Selector Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 12px',
                borderRadius: 9,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-foreground)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: selectedModel.badgeColor,
                }}
              />
              <span style={{ fontWeight: 600 }}>{selectedModel.name}</span>
              <IcChevronDown
                size={13}
                style={{
                  transform: showModelDropdown ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                  color: 'var(--color-muted)',
                }}
              />
            </button>

            {showModelDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  width: 280,
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  padding: 6,
                  zIndex: 60,
                  boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--color-muted)',
                    padding: '6px 10px',
                    letterSpacing: '0.06em',
                  }}
                >
                  Select Orchestrator Model
                </div>
                {MODELS.map(m => {
                  const active = m.id === selectedModelId
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSelectedModelId(m.id)
                        setShowModelDropdown(false)
                        triggerToast(`Switched orchestrator to ${m.name}`)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: active ? 'rgba(124,58,237,0.12)' : 'transparent',
                        transition: 'background 0.12s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.badgeColor }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-foreground)' }}>{m.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{m.provider}</div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: 'var(--color-surface-deep)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-muted)',
                        }}
                      >
                        {m.tag}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Reset Workspace */}
          {hasActiveTask && (
            <button
              onClick={handleResetWorkspace}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 9,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-foreground)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <IcPlus size={14} />
              <span>New Swarm</span>
            </button>
          )}

          {/* Run / Pause */}
          {hasActiveTask && !isSwarmComplete && (
            <button
              onClick={() => setIsRunning(!isRunning)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 9,
                background: isRunning ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                border: `1px solid ${isRunning ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
                color: isRunning ? '#EF4444' : '#10B981',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isRunning ? <IcPause size={14} /> : <IcPlay size={14} />}
              <span>{isRunning ? 'Pause' : 'Resume'}</span>
            </button>
          )}

          {/* Speed Toggle */}
          {hasActiveTask && !isSwarmComplete && (
            <button
              onClick={() => setSimulationSpeed(s => (s === 1 ? 2 : s === 2 ? 4 : 1))}
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '6px 10px',
                borderRadius: 8,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-foreground)',
                cursor: 'pointer',
              }}
            >
              {simulationSpeed}x Speed
            </button>
          )}

          {/* Export Artifact */}
          {hasActiveTask && (
            <button
              onClick={handleExportJSON}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 9,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-foreground)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <IcDownload size={14} />
              <span className="max-sm:hidden">Export</span>
            </button>
          )}
        </div>
      </TopBar>

      {/* ─── WORKFLOW CANVAS WORKSPACE ─── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          minHeight: 0,
          overflow: 'hidden',
          width: '100%',
          position: 'relative',
        }}
      >
        {/* 1. LEFT SUB-SIDEBAR: SWARM NAVIGATION & PRESETS */}
        <aside
          style={{
            width: 220,
            background: 'var(--color-surface)',
            borderRight: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            overflow: 'hidden',
          }}
          className="swarm-nav-sidebar"
        >
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-border-faint)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-foreground)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <IcSwarm size={16} color="var(--color-accent-violet)" />
              <span>Swarm Pipelines</span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted)', padding: '0 8px 6px 8px' }}>
                Preset Workflows
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {SWARM_TEMPLATES.map(t => (
                  <div
                    key={t.id}
                    onClick={() => handleStartTask(t.prompt, t.modelId)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: activePrompt === t.prompt ? 'rgba(124, 58, 237, 0.12)' : 'transparent',
                      border: `1px solid ${activePrompt === t.prompt ? 'var(--color-accent-violet)' : 'transparent'}`,
                      cursor: 'pointer',
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: 'var(--color-foreground)',
                      transition: 'all 0.12s ease',
                    }}
                    onMouseEnter={e => {
                      if (activePrompt !== t.prompt) e.currentTarget.style.background = 'var(--color-card)'
                    }}
                    onMouseLeave={e => {
                      if (activePrompt !== t.prompt) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <div>{t.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>{t.category}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted)', padding: '0 8px 6px 8px' }}>
                Swarm Nodes ({nodes.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {nodes.map(n => {
                  const isSelected = selectedNodeId === n.id
                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        setSelectedNodeId(n.id)
                        setShowInspector(true)
                      }}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        background: isSelected ? 'var(--color-card)' : 'transparent',
                        border: `1px solid ${isSelected ? n.color : 'transparent'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: 'var(--color-foreground)' }}>
                        <span>{n.avatar}</span>
                        <span>{n.name}</span>
                      </div>
                      <StageIndicator stage={n.stage} />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div style={{ padding: '12px', borderTop: '1px solid var(--color-border-faint)' }}>
            <button
              onClick={() => handleResetWorkspace()}
              className="pill-primary"
              style={{
                width: '100%',
                padding: '8px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <IcPlus size={13} />
              <span>New Workflow</span>
            </button>
          </div>
        </aside>

        {/* 2. CENTER & BOTTOM: VISUAL CANVAS (TOP) + SPLIT CHAT & EXECUTION LOGS (BOTTOM) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            background: 'var(--color-background)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* ─── TOP HALF: VISUAL NODE WORKFLOW CANVAS ─── */}
          <div
            style={{
              flex: '1 1 50%',
              minHeight: 280,
              position: 'relative',
              background: 'radial-gradient(var(--color-border-faint) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              overflow: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              boxSizing: 'border-box',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            {/* Canvas Header Pills */}
            <div
              style={{
                position: 'absolute',
                top: 14,
                left: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                zIndex: 10,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  padding: '4px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--color-foreground)',
                }}
              >
                <span>Workflows</span>
                <span style={{ color: 'var(--color-muted)' }}>/</span>
                <span style={{ color: 'var(--color-accent-violet)' }}>JudgeAI Swarm Core</span>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 999,
                  background: hasActiveTask && !isSwarmComplete ? 'rgba(124, 58, 237, 0.15)' : isSwarmComplete ? 'rgba(16, 185, 129, 0.15)' : 'var(--color-surface)',
                  color: hasActiveTask && !isSwarmComplete ? 'var(--color-accent-violet)' : isSwarmComplete ? '#10B981' : 'var(--color-muted)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {hasActiveTask && !isSwarmComplete ? '● Active Execution' : isSwarmComplete ? '✓ Certified Synthesis' : '○ Standby'}
              </span>
            </div>

            {/* Visual Node Graph Layout */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 36,
                position: 'relative',
                zIndex: 5,
                flexWrap: 'nowrap',
              }}
            >
              {/* TRIGGER NODE */}
              <div
                style={{
                  width: 170,
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: 'var(--color-card)',
                  border: `1.5px solid ${hasActiveTask ? '#38BDF8' : 'var(--color-border)'}`,
                  boxShadow: hasActiveTask ? '0 0 16px rgba(56, 189, 248, 0.15)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    ⚡ TRIGGER
                  </span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-foreground)' }}>
                  User Task Prompt
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 4 }}>
                  {hasActiveTask ? (activePrompt.length > 28 ? `${activePrompt.slice(0, 28)}...` : activePrompt) : 'Awaiting prompt input'}
                </div>
              </div>

              {/* MAIN AGENT NODE (ARCHITECT PRIME) */}
              <div
                onClick={() => {
                  setSelectedNodeId(nodes[0].id)
                  setShowInspector(true)
                }}
                style={{
                  width: 230,
                  padding: '16px',
                  borderRadius: 16,
                  background: 'var(--color-card)',
                  border: `2px solid ${selectedNodeId === nodes[0].id ? nodes[0].color : nodes[0].stage === 'done' ? '#10B981' : nodes[0].stage !== 'waiting' ? nodes[0].color : 'var(--color-border)'}`,
                  boxShadow: nodes[0].stage !== 'waiting' ? `0 0 24px ${nodes[0].color}25` : 'none',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{nodes[0].avatar}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)' }}>{nodes[0].name}</div>
                      <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>{nodes[0].role}</div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      padding: '2px 5px',
                      borderRadius: 4,
                      background: 'rgba(124, 58, 237, 0.2)',
                      color: 'var(--color-accent-violet)',
                    }}
                  >
                    MAIN
                  </span>
                </div>

                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  AGENT TOOLS & ENGINES
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {nodes[0].tools.map((t, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border-faint)',
                        fontSize: 10.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: 'var(--color-foreground)',
                      }}
                    >
                      <span>{t.icon}</span>
                      <span>{t.name}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 700, marginBottom: 2 }}>
                    <span style={{ color: 'var(--color-muted)' }}>{nodes[0].stage.toUpperCase()}</span>
                    <span style={{ color: nodes[0].stage === 'done' ? '#10B981' : nodes[0].color }}>{nodes[0].progress}%</span>
                  </div>
                  <div style={{ width: '100%', height: 3, background: 'var(--color-surface)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${nodes[0].progress}%`, height: '100%', background: nodes[0].stage === 'done' ? '#10B981' : nodes[0].color, transition: 'width 0.3s' }} />
                  </div>
                </div>
              </div>

              {/* DOWNSTREAM PIPELINE NODES (GENERATOR, GUARD, SYNTHESIS) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {nodes.slice(1).map(n => {
                  const isSelected = selectedNodeId === n.id
                  const isDone = n.stage === 'done'
                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        setSelectedNodeId(n.id)
                        setShowInspector(true)
                      }}
                      style={{
                        width: 210,
                        padding: '10px 14px',
                        borderRadius: 12,
                        background: 'var(--color-card)',
                        border: `1.5px solid ${isSelected ? n.color : isDone ? '#10B981' : n.stage !== 'waiting' ? n.color : 'var(--color-border)'}`,
                        boxShadow: n.stage !== 'waiting' ? `0 0 16px ${n.color}20` : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 14 }}>{n.avatar}</span>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-foreground)' }}>{n.name}</div>
                            <div style={{ fontSize: 9.5, color: 'var(--color-muted)' }}>{n.modelName}</div>
                          </div>
                        </div>
                        <StageIndicator stage={n.stage} />
                      </div>

                      <div style={{ marginTop: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 700, marginBottom: 2 }}>
                          <span style={{ color: 'var(--color-muted)' }}>{n.stage.toUpperCase()}</span>
                          <span style={{ color: isDone ? '#10B981' : n.color }}>{n.progress}%</span>
                        </div>
                        <div style={{ width: '100%', height: 3, background: 'var(--color-surface)', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ width: `${n.progress}%`, height: '100%', background: isDone ? '#10B981' : n.color, transition: 'width 0.3s' }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ─── BOTTOM HALF: DUAL-PANEL (AI CHAT + LIVE EXECUTION LOGS) ─── */}
          <div
            style={{
              flex: '1 1 50%',
              minHeight: 280,
              display: 'flex',
              overflow: 'hidden',
              background: 'var(--color-surface)',
            }}
          >
            {/* BOTTOM-LEFT: AI COLLABORATION CHAT */}
            <div
              style={{
                flex: 1,
                borderRight: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                background: 'var(--color-background)',
              }}
            >
              <div
                style={{
                  padding: '8px 14px',
                  borderBottom: '1px solid var(--color-border)',
                  background: 'var(--color-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-foreground)' }}>
                  AI Collaboration Chat
                </div>
                <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>
                  {chatMessages.length} Messages
                </span>
              </div>

              {/* Chat Stream */}
              <div
                ref={chatContainerRef}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {!hasActiveTask && (
                  <div style={{ textAlign: 'center', color: 'var(--color-muted)', fontSize: 12, padding: '24px 0' }}>
                    Describe your objective below to start the multi-agent collaboration...
                  </div>
                )}

                {chatMessages.map(msg => {
                  const isUser = msg.sender === 'user'
                  const isOrch = msg.sender === 'orchestrator'
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'flex-start',
                        fontSize: 12,
                        lineHeight: 1.45,
                      }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: isUser ? 'var(--color-accent-violet)' : isOrch ? 'rgba(124, 58, 237, 0.15)' : `${msg.agentColor}18`,
                          border: `1px solid ${isUser ? 'var(--color-accent-violet)' : isOrch ? 'var(--color-accent-violet)' : msg.agentColor}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          color: isUser ? '#fff' : 'inherit',
                          flexShrink: 0,
                        }}
                      >
                        {isUser ? '👤' : isOrch ? '⚡' : msg.agentAvatar}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, color: isUser ? 'var(--color-accent-violet)' : 'var(--color-foreground)' }}>
                            {isUser ? 'You' : isOrch ? 'Swarm Orchestrator' : msg.agentName}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>{msg.time}</span>
                        </div>
                        <div style={{ color: 'var(--color-foreground)' }}>{msg.text}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Chat Input */}
              <div
                style={{
                  padding: '10px 14px',
                  background: 'var(--color-card)',
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <input
                  type="text"
                  value={inputTask}
                  onChange={e => setInputTask(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && inputTask.trim()) {
                      e.preventDefault()
                      handleStartTask(inputTask)
                    }
                  }}
                  placeholder="Type a task prompt or instruct the swarm..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'var(--color-input-bg)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-foreground)',
                    fontSize: 12,
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => {
                    if (inputTask.trim()) handleStartTask(inputTask)
                  }}
                  disabled={!inputTask.trim()}
                  className="pill-primary"
                  style={{
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 8,
                    opacity: inputTask.trim() ? 1 : 0.45,
                  }}
                >
                  <IcSend size={13} />
                </button>
              </div>
            </div>

            {/* BOTTOM-RIGHT: LIVE EXECUTION LOGS */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                background: 'var(--color-background)',
              }}
            >
              <div
                style={{
                  padding: '8px 14px',
                  borderBottom: '1px solid var(--color-border)',
                  background: 'var(--color-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-foreground)' }}>
                  Live Execution Logs
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: isSwarmComplete ? '#10B981' : '#38BDF8', fontWeight: 600 }}>
                    {isSwarmComplete ? 'status: completed' : hasActiveTask ? 'status: running' : 'status: idle'}
                  </span>
                </div>
              </div>

              {/* Logs Body */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  overflow: 'hidden',
                  background: '#0B0F19',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11,
                  color: '#94A3B8',
                }}
              >
                {/* Node Status Sidebar */}
                <div
                  style={{
                    width: 130,
                    borderRight: '1px solid rgba(255,255,255,0.1)',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div style={{ padding: '4px 6px', borderRadius: 4, background: hasActiveTask ? 'rgba(56, 189, 248, 0.15)' : 'transparent', color: hasActiveTask ? '#38BDF8' : '#64748B', fontSize: 10, fontWeight: 700 }}>
                    ✓ TRIGGER
                  </div>
                  {nodes.map(n => (
                    <div
                      key={n.id}
                      style={{
                        padding: '4px 6px',
                        borderRadius: 4,
                        background: n.stage === 'done' ? 'rgba(16, 185, 129, 0.15)' : n.stage !== 'waiting' ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                        color: n.stage === 'done' ? '#10B981' : n.stage !== 'waiting' ? '#C084FC' : '#64748B',
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {n.stage === 'done' ? '✓' : n.stage !== 'waiting' ? '⚡' : '○'} {n.name.split(' ')[0].toUpperCase()}
                    </div>
                  ))}
                </div>

                {/* Log Stream Output */}
                <div
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  {isSwarmComplete ? (
                    <div>
                      <div style={{ color: '#34D399', marginBottom: 4 }}>// Swarm Consensus Achieved: 4/4 Nodes</div>
                      <div style={{ color: '#E2E8F0' }}>
                        {JSON.stringify(
                          {
                            status: 'SUCCESS',
                            task: activePrompt,
                            hallucination_rate: '0.00%',
                            soundness_score: '99.85%',
                            consensus: 'VERIFIED',
                          },
                          null,
                          2
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {selectedNode.logs.map((l, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 6, lineHeight: 1.4 }}>
                          <span style={{ color: '#64748B' }}>[{l.time}]</span>
                          <span style={{ color: l.level === 'success' ? '#34D399' : '#F8FAFC' }}>
                            {l.text}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. RIGHT PANEL: INSPECTOR / PROPERTIES */}
        {showInspector && (
          <aside
            style={{
              width: 280,
              background: 'var(--color-surface)',
              borderLeft: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              overflow: 'hidden',
            }}
            className="swarm-inspector-sidebar"
          >
            <div
              style={{
                padding: '12px 14px',
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-foreground)' }}>Properties</span>
                <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontWeight: 700 }}>
                  ID: {selectedNode.id}
                </span>
              </div>
              <button
                onClick={() => setShowInspector(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer' }}
              >
                <IcX size={14} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Node Name */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                  NODE NAME
                </div>
                <div style={{ padding: '6px 10px', borderRadius: 6, background: 'var(--color-card)', border: '1px solid var(--color-border)', fontSize: 12, fontWeight: 700, color: 'var(--color-foreground)' }}>
                  {selectedNode.avatar} {selectedNode.name}
                </div>
              </div>

              {/* Description */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                  DESCRIPTION
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.4, padding: '6px 10px', borderRadius: 6, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
                  {selectedNode.description}
                </div>
              </div>

              {/* Model */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                  CHAT MODEL
                </div>
                <div style={{ padding: '6px 10px', borderRadius: 6, background: 'var(--color-card)', border: '1px solid var(--color-border)', fontSize: 12, fontWeight: 600, color: 'var(--color-foreground)' }}>
                  {selectedNode.modelName}
                </div>
              </div>

              {/* Telemetry Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <div style={{ padding: '6px 8px', borderRadius: 6, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 9, color: 'var(--color-muted)', fontWeight: 700 }}>SPEED</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-foreground)' }}>{selectedNode.speed}</div>
                </div>
                <div style={{ padding: '6px 8px', borderRadius: 6, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 9, color: 'var(--color-muted)', fontWeight: 700 }}>HALLUCINATION</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>{selectedNode.hallucinationRate}</div>
                </div>
              </div>

              {/* Sub-Tasks Checklist */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Sub-Tasks Checklist
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {selectedNode.subTasks.map((st, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '6px 8px',
                        borderRadius: 6,
                        background: 'var(--color-card)',
                        border: '1px solid var(--color-border-faint)',
                        fontSize: 10.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span style={{ color: st.done ? '#10B981' : 'var(--color-muted)', fontWeight: 700 }}>
                        {st.done ? '✓' : '○'}
                      </span>
                      <span style={{ color: st.done ? 'var(--color-foreground)' : 'var(--color-muted)' }}>
                        {st.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Output Button */}
              {isSwarmComplete && (
                <button
                  onClick={handleCopyDeliverable}
                  className="pill-primary"
                  style={{
                    padding: '8px',
                    fontSize: 11.5,
                    fontWeight: 700,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    marginTop: 4,
                  }}
                >
                  <IcCopy size={13} />
                  <span>Copy Final Deliverable</span>
                </button>
              )}
            </div>
          </aside>
        )}
      </div>

      <style>{`
        @media(max-width: 1000px) {
          .swarm-inspector-sidebar {
            display: none !important;
          }
        }
        @media(max-width: 768px) {
          .swarm-nav-sidebar {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}

function StageIndicator({ stage }: { stage: AgentStage }) {
  const isDone = stage === 'done'
  const isWorking = stage === 'working' || stage === 'thinking' || stage === 'verifying' || stage === 'synthesizing'

  const color = isDone
    ? '#10B981'
    : isWorking
    ? '#8B5CF6'
    : 'var(--color-muted)'

  return (
    <span
      style={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: color,
        boxShadow: isWorking ? `0 0 6px ${color}` : 'none',
      }}
    />
  )
}

function generateFinalMarkdown(prompt: string, orchestrator: string, nodes: SwarmNode[]) {
  return `# Multi-Agent Swarm Synthesis Deliverable
**Objective:** ${prompt}
**Orchestrator:** ${orchestrator}
**Generated Date:** ${new Date().toUTCString()}
**Hallucination Rate:** 0.00% (Formally Certified)
**Soundness Score:** 99.85%

---

## 1. Executive Decomposition
1. **Architect Prime**: Formulated deterministic scope and boundary parameter DAG.
2. **Deep Generator**: Computed step-by-step intermediate derivations and reasoning units.
3. **Citation & Logic Guard**: Certified 0.00% hallucination rate with double-blind formal proofs.
4. **Synthesis Lead**: Unified verified deliverable artifacts and compiled production schema.

## 2. Derivations & Problem Units
- **Unit 01**: Parameter bounds verified without assumption leaks.
- **Unit 02**: Step-by-step calculus word problems and algebraic derivations verified.
- **Unit 03**: Swarm consensus confirmed 4/4 agreement.

## 3. Checksum
\`\`\`json
{
  "status": "CERTIFIED",
  "hallucination_rate": "0.00%",
  "soundness": "99.85%",
  "verified_by": "JudgeAI Swarm Core"
}
\`\`\`
`
}
