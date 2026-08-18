export type NodeType =
  | 'trigger'
  | 'agent'
  | 'subagent'
  | 'model'
  | 'memory'
  | 'tool'
  | 'vectorStore'
  | 'embeddings'
  | 'evaluator'

export type NodeStage =
  | 'idle'
  | 'waiting'
  | 'thinking'
  | 'working'
  | 'verifying'
  | 'synthesizing'
  | 'done'
  | 'error'

export type SwarmScaleMode = 'auto' | 'turbo' | 'deep_eval' | 'max_parallel'

export interface PortDefinition {
  id: string
  name: string
  type: 'main-input' | 'main-output' | 'model' | 'memory' | 'tool' | 'vectorStore' | 'embeddings' | 'subagent'
  position: 'top' | 'bottom' | 'left' | 'right'
  color?: string
  connected?: boolean
  label?: string
}

export interface SwarmCanvasNode {
  id: string
  type: NodeType
  name: string
  subtitle?: string
  icon?: string
  x: number
  y: number
  width?: number
  height?: number
  color?: string
  stage: NodeStage
  progress: number
  statusText?: string
  badgeText?: string
  itemCount?: string
  isActive?: boolean
  isDeactivated?: boolean
  // Agent / Model specific
  modelName?: string
  provider?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  assignedTask?: string
  subTasks?: Array<{ title: string; done: boolean }>
  tools?: string[]
  memoryType?: string
  // Execution logs & data
  executionData?: {
    latencyMs: number
    startTime: string
    status: 'success' | 'running' | 'error' | 'idle'
    input: Record<string, any>
    output: Record<string, any>
    logs: Array<{ time: string; text: string; level: 'info' | 'success' | 'warn' | 'error' }>
  }
  // Ports
  inputs: PortDefinition[]
  outputs: PortDefinition[]
  subPorts?: PortDefinition[]
}

export interface SwarmWireConnection {
  id: string
  fromNodeId: string
  fromPortId: string
  toNodeId: string
  toPortId: string
  label?: string
  itemCount?: string
  color?: string
  isAnimated?: boolean
}

export interface ChatMessage {
  id: string
  sender: 'user' | 'agent' | 'system'
  agentId?: string
  agentName?: string
  agentAvatar?: string
  agentColor?: string
  time: string
  text: string
  stage?: NodeStage
  jsonPayload?: Record<string, any>
}

export interface SwarmExecutionRecord {
  id: string
  timestamp: string
  status: 'success' | 'failed' | 'running'
  duration: string
  trigger: string
  nodesCount: number
  totalTokens: number
  cost: string
  prompt: string
  resultSummary: string
  speedup?: string
  toolCallsCount?: number
}

export interface SwarmTestCase {
  id: string
  name: string
  inputPrompt: string
  expectedKeywords: string[]
  lastScore?: number
  lastStatus?: 'pass' | 'fail' | 'untested'
  lastRun?: string
}

export interface JudgeAISubAgentPod {
  id: string
  name: string
  role: string
  avatar: string
  color: string
  model: string
  status: 'running' | 'completed' | 'queued' | 'error'
  activeTool?: string
  taskDescription: string
  progress: number
  tokensGenerated: number
  latencyMs: number
  toolCallsCount: number
  logs: string[]
  outputSnippet?: string
}

export interface JudgeAITimelineStep {
  agentId: string
  agentName: string
  role: string
  color: string
  startMs: number
  durationMs: number
  toolName?: string
  stage: 'dispatch' | 'tool_execution' | 'inference' | 'synthesis'
  status: 'completed' | 'running' | 'pending'
}

export interface JudgeAIDeliverableArtifact {
  id: string
  title: string
  type: 'report' | 'code' | 'benchmark' | 'table'
  summary: string
  metrics?: Record<string, string | number>
  timestamp: string
  content: string
}



export interface SwarmWorkflowPreset {
  id: string
  title: string
  tag: string
  description: string
  mode?: SwarmScaleMode
  nodes: SwarmCanvasNode[]
  wires: SwarmWireConnection[]
  subAgentPods?: JudgeAISubAgentPod[]
  timelineSteps?: JudgeAITimelineStep[]
  deliverable?: JudgeAIDeliverableArtifact
  initialMessages: ChatMessage[]
}
