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

export type NodeStage = 'idle' | 'waiting' | 'thinking' | 'working' | 'verifying' | 'synthesizing' | 'done' | 'error'

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

export interface SwarmWorkflowPreset {
  id: string
  title: string
  tag: string
  description: string
  nodes: SwarmCanvasNode[]
  wires: SwarmWireConnection[]
  initialMessages: ChatMessage[]
}
