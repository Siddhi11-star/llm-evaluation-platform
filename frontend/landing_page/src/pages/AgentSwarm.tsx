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
  IcKey,
  IcSettings,
} from '../components/icons'

// ─── Agent Swarm Node Definitions ──────────────────────────────────────────

export type SwarmAgent = {
  id: string
  label: string
  role: string
  model: string
  provider: string
  color: string
  bg: string
  border: string
  status: 'Idle' | 'Active' | 'Thinking' | 'Completed' | 'Error'
  temperature: number
  maxTokens: number
  tools: string[]
  systemPrompt: string
  latencyMs: number
  tokensUsed: number
}

const DEFAULT_AGENTS: SwarmAgent[] = [
  {
    id: 'planner',
    label: 'Planner & Orchestrator',
    role: 'Decomposes objective into an execution DAG, schedules parallel tasks, and assigns sub-agents.',
    model: 'claude-3.5-sonnet',
    provider: 'Anthropic',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.1)',
    border: 'rgba(124,58,237,0.25)',
    status: 'Idle',
    temperature: 0.2,
    maxTokens: 2048,
    tools: ['DAG Generator', 'Resource Scheduler', 'Context Window Manager'],
    systemPrompt: 'You are the Chief Planning Agent. Break down complex queries into isolated, actionable sub-tasks with strict dependency constraints.',
    latencyMs: 310,
    tokensUsed: 840,
  },
  {
    id: 'researcher',
    label: 'Deep Context Researcher',
    role: 'Fetches relevant vector embeddings, web citations, and contextual ground-truth references.',
    model: 'gemini-2.0-flash',
    provider: 'Google',
    color: '#38BDF8',
    bg: 'rgba(56,189,248,0.1)',
    border: 'rgba(56,189,248,0.25)',
    status: 'Idle',
    temperature: 0.1,
    maxTokens: 4096,
    tools: ['Vector Retrieval', 'Google Search API', 'Doc Indexer'],
    systemPrompt: 'Retrieve factual context and ground all factual propositions in verifiable references.',
    latencyMs: 440,
    tokensUsed: 1250,
  },
  {
    id: 'executor',
    label: 'Core Task Generator',
    role: 'Executes sub-tasks, generates draft solutions, produces code implementations or structured data.',
    model: 'gpt-4o',
    provider: 'OpenAI',
    color: '#34D399',
    bg: 'rgba(52,211,153,0.1)',
    border: 'rgba(52,211,153,0.25)',
    status: 'Idle',
    temperature: 0.4,
    maxTokens: 4096,
    tools: ['Python Sandbox', 'AST Parser', 'Mathematical Engine'],
    systemPrompt: 'Generate precision draft responses based directly on the planner specification and retrieved context.',
    latencyMs: 780,
    tokensUsed: 1980,
  },
  {
    id: 'critic',
    label: 'Adversarial Critic & Judge',
    role: 'Audits draft outputs against rubric constraints: Hallucination rate, Logical soundness, and Safety.',
    model: 'llama-3.3-70b',
    provider: 'Meta / Groq',
    color: '#EC4899',
    bg: 'rgba(236,72,153,0.1)',
    border: 'rgba(236,72,153,0.25)',
    status: 'Idle',
    temperature: 0.1,
    maxTokens: 2048,
    tools: ['Hallucination Probe', 'Safety Guardrail', 'Rubric Scorer'],
    systemPrompt: 'Act as a strict adversarial judge. Flag logical non-sequiturs, hallucinated citations, and edge-case liabilities.',
    latencyMs: 390,
    tokensUsed: 920,
  },
  {
    id: 'synthesizer',
    label: 'Consensus Synthesizer',
    role: 'Reconciles critique feedback, merges multi-agent viewpoints, and formats final delivery artifact.',
    model: 'claude-3.5-sonnet',
    provider: 'Anthropic',
    color: '#FBBF24',
    bg: 'rgba(251,191,36,0.1)',
    border: 'rgba(251,191,36,0.25)',
    status: 'Idle',
    temperature: 0.3,
    maxTokens: 4096,
    tools: ['Markdown Formatter', 'Confidence Calibrator', 'SLA Validator'],
    systemPrompt: 'Synthesize verified agent streams into a definitive, crystal-clear, executive-ready response.',
    latencyMs: 360,
    tokensUsed: 1140,
  },
]

// ─── Preset Tasks ──────────────────────────────────────────────────────────

const PRESET_TASKS = [
  {
    id: 'fin-audit',
    title: 'Financial & SEC 10-K Audit',
    badge: 'Finance / Risk',
    prompt: 'Analyze enterprise SaaS ARR churn risks and evaluate compliance with ASC 606 revenue recognition guidelines for multi-year contract renewals.',
    output: `### Executive Financial Audit & ASC 606 Revenue Assessment

**Swarm Consensus Confidence:** 98.6% | **Composite Evaluation Score:** 96.4/100

#### 1. Core Findings & Risk Vectors
- **ASC 606 Performance Obligation Breakdown:** Multi-year contract renewals with bundled professional services must be bifurcated into distinct performance obligations at standalone selling prices (SSP).
- **Material Churn Risk Identified:** Upfront renewal discounts amortized across year 1 create artificial ARR cliffs if usage metrics drop below the 80% contract threshold.
- **Contractual Clawback Safeguards:** Recommended minimum 90-day cure period for SLA breaches before revenue clawback provisions trigger.

#### 2. Reconciled Agent Synthesis
All 5 swarm nodes reached unanimous consensus. The Critic agent rejected the initial unhedged churn extrapolation and replaced it with a 3-tier sensitivity model (Base: 4.2% churn, Stressed: 8.7% churn).

\`\`\`json
{
  "compliance_status": "APPROVED_WITH_CONDITIONS",
  "audit_trail_id": "swrm-fin-994182",
  "recommended_escrow_reserve": "$450,000"
}
\`\`\``,
    thoughtLogs: [
      { agentId: 'planner', message: 'Deconstructed prompt into: 1) ASC 606 SSP identification, 2) ARR churn hazard rate, 3) SLA clawback mitigation.' },
      { agentId: 'researcher', message: 'Retrieved FASB ASC 606-10-25 regulations and SaaS benchmark churn percentiles (2025-2026 data).' },
      { agentId: 'executor', message: 'Drafted 3-part financial audit and calculated ARR impact metrics for cohort renewals.' },
      { agentId: 'critic', message: 'Flagged unhedged churn projection on line 14; mandated inclusion of sensitivity confidence intervals.' },
      { agentId: 'synthesizer', message: 'Unified reconciled figures into final compliance brief with JSON metadata block.' },
    ],
  },
  {
    id: 'sec-patch',
    title: 'Zero-Day Vulnerability & Patch Review',
    badge: 'Cybersecurity',
    prompt: 'Investigate an asynchronous race condition in token refresh middleware causing JWT replay vulnerabilities and author a thread-safe mutex patch in TypeScript.',
    output: `### Security Vulnerability Advisory & Hotfix Verification

**Swarm Consensus Confidence:** 99.2% | **Judge Safety Score:** 100/100

#### Vulnerability Assessment (CVE-2026-PENDING)
The asynchronous token refresh pipeline permitted concurrent requests during the token expiration boundary window to invoke \`/api/auth/refresh\` in parallel, leading to token desynchronization and race condition replays.

#### Verified Hotfix Patch:
\`\`\`typescript
import { Mutex } from 'async-mutex';

export class TokenRefreshManager {
  private refreshMutex = new Mutex();
  private inflightPromise: Promise<string> | null = null;

  async getValidToken(): Promise<string> {
    if (!this.isTokenExpired()) {
      return this.currentToken;
    }

    // Acquire lock to guarantee single in-flight refresh request
    return this.refreshMutex.runExclusive(async () => {
      if (!this.isTokenExpired()) return this.currentToken;
      
      if (!this.inflightPromise) {
        this.inflightPromise = this.performTokenExchange()
          .finally(() => { this.inflightPromise = null; });
      }
      return await this.inflightPromise;
    });
  }
}
\`\`\`

#### Swarm Judge Verification:
- **Accuracy:** 99% (Deterministic race test passed 10,000/10,000 iterations)
- **Safety:** 100% (No memory leak found in mutex lifecycle)
- **Hallucination:** 0% (Standard async-mutex primitive verified)`,
    thoughtLogs: [
      { agentId: 'planner', message: 'Mapped exploit topology: Race condition window in async HTTP interceptor pipeline.' },
      { agentId: 'researcher', message: 'Queried OWASP guidelines and async-mutex concurrency safety benchmarks.' },
      { agentId: 'executor', message: 'Engineered TypeScript mutex wrapper with in-flight deduplication promise caching.' },
      { agentId: 'critic', message: 'Simulated 500 concurrent requests; validated that only 1 refresh network call executes.' },
      { agentId: 'synthesizer', message: 'Compiled advisory report, unit test specs, and zero-downtime deployment guidance.' },
    ],
  },
  {
    id: 'med-research',
    title: 'Biomedical Meta-Analysis Synthesis',
    badge: 'Healthcare / R&D',
    prompt: 'Synthesize recent clinical trial literature on GLP-1 receptor agonists and cardiovascular mortality reductions in non-diabetic cohorts with BMI > 30.',
    output: `### Systematic Clinical Synthesis: GLP-1 RA in Non-Diabetic Cardiovascular Risk

**Swarm Consensus Confidence:** 97.8% | **Factuality Score:** 98.2/100

#### 1. Meta-Analysis Summary
Across 4 major double-blind randomized clinical trials (aggregate $N = 17,604$), GLP-1 receptor agonists exhibited a **20% relative risk reduction (RRR)** in Major Adverse Cardiovascular Events (MACE; HR 0.80, 95% CI 0.72–0.90, $p < 0.001$) in non-diabetic adults with established CVD.

#### 2. Key Physiological Mechanisms
- **Endothelial Stabilization:** Reduction in systemic inflammatory cytokines (hs-CRP, IL-6).
- **Blood Pressure & Lipid Modulation:** Average systolic reduction of 3.3 mmHg and modest triglyceride decrease.
- **Direct Cardioprotective Signaling:** Activation of cardiac GLP-1 receptors dampening ischemic reperfusion injury.

#### 3. Swarm Verification Note
The Critic Judge cross-referenced patient inclusion criteria and verified all cited hazard ratios against published trial datasets.`,
    thoughtLogs: [
      { agentId: 'planner', message: 'Isolated 3 clinical sub-domains: MACE primary endpoints, adverse event safety profile, mechanism of action.' },
      { agentId: 'researcher', message: 'Extracted hazard ratios and confidence intervals from PubMed and clinical trial registries.' },
      { agentId: 'executor', message: 'Structured comparative statistics across SELECT, STEP-HFpEF, and SURMOUNT clinical trials.' },
      { agentId: 'critic', message: 'Flagged discrepancy in baseline patient BMI thresholds; harmonized definitions to $BMI \\ge 30$.' },
      { agentId: 'synthesizer', message: 'Authored formatted medical summary with rigorous statistical bounds.' },
    ],
  },
]

const ORCHESTRATION_MODES = [
  { id: 'hierarchical', name: 'Hierarchical Orchestrator', desc: 'Planner coordinates parallel sub-agents with centralized synthesis.', icon: '🎯' },
  { id: 'sequential', name: 'Sequential Relay', desc: 'Linear pipeline passing cumulative context from agent to agent.', icon: '⚡' },
  { id: 'consensus', name: 'Consensus Voting', desc: 'Multi-agent majority voting with confidence-weighted aggregation.', icon: '⚖️' },
  { id: 'adversarial', name: 'Adversarial Debate', desc: 'Continuous proposer vs critic refinement until score target met.', icon: '🛡️' },
]

export default function AgentSwarm() {
  const [agents, setAgents] = useState<SwarmAgent[]>(DEFAULT_AGENTS)
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0)
  const [prompt, setPrompt] = useState(PRESET_TASKS[0].prompt)
  const [selectedMode, setSelectedMode] = useState('hierarchical')
  const [activeTab, setActiveTab] = useState<'output' | 'trace' | 'scratchpad' | 'scorecard'>('output')
  const [selectedAgentForEdit, setSelectedAgentForEdit] = useState<SwarmAgent | null>(null)
  
  // Execution state
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState<number>(-1)
  const [progress, setProgress] = useState(0)
  const [completedTask, setCompletedTask] = useState<typeof PRESET_TASKS[0] | null>(PRESET_TASKS[0])
  const [copied, setCopied] = useState(false)
  const [activeLogs, setActiveLogs] = useState<Array<{ agentId: string; message: string; timestamp: string }>>([])
  
  const timerRef = useRef<any>(null)

  // Sync preset selection
  const selectPreset = (index: number) => {
    setSelectedTaskIndex(index)
    setPrompt(PRESET_TASKS[index].prompt)
    if (!isRunning) {
      setCompletedTask(PRESET_TASKS[index])
      setActiveLogs(
        PRESET_TASKS[index].thoughtLogs.map(l => ({
          ...l,
          timestamp: new Date().toLocaleTimeString(),
        }))
      )
    }
  }

  // Handle Run Simulation
  const handleRunSwarm = () => {
    if (isRunning) {
      clearInterval(timerRef.current)
      setIsRunning(false)
      return
    }

    setIsRunning(true)
    setCurrentStep(0)
    setProgress(5)
    setActiveLogs([])
    
    // Reset agent statuses
    setAgents(prev => prev.map(a => ({ ...a, status: 'Idle' })))

    const taskData = PRESET_TASKS[selectedTaskIndex] || PRESET_TASKS[0]
    let step = 0

    timerRef.current = setInterval(() => {
      if (step < agents.length) {
        const activeAgent = agents[step]
        
        // Update statuses
        setAgents(prev =>
          prev.map((a, i) => {
            if (i < step) return { ...a, status: 'Completed' }
            if (i === step) return { ...a, status: 'Thinking' }
            return { ...a, status: 'Idle' }
          })
        )

        // Append log
        const logMsg = taskData.thoughtLogs[step] || {
          agentId: activeAgent.id,
          message: `Processing context in ${activeAgent.model} (${activeAgent.tools.join(', ')})...`,
        }

        setActiveLogs(prev => [
          ...prev,
          {
            agentId: activeAgent.id,
            message: logMsg.message,
            timestamp: new Date().toLocaleTimeString(),
          },
        ])

        setCurrentStep(step)
        setProgress(Math.round(((step + 1) / agents.length) * 100))
        step++
      } else {
        // Complete
        clearInterval(timerRef.current)
        setIsRunning(false)
        setCurrentStep(agents.length)
        setProgress(100)
        setAgents(prev => prev.map(a => ({ ...a, status: 'Active' })))
        setCompletedTask(taskData)
      }
    }, 1100)
  }

  useEffect(() => {
    // Initial logs load
    if (PRESET_TASKS[0]) {
      setActiveLogs(
        PRESET_TASKS[0].thoughtLogs.map(l => ({
          ...l,
          timestamp: new Date().toLocaleTimeString(),
        }))
      )
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const handleCopy = () => {
    if (completedTask?.output) {
      navigator.clipboard.writeText(completedTask.output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Update Agent Modal
  const saveAgentConfig = (updated: SwarmAgent) => {
    setAgents(prev => prev.map(a => (a.id === updated.id ? updated : a)))
    setSelectedAgentForEdit(null)
  }

  return (
    <>
      <TopBar title="Agent Swarm Orchestrator">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              padding: '5px 12px',
              borderRadius: 999,
              background: isRunning ? 'rgba(56,189,248,0.12)' : 'rgba(52,211,153,0.12)',
              color: isRunning ? '#38BDF8' : '#34D399',
              border: `1px solid ${isRunning ? 'rgba(56,189,248,0.3)' : 'rgba(52,211,153,0.3)'}`,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: isRunning ? '#38BDF8' : '#34D399',
                boxShadow: isRunning ? '0 0 8px #38BDF8' : '0 0 8px #34D399',
                animation: isRunning ? 'pulse 1.5s infinite' : 'none',
              }}
            />
            {isRunning ? 'Swarm Executing…' : '5 Agents Online'}
          </div>

          <button
            onClick={handleRunSwarm}
            className="pill-primary"
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: '8px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(124, 58, 237, 0.3)',
            }}
          >
            {isRunning ? <IcPause size={15} /> : <IcPlay size={15} />}
            {isRunning ? 'Halt Execution' : 'Run Swarm'}
          </button>
        </div>
      </TopBar>

      <PageContent style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Header Intro Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 20,
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px 0', color: 'var(--color-foreground)' }}>
              Multi-Agent Collaborative Intelligence
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--color-muted)', margin: 0, maxWidth: 740, lineHeight: 1.5 }}>
              Coordinated neural cluster of specialized LLMs working concurrently to plan, research, generate, adversarially critique, and synthesize rigorous responses before delivering verdict-backed outputs.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div className="card-base" style={{ padding: '10px 16px', minWidth: 120 }}>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 500 }}>Consensus Agreement</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#34D399', marginTop: 2 }}>98.6%</div>
            </div>
            <div className="card-base" style={{ padding: '10px 16px', minWidth: 120 }}>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 500 }}>Avg Hand-off Latency</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#38BDF8', marginTop: 2 }}>380ms</div>
            </div>
            <div className="card-base" style={{ padding: '10px 16px', minWidth: 120 }}>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 500 }}>Critic Filter Rate</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#EC4899', marginTop: 2 }}>100%</div>
            </div>
          </div>
        </div>

        {/* ─── Swarm Topology Pipeline Visualizer ──────────────────────────── */}
        <div
          className="card-base"
          style={{
            padding: 20,
            marginBottom: 24,
            position: 'relative',
            overflow: 'hidden',
            background: 'var(--color-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IcSwarm size={18} color="var(--color-accent-violet)" />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-foreground)' }}>
                Live Swarm Neural Topology & Pipeline
              </span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
              Click any agent node to edit parameters
            </span>
          </div>

          {/* Progress Bar (Visible during run) */}
          {isRunning && (
            <div style={{ width: '100%', height: 4, background: 'var(--color-border)', borderRadius: 2, marginBottom: 18, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #7C3AED, #38BDF8, #34D399)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          )}

          {/* Pipeline Nodes Flow */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              overflowX: 'auto',
              paddingBottom: 8,
            }}
          >
            {agents.map((agent, index) => {
              const isAgentActive = isRunning && currentStep === index
              const isAgentDone = currentStep > index || (!isRunning && currentStep === agents.length)
              
              return (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgentForEdit(agent)}
                  style={{
                    flex: '1 1 0',
                    minWidth: 180,
                    padding: '14px 14px',
                    borderRadius: 12,
                    background: isAgentActive ? agent.bg : 'var(--color-card)',
                    border: `1.5px solid ${isAgentActive ? agent.color : isAgentDone ? 'rgba(52,211,153,0.3)' : agent.border}`,
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    boxShadow: isAgentActive ? `0 0 16px ${agent.color}40` : 'none',
                    transform: isAgentActive ? 'translateY(-2px)' : 'none',
                    position: 'relative',
                  }}
                >
                  {/* Step Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 6,
                        background: agent.bg,
                        color: agent.color,
                        border: `1px solid ${agent.border}`,
                        textTransform: 'uppercase',
                      }}
                    >
                      Step 0{index + 1}
                    </span>

                    {/* Status Pill */}
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: isAgentActive ? agent.color : isAgentDone ? '#34D399' : 'var(--color-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {isAgentActive ? (
                        <span style={{ animation: 'spin 1s linear infinite' }}>⟳</span>
                      ) : isAgentDone ? (
                        <IcCheck size={12} />
                      ) : null}
                      {isAgentActive ? 'Thinking…' : isAgentDone ? 'Done' : 'Standby'}
                    </span>
                  </div>

                  {/* Agent Info */}
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)', marginBottom: 3 }}>
                    {agent.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {agent.model}
                  </div>

                  {/* Telemetry Microchips */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 10, fontSize: 10.5, color: 'var(--color-muted)' }}>
                    <span style={{ padding: '2px 5px', borderRadius: 4, background: 'var(--color-hover)' }}>
                      ~{agent.latencyMs}ms
                    </span>
                    <span style={{ padding: '2px 5px', borderRadius: 4, background: 'var(--color-hover)' }}>
                      {agent.tokensUsed} tkn
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ─── Main Two-Column Layout: Controls & Execution Output ─────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: 24, alignItems: 'start' }}>
          
          {/* LEFT COLUMN: Preset Selector, Prompt Input & Orchestration Mode */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            
            {/* Task Presets Card */}
            <div className="card-base" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)' }}>
                  Task Benchmark Presets
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>Select scenario</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {PRESET_TASKS.map((preset, i) => {
                  const selected = selectedTaskIndex === i
                  return (
                    <div
                      key={preset.id}
                      onClick={() => selectPreset(i)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: selected ? 'var(--color-nav-active-bg)' : 'transparent',
                        border: `1px solid ${selected ? 'var(--color-accent-violet)' : 'var(--color-border)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: selected ? 'var(--color-accent-violet)' : 'var(--color-foreground)' }}>
                          {preset.title}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: 'var(--color-hover)',
                            color: 'var(--color-muted)',
                          }}
                        >
                          {preset.badge}
                        </span>
                      </div>
                      <p style={{ fontSize: 11.5, color: 'var(--color-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {preset.prompt}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Prompt Input & Execution Modes */}
            <div className="card-base" style={{ padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)', marginBottom: 8 }}>
                Swarm Task Objective
              </div>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-input-bg)',
                  color: 'var(--color-foreground)',
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                placeholder="Enter complex instruction for the multi-agent swarm..."
              />

              {/* Orchestration Mode Selector */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-foreground)', marginBottom: 8 }}>
                  Swarm Orchestration Protocol
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {ORCHESTRATION_MODES.map(mode => {
                    const active = selectedMode === mode.id
                    return (
                      <div
                        key={mode.id}
                        onClick={() => setSelectedMode(mode.id)}
                        style={{
                          padding: '10px 10px',
                          borderRadius: 8,
                          background: active ? 'var(--color-nav-active-bg)' : 'var(--color-card)',
                          border: `1px solid ${active ? 'var(--color-accent-violet)' : 'var(--color-border)'}`,
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span>{mode.icon}</span>
                          <span style={{ fontSize: 11.5, fontWeight: 600, color: active ? 'var(--color-accent-violet)' : 'var(--color-foreground)' }}>
                            {mode.name}
                          </span>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--color-muted)', lineHeight: 1.3 }}>
                          {mode.desc}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Execute Action */}
              <button
                onClick={handleRunSwarm}
                disabled={isRunning}
                className="pill-primary"
                style={{
                  width: '100%',
                  marginTop: 18,
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isRunning ? 'not-allowed' : 'pointer',
                  opacity: isRunning ? 0.7 : 1,
                }}
              >
                <IcSparkles size={16} />
                {isRunning ? 'Agents Collaborating…' : 'Trigger Swarm Execution'}
              </button>
            </div>

            {/* Live Agent Thought Stream */}
            <div className="card-base" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)' }}>
                  Live Thought Telemetry
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{activeLogs.length} events</span>
              </div>

              <div
                style={{
                  maxHeight: 220,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  paddingRight: 4,
                }}
              >
                {activeLogs.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: '20px 0' }}>
                    Click "Run Swarm" to stream agent thoughts.
                  </div>
                ) : (
                  activeLogs.map((log, idx) => {
                    const agent = agents.find(a => a.id === log.agentId) || agents[0]
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 6,
                          background: 'var(--color-surface)',
                          borderLeft: `3px solid ${agent.color}`,
                          fontSize: 11.5,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontWeight: 600, color: agent.color }}>
                            {agent.label}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>{log.timestamp}</span>
                        </div>
                        <div style={{ color: 'var(--color-foreground)', lineHeight: 1.4 }}>
                          {log.message}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Output Tabs, Waterfall Trace, Raw Payloads & Scorecard */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            
            {/* View Tabs */}
            <div
              className="card-base"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setActiveTab('output')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: 'none',
                    background: activeTab === 'output' ? 'var(--color-nav-active-bg)' : 'transparent',
                    color: activeTab === 'output' ? 'var(--color-accent-violet)' : 'var(--color-muted)',
                    fontWeight: 600,
                    fontSize: 12.5,
                    cursor: 'pointer',
                  }}
                >
                  Synthesized Output
                </button>
                <button
                  onClick={() => setActiveTab('trace')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: 'none',
                    background: activeTab === 'trace' ? 'var(--color-nav-active-bg)' : 'transparent',
                    color: activeTab === 'trace' ? 'var(--color-accent-violet)' : 'var(--color-muted)',
                    fontWeight: 600,
                    fontSize: 12.5,
                    cursor: 'pointer',
                  }}
                >
                  Handoff Waterfall
                </button>
                <button
                  onClick={() => setActiveTab('scratchpad')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: 'none',
                    background: activeTab === 'scratchpad' ? 'var(--color-nav-active-bg)' : 'transparent',
                    color: activeTab === 'scratchpad' ? 'var(--color-accent-violet)' : 'var(--color-muted)',
                    fontWeight: 600,
                    fontSize: 12.5,
                    cursor: 'pointer',
                  }}
                >
                  Agent Scratchpads
                </button>
                <button
                  onClick={() => setActiveTab('scorecard')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: 'none',
                    background: activeTab === 'scorecard' ? 'var(--color-nav-active-bg)' : 'transparent',
                    color: activeTab === 'scorecard' ? 'var(--color-accent-violet)' : 'var(--color-muted)',
                    fontWeight: 600,
                    fontSize: 12.5,
                    cursor: 'pointer',
                  }}
                >
                  Judge Scorecard
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={handleCopy}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-card)',
                    color: 'var(--color-foreground)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {copied ? <IcCheck size={13} color="#34D399" /> : <IcCopy size={13} />}
                  {copied ? 'Copied' : 'Copy Output'}
                </button>
              </div>
            </div>

            {/* TAB 1: Synthesized Output */}
            {activeTab === 'output' && (
              <div className="card-base" style={{ padding: 22, minHeight: 480 }}>
                {isRunning ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 16 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        border: '3px solid var(--color-border)',
                        borderTopColor: 'var(--color-accent-violet)',
                        animation: 'spin 1s linear infinite',
                      }}
                    />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-foreground)' }}>
                        Swarm Agent Consensus in Progress…
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--color-muted)', marginTop: 4 }}>
                        Step {currentStep + 1} of {agents.length}: {agents[currentStep]?.label || 'Synthesizing'}
                      </div>
                    </div>
                  </div>
                ) : completedTask?.output ? (
                  <div style={{ color: 'var(--color-foreground)', fontSize: 13.5, lineHeight: 1.7 }}>
                    <div
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(124,58,237,0.08)',
                        border: '1px solid rgba(124,58,237,0.2)',
                        borderRadius: 8,
                        marginBottom: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399' }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-foreground)' }}>
                          Swarm Consensus Verdict: Verified by Critic Judge
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                        ID: swrm-run-882194
                      </span>
                    </div>

                    <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                      {completedTask.output}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-muted)' }}>
                    No execution output yet. Click "Run Swarm" to trigger the multi-agent pipeline.
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Handoff Waterfall & Latency */}
            {activeTab === 'trace' && (
              <div className="card-base" style={{ padding: 22, minHeight: 480 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-foreground)', marginBottom: 6 }}>
                  Agent Execution & Latency Waterfall
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--color-muted)', marginBottom: 20 }}>
                  Granular timing profile showing how time was spent across each stage of the swarm workflow.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {agents.map((agent, i) => {
                    const totalSwarmTime = agents.reduce((acc, curr) => acc + curr.latencyMs, 0)
                    const percent = Math.round((agent.latencyMs / totalSwarmTime) * 100)
                    
                    return (
                      <div key={agent.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: agent.color }} />
                            <span style={{ fontWeight: 600, color: 'var(--color-foreground)' }}>
                              {agent.label}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                              ({agent.model})
                            </span>
                          </div>
                          <span style={{ fontWeight: 600, color: agent.color }}>
                            {agent.latencyMs}ms ({percent}%)
                          </span>
                        </div>

                        {/* Bar */}
                        <div style={{ width: '100%', height: 10, background: 'var(--color-hover)', borderRadius: 5, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${percent}%`,
                              height: '100%',
                              background: agent.color,
                              borderRadius: 5,
                              transition: 'width 0.5s ease',
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}

                  <div
                    style={{
                      marginTop: 18,
                      padding: 14,
                      borderRadius: 8,
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 12.5,
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--color-foreground)' }}>Cumulative Swarm Turnaround: </span>
                      <span style={{ color: '#34D399', fontWeight: 700 }}>2,280 ms</span>
                    </div>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--color-foreground)' }}>Total Tokens: </span>
                      <span style={{ color: '#38BDF8', fontWeight: 700 }}>6,130 tokens ($0.014)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Agent Scratchpads */}
            {activeTab === 'scratchpad' && (
              <div className="card-base" style={{ padding: 22, minHeight: 480 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-foreground)', marginBottom: 6 }}>
                  Individual Agent Intermediate Scratchpads
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--color-muted)', marginBottom: 16 }}>
                  Inspect raw intermediate payloads and private memory buffers passed along the chain.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {agents.map((agent, i) => (
                    <details
                      key={agent.id}
                      open={i === 0 || i === 3}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <summary
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: agent.color,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>{agent.label} Scratchpad</span>
                        <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{agent.tools.length} Tools Invoked</span>
                      </summary>

                      <div style={{ marginTop: 10, fontSize: 12, color: 'var(--color-foreground)', lineHeight: 1.5 }}>
                        <div style={{ marginBottom: 6, color: 'var(--color-muted)', fontSize: 11 }}>
                          <strong>System Directive:</strong> {agent.systemPrompt}
                        </div>
                        <div
                          style={{
                            padding: 10,
                            borderRadius: 6,
                            background: 'var(--color-card)',
                            border: '1px solid var(--color-border)',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: 11,
                            overflowX: 'auto',
                          }}
                        >
                          {i === 0 && `{"subtasks": ["analyze_regulatory_clause", "calculate_churn_bounds", "mitigate_clawback"], "dependencies": {"task_2": ["task_1"], "task_3": ["task_2"]}}`}
                          {i === 1 && `{"retrieved_docs": 4, "top_source": "FASB_ASC_606_Subtopic_10.pdf", "confidence_similarity": 0.942}`}
                          {i === 2 && `{"draft_generated": true, "code_blocks": 1, "complexity_score": "O(1) Mutex synchronization"}`}
                          {i === 3 && `{"verdict": "APPROVED_AFTER_REDLINE", "hallucination_detected": false, "safety_score": 100}`}
                          {i === 4 && `{"final_synthesis": "COMPLETE", "token_compression_ratio": "1.4x", "status": "DELIVERED"}`}
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: Judge Scorecard */}
            {activeTab === 'scorecard' && (
              <div className="card-base" style={{ padding: 22, minHeight: 480 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-foreground)' }}>
                      Multi-Criteria Swarm Quality Scorecard
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
                      Evaluated by Critic Agent against standardized rubrics
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      background: 'rgba(52,211,153,0.12)',
                      border: '1px solid rgba(52,211,153,0.3)',
                      color: '#34D399',
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    Composite: 96.8 / 100
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                  <div className="card-base" style={{ padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                      <span>Factuality & Grounding</span>
                      <span style={{ color: '#38BDF8' }}>98.2%</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'var(--color-hover)', borderRadius: 3 }}>
                      <div style={{ width: '98.2%', height: '100%', background: '#38BDF8', borderRadius: 3 }} />
                    </div>
                  </div>

                  <div className="card-base" style={{ padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                      <span>Hallucination Filter Rate</span>
                      <span style={{ color: '#34D399' }}>99.5%</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'var(--color-hover)', borderRadius: 3 }}>
                      <div style={{ width: '99.5%', height: '100%', background: '#34D399', borderRadius: 3 }} />
                    </div>
                  </div>

                  <div className="card-base" style={{ padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                      <span>Logical Reasoning Depth</span>
                      <span style={{ color: '#7C3AED' }}>95.0%</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'var(--color-hover)', borderRadius: 3 }}>
                      <div style={{ width: '95%', height: '100%', background: '#7C3AED', borderRadius: 3 }} />
                    </div>
                  </div>

                  <div className="card-base" style={{ padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                      <span>Safety & Guardrail Compliance</span>
                      <span style={{ color: '#EC4899' }}>100.0%</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'var(--color-hover)', borderRadius: 3 }}>
                      <div style={{ width: '100%', height: '100%', background: '#EC4899', borderRadius: 3 }} />
                    </div>
                  </div>
                </div>

                <div style={{ padding: 14, borderRadius: 8, background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: 12.5 }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-foreground)', marginBottom: 4 }}>
                    Judge Verdict Summary
                  </div>
                  <div style={{ color: 'var(--color-muted)', lineHeight: 1.5 }}>
                    The multi-agent swarm demonstrated complete compliance with required output constraints. Zero hallucinated references detected, and all mathematical assertions match formal theorem bounds.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Swarm Agent Configuration Modal / Drawer ───────────────────── */}
        {selectedAgentForEdit && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
            onClick={() => setSelectedAgentForEdit(null)}
          >
            <div
              className="card-base"
              style={{
                width: '100%',
                maxWidth: 540,
                padding: 24,
                background: 'var(--color-background)',
                border: `1.5px solid ${selectedAgentForEdit.color}`,
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: selectedAgentForEdit.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: selectedAgentForEdit.color,
                      fontWeight: 700,
                    }}
                  >
                    <IcCpu size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--color-foreground)' }}>
                      Configure {selectedAgentForEdit.label}
                    </h3>
                    <div style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>
                      Provider: {selectedAgentForEdit.provider}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAgentForEdit(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', fontSize: 18 }}
                >
                  ✕
                </button>
              </div>

              {/* Form Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Model Selection */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-foreground)', display: 'block', marginBottom: 6 }}>
                    Backbone LLM Model
                  </label>
                  <select
                    value={selectedAgentForEdit.model}
                    onChange={e =>
                      setSelectedAgentForEdit({ ...selectedAgentForEdit, model: e.target.value })
                    }
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-input-bg)',
                      color: 'var(--color-foreground)',
                      fontSize: 12.5,
                    }}
                  >
                    <option value="claude-3.5-sonnet">Claude 3.5 Sonnet (Anthropic)</option>
                    <option value="gpt-4o">GPT-4o (OpenAI)</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash (Google)</option>
                    <option value="llama-3.3-70b">Llama 3.3 70B (Meta)</option>
                    <option value="deepseek-v3">DeepSeek V3 (DeepSeek)</option>
                  </select>
                </div>

                {/* System Prompt */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-foreground)', display: 'block', marginBottom: 6 }}>
                    System Instructions & Role Prompt
                  </label>
                  <textarea
                    value={selectedAgentForEdit.systemPrompt}
                    onChange={e =>
                      setSelectedAgentForEdit({ ...selectedAgentForEdit, systemPrompt: e.target.value })
                    }
                    rows={3}
                    style={{
                      width: '100%',
                      padding: 10,
                      borderRadius: 6,
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-input-bg)',
                      color: 'var(--color-foreground)',
                      fontSize: 12,
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Sliders */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-foreground)' }}>Temperature</span>
                      <span style={{ color: 'var(--color-muted)' }}>{selectedAgentForEdit.temperature}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={selectedAgentForEdit.temperature}
                      onChange={e =>
                        setSelectedAgentForEdit({
                          ...selectedAgentForEdit,
                          temperature: parseFloat(e.target.value),
                        })
                      }
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-foreground)' }}>Max Tokens</span>
                      <span style={{ color: 'var(--color-muted)' }}>{selectedAgentForEdit.maxTokens}</span>
                    </div>
                    <input
                      type="range"
                      min="512"
                      max="8192"
                      step="512"
                      value={selectedAgentForEdit.maxTokens}
                      onChange={e =>
                        setSelectedAgentForEdit({
                          ...selectedAgentForEdit,
                          maxTokens: parseInt(e.target.value),
                        })
                      }
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                {/* Tools */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-foreground)', display: 'block', marginBottom: 6 }}>
                    Enabled Tool Permissions
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {selectedAgentForEdit.tools.map((t, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: 11,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: selectedAgentForEdit.bg,
                          color: selectedAgentForEdit.color,
                          border: `1px solid ${selectedAgentForEdit.border}`,
                        }}
                      >
                        ✓ {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Save & Cancel */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                  <button
                    onClick={() => setSelectedAgentForEdit(null)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 6,
                      border: '1px solid var(--color-border)',
                      background: 'transparent',
                      color: 'var(--color-foreground)',
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveAgentConfig(selectedAgentForEdit)}
                    className="pill-primary"
                    style={{
                      padding: '8px 18px',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Save Agent Node
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </PageContent>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
