import React, { useState, useEffect } from 'react'
import { useSettings } from '../components/ThemeProvider'
import {
  SwarmCanvasNode,
  SwarmWireConnection,
  SwarmExecutionRecord,
  SwarmTestCase,
  ChatMessage,
  SwarmWorkflowPreset,
} from '../components/swarm/types'
import {
  INITIAL_SWARM_NODES,
  INITIAL_SWARM_WIRES,
  INITIAL_CHAT_MESSAGES,
  INITIAL_EXECUTIONS,
  INITIAL_TEST_CASES,
  WORKFLOW_PRESETS,
} from '../components/swarm/initialData'
import { SwarmCanvas } from '../components/swarm/SwarmCanvas'
import { SwarmBottomDrawer } from '../components/swarm/SwarmBottomDrawer'
import { NodeInspectorModal } from '../components/swarm/NodeInspectorModal'
import { NodeLibraryDrawer } from '../components/swarm/NodeLibraryDrawer'
import { ExecutionsView } from '../components/swarm/ExecutionsView'
import { TestsView } from '../components/swarm/TestsView'
import { generateDynamicSwarmWorkflow } from '../components/swarm/swarmWorkflowGenerator'
import {
  IcPlus,
  IcPlay,
  IcCheck,
  IcRotate,
  IcSparkles,
  IcShare,
  IcDatabase,
  IcSearch,
  IcSettings,
  IcX,
  IcChevronDown,
} from '../components/icons'

export default function AgentSwarmPage() {
  const { theme, profile } = useSettings()
  const isLightTheme = theme === 'light'

  // Navigation Mode
  const [activeTab, setActiveTab] = useState<'editor' | 'executions' | 'tests'>('editor')

  // Workflow Metadata & Presets
  const initialDefault = generateDynamicSwarmWorkflow('Analyze request and coordinate multi-agent evaluation')
  const [selectedPresetId, setSelectedPresetId] = useState<string>('preset-dynamic')
  const [workflowTitle, setWorkflowTitle] = useState(initialDefault.title)
  const [workflowTag, setWorkflowTag] = useState(initialDefault.tag)
  const [isActive, setIsActive] = useState(true)
  const [isSaved, setIsSaved] = useState(true)

  // Canvas State
  const [nodes, setNodes] = useState<SwarmCanvasNode[]>(initialDefault.nodes)
  const [wires, setWires] = useState<SwarmWireConnection[]>(initialDefault.wires)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node-gen-coord')
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null)

  // History Stack for Undo / Redo
  const [history, setHistory] = useState<Array<{ nodes: SwarmCanvasNode[]; wires: SwarmWireConnection[] }>>([])
  const [historyIndex, setHistoryIndex] = useState<number>(-1)

  // Inspector & Add Drawers
  const [inspectingNodeId, setInspectingNodeId] = useState<string | null>(null)
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isPresetDropdownOpen, setIsPresetDropdownOpen] = useState(false)

  // Execution & Live Chat State
  const [isExecuting, setIsExecuting] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [sessionId, setSessionId] = useState('b6ff428be3c64c6a891eceb814bb9a78')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES)
  const [executions, setExecutions] = useState<SwarmExecutionRecord[]>(INITIAL_EXECUTIONS)
  const [testCases, setTestCases] = useState<SwarmTestCase[]>(INITIAL_TEST_CASES)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Push state to history
  const pushHistory = (newNodes: SwarmCanvasNode[], newWires: SwarmWireConnection[]) => {
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), { nodes: newNodes, wires: newWires }])
    setHistoryIndex((prev) => prev + 1)
  }

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevStep = history[historyIndex - 1]
      setNodes(prevStep.nodes)
      setWires(prevStep.wires)
      setHistoryIndex(historyIndex - 1)
      triggerToast('Undo previous step')
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextStep = history[historyIndex + 1]
      setNodes(nextStep.nodes)
      setWires(nextStep.wires)
      setHistoryIndex(historyIndex + 1)
      triggerToast('Redo step')
    }
  }

  // Node Drag Position Update
  const handleUpdateNodePosition = (nodeId: string, x: number, y: number) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, x, y } : n))
    )
    setIsSaved(false)
  }

  // Connect Two Nodes via Wire
  const handleAddWire = (
    fromNodeId: string,
    fromPortId: string,
    toNodeId: string,
    toPortId: string
  ) => {
    const exists = wires.some(
      (w) =>
        w.fromNodeId === fromNodeId &&
        w.fromPortId === fromPortId &&
        w.toNodeId === toNodeId &&
        w.toPortId === toPortId
    )
    if (exists) return

    const newWire: SwarmWireConnection = {
      id: `wire-${Date.now()}`,
      fromNodeId,
      fromPortId,
      toNodeId,
      toPortId,
      itemCount: '1 item',
      color: isLightTheme ? '#7C3AED' : '#10B981',
      isAnimated: true,
    }

    const updatedWires = [...wires, newWire]
    setWires(updatedWires)
    pushHistory(nodes, updatedWires)
    setIsSaved(false)
    triggerToast('Connected node ports successfully')
  }

  // Delete Wire
  const handleDeleteWire = (wireId: string) => {
    const updated = wires.filter((w) => w.id !== wireId)
    setWires(updated)
    setSelectedWireId(null)
    pushHistory(nodes, updated)
    setIsSaved(false)
  }

  // Delete Node
  const handleDeleteNode = (nodeId: string) => {
    const updatedNodes = nodes.filter((n) => n.id !== nodeId)
    const updatedWires = wires.filter((w) => w.fromNodeId !== nodeId && w.toNodeId !== nodeId)
    setNodes(updatedNodes)
    setWires(updatedWires)
    if (selectedNodeId === nodeId) setSelectedNodeId(null)
    if (inspectingNodeId === nodeId) setInspectingNodeId(null)
    pushHistory(updatedNodes, updatedWires)
    setIsSaved(false)
    triggerToast('Node removed from flow')
  }

  // Add Node from Catalog
  const handleAddNodeFromTemplate = (template: Partial<SwarmCanvasNode>) => {
    const newNode: SwarmCanvasNode = {
      id: `node-${Date.now()}`,
      type: template.type || 'tool',
      name: template.name || 'New Node',
      subtitle: template.subtitle || 'Custom Node',
      icon: template.icon || '⚙️',
      x: 380 + Math.floor(Math.random() * 80),
      y: 280 + Math.floor(Math.random() * 80),
      width: template.width || 200,
      height: template.height || 85,
      color: template.color || (isLightTheme ? '#7C3AED' : '#10B981'),
      stage: 'idle',
      progress: 0,
      inputs: template.inputs || [{ id: 'in-1', name: 'Input', type: 'main-input', position: 'left' }],
      outputs: template.outputs || [{ id: 'out-1', name: 'Output', type: 'main-output', position: 'right' }],
      subPorts: template.subPorts,
      modelName: template.modelName,
      ...template,
    }

    const updatedNodes = [...nodes, newNode]
    setNodes(updatedNodes)
    setSelectedNodeId(newNode.id)
    pushHistory(updatedNodes, wires)
    setIsSaved(false)
    triggerToast(`Added "${newNode.name}" to canvas`)
  }

  // Save Node Configuration from Inspector
  const handleSaveNodeConfig = (updatedNode: SwarmCanvasNode) => {
    const updated = nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n))
    setNodes(updated)
    pushHistory(updated, wires)
    setIsSaved(false)
    triggerToast(`Saved settings for "${updatedNode.name}"`)
  }

  // Preset Template Loader
  const handleSelectPreset = (preset: SwarmWorkflowPreset) => {
    setSelectedPresetId(preset.id)
    setWorkflowTitle(preset.title)
    setWorkflowTag(preset.tag)
    setNodes(preset.nodes)
    setWires(preset.wires)
    setChatMessages(preset.initialMessages)
    setIsPresetDropdownOpen(false)
    setIsSaved(true)
    pushHistory(preset.nodes, preset.wires)
    triggerToast(`Loaded "${preset.title}" architecture`)
  }

  // Run Swarm Workflow Simulation
  const handleRunWorkflow = () => {
    if (isExecuting) return
    setIsExecuting(true)
    setIsChatOpen(true)

    // Reset stages
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        stage: n.isDeactivated ? 'idle' : 'working',
        progress: n.isDeactivated ? 0 : 20,
      }))
    )

    // Step 1: Trigger & Gateway
    setTimeout(() => {
      setNodes((prev) =>
        prev.map((n) =>
          n.type === 'trigger' || n.id === 'node-slack' || n.id.includes('trigger')
            ? { ...n, stage: 'done', progress: 100 }
            : { ...n, progress: 50 }
        )
      )
    }, 450)

    // Step 2: Vector Search & Decomposition
    setTimeout(() => {
      setNodes((prev) =>
        prev.map((n) =>
          n.type === 'vectorStore' || n.type === 'embeddings' || n.id.includes('model') || n.id.includes('coord') || n.id.includes('architect')
            ? { ...n, stage: 'done', progress: 100 }
            : { ...n, progress: 80 }
        )
      )
    }, 900)

    // Step 3: Synthesis & Verification
    setTimeout(() => {
      setNodes((prev) =>
        prev.map((n) =>
          n.isDeactivated
            ? n
            : {
                ...n,
                stage: 'done',
                progress: 100,
              }
        )
      )
      setIsExecuting(false)
      triggerToast('✓ Swarm executed successfully in 1.42s')

      const newExec: SwarmExecutionRecord = {
        id: `exec-${Math.random().toString(36).slice(2, 10)}`,
        timestamp: 'Just now',
        status: 'success',
        duration: '1.42s',
        trigger: 'When chat message received',
        nodesCount: nodes.length,
        totalTokens: 2480,
        cost: '$0.0098',
        prompt: chatMessages[chatMessages.length - 1]?.text || 'Test workflow prompt',
        resultSummary: 'Synthesized 25 retrieved vector chunks with 0.00% hallucination verification.',
      }
      setExecutions((prev) => [newExec, ...prev])
    }, 1450)
  }

  // Send Chat Message & Dynamically Update Agent Swarm Diagram & Logs
  const handleSendMessage = (text: string) => {
    const userMsg: ChatMessage = {
      id: `chat-${Date.now()}`,
      sender: 'user',
      time: new Date().toLocaleTimeString().slice(0, 8),
      text,
    }
    setChatMessages((prev) => [...prev, userMsg])
    setIsExecuting(true)

    // Dynamically synthesize a swarm workflow matching this exact prompt!
    const dynamicSwarm = generateDynamicSwarmWorkflow(text)

    // Update Top Title to reflect the active prompt task
    setWorkflowTitle(dynamicSwarm.title)
    setWorkflowTag(dynamicSwarm.tag)

    // Initialize the generated workflow nodes on the canvas
    const initialWorkingNodes = dynamicSwarm.nodes.map((n, idx) => ({
      ...n,
      stage: idx === 0 ? ('working' as const) : ('idle' as const),
      progress: idx === 0 ? 30 : 0,
    }))

    pushHistory(initialWorkingNodes, dynamicSwarm.wires)
    setNodes(initialWorkingNodes)
    setWires(dynamicSwarm.wires)

    // Set active node for the logs inspector to the Coordinator
    const coordinatorNode = dynamicSwarm.nodes.find((n) => n.type === 'agent') || dynamicSwarm.nodes[0]
    if (coordinatorNode) {
      setSelectedNodeId(coordinatorNode.id)
    }

    // Step 1: Ingestion & Trigger Node
    setTimeout(() => {
      setNodes((prev) =>
        prev.map((n, idx) =>
          idx === 0
            ? { ...n, stage: 'done', progress: 100 }
            : idx === 1
            ? { ...n, stage: 'working', progress: 45 }
            : n
        )
      )
    }, 400)

    // Step 2: Coordinator & Model Reasoning
    setTimeout(() => {
      setNodes((prev) =>
        prev.map((n, idx) =>
          idx <= 2
            ? { ...n, stage: 'done', progress: 100 }
            : idx <= 4
            ? { ...n, stage: 'working', progress: 60 }
            : n
        )
      )
    }, 850)

    // Step 3: Domain Specialists & Zero-Hallucination Verifiers Finish
    setTimeout(() => {
      setNodes((prev) =>
        prev.map((n) => ({
          ...n,
          stage: 'done',
          progress: 100,
        }))
      )
      setIsExecuting(false)
      triggerToast(`✓ Swarm synthesized "${dynamicSwarm.title}" with 0.00% hallucination`)

      // Add to Executions history
      setExecutions((prev) => [dynamicSwarm.executionRecord, ...prev])

      // Stream the synthesized assistant response
      const agentMsg: ChatMessage = {
        id: `chat-${Date.now() + 1}`,
        sender: 'agent',
        agentId: coordinatorNode?.id || 'node-agent',
        agentName: coordinatorNode?.name || 'Swarm Coordinator',
        agentAvatar: coordinatorNode?.icon || '🤖',
        agentColor: coordinatorNode?.color || '#10B981',
        time: new Date().toLocaleTimeString().slice(0, 8),
        stage: 'done',
        text: dynamicSwarm.chatResponseText,
      }
      setChatMessages((prev) => [...prev, agentMsg])
    }, 1450)
  }

  return (
    <div
      className={`flex flex-col flex-1 h-full w-full overflow-hidden select-none font-sans transition-colors duration-200 ${
        isLightTheme ? 'bg-[#F8F9FA] text-zinc-900' : 'bg-[#0A0A0A] text-zinc-100'
      }`}
    >
      {/* ================= TOP WORKFLOW HEADER (Evaluations Style) ================= */}
      <header
        className={`h-14 border-b px-5 flex items-center justify-between shrink-0 z-40 backdrop-blur-xl transition-colors duration-200 ${
          isLightTheme ? 'border-zinc-200 bg-white/90 shadow-sm' : 'border-zinc-800 bg-[#0E0E14]/90'
        }`}
      >
        {/* Left: Brand Icon + Title & Preset Selector */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/20">
            <span className="text-white text-base font-bold">☍</span>
          </div>

          {/* Workflow Title Input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={workflowTitle}
              onChange={(e) => {
                setWorkflowTitle(e.target.value)
                setIsSaved(false)
              }}
              className="text-sm font-bold text-[var(--color-foreground)] bg-transparent border-b border-transparent hover:border-[var(--color-border)] focus:border-purple-500 focus:outline-none px-1 py-0.5 tracking-tight font-sans"
            />
            <span className="px-2 py-0.5 rounded-md bg-[var(--color-surface)] text-[var(--color-muted)] text-[11px] font-medium border border-[var(--color-border)]">
              {workflowTag}
            </span>
          </div>

          {/* Template Presets Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsPresetDropdownOpen(!isPresetDropdownOpen)}
              className="px-3 py-1.5 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-hover)] text-[var(--color-foreground)] text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[var(--color-border)]"
            >
              <span>Presets</span>
              <IcChevronDown className="w-3 h-3 text-[var(--color-muted)]" />
            </button>

            {isPresetDropdownOpen && (
              <div
                className={`absolute left-0 mt-2 w-64 rounded-2xl border shadow-2xl p-2 z-50 text-xs backdrop-blur-2xl ${
                  isLightTheme ? 'bg-white/95 border-zinc-200 shadow-zinc-300/60' : 'bg-[#14141C]/95 border-zinc-800 shadow-black/90'
                }`}
              >
                <div className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider px-2 py-1">
                  Architecture Presets
                </div>
                {WORKFLOW_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex flex-col ${
                      selectedPresetId === preset.id
                        ? 'bg-purple-600/15 text-purple-400 font-bold border border-purple-500/30'
                        : 'hover:bg-[var(--color-hover)] text-[var(--color-foreground)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{preset.title}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-hover)] text-[var(--color-muted)] font-mono">
                        {preset.tag}
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--color-muted)] font-normal truncate mt-0.5">
                      {preset.description}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add Node Button matching Evaluations Run button style */}
          <button
            onClick={() => setIsAddDrawerOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 dark:bg-white dark:text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <span className="text-sm leading-none">+</span>
            <span>Add Node</span>
          </button>
        </div>

        {/* Center: Mode Switcher Tabs [Editor | Executions | Tests] styled as Evaluations segments */}
        <div className="flex items-center bg-[var(--color-surface)] p-1 rounded-xl border border-[var(--color-border)]">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'editor'
                ? 'bg-purple-600/20 text-purple-400 font-bold border border-purple-500/30 shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setActiveTab('executions')}
            className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'executions'
                ? 'bg-purple-600/20 text-purple-400 font-bold border border-purple-500/30 shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
            }`}
          >
            Executions
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'tests'
                ? 'bg-purple-600/20 text-purple-400 font-bold border border-purple-500/30 shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
            }`}
          >
            Tests
          </button>
        </div>

        {/* Right: Active Toggle, Share, Saved Status, Undo/Redo */}
        <div className="flex items-center gap-3">
          {/* Active Switch Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-[var(--color-muted)]">Active</span>
            <button
              type="button"
              onClick={() => {
                setIsActive(!isActive)
                triggerToast(isActive ? 'Swarm paused' : 'Swarm active')
              }}
              className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                isActive ? 'bg-emerald-500' : 'bg-zinc-600'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${
                  isActive ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <button
            onClick={() => triggerToast('Workflow share link copied to clipboard')}
            className="px-3 py-1.5 rounded-xl bg-[var(--color-hover)] hover:bg-[var(--color-hover-strong)] text-[var(--color-foreground)] text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[var(--color-border)]"
          >
            <IcShare className="w-3.5 h-3.5" />
            Share
          </button>

          <div className="flex items-center gap-1 text-[11px] text-[var(--color-muted)]">
            <IcCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isSaved ? 'Saved' : 'Unsaved'}</span>
          </div>

          {/* Undo / Redo */}
          <div className="flex items-center border-l border-[var(--color-border)] pl-2 gap-1 text-[var(--color-muted)]">
            <button
              onClick={handleUndo}
              className="p-1.5 hover:text-[var(--color-foreground)] hover:bg-[var(--color-hover)] rounded-lg transition-colors text-xs"
              title="Undo (Ctrl+Z)"
            >
              ↩
            </button>
            <button
              onClick={handleRedo}
              className="p-1.5 hover:text-[var(--color-foreground)] hover:bg-[var(--color-hover)] rounded-lg transition-colors text-xs"
              title="Redo (Ctrl+Y)"
            >
              ↪
            </button>
          </div>

          {/* 3-Dot Options Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 hover:text-[var(--color-foreground)] hover:bg-[var(--color-hover)] rounded-xl text-[var(--color-muted)] transition-colors"
            >
              •••
            </button>
            {isMenuOpen && (
              <div
                className={`absolute right-0 mt-2 w-48 rounded-2xl border shadow-2xl py-1.5 z-50 text-xs backdrop-blur-2xl ${
                  isLightTheme ? 'bg-white/95 border-zinc-200 shadow-zinc-300/60' : 'bg-[#161620]/95 border-zinc-800 shadow-black/80'
                }`}
              >
                <button
                  onClick={() => {
                    const json = JSON.stringify({ nodes, wires }, null, 2)
                    navigator.clipboard.writeText(json)
                    triggerToast('Exported flow JSON copied to clipboard')
                    setIsMenuOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--color-hover)] text-[var(--color-foreground)] transition-colors"
                >
                  Export Workflow JSON
                </button>
                <button
                  onClick={() => {
                    handleSelectPreset(WORKFLOW_PRESETS[0])
                    setIsMenuOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--color-hover)] text-purple-400 font-semibold transition-colors"
                >
                  Reset to Default Demo
                </button>
                <button
                  onClick={() => {
                    setNodes([])
                    setWires([])
                    setIsMenuOpen(false)
                    triggerToast('Cleared canvas')
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--color-hover)] text-rose-400 transition-colors"
                >
                  Clear Canvas
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex-1 flex overflow-hidden relative">
        <main className="flex-1 relative overflow-hidden flex flex-col">
          {activeTab === 'editor' && (
            <>
              {/* Interactive Canvas */}
              <SwarmCanvas
                nodes={nodes}
                wires={wires}
                selectedNodeId={selectedNodeId}
                selectedWireId={selectedWireId}
                isExecuting={isExecuting}
                isChatOpen={isChatOpen}
                isLightTheme={isLightTheme}
                onSelectNode={(id) => setSelectedNodeId(id)}
                onSelectWire={(id) => setSelectedWireId(id)}
                onDoubleClickNode={(id) => setInspectingNodeId(id)}
                onUpdateNodePosition={handleUpdateNodePosition}
                onAddWire={handleAddWire}
                onDeleteWire={handleDeleteWire}
                onDeleteNode={handleDeleteNode}
                onRunWorkflow={handleRunWorkflow}
                onToggleChat={() => setIsChatOpen(!isChatOpen)}
                onOpenAddDrawer={() => setIsAddDrawerOpen(true)}
              />

              {/* Bottom Split Drawer (Chat + Real-time Node Execution Logs) */}
              <SwarmBottomDrawer
                isOpen={isChatOpen}
                nodes={nodes}
                selectedNodeId={selectedNodeId}
                chatMessages={chatMessages}
                sessionId={sessionId}
                isExecuting={isExecuting}
                isLightTheme={isLightTheme}
                onSelectNode={(id) => setSelectedNodeId(id)}
                onSendMessage={handleSendMessage}
                onResetSession={() => {
                  setChatMessages(INITIAL_CHAT_MESSAGES)
                  setSessionId(Math.random().toString(36).slice(2, 12))
                  triggerToast('Chat session reset')
                }}
                onToggleOpen={() => setIsChatOpen(false)}
              />
            </>
          )}

          {activeTab === 'executions' && (
            <ExecutionsView
              executions={executions}
              isLightTheme={isLightTheme}
              onRerun={() => {
                setActiveTab('editor')
                handleRunWorkflow()
              }}
            />
          )}

          {activeTab === 'tests' && (
            <TestsView
              testCases={testCases}
              isLightTheme={isLightTheme}
              onRunAll={() => triggerToast('Benchmark test suite started')}
            />
          )}
        </main>
      </div>

      {/* ================= MODALS & DRAWERS ================= */}

      {/* Node Inspector Modal */}
      <NodeInspectorModal
        node={nodes.find((n) => n.id === inspectingNodeId) || null}
        isOpen={!!inspectingNodeId}
        isLightTheme={isLightTheme}
        onClose={() => setInspectingNodeId(null)}
        onSaveNode={handleSaveNodeConfig}
        onDeleteNode={handleDeleteNode}
      />

      {/* Left Node Library Drawer (+) */}
      <NodeLibraryDrawer
        isOpen={isAddDrawerOpen}
        isLightTheme={isLightTheme}
        onClose={() => setIsAddDrawerOpen(false)}
        onAddNode={handleAddNodeFromTemplate}
      />

      {/* Toast Notification Pill */}
      {toastMessage && (
        <div className="fixed top-18 right-8 z-50 px-4 py-2.5 rounded-2xl bg-[var(--color-surface)] border border-emerald-500/60 text-emerald-400 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
