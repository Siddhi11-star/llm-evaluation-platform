import { useState, useEffect, useRef } from 'react'
import { TopBar, PageContent } from '../components/AppShell'
import {
  IcSwarm,
  IcSparkles,
  IcArrowRight,
  IcCheck,
  IcRotate,
  IcChevronDown,
  IcCopy,
  IcPlay,
  IcPause,
  IcCpu,
  IcJudge,
  IcSearch,
  IcFilter,
  IcDownload,
  IcTable,
  IcDatabase,
  IcExternalLink,
  IcKey,
  IcPlus,
} from '../components/icons'
import { AnimatedAIChat } from '../components/ui/animated-ai-chat'

// ─── Persona Avatars ────────────────────────────────────────────────────────

type AgentPersona = {
  id: string
  name: string
  role: string
  avatarType: string
  specialty: string
  status: 'active' | 'thinking' | 'standby' | 'completed'
  currentPrompt: string
  taskIndex: string
  outputSample: string
  workerId?: string
}

type SwarmModelTier = {
  id: string
  name: string
  maxAgents: number
  toolCalls: string
  badge: string
}

const SWARM_MODELS: SwarmModelTier[] = [
  { id: 'k2.6', name: 'Kimi K2.6 Agent Swarm', maxAgents: 300, toolCalls: '4,000+ Tool Calls', badge: 'Flagship Scale-Out' },
  { id: 'judgeai', name: 'JudgeAI Swarm Core', maxAgents: 200, toolCalls: '3,200+ Tool Calls', badge: 'Evaluation Optimized' },
  { id: 'k2.5', name: 'K2.5 Fast Swarm', maxAgents: 100, toolCalls: '1,500+ Tool Calls', badge: 'Low Latency' },
]

const CAMPAIGN_PRESETS = [
  {
    id: 'math',
    title: 'Math Word Problem Benchmark Creation',
    desc: 'Launch 20+ parallel agents to generate 100 math problems with step-by-step reasoning',
    category: 'Reasoning & Math',
    agentCount: 24,
    defaultPrompt: 'Generate 100 high-difficulty math word problems covering algebra, calculus, discrete probability, and geometry with formal solution steps and domain tags.',
  },
  {
    id: 'dataset',
    title: '300-Agent Web Sourced Dataset Swarm',
    desc: 'Massive parallel crawling, extraction, citation validation, and schema deduplication',
    category: 'Data Mining',
    agentCount: 300,
    defaultPrompt: 'Autonomous discovery of 500 venture-backed AI startups with verified ARR metrics, series tiers, and double-checked primary source URLs.',
  },
  {
    id: 'vibe-code',
    title: 'Vibe Coding & Full-Stack App Engineering Swarm',
    desc: 'Parallel sub-agents building UI layouts, auth flows, database schema, and test suites',
    category: 'Software Engineering',
    agentCount: 48,
    defaultPrompt: 'Architect and generate a production-ready Next.js application with Tailwind styling, Prisma ORM schema, JWT authentication, and Jest integration tests.',
  },
  {
    id: 'audit',
    title: 'Financial Audit & Multi-Page SEC Extraction',
    desc: 'Triangulate ASC 606 revenue compliance, CapEx disclosures, and risk factors',
    category: 'Finance / Risk',
    agentCount: 36,
    defaultPrompt: 'Audit Fortune 500 annual 10-K filings for enterprise AI infrastructure capital expenditures and cloud contractual commitments.',
  },
]

const DEFAULT_PERSONAS: AgentPersona[] = [
  {
    id: 'barthes',
    name: 'Barthes',
    role: 'Arithmetic Engine',
    avatarType: 'glasses',
    specialty: 'Speed & rate word problems with multi-variable constraints',
    status: 'completed',
    taskIndex: '05',
    workerId: 'Worker #012',
    currentPrompt: 'Generate 5 arithmetic word problems with step-by-step solutions. Focus on proportional rates, train speeds, and collaborative work scenarios.',
    outputSample: JSON.stringify({
      problem: 'Two trains start at the same time from Station A and B, 450 km apart, traveling toward each other at 60 km/h and 90 km/h. When and where do they collide?',
      steps: ['Combined speed = 60 + 90 = 150 km/h', 'Time to meet = 450 / 150 = 3 hours', 'Distance from Station A = 60 * 3 = 180 km'],
      answer: '3 hours, 180 km from Station A',
      domain: 'kinematics_arithmetic',
    }, null, 2),
  },
  {
    id: 'fisher',
    name: 'Fisher',
    role: 'Combinatorics Lead',
    avatarType: 'cap',
    specialty: 'Permutations, probability trees, and discrete math',
    status: 'completed',
    taskIndex: '06',
    workerId: 'Worker #028',
    currentPrompt: 'Generate 5 discrete probability word problems with step-by-step Bayes theorem resolutions.',
    outputSample: JSON.stringify({
      problem: 'A bag contains 5 red and 7 blue marbles. Two marbles are drawn without replacement. What is the probability both are blue?',
      steps: ['P(1st Blue) = 7/12', 'P(2nd Blue | 1st Blue) = 6/11', 'Total P = (7/12) * (6/11) = 42/132 = 7/22'],
      answer: '7/22 (~31.8%)',
      domain: 'discrete_probability',
    }, null, 2),
  },
  {
    id: 'kian',
    name: 'Kian',
    role: 'Algebra Specialist',
    avatarType: 'curly',
    specialty: 'Quadratic systems, polynomial roots, and matrix linear systems',
    status: 'active',
    taskIndex: '07',
    workerId: 'Worker #044',
    currentPrompt: 'Generate 5 algebra word problems with quadratic optimization and constraint boundaries.',
    outputSample: JSON.stringify({
      problem: 'A farmer has 120 meters of fencing to build a rectangular paddock against an existing stone wall. What dimensions maximize area?',
      steps: ['Perimeter = 2x + y = 120 -> y = 120 - 2x', 'Area A(x) = x(120 - 2x) = 120x - 2x^2', 'Vertex at x = -120 / (2 * -2) = 30 meters', 'y = 120 - 2(30) = 60 meters', 'Max Area = 30 * 60 = 1800 m^2'],
      answer: 'Width: 30m, Length: 60m, Max Area: 1800 m²',
      domain: 'quadratic_optimization',
    }, null, 2),
  },
  {
    id: 'prof_davis',
    name: 'Prof. Davis',
    role: 'Calculus Professor',
    avatarType: 'beard',
    specialty: 'Differential rates of change and accumulation integrals',
    status: 'active',
    taskIndex: '08',
    workerId: 'Worker #067',
    currentPrompt: 'Generate 5 related rates calculus word problems with step-by-step derivatives.',
    outputSample: JSON.stringify({
      problem: 'Water is poured into a conical tank of height 10m and base radius 4m at 2 m³/min. How fast is the water level rising when height is 5m?',
      steps: ['r/h = 4/10 -> r = 0.4h', 'V = (1/3) * pi * r^2 * h = (1/3) * pi * (0.4h)^2 * h = (0.16/3) * pi * h^3', 'dV/dt = 0.16 * pi * h^2 * (dh/dt)', '2 = 0.16 * pi * (5)^2 * (dh/dt) = 4 * pi * (dh/dt)', 'dh/dt = 2 / (4 * pi) = 1 / (2 * pi) m/min'],
      answer: '1 / (2π) ≈ 0.159 m/min',
      domain: 'related_rates_calculus',
    }, null, 2),
  },
  {
    id: 'ayesha',
    name: 'Ayesha',
    role: 'ProblemGen Algebra',
    avatarType: 'woman_hair',
    specialty: 'Pipe filling, collaborative workflows & unit conversion systems',
    status: 'active',
    taskIndex: '09',
    workerId: 'Worker #091',
    currentPrompt: 'Generate 5 algebra word problems with step-by-step solutions. Focus on work problems, pipe filling, and collaborative work scenarios. Return JSON array with 5 objects: problem, solution_steps (as array), final_answer, domain.',
    outputSample: JSON.stringify({
      problem: 'Pipe A fills a reservoir in 4 hours, and Pipe B empties it in 6 hours. If both pipes are opened simultaneously, how long until the reservoir is completely filled?',
      steps: ['Rate A = +1/4 reservoir/hr', 'Rate B = -1/6 reservoir/hr', 'Combined Rate = 1/4 - 1/6 = 3/12 - 2/12 = 1/12 reservoir/hr', 'Time = 1 / (1/12) = 12 hours'],
      answer: '12 hours',
      domain: 'work_pipe_algebra',
    }, null, 2),
  },
  {
    id: 'judith',
    name: 'Judith',
    role: 'Geometry Architect',
    avatarType: 'glasses_woman',
    specialty: '3D spatial geometry, surface areas, and trigonometry',
    status: 'thinking',
    taskIndex: '10',
    workerId: 'Worker #114',
    currentPrompt: 'Generate 5 trigonometry triangle surveying benchmark problems with precision angles.',
    outputSample: JSON.stringify({
      problem: 'From a lighthouse 80 meters high, the angle of depression to a sailboat is 28°. How far is the boat from the base of the lighthouse?',
      steps: ['tan(28°) = Opposite / Adjacent = 80 / d', 'd = 80 / tan(28°)', 'd = 80 / 0.5317 ≈ 150.46 meters'],
      answer: '150.46 meters',
      domain: 'trigonometry_surveying',
    }, null, 2),
  },
  {
    id: 'quinne',
    name: 'Quinne',
    role: 'Physics Word Problems',
    avatarType: 'round_glasses',
    specialty: 'Thermodynamics, Newton laws, and electrical circuit math',
    status: 'standby',
    taskIndex: '11',
    workerId: 'Worker #142',
    currentPrompt: 'Generate 5 thermodynamic heat transfer word problems with specific heat constants.',
    outputSample: JSON.stringify({
      problem: 'How much energy in Joules is required to heat 250g of water from 20°C to 100°C? (Specific heat c = 4.184 J/g°C)',
      steps: ['Q = m * c * deltaT', 'deltaT = 100 - 20 = 80°C', 'Q = 250 * 4.184 * 80 = 83,680 Joules'],
      answer: '83,680 J (83.68 kJ)',
      domain: 'thermodynamics',
    }, null, 2),
  },
  {
    id: 'tyler',
    name: 'Tyler',
    role: 'Financial Quant',
    avatarType: 'hoodie',
    specialty: 'Compound interest, annuity payouts, and loan amortization formulas',
    status: 'standby',
    taskIndex: '12',
    workerId: 'Worker #188',
    currentPrompt: 'Generate 5 compound interest and annuity amortisation word problems.',
    outputSample: JSON.stringify({
      problem: 'An investor deposits $5,000 at 6% annual interest compounded monthly. What is the account balance after 5 years?',
      steps: ['A = P * (1 + r/n)^(nt)', 'P = 5000, r = 0.06, n = 12, t = 5', 'A = 5000 * (1 + 0.005)^60 = 5000 * (1.34885) ≈ $6,744.25'],
      answer: '$6,744.25',
      domain: 'financial_mathematics',
    }, null, 2),
  },
]

// Canvas Agent Nodes in the swarm hive constellation (matching Kimi K2.6 demo)
const HIVE_AGENTS = [
  { id: 'gannon', name: 'Gannon', role: 'Progress Expediter', avatar: '😎', status: 'active', desc: 'Schedules parallel workstreams & unblocks bottlenecks' },
  { id: 'k', name: 'K', role: 'Translation Expert', avatar: '👓', status: 'active', desc: 'Translates & standardizes multilingual prompt inputs' },
  { id: 'hemingway', name: 'Hemingway', role: 'Renowned Author', avatar: '📜', status: 'active', desc: 'Synthesizes long-form prose and clear problem statements' },
  { id: 'parker', name: 'Parker', role: 'Tactical Advisor', avatar: '🧢', status: 'active', desc: 'Optimizes token allocation & tool execution strategies' },
  { id: 'miles', name: 'Miles', role: 'Business Consultant', avatar: '👔', status: 'thinking', desc: 'Audits commercial viability & enterprise constraints' },
  { id: 'trey', name: 'Trey', role: 'Data Analyst', avatar: '📊', status: 'active', desc: 'Parses statistical distributions & numeric bounds' },
  { id: 'rex', name: 'Rex', role: 'Quality Control Expert', avatar: '🛡️', status: 'active', desc: 'Validates solution steps against 0% hallucination rubrics' },
  { id: 'grit', name: 'Grit', role: 'Product Evaluation', avatar: '⚡', status: 'standby', desc: 'Benchmarks output against standard test suites' },
  { id: 'ren', name: 'Ren', role: 'Delivery Acceptance', avatar: '📦', status: 'standby', desc: 'Guarantees final JSON schema compliance before release' },
  { id: 'allen', name: 'Allen', role: 'Data Scientist', avatar: '🔬', status: 'active', desc: 'Generates synthetic edge cases & outlier distributions' },
  { id: 'winston', name: 'Principal Winston', role: 'Logic Deduction Expert', avatar: '🎩', status: 'active', desc: 'Ensures formal mathematical rigor in step deductions' },
  { id: 'cyclops', name: 'Cyclops', role: 'Chief Inspector', avatar: '👁️', status: 'active', desc: 'Scans for ambiguity, circular logic, and syntax flaws' },
]

function PersonaAvatarSvg({ type, size = 32 }: { type: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#fff',
        border: '1.5px solid rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#111',
        fontWeight: 800,
        fontSize: size * 0.45,
        flexShrink: 0,
        boxShadow: '0 2px 5px rgba(0,0,0,0.12)',
        overflow: 'hidden',
      }}
    >
      {type === 'glasses' && '👓'}
      {type === 'cap' && '🧢'}
      {type === 'curly' && '🧑‍🦱'}
      {type === 'beard' && '🧔'}
      {type === 'woman_hair' && '👩'}
      {type === 'glasses_woman' && '👩‍🏫'}
      {type === 'round_glasses' && '🧐'}
      {type === 'hoodie' && '👨‍💻'}
    </div>
  )
}

export default function AgentSwarm() {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0)
  const currentPreset = CAMPAIGN_PRESETS[selectedPresetIndex]

  const [selectedModel, setSelectedModel] = useState<SwarmModelTier>(SWARM_MODELS[0])
  const [personas, setPersonas] = useState<AgentPersona[]>(DEFAULT_PERSONAS)
  const [activePersona, setActivePersona] = useState<AgentPersona>(DEFAULT_PERSONAS[4]) // Default to Ayesha
  const [hoveredPersona, setHoveredPersona] = useState<AgentPersona | null>(DEFAULT_PERSONAS[4])
  
  const [isRunning, setIsRunning] = useState(true)
  const [progressCount, setProgressCount] = useState(4)
  const [totalSteps, setTotalSteps] = useState(6)
  const [selectedHiveAgent, setSelectedHiveAgent] = useState<any | null>(null)
  const [swarmOutputTab, setSwarmOutputTab] = useState<'prompt' | 'json' | 'stats'>('prompt')
  
  const [showAssignChat, setShowAssignChat] = useState(false)
  const [showPresetDropdown, setShowPresetDropdown] = useState(false)
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  
  const [swarmConcurrency, setSwarmConcurrency] = useState(300)
  const [liveLogIndex, setLiveLogIndex] = useState(0)

  const LIVE_STATUS_MESSAGES = [
    'Assigning sub-tasks & generating 100 math reasoning problems in parallel…',
    'Worker #042: Completed algebra work problems (0% hallucination detected)…',
    'Rex (Quality Control Expert): Cross-verifying calculus derivative steps…',
    'Hemingway: Formatting final synthesized dataset schema with JSON bounds…',
    'Swarm Core: 300 parallel sub-agents allocated (4.5x faster throughput)…',
  ]

  // Simulation timer for progress and live log stream
  useEffect(() => {
    let timer: any
    if (isRunning) {
      timer = setInterval(() => {
        setProgressCount(prev => (prev >= totalSteps ? 1 : prev + 1))
        setLiveLogIndex(prev => (prev + 1) % LIVE_STATUS_MESSAGES.length)
      }, 4000)
    }
    return () => clearInterval(timer)
  }, [isRunning, totalSteps])

  const handleSelectPreset = (index: number) => {
    setSelectedPresetIndex(index)
    setShowPresetDropdown(false)
    setToastMessage(`Switched campaign to "${CAMPAIGN_PRESETS[index].title}"`)
    setTimeout(() => setToastMessage(null), 2500)
  }

  const handleTaskAssign = (promptText: string, commandName?: string, attachments?: string[]) => {
    const avatarList = ['glasses', 'cap', 'curly', 'beard', 'woman_hair', 'glasses_woman', 'round_glasses', 'hoodie']
    const randomAvatar = avatarList[Math.floor(Math.random() * avatarList.length)]
    const newId = `agent_${Date.now()}`
    const nextIndex = String(personas.length + 5).padStart(2, '0')
    const workerNum = Math.floor(Math.random() * swarmConcurrency + 1)

    const newPersona: AgentPersona = {
      id: newId,
      name: commandName ? `${commandName.replace('/', '')} Specialist` : `Sub-Agent #${nextIndex}`,
      role: 'Autonomous Swarm Specialist',
      avatarType: randomAvatar,
      specialty: 'Parallel reasoning & multi-agent execution',
      status: 'active',
      taskIndex: nextIndex,
      workerId: `Worker #${String(workerNum).padStart(3, '0')}`,
      currentPrompt: promptText,
      outputSample: JSON.stringify({
        task_id: newId,
        directive: promptText,
        model_engine: selectedModel.name,
        attachments_processed: attachments?.length || 0,
        status: 'EXECUTING_IN_PARALLEL',
        allocated_sub_agents: 24,
        confidence_score: 99.4,
        timestamp: new Date().toISOString(),
      }, null, 2),
    }

    setPersonas(prev => [newPersona, ...prev])
    setActivePersona(newPersona)
    setHoveredPersona(newPersona)
    setTotalSteps(prev => prev + 1)
    setProgressCount(prev => Math.min(prev + 1, totalSteps + 1))
    
    setToastMessage(`Dispatched task to ${newPersona.name}!`)
    setTimeout(() => setToastMessage(null), 3000)
    setTimeout(() => setShowAssignChat(false), 1200)
  }

  const handleExportJSON = () => {
    const data = personas.map(p => ({
      name: p.name,
      role: p.role,
      taskIndex: p.taskIndex,
      directive: p.currentPrompt,
      output: JSON.parse(p.outputSample),
    }))
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `judgeai-swarm-export-${currentPreset.id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setToastMessage('Exported Swarm Dataset JSON!')
    setTimeout(() => setToastMessage(null), 2500)
  }

  return (
    <>
      <TopBar title="Agent Swarm Orchestrator">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {toastMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12.5,
                fontWeight: 600,
                padding: '5px 14px',
                borderRadius: 999,
                background: 'rgba(52,211,153,0.15)',
                color: '#34D399',
                border: '1px solid rgba(52,211,153,0.3)',
                animation: 'fadeIn 0.2s ease',
              }}
            >
              <IcCheck size={14} color="#34D399" />
              {toastMessage}
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
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-foreground)',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <IcCpu size={14} color="var(--color-accent-violet)" />
              {selectedModel.name}
              <IcChevronDown size={13} color="var(--color-muted)" />
            </button>

            {showModelDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 6,
                  width: 280,
                  borderRadius: 10,
                  background: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.5)',
                  zIndex: 40,
                  padding: 6,
                }}
              >
                {SWARM_MODELS.map(m => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedModel(m)
                      setSwarmConcurrency(m.maxAgents)
                      setShowModelDropdown(false)
                      setToastMessage(`Switched engine to ${m.name}`)
                      setTimeout(() => setToastMessage(null), 2500)
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      background: selectedModel.id === m.id ? 'var(--color-nav-active-bg)' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)' }}>
                        {m.name}
                      </span>
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--color-hover)', color: 'var(--color-muted)' }}>
                        {m.badge}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
                      Up to {m.maxAgents} parallel agents · {m.toolCalls}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowAssignChat(true)}
            className="pill-primary"
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              padding: '7px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(124, 58, 237, 0.3)',
            }}
          >
            <IcSparkles size={14} /> Assign Swarm Task
          </button>
        </div>
      </TopBar>

      <PageContent style={{ padding: '16px 20px', maxWidth: 1440, margin: '0 auto' }}>
        {/* ─── Main Two-Pane Split Layout Matching the Screenshot ─────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '360px 1fr',
            gap: 16,
            height: 'calc(100vh - 120px)',
            minHeight: 640,
          }}
        >
          
          {/* ═════════════════════════════════════════════════════════════════
              LEFT PANE: PARALLEL TASK LIST & SWARM CONTROL BAR
              ═════════════════════════════════════════════════════════════════ */}
          <div
            className="card-base"
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 14,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Left Header with Campaign Preset Selector */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderBottom: '1px solid var(--color-border-faint)',
                position: 'relative',
              }}
            >
              <div
                onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: 'var(--color-surface-deep)',
                    border: '1px solid var(--color-border)',
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  田
                </span>
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: 'var(--color-foreground)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {currentPreset.title}
                </span>
                <IcChevronDown size={14} color="var(--color-muted)" />
              </div>

              <button
                onClick={() => setShowAssignChat(true)}
                title="Assign new task via AI Chat"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-muted)',
                  cursor: 'pointer',
                  fontSize: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2px 6px',
                }}
              >
                +
              </button>

              {/* Campaign Dropdown */}
              {showPresetDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 10,
                    right: 10,
                    marginTop: 4,
                    borderRadius: 10,
                    background: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.6)',
                    zIndex: 30,
                    padding: 6,
                  }}
                >
                  {CAMPAIGN_PRESETS.map((p, idx) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPreset(idx)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 6,
                        background: selectedPresetIndex === idx ? 'var(--color-nav-active-bg)' : 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-foreground)' }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
                        {p.desc}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Task Item List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {personas.map(persona => {
                const isSelected = activePersona.id === persona.id
                return (
                  <div
                    key={persona.id}
                    onClick={() => setActivePersona(persona)}
                    onMouseEnter={() => setHoveredPersona(persona)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: isSelected ? 'var(--color-nav-active-bg)' : 'var(--color-surface)',
                      border: `1px solid ${isSelected ? 'var(--color-accent-violet)' : 'var(--color-border-faint)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <PersonaAvatarSvg type={persona.avatarType} size={28} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)' }}>
                            {persona.name}
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--color-muted)',
                          fontFamily: 'JetBrains Mono, monospace',
                        }}
                      >
                        {persona.taskIndex}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: 11.5,
                        color: 'var(--color-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        paddingLeft: 38,
                        lineHeight: 1.4,
                      }}
                    >
                      ↳ {persona.currentPrompt}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Hover Floating Popover Preview */}
            {hoveredPersona && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 90,
                  left: 12,
                  right: 12,
                  zIndex: 20,
                  padding: 14,
                  borderRadius: 12,
                  background: 'var(--color-background)',
                  border: '1.5px solid var(--color-border)',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.6)',
                  animation: 'fadeIn 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <PersonaAvatarSvg type={hoveredPersona.avatarType} size={34} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--color-foreground)' }}>
                      {hoveredPersona.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                      {hoveredPersona.role} · {hoveredPersona.workerId || 'Worker #042'}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--color-foreground)', lineHeight: 1.45, opacity: 0.9 }}>
                  {hoveredPersona.currentPrompt}
                </div>
              </div>
            )}

            {/* Left Bottom Control Footer */}
            <div
              style={{
                padding: '12px 14px',
                borderTop: '1px solid var(--color-border-faint)',
                background: 'var(--color-surface)',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 10, lineHeight: 1.4 }}>
                This task is handled by Agent Swarm. Follow-ups will continue with {selectedModel.name}.
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => setShowAssignChat(true)}
                    title="Open Task Assignment Chat"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-card)',
                      color: 'var(--color-foreground)',
                      fontSize: 14,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    +
                  </button>
                  <span style={{ fontSize: 11, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IcSparkles size={12} color="var(--color-accent-cyan)" /> 40 left
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-foreground)' }}>
                    {selectedModel.name.split(' ')[0]} ⌵
                  </span>
                  <button
                    onClick={() => setIsRunning(!isRunning)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: isRunning ? '#fff' : 'var(--color-accent-violet)',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: isRunning ? '#000' : '#fff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                  >
                    {isRunning ? <div style={{ width: 10, height: 10, borderRadius: 2, background: '#000' }} /> : <IcPlay size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════
              RIGHT PANE: "JUDGEAI / KIMI'S COMPUTER" SWARM CANVAS
              ═════════════════════════════════════════════════════════════════ */}
          <div
            className="card-base"
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 14,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Top Retro Computer Title Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: '1px solid var(--color-border-faint)',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 20 }}>🖥️</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-foreground)', letterSpacing: '-0.01em' }}>
                    JudgeAI / Kimi's Computer · {selectedModel.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#34D399', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 6px #34D399' }} />
                      Task Progress {progressCount}/{totalSteps}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>|</span>
                    <span style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>
                      {currentPreset.desc} &gt;
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={handleExportJSON}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 7,
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
                  onClick={() => setShowAssignChat(true)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-foreground)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Canvas Body: Sub-Agent Hive Constellation Grid */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 30px',
                background: 'radial-gradient(ellipse at center, rgba(124, 58, 237, 0.05) 0%, transparent 70%)',
                position: 'relative',
                overflowY: 'auto',
              }}
            >
              {/* 4x3 Pill Capsule Hive Grid matching Kimi K2.6 video */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, minmax(160px, 1fr))',
                  gap: '14px 16px',
                  width: '100%',
                  maxWidth: 880,
                }}
              >
                {HIVE_AGENTS.map(agent => {
                  const isAgentActive = agent.status === 'active'
                  const isSelected = selectedHiveAgent?.id === agent.id

                  return (
                    <div
                      key={agent.id}
                      onClick={() => setSelectedHiveAgent(agent)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 14px',
                        borderRadius: 9999,
                        background: isSelected
                          ? 'rgba(124,58,237,0.2)'
                          : isAgentActive
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(255,255,255,0.02)',
                        border: `1.5px solid ${
                          isSelected
                            ? 'var(--color-accent-violet)'
                            : isAgentActive
                            ? 'rgba(255,255,255,0.2)'
                            : 'rgba(255,255,255,0.05)'
                        }`,
                        cursor: 'pointer',
                        opacity: isAgentActive ? 1 : 0.45,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isSelected ? 'scale(1.03)' : 'none',
                        boxShadow: isSelected ? '0 0 16px rgba(124,58,237,0.3)' : 'none',
                      }}
                    >
                      {/* Illustrated Circular Avatar */}
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: isAgentActive ? '#FFFFFF' : '#333333',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          color: '#000000',
                          flexShrink: 0,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                        }}
                      >
                        {agent.avatar}
                      </div>

                      {/* Agent Text Labels */}
                      <div style={{ overflow: 'hidden' }}>
                        <div
                          style={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: 'var(--color-foreground)',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                          }}
                        >
                          {agent.name}
                        </div>
                        <div
                          style={{
                            fontSize: 10.5,
                            color: 'var(--color-muted)',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                          }}
                        >
                          {agent.role}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Status Message at the bottom */}
              <div
                style={{
                  marginTop: 28,
                  fontSize: 12.5,
                  color: 'var(--color-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ animation: 'spin 1.5s linear infinite' }}>⟳</span>
                {LIVE_STATUS_MESSAGES[liveLogIndex]}
              </div>

              {/* Output Preview Drawer for Selected Hive Agent or Active Persona */}
              <div
                style={{
                  marginTop: 20,
                  width: '100%',
                  maxWidth: 880,
                  borderRadius: 12,
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PersonaAvatarSvg type={activePersona.avatarType} size={22} />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-foreground)' }}>
                      {activePersona.name} · Live Generated Dataset Payload
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                      ({activePersona.workerId || 'Worker #042'})
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => setSwarmOutputTab('prompt')}
                      style={{
                        padding: '3px 10px',
                        borderRadius: 5,
                        border: 'none',
                        background: swarmOutputTab === 'prompt' ? 'var(--color-nav-active-bg)' : 'transparent',
                        color: swarmOutputTab === 'prompt' ? 'var(--color-accent-violet)' : 'var(--color-muted)',
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Directive
                    </button>
                    <button
                      onClick={() => setSwarmOutputTab('json')}
                      style={{
                        padding: '3px 10px',
                        borderRadius: 5,
                        border: 'none',
                        background: swarmOutputTab === 'json' ? 'var(--color-nav-active-bg)' : 'transparent',
                        color: swarmOutputTab === 'json' ? 'var(--color-accent-violet)' : 'var(--color-muted)',
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      JSON Output
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: 'var(--color-input-bg)',
                    border: '1px solid var(--color-border-faint)',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11.5,
                    color: 'var(--color-foreground)',
                    maxHeight: 140,
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {swarmOutputTab === 'prompt' ? activePersona.currentPrompt : activePersona.outputSample}
                </div>
              </div>
            </div>
          </div>

        </div>
      </PageContent>

      {/* ─── Animated AI Chat Modal for Assigning Tasks (Matching Kimi K2.6) ─── */}
      {showAssignChat && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setShowAssignChat(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 720,
              background: 'var(--color-background)',
              borderRadius: 20,
              border: '1px solid var(--color-border)',
              position: 'relative',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAssignChat(false)}
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                zIndex: 30,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>

            <AnimatedAIChat
              title="Assign Task to Swarm"
              subtitle="Deploy up to 300 parallel AI sub-agents with a single prompt"
              placeholder="e.g. /math Generate 100 calculus related rates problems with verified steps..."
              onTaskAssign={handleTaskAssign}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
