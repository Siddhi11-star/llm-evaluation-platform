export type AgentStatus = 'running' | 'thinking' | 'waiting' | 'completed' | 'failed' | 'paused'

export interface JudgeAIAgentTask {
  id: string
  number: string
  name: string
  role: string
  avatar: string
  taskPrompt: string
  status: AgentStatus
  statusLabel?: string
  model: string
  progress: number
  tokensGenerated: number
  latencyMs: number
  startedTime?: string
  isHighlighted?: boolean
  detailInfo: {
    overview: string
    subtasks: string[]
    currentActivity: string[]
    terminalLogs: Array<{ time: string; agent: string; text: string; level?: 'info' | 'success' | 'warn' | 'error' }>
    artifactOutput?: {
      type: 'image_analysis' | 'code' | 'markdown' | 'table' | 'evaluation'
      title: string
      content: string
      data?: Record<string, any>
    }
  }
}

export interface JudgeAIEvaluationResult {
  overallScore: number
  criteria: {
    accuracy: number
    reasoning: number
    groundedness: number
    safety: number
    consistency: number
  }
  confidence: 'High' | 'Medium' | 'Low'
  bestModel: {
    name: string
    score: number
    cost: string
    latency: string
  }
  summaryVerdict: string
}

export interface JudgeAISwarmSession {
  id: string
  title: string
  subtitle?: string
  category: string
  status?: string
  totalTasks: number
  activeTaskIndex: number
  attachmentsCount: number
  modelName: string
  prompt: string
  delegationLeadText: string
  elapsedTime: string
  totalTokens: number
  cost: string
  swarmProgress: number
  startedAt?: string
  progressPercent?: number
  activeAgentsCount?: number
  synthesisText?: string
  orchestrator: {
    name: string
    role: string
    avatar: string
    model: string
    status: AgentStatus
    progress: number
    tokens: number
    latency: string
    task: string
  }
  tasks: JudgeAIAgentTask[]
  synthesisNode: {
    name: string
    role: string
    avatar: string
    model: string
    status: AgentStatus
    progress: number
    task: string
  }
  thoughtSteps: Array<{ title: string; agentName: string; why: string; content: string }>
  liveLogs: Array<{ time: string; agent: string; text: string; level?: 'info' | 'success' | 'warn' | 'error' }>
  evaluationResult?: JudgeAIEvaluationResult | null
  createdFile?: { name: string; status: 'creating' | 'done'; progress: number }
  is_trivial?: boolean
  timelineSteps?: any[]
  deliverable?: any
  subAgentPods?: any[]
}

export const FEATURED_SWARM_CASES = [
  {
    id: 'case-gargantua',
    title: 'Balckhole: GARGANTUA',
    category: 'Physics & WebGL Simulation',
    image: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=800&auto=format&fit=crop',
    description: 'Accretion disk relativistic raytracing engine in WebGL2 with 4 parallel compute shaders.',
    prompt: 'Build a relativistic raytracing simulation of the Gargantua black hole with photon sphere gravitational lensing.',
  },
  {
    id: 'case-typewriter',
    title: '3D Vintage Typewriter',
    category: 'Interactive 3D Experience',
    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=800&auto=format&fit=crop',
    description: 'Kinematic mechanical keypress simulation with physics-based audio synthesis in Three.js.',
    prompt: 'Create an interactive 3D mechanical vintage typewriter with physically accurate key levers and typewriter sounds.',
  },
  {
    id: 'case-market-dashboard',
    title: 'Global Market Dashboard',
    category: 'Real-Time Financial Intel',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=800&auto=format&fit=crop',
    description: 'Multi-exchange WebSocket ticker aggregator and heatmap risk model across 4 parallel worker pods.',
    prompt: 'Aggregate global equity, crypto, and commodity order books in real time with portfolio value-at-risk stress tests.',
  },
]

export const JUDGEAI_SWARM_SESSIONS: JudgeAISwarmSession[] = [
  // Session 1: LLM-as-a-Judge Evaluation & Benchmarking Swarm (4 Parallel Specialized Agents)
  {
    id: 'session-llm-judge-eval',
    title: 'LLM Multi-Criteria Benchmark',
    category: 'Autonomous Multi-Agent Evaluation',
    totalTasks: 4,
    activeTaskIndex: 0,
    attachmentsCount: 4,
    modelName: 'MiniMax M3 (Orchestrator)',
    prompt: 'Evaluate Qwen3 14B vs Llama 3.3 70B across accuracy, reasoning depth, groundedness, and hallucination safety rubrics.',
    delegationLeadText: 'Orchestrator parsed prompt into 3 parallel evaluation workstreams and 1 synthesis judge:',
    elapsedTime: '12.4s',
    totalTokens: 18420,
    cost: '$0.0210',
    swarmProgress: 100,
    orchestrator: {
      name: 'JudgeAI Orchestrator',
      role: 'Boss Orchestrator & Decomposer',
      avatar: '👑',
      model: 'MiniMax M3',
      status: 'completed',
      progress: 100,
      tokens: 4821,
      latency: '2.4s',
      task: 'Decompose incoming evaluation request and dispatch to specialized worker pods',
    },
    tasks: [
      {
        id: 'task-01',
        number: '01',
        name: 'JudgeAI Orchestrator',
        role: 'Orchestrator',
        avatar: '👑',
        taskPrompt: 'Decompose incoming evaluation request into domain rubrics',
        status: 'completed',
        model: 'MiniMax M3',
        progress: 100,
        tokensGenerated: 4821,
        latencyMs: 2400,
        startedTime: '22:47:12',
        detailInfo: {
          overview: 'Deconstruct prompt into syntax trees, semantic criteria, and gold-standard references.',
          subtasks: [
            'Parse user request into structured evaluation rubrics',
            'Dispatch retrieval queries to Vector Agent',
            'Assign parallel inference to Reasoning and Judge agents',
          ],
          currentActivity: [
            'Decomposing evaluation request...',
            'Allocating workers for parallel execution...',
            'Awaiting sub-agent evaluations...',
            'Synthesizing final meta-judgment score.',
          ],
          terminalLogs: [
            { time: '22:47:12', agent: 'ORCHESTRATOR', text: 'Prompt received: "Evaluate Qwen3 14B vs Llama 3.3 70B"', level: 'info' },
            { time: '22:47:13', agent: 'ORCHESTRATOR', text: 'Parsed 4 evaluation rubrics: Accuracy, Reasoning, Safety, Groundedness', level: 'info' },
            { time: '22:47:13', agent: 'ORCHESTRATOR', text: 'Spawned 3 parallel worker pods via JudgeAI PARL Engine', level: 'success' },
            { time: '22:47:18', agent: 'ORCHESTRATOR', text: 'Synthesized final multi-agent evaluation dossier in 610ms', level: 'success' },
          ],
          artifactOutput: {
            type: 'markdown',
            title: 'JudgeAI Orchestrator Execution Plan',
            content: `**Decomposition Strategy:**
- **Pipeline:** Parallel Non-Blocking (PARL)
- **Rubrics:** 4 core vectors (Accuracy, Logic, Groundedness, Security)
- **Concurrency Speedup:** **4.5x** over sequential evaluation.`,
          },
        },
      },
      {
        id: 'task-02',
        number: '02',
        name: 'Vector Agent',
        role: 'Context & Groundedness Retriever',
        avatar: '💾',
        taskPrompt: 'Retrieve relevant context and similarity records from knowledge base',
        status: 'completed',
        model: 'DeepSeek V4 Flash',
        progress: 100,
        tokensGenerated: 3410,
        latencyMs: 1850,
        startedTime: '22:47:14',
        detailInfo: {
          overview: 'Extract vector embeddings, query MongoDB vector indexes, and compute similarity cosine scores.',
          subtasks: [
            'Query local embeddings collection for reference ground truth',
            'Compute semantic cosine distance for 25 retrieved chunks',
            'Verify zero context truncation across 32k window',
          ],
          currentActivity: [
            'Connecting to MongoDB vector index...',
            'Retrieved 25 high-confidence reference chunks...',
            'Filtered top-5 ground truth citations.',
          ],
          terminalLogs: [
            { time: '22:47:14', agent: 'VECTOR', text: 'Embedding query using all-MiniLM-L6-v2 vectorizer', level: 'info' },
            { time: '22:47:15', agent: 'VECTOR', text: 'Retrieved 25 nearest neighbors with avg cosine similarity 0.892', level: 'success' },
            { time: '22:47:16', agent: 'VECTOR', text: 'Groundedness verified against 14 factual source clauses', level: 'success' },
          ],
          artifactOutput: {
            type: 'table',
            title: 'Vector Context Citations',
            content: `| Source Chunk | Cosine Similarity | Factual Alignment | Groundedness |
| :--- | :--- | :--- | :--- |
| **HaluEval #104** | 0.942 | 100% Validated | Optimal |
| **JudgeAI Gold #88**| 0.918 | 98.4% Match | Optimal |
| **Legal Corpus #12**| 0.884 | 96.0% Match | Verified |`,
          },
        },
      },
      {
        id: 'task-03',
        number: '03',
        name: 'Reasoning Agent',
        role: 'Logical Consistency & Chain-of-Thought Evaluator',
        avatar: '🧠',
        taskPrompt: 'Evaluate logical consistency and multi-step inference chains',
        status: 'completed',
        model: 'Qwen3 14B',
        progress: 100,
        tokensGenerated: 5820,
        latencyMs: 3100,
        startedTime: '22:47:15',
        detailInfo: {
          overview: 'Audit step-by-step deductive logic, identify logical fallacies, and measure mathematical accuracy.',
          subtasks: [
            'Extract symbolic proof structure from model generation',
            'Verify premise-to-conclusion causal chain',
            'Calculate reasoning depth coefficient (86/100)',
          ],
          currentActivity: [
            'Analyzing 12 reasoning nodes in chain-of-thought...',
            'No deductive fallacies or circular reasoning detected...',
            'Reasoning depth verified at 86/100.',
          ],
          terminalLogs: [
            { time: '22:47:15', agent: 'REASONING', text: 'Parsing mathematical and deductive logic nodes...', level: 'info' },
            { time: '22:47:16', agent: 'REASONING', text: 'Audited 12 reasoning steps: 12 valid, 0 invalid', level: 'success' },
            { time: '22:47:17', agent: 'REASONING', text: 'Assigned reasoning rubric score: 86 / 100', level: 'success' },
          ],
          artifactOutput: {
            type: 'markdown',
            title: 'Logical Consistency Audit Report',
            content: `**Reasoning Rubric Findings:**
- **Deductive Validity:** 100%
- **Inference Redundancy:** 0.04 (Negligible)
- **Reasoning Score:** **86 / 100**
- **Conclusion:** Candidate model exhibits robust chain-of-thought reasoning without premature termination.`,
          },
        },
      },
      {
        id: 'task-04',
        number: '04',
        name: 'Judge Agent',
        role: 'Factual Guard & Safety Evaluator',
        avatar: '⚖️',
        taskPrompt: 'Audit model outputs, measure hallucination rate, and generate evaluation',
        status: 'completed',
        model: 'Claude 3.5 Sonnet',
        progress: 100,
        tokensGenerated: 4369,
        latencyMs: 2900,
        startedTime: '22:47:17',
        detailInfo: {
          overview: 'Execute automated LLM-as-a-Judge inspection using G-Eval protocols and zero-hallucination guardrails.',
          subtasks: [
            'Measure factual consistency against source references',
            'Check for safety alignment and prompt injection attempts',
            'Compute confidence interval (High, p < 0.01)',
          ],
          currentActivity: [
            'Running G-Eval multi-criteria prompt...',
            'Hallucination rate verified at 0.00%...',
            'Safety alignment rating: 95/100.',
          ],
          terminalLogs: [
            { time: '22:47:17', agent: 'JUDGE', text: 'Executing G-Eval inspection on model responses...', level: 'info' },
            { time: '22:47:18', agent: 'JUDGE', text: 'Hallucination rate: 0.00% (Zero ungrounded assertions)', level: 'success' },
            { time: '22:47:18', agent: 'JUDGE', text: 'Overall safety rating: 95 / 100 (Clean)', level: 'success' },
          ],
          artifactOutput: {
            type: 'evaluation',
            title: 'LLM Judge Evaluation Verdict',
            content: `**JudgeAI Evaluation Summary:**
- **Overall Score:** **87.4 / 100**
- **Accuracy:** 92
- **Reasoning:** 86
- **Groundedness:** 89
- **Safety:** 95
- **Consistency:** 81
- **Confidence:** **High**`,
          },
        },
      },
    ],
    synthesisNode: {
      name: 'Final Synthesis',
      role: 'Meta Consensus Compiler',
      avatar: '✨',
      model: 'MiniMax M3',
      status: 'completed',
      progress: 100,
      task: 'Synthesize parallel evaluations into final judgment and rank models',
    },
    thoughtSteps: [
      {
        title: 'Vector Context Retrieval',
        agentName: 'Vector Agent',
        why: 'Retrieve ground-truth facts and knowledge chunks to anchor evaluation',
        content: 'Vector Agent queries high-dimensional embeddings to verify candidate statements against source documents.',
      },
      {
        title: 'Logical Consistency Analysis',
        agentName: 'Reasoning Agent',
        why: 'Examine step-by-step deductive steps and prevent circular logic',
        content: 'Reasoning Agent audits the formal logic and proof consistency across all generation tokens.',
      },
      {
        title: 'Quality & Safety Verification',
        agentName: 'Judge Agent',
        why: 'Measure hallucination, safety guardrails, and compliance score',
        content: 'Judge Agent applies multi-criteria rubrics to score output veracity with high statistical confidence.',
      },
      {
        title: 'Final Meta Synthesis',
        agentName: 'Orchestrator',
        why: 'Synthesize all parallel results into actionable metrics and leaderboards',
        content: 'Orchestrator compiles individual worker vectors into the final judgment dossier.',
      },
    ],
    liveLogs: [
      { time: '22:47:12', agent: 'ORCHESTRATOR', text: 'Prompt received: Decomposing evaluation request...', level: 'info' },
      { time: '22:47:13', agent: 'ORCHESTRATOR', text: 'Created 4 parallel agents (Vector, Reasoning, Judge, Synthesis)', level: 'info' },
      { time: '22:47:14', agent: 'VECTOR', text: 'Retrieving embeddings & similarity records from knowledge base...', level: 'info' },
      { time: '22:47:15', agent: 'REASONING', text: 'Running reasoning evaluation on step-by-step inference...', level: 'info' },
      { time: '22:47:17', agent: 'JUDGE', text: 'Comparing model outputs against factual consistency rubric...', level: 'info' },
      { time: '22:47:18', agent: 'ORCHESTRATOR', text: 'Synthesizing final multi-agent evaluation dossier', level: 'success' },
    ],
    evaluationResult: {
      overallScore: 87.4,
      criteria: {
        accuracy: 92,
        reasoning: 86,
        groundedness: 89,
        safety: 95,
        consistency: 81,
      },
      confidence: 'High',
      bestModel: {
        name: 'Qwen3 14B',
        score: 91.2,
        cost: '$0.00',
        latency: '2.8s',
      },
      summaryVerdict: 'Qwen3 14B outperformed candidate benchmarks with 91.2 composite score, zero hallucinations, and high reasoning depth.',
    },
    createdFile: {
      name: 'judgeai_evaluation_dossier.md',
      status: 'done',
      progress: 100,
    },
  },
]
