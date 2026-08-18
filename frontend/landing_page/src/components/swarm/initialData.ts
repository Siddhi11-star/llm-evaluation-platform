import {
  SwarmCanvasNode,
  SwarmWireConnection,
  SwarmExecutionRecord,
  SwarmTestCase,
  ChatMessage,
  SwarmWorkflowPreset,
  JudgeAISubAgentPod,
  JudgeAITimelineStep,
  JudgeAIDeliverableArtifact,
} from './types'

export const INITIAL_SWARM_NODES: SwarmCanvasNode[] = [
  {
    id: 'node-trigger',
    type: 'trigger',
    name: 'When chat message received',
    subtitle: 'Chat Trigger',
    icon: '⚡',
    x: 180,
    y: 350,
    width: 220,
    height: 90,
    color: '#10B981',
    stage: 'done',
    progress: 100,
    statusText: 'Listening for incoming chat',
    badgeText: 'Trigger',
    itemCount: '1 item',
    inputs: [],
    outputs: [{ id: 'out-1', name: 'Output', type: 'main-output', position: 'right' }],
  },
  {
    id: 'node-agent-main',
    type: 'agent',
    name: 'AI Agent',
    subtitle: 'Tools Agent',
    icon: '🤖',
    x: 560,
    y: 260,
    width: 250,
    height: 105,
    color: '#10B981',
    stage: 'done',
    progress: 100,
    statusText: 'Coordinator Agent',
    badgeText: 'Coordinator',
    itemCount: '1 item',
    isActive: true,
    modelName: 'gpt-4o',
    inputs: [{ id: 'in-1', name: 'Input', type: 'main-input', position: 'left' }],
    outputs: [{ id: 'out-1', name: 'Output', type: 'main-output', position: 'right' }],
  },
]

export const INITIAL_SWARM_WIRES: SwarmWireConnection[] = [
  {
    id: 'wire-1',
    fromNodeId: 'node-trigger',
    fromPortId: 'out-1',
    toNodeId: 'node-agent-main',
    toPortId: 'in-1',
    itemCount: '1 item',
    color: '#10B981',
    isAnimated: true,
  },
]

export const INITIAL_SUB_AGENT_PODS: JudgeAISubAgentPod[] = [
  {
    id: 'pod-1',
    name: 'Su',
    role: 'MacroNutrientExtractor',
    avatar: '👩🏻',
    color: '#6366F1',
    model: 'minimax-m3:cloud',
    status: 'completed',
    taskDescription: 'Analyze the nutrition label in the image at /mnt/ok_food_label_01.png',
    progress: 100,
    tokensGenerated: 1420,
    latencyMs: 145,
    toolCallsCount: 4,
    logs: ['Loaded image tensor', 'Extracted macro ratio', 'Verified zero allergens'],
  },
  {
    id: 'pod-2',
    name: 'Stigler',
    role: 'CaloricDensityAnalyzer',
    avatar: '👦🏻',
    color: '#10B981',
    model: 'qwen3:14b',
    status: 'completed',
    taskDescription: 'Analyze the nutrition label in the image at /mnt/ok_food_label_02.png',
    progress: 100,
    tokensGenerated: 1840,
    latencyMs: 180,
    toolCallsCount: 6,
    logs: ['Calculated density index', 'Assessed glycemic load'],
  },
  {
    id: 'pod-3',
    name: 'Allen',
    role: 'AdditiveAllergenScanner',
    avatar: '👩🏽',
    color: '#EC4899',
    model: 'deepseek-v4-flash',
    status: 'completed',
    taskDescription: 'Analyze the nutrition label in the image at /mnt/ok_food_label_03.png',
    progress: 100,
    tokensGenerated: 1650,
    latencyMs: 210,
    toolCallsCount: 5,
    logs: ['Scanned E-numbers', 'Verified zero tree nuts'],
  },
]

export const INITIAL_TIMELINE_STEPS: JudgeAITimelineStep[] = [
  { agentId: 'pod-1', agentName: 'Su (MacroNutrientExtractor)', role: 'OCR', color: '#6366F1', startMs: 0, durationMs: 145, toolName: 'cv2_ocr()', stage: 'tool_execution', status: 'completed' },
  { agentId: 'pod-2', agentName: 'Stigler (CaloricDensityAnalyzer)', role: 'Density', color: '#10B981', startMs: 0, durationMs: 180, toolName: 'density_calc()', stage: 'tool_execution', status: 'completed' },
  { agentId: 'pod-3', agentName: 'Allen (AdditiveAllergenScanner)', role: 'Allergens', color: '#EC4899', startMs: 0, durationMs: 210, toolName: 'allergen_scan()', stage: 'tool_execution', status: 'completed' },
]

export const INITIAL_DELIVERABLE: JudgeAIDeliverableArtifact = {
  id: 'art-initial',
  title: 'JudgeAI Multi-Agent Synthesis Dossier',
  type: 'report',
  summary: 'Synthesized parallel multi-agent evaluation with 4.5x speedup.',
  content: `# JudgeAI Swarm Synthesis Report

All parallel sub-agents completed non-blocking execution in 610ms.
- **Su:** Protein and macro extraction validated
- **Stigler:** Caloric density rating: A
- **Allen:** 100% allergen safe
`,
  timestamp: 'Just now',
}

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'm-1',
    sender: 'user',
    time: '8:49:38 PM',
    text: 'Analyze all nutrition label images in parallel and extract macro ratios.',
  },
  {
    id: 'm-2',
    sender: 'agent',
    agentName: 'JudgeAI Swarm Orchestrator',
    agentAvatar: '🤖',
    agentColor: '#6366F1',
    time: '8:49:40 PM',
    stage: 'done',
    text: 'All 7 nutrition label agents have initialized concurrent image analyses. Viewing real-time OCR extractions and comparative macro tables on JudgeAI’s Computer.',
  },
]

export const INITIAL_EXECUTIONS: SwarmExecutionRecord[] = [
  {
    id: 'exec-8f2a1b',
    timestamp: 'Just now',
    status: 'success',
    duration: '610ms',
    trigger: 'When chat message received',
    nodesCount: 6,
    totalTokens: 7200,
    cost: '$0.0108',
    prompt: 'Analyze all 7 nutrition label images in parallel',
    resultSummary: 'Synthesized 7 parallel image OCR streams with 0.00% error rate.',
    speedup: '4.5x',
    toolCallsCount: 23,
  },
]

export const INITIAL_TEST_CASES: SwarmTestCase[] = [
  {
    id: 'test-1',
    name: 'Parallel OCR Execution Concurrency',
    inputPrompt: 'Extract macronutrient table from label image',
    expectedKeywords: ['protein', 'calories', 'fat', 'carbs'],
    lastScore: 99.4,
    lastStatus: 'pass',
    lastRun: 'Just now',
  },
]

export const WORKFLOW_PRESETS: SwarmWorkflowPreset[] = [
  {
    id: 'preset-nutrition',
    title: '🥗 Nutrition Label Comparison (7 Tasks)',
    tag: 'vision',
    description: 'Analyze all 7 nutrition label images in parallel with OCR extractions and macro tables.',
    mode: 'turbo',
    nodes: INITIAL_SWARM_NODES,
    wires: INITIAL_SWARM_WIRES,
    subAgentPods: INITIAL_SUB_AGENT_PODS,
    timelineSteps: INITIAL_TIMELINE_STEPS,
    deliverable: INITIAL_DELIVERABLE,
    initialMessages: INITIAL_CHAT_MESSAGES,
  },
]
