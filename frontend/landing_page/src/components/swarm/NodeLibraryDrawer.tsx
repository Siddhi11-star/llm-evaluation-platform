import React, { useState } from 'react'
import { NodeType, SwarmCanvasNode } from './types'
import { IcX, IcSearch, IcSparkles } from '../icons'

interface NodeLibraryDrawerProps {
  isOpen: boolean
  isLightTheme?: boolean
  onClose: () => void
  onAddNode: (template: Partial<SwarmCanvasNode>) => void
}

interface NodeTemplateItem {
  type: NodeType
  name: string
  subtitle: string
  icon: string
  color: string
  category: 'Agents' | 'Models' | 'Triggers' | 'Tools' | 'Memory' | 'Vector Stores' | 'Evaluators'
  description: string
  defaultData?: Partial<SwarmCanvasNode>
}

const TEMPLATES: NodeTemplateItem[] = [
  // Triggers
  {
    type: 'trigger',
    name: 'When chat message received',
    subtitle: 'Chat Trigger',
    icon: '⚡',
    color: '#10B981',
    category: 'Triggers',
    description: 'Triggers flow execution on new user message in web chat widget',
    defaultData: {
      width: 220,
      height: 90,
      inputs: [],
      outputs: [{ id: 'out-1', name: 'Output', type: 'main-output', position: 'right' }],
    },
  },
  {
    type: 'trigger',
    name: 'Webhook Event',
    subtitle: 'HTTP POST Trigger',
    icon: '🪝',
    color: '#7C3AED',
    category: 'Triggers',
    description: 'Receives external webhook payloads and dispatches swarm tasks',
    defaultData: {
      width: 200,
      height: 85,
      inputs: [],
      outputs: [{ id: 'out-1', name: 'Output', type: 'main-output', position: 'right' }],
    },
  },

  // Agents
  {
    type: 'agent',
    name: 'AI Agent',
    subtitle: 'Tools Agent',
    icon: '🤖',
    color: '#10B981',
    category: 'Agents',
    description: 'Multi-tool agent coordinator that decomposes tasks and orchestrates sub-nodes',
    defaultData: {
      width: 250,
      height: 105,
      modelName: 'gpt-4o',
      inputs: [{ id: 'in-1', name: 'Input', type: 'main-input', position: 'left' }],
      outputs: [{ id: 'out-1', name: 'Output', type: 'main-output', position: 'right' }],
      subPorts: [
        { id: 'sub-model', name: 'Chat Model*', type: 'model', position: 'bottom', color: '#10B981', label: 'Chat Model*' },
        { id: 'sub-memory', name: 'Memory', type: 'memory', position: 'bottom', color: '#9CA3AF', label: 'Memory' },
        { id: 'sub-tool', name: 'Tool', type: 'tool', position: 'bottom', color: '#38BDF8', label: 'Tool' },
      ],
    },
  },
  {
    type: 'agent',
    name: 'Architect Prime',
    subtitle: 'Task Decomposer',
    icon: '⚡',
    color: '#8B5CF6',
    category: 'Agents',
    description: 'Autonomous schema architect that decomposes tasks into formal dependency DAGs',
    defaultData: {
      width: 240,
      height: 100,
      modelName: 'claude-3-5-sonnet',
      inputs: [{ id: 'in-1', name: 'Input', type: 'main-input', position: 'left' }],
      outputs: [{ id: 'out-1', name: 'Output', type: 'main-output', position: 'right' }],
      subPorts: [
        { id: 'sub-model', name: 'Chat Model*', type: 'model', position: 'bottom', color: '#8B5CF6', label: 'Model*' },
      ],
    },
  },
  {
    type: 'agent',
    name: 'Deep Generator',
    subtitle: 'Compute & Synthesis',
    icon: '🧠',
    color: '#0284C7',
    category: 'Agents',
    description: 'Generates step-by-step synthetic proofs and analytical vectors',
    defaultData: {
      width: 240,
      height: 100,
      modelName: 'gpt-4o',
      inputs: [{ id: 'in-1', name: 'Input', type: 'main-input', position: 'left' }],
      outputs: [{ id: 'out-1', name: 'Output', type: 'main-output', position: 'right' }],
    },
  },

  // Models
  {
    type: 'model',
    name: 'OpenAI Chat Model',
    subtitle: 'GPT-4o',
    icon: '🟢',
    color: '#10B981',
    category: 'Models',
    description: 'OpenAI flagship multimodal reasoning model',
    defaultData: {
      width: 140,
      height: 100,
      modelName: 'gpt-4o',
      inputs: [{ id: 'in-1', name: 'Model', type: 'model', position: 'top', label: 'Model' }],
      outputs: [],
    },
  },
  {
    type: 'model',
    name: 'Claude 3.5 Sonnet',
    subtitle: 'Anthropic',
    icon: '🟣',
    color: '#8B5CF6',
    category: 'Models',
    description: 'State-of-the-art coding and formal verification model',
    defaultData: {
      width: 140,
      height: 100,
      modelName: 'claude-3-5-sonnet',
      inputs: [{ id: 'in-1', name: 'Model', type: 'model', position: 'top', label: 'Model' }],
      outputs: [],
    },
  },
  {
    type: 'model',
    name: 'DeepSeek V3',
    subtitle: 'DeepSeek',
    icon: '🟡',
    color: '#F59E0B',
    category: 'Models',
    description: 'High efficiency open-weight reasoning model',
    defaultData: {
      width: 140,
      height: 100,
      modelName: 'deepseek-v3',
      inputs: [{ id: 'in-1', name: 'Model', type: 'model', position: 'top', label: 'Model' }],
      outputs: [],
    },
  },

  // Tools & Integrations
  {
    type: 'tool',
    name: 'Vector Store Tool',
    subtitle: 'Document Retriever',
    icon: '🗄️',
    color: '#0284C7',
    category: 'Tools',
    description: 'Connects AI Agents to vector retrieval collections',
    defaultData: {
      width: 210,
      height: 85,
      inputs: [{ id: 'in-1', name: 'Tool', type: 'tool', position: 'left', label: 'Tool' }],
      outputs: [{ id: 'out-1', name: 'Output', type: 'main-output', position: 'right' }],
      subPorts: [
        { id: 'sub-store', name: 'Vector Store', type: 'vectorStore', position: 'bottom', label: 'Vector Store' },
        { id: 'sub-model-tool', name: 'Model', type: 'model', position: 'bottom', label: 'Model' },
      ],
    },
  },
  {
    type: 'tool',
    name: 'Slack',
    subtitle: 'post: message',
    icon: '💬',
    color: '#E01E5A',
    category: 'Tools',
    description: 'Broadcast notifications and evaluation updates to Slack channels',
    defaultData: {
      width: 170,
      height: 80,
      inputs: [{ id: 'in-1', name: 'Input', type: 'main-input', position: 'left' }],
      outputs: [{ id: 'out-1', name: 'Output', type: 'main-output', position: 'right' }],
    },
  },
  {
    type: 'tool',
    name: 'Code Interpreter Sandbox',
    subtitle: 'Python Runtime',
    icon: '🐍',
    color: '#3B82F6',
    category: 'Tools',
    description: 'Executes sandboxed Python calculations and data transformations',
    defaultData: {
      width: 200,
      height: 85,
      inputs: [{ id: 'in-1', name: 'Input', type: 'main-input', position: 'left' }],
      outputs: [{ id: 'out-1', name: 'Output', type: 'main-output', position: 'right' }],
    },
  },

  // Vector Stores & Embeddings
  {
    type: 'vectorStore',
    name: 'Qdrant Vector Store',
    subtitle: 'Cosine Search',
    icon: '🔴',
    color: '#EF4444',
    category: 'Vector Stores',
    description: 'High-performance vector database collection',
    defaultData: {
      width: 190,
      height: 85,
      inputs: [{ id: 'in-1', name: 'Vector Store', type: 'vectorStore', position: 'top', label: 'Vector Store' }],
      outputs: [{ id: 'out-1', name: 'Output', type: 'main-output', position: 'right' }],
      subPorts: [{ id: 'sub-embed', name: 'Embedding*', type: 'embeddings', position: 'bottom', label: 'Embedding*' }],
    },
  },
  {
    type: 'embeddings',
    name: 'Embeddings OpenAI',
    subtitle: 'text-embedding-3-small',
    icon: '🟢',
    color: '#10B981',
    category: 'Vector Stores',
    description: '1536-dimensional dense vector embeddings',
    defaultData: {
      width: 140,
      height: 100,
      inputs: [{ id: 'in-1', name: 'Embeddings', type: 'embeddings', position: 'top', label: 'Embeddings' }],
      outputs: [],
    },
  },

  // Memory
  {
    type: 'memory',
    name: 'Postgres Chat Memory',
    subtitle: 'Session Buffer',
    icon: '💾',
    color: '#6B7280',
    category: 'Memory',
    description: 'Persists multi-turn conversation memory in PostgreSQL',
    defaultData: {
      width: 150,
      height: 100,
      inputs: [{ id: 'in-1', name: 'Memory', type: 'memory', position: 'top', label: 'Memory' }],
      outputs: [],
    },
  },

  // Evaluators
  {
    type: 'evaluator',
    name: 'Zero-Hallucination Guard',
    subtitle: 'LLM Judge Validator',
    icon: '🛡️',
    color: '#10B981',
    category: 'Evaluators',
    description: 'Performs formal double-blind verification against reference ground truth',
    defaultData: {
      width: 210,
      height: 85,
      inputs: [{ id: 'in-1', name: 'Input', type: 'main-input', position: 'left' }],
      outputs: [{ id: 'out-1', name: 'Output', type: 'main-output', position: 'right' }],
    },
  },
]

export const NodeLibraryDrawer: React.FC<NodeLibraryDrawerProps> = ({
  isOpen,
  isLightTheme,
  onClose,
  onAddNode,
}) => {
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState<string>('All')

  if (!isOpen) return null

  const categories = ['All', 'Agents', 'Models', 'Triggers', 'Tools', 'Vector Stores', 'Memory', 'Evaluators']

  const filtered = TEMPLATES.filter((t) => {
    const matchCat = selectedCat === 'All' || t.category === selectedCat
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div
      className={`absolute inset-y-0 left-0 z-40 w-80 border-r shadow-2xl flex flex-col backdrop-blur-2xl transition-all duration-300 animate-in slide-in-from-left duration-200 ${
        isLightTheme
          ? 'bg-white/95 border-zinc-200 shadow-zinc-300/50 text-zinc-900'
          : 'bg-[#14141C]/95 border-zinc-800 shadow-black/80 text-zinc-100'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xs text-white font-bold shadow-sm">
            +
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-foreground)]">Add Flow Nodes</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-hover)] transition-colors"
        >
          <IcX className="w-4 h-4" />
        </button>
      </div>

      {/* Search & Categories */}
      <div className="p-3 border-b border-[var(--color-border)] space-y-2.5">
        <div className="relative">
          <IcSearch className="w-3.5 h-3.5 text-[var(--color-muted)] absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents, models, tools..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-[10px]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors ${
                selectedCat === cat
                  ? 'bg-purple-600 text-white font-bold shadow-sm'
                  : 'bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-hover)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Node Catalog List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
        {filtered.map((item, idx) => (
          <div
            key={idx}
            onClick={() => {
              onAddNode({
                type: item.type,
                name: item.name,
                subtitle: item.subtitle,
                icon: item.icon,
                color: item.color,
                stage: 'idle',
                progress: 0,
                ...item.defaultData,
              })
              onClose()
            }}
            className="p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-purple-500/60 hover:scale-[1.02] cursor-pointer transition-all group relative shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 border"
                style={{
                  backgroundColor: `${item.color}15`,
                  borderColor: `${item.color}40`,
                  color: item.color,
                }}
              >
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--color-foreground)] group-hover:text-purple-400 transition-colors truncate">
                    {item.name}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-hover)] text-[var(--color-muted)] font-mono">
                    {item.category}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--color-muted)] line-clamp-2 mt-0.5 leading-relaxed font-normal">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
