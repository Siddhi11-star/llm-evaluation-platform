import React, { useState } from 'react'
import { SwarmCanvasNode } from './types'
import { IcX, IcSparkles, IcCheck, IcRotate, IcCopy } from '../icons'

interface NodeInspectorModalProps {
  node: SwarmCanvasNode | null
  isOpen: boolean
  isLightTheme?: boolean
  onClose: () => void
  onSaveNode: (updated: SwarmCanvasNode) => void
  onDeleteNode: (nodeId: string) => void
}

export const NodeInspectorModal: React.FC<NodeInspectorModalProps> = ({
  node,
  isOpen,
  isLightTheme,
  onClose,
  onSaveNode,
  onDeleteNode,
}) => {
  if (!isOpen || !node) return null

  const [activeTab, setActiveTab] = useState<'params' | 'subtasks' | 'output'>('params')
  const [name, setName] = useState(node.name)
  const [subtitle, setSubtitle] = useState(node.subtitle || '')
  const [modelName, setModelName] = useState(node.modelName || 'gpt-4o')
  const [temperature, setTemperature] = useState(node.temperature ?? 0.2)
  const [maxTokens, setMaxTokens] = useState(node.maxTokens ?? 4096)
  const [systemPrompt, setSystemPrompt] = useState(node.systemPrompt || '')
  const [assignedTask, setAssignedTask] = useState(node.assignedTask || '')
  const [subTasks, setSubTasks] = useState(node.subTasks || [])
  const [newSubTask, setNewSubTask] = useState('')
  const [copied, setCopied] = useState(false)
  const [testOutput, setTestOutput] = useState<any>(node.executionData?.output || null)
  const [isTesting, setIsTesting] = useState(false)

  const handleSave = () => {
    onSaveNode({
      ...node,
      name,
      subtitle,
      modelName,
      temperature,
      maxTokens,
      systemPrompt,
      assignedTask,
      subTasks,
    })
    onClose()
  }

  const handleAddSubTask = () => {
    if (!newSubTask.trim()) return
    setSubTasks([...subTasks, { title: newSubTask.trim(), done: false }])
    setNewSubTask('')
  }

  const handleToggleSubTask = (idx: number) => {
    setSubTasks(subTasks.map((st, i) => (i === idx ? { ...st, done: !st.done } : st)))
  }

  const handleDeleteSubTask = (idx: number) => {
    setSubTasks(subTasks.filter((_, i) => i !== idx))
  }

  const handleRunTestStep = () => {
    setIsTesting(true)
    setTimeout(() => {
      setIsTesting(false)
      setTestOutput({
        status: 'success',
        nodeId: node.id,
        nodeType: node.type,
        timestamp: new Date().toISOString(),
        executionTimeMs: Math.floor(Math.random() * 400) + 120,
        result: {
          message: `Successfully executed step for "${name}"`,
          outputPayload: {
            confidence: 0.998,
            hallucinationRate: '0.00%',
            tokensUsed: 284,
          },
        },
      })
      setActiveTab('output')
    }, 600)
  }

  const copyJson = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200 font-sans">
      <div
        className={`w-full max-w-2xl border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] backdrop-blur-2xl transition-colors duration-200 font-sans ${
          isLightTheme ? 'bg-white/95 border-zinc-200 text-zinc-900' : 'bg-[#181822]/95 border-zinc-800 text-zinc-100'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between font-sans ${
            isLightTheme ? 'border-zinc-200 bg-zinc-50/70' : 'border-zinc-800 bg-zinc-900/60'
          }`}
        >
          <div className="flex items-center gap-3 font-sans">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border shadow-sm font-sans"
              style={{
                backgroundColor: `${node.color || '#10B981'}20`,
                borderColor: `${node.color || '#10B981'}50`,
                color: node.color || '#10B981',
              }}
            >
              {node.icon || '⚙️'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[var(--color-foreground)] tracking-tight font-sans">{name}</h3>
                <span className="px-2 py-0.5 text-[10px] rounded bg-[var(--color-hover)] text-[var(--color-muted-stronger)] font-mono border border-[var(--color-border)]">
                  {node.type}
                </span>
              </div>
              <p className="text-xs text-[var(--color-muted)] font-sans">Configure parameters, prompt axioms & assigned tasks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-hover)] transition-colors"
          >
            <IcX className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--color-border)] px-6 bg-[var(--color-surface)] gap-6 font-sans">
          <button
            onClick={() => setActiveTab('params')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors font-sans ${
              activeTab === 'params'
                ? 'border-purple-500 text-purple-400 font-bold'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
            }`}
          >
            Parameters & Model
          </button>
          <button
            onClick={() => setActiveTab('subtasks')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 font-sans ${
              activeTab === 'subtasks'
                ? 'border-purple-500 text-purple-400 font-bold'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
            }`}
          >
            Assigned Sub-Tasks
            <span className="px-1.5 py-0.2 rounded-full bg-[var(--color-hover)] text-[10px] text-[var(--color-muted)] font-mono">
              {subTasks.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('output')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors font-sans ${
              activeTab === 'output'
                ? 'border-purple-500 text-purple-400 font-bold'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
            }`}
          >
            Execution Data & Test
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-[var(--color-foreground)] font-sans">
          {activeTab === 'params' && (
            <div className="space-y-4 font-sans">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-muted)] mb-1.5 font-sans">Node Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-foreground)] font-sans focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-muted)] mb-1.5 font-sans">Subtitle / Role</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. Tools Agent"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-foreground)] font-sans focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* LLM Model Provider */}
              {(node.type === 'agent' || node.type === 'model' || node.type === 'evaluator') && (
                <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4 font-sans">
                  <div className="flex items-center justify-between font-sans">
                    <label className="text-xs font-bold text-[var(--color-foreground)] flex items-center gap-1.5 font-sans">
                      <IcSparkles className="w-3.5 h-3.5 text-purple-400" />
                      LLM Model Engine
                    </label>
                    <span className="text-[11px] text-emerald-400 font-mono font-semibold">
                      0% Hallucination Target
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 font-sans">
                    {[
                      { id: 'gpt-4o', label: 'GPT-4o (OpenAI)', badge: 'Multimodal' },
                      { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', badge: 'Flagship' },
                      { id: 'gemini-2-flash', label: 'Gemini 2.0 Flash', badge: 'Ultra Fast' },
                      { id: 'deepseek-v3', label: 'DeepSeek V3', badge: 'Reasoning' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setModelName(m.id)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all font-sans ${
                          modelName === m.id
                            ? 'border-purple-500 bg-purple-500/15 text-purple-300 font-bold shadow-sm'
                            : 'border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-muted)] hover:border-purple-500/50'
                        }`}
                      >
                        <span className="text-xs font-semibold font-sans">{m.label}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--color-hover)] text-[var(--color-muted)] font-mono">
                          {m.badge}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 font-sans">
                    <div>
                      <div className="flex justify-between text-xs text-[var(--color-muted)] mb-1 font-sans">
                        <span>Temperature</span>
                        <span className="font-mono text-purple-400 font-bold">{temperature}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full accent-purple-500 cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-[var(--color-muted)] mb-1 font-sans">
                        <span>Max Tokens</span>
                        <span className="font-mono text-purple-400 font-bold">{maxTokens}</span>
                      </div>
                      <input
                        type="number"
                        value={maxTokens}
                        onChange={(e) => setMaxTokens(parseInt(e.target.value) || 2048)}
                        className="w-full px-3 py-1.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-foreground)] font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* System Prompt / Task */}
              <div className="font-sans">
                <label className="block text-xs font-medium text-[var(--color-muted)] mb-1.5 font-sans">
                  System Instructions & Prompt Axioms
                </label>
                <textarea
                  rows={4}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Define role boundary conditions, schema constraints, and verified evaluation rules..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-foreground)] focus:outline-none focus:border-purple-500 font-mono leading-relaxed"
                />
              </div>
            </div>
          )}

          {activeTab === 'subtasks' && (
            <div className="space-y-4 font-sans">
              <p className="text-xs text-[var(--color-muted)] font-sans">
                Tasks decomposed and assigned to this node for multi-agent swarm execution:
              </p>

              <div className="flex gap-2 font-sans">
                <input
                  type="text"
                  value={newSubTask}
                  onChange={(e) => setNewSubTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubTask()}
                  placeholder="Add a new sub-task for this agent..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-foreground)] font-sans focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={handleAddSubTask}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shadow-md font-sans"
                >
                  Add Task
                </button>
              </div>

              <div className="space-y-2 mt-3 font-sans">
                {subTasks.map((st, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-purple-500/40 transition-colors font-sans"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0 font-sans">
                      <input
                        type="checkbox"
                        checked={st.done}
                        onChange={() => handleToggleSubTask(idx)}
                        className="rounded accent-purple-500 cursor-pointer w-4 h-4"
                      />
                      <span
                        className={`text-xs truncate font-sans ${
                          st.done ? 'text-[var(--color-muted)] line-through' : 'text-[var(--color-foreground)] font-medium'
                        }`}
                      >
                        {st.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubTask(idx)}
                      className="text-[var(--color-muted)] hover:text-rose-400 p-1 text-xs transition-colors"
                    >
                      <IcX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'output' && (
            <div className="space-y-4 font-sans">
              <div className="flex items-center justify-between font-sans">
                <div className="text-xs text-[var(--color-muted)] font-sans">
                  Live input payload and mock test generation for this step:
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRunTestStep}
                    disabled={isTesting}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-md font-sans"
                  >
                    <IcRotate className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    {isTesting ? 'Executing...' : 'Test Step'}
                  </button>
                  {testOutput && (
                    <button
                      type="button"
                      onClick={() => copyJson(testOutput)}
                      className="px-2.5 py-1.5 rounded-xl bg-[var(--color-hover)] hover:bg-[var(--color-hover-strong)] text-[var(--color-foreground)] text-xs flex items-center gap-1 transition-colors border border-[var(--color-border)] font-sans"
                    >
                      {copied ? <IcCheck className="w-3.5 h-3.5 text-emerald-400" /> : <IcCopy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy JSON'}
                    </button>
                  )}
                </div>
              </div>

              {testOutput ? (
                <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] font-mono text-xs text-purple-400 max-h-72 overflow-y-auto custom-scrollbar">
                  <pre>{JSON.stringify(testOutput, null, 2)}</pre>
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-[var(--color-border)] rounded-2xl text-[var(--color-muted)] text-xs font-sans">
                  No execution output available. Click "Test Step" to run a mock execution.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-4 border-t flex items-center justify-between font-sans ${
            isLightTheme ? 'border-zinc-200 bg-zinc-50/70' : 'border-zinc-800 bg-zinc-900/60'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              onDeleteNode(node.id)
              onClose()
            }}
            className="text-xs text-rose-400 hover:text-rose-300 hover:underline transition-colors font-semibold font-sans"
          >
            Delete this Node
          </button>
          <div className="flex items-center gap-3 font-sans">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[var(--color-hover)] hover:bg-[var(--color-hover-strong)] text-xs font-semibold text-[var(--color-foreground)] transition-colors border border-[var(--color-border)] font-sans"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white transition-all shadow-md font-sans"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
