import React, { useState, useRef, useEffect } from 'react'
import { SwarmCanvasNode, SwarmWireConnection } from './types'
import { SwarmNodeView } from './SwarmNodeView'
import { SwarmWire } from './SwarmWire'
import { IcSparkles, IcRotate, IcPlay } from '../icons'

interface SwarmCanvasProps {
  nodes: SwarmCanvasNode[]
  wires: SwarmWireConnection[]
  selectedNodeId: string | null
  selectedWireId: string | null
  isExecuting: boolean
  isChatOpen: boolean
  isLightTheme?: boolean
  onSelectNode: (nodeId: string | null) => void
  onSelectWire: (wireId: string | null) => void
  onDoubleClickNode: (nodeId: string) => void
  onUpdateNodePosition: (nodeId: string, x: number, y: number) => void
  onAddWire: (fromNodeId: string, fromPortId: string, toNodeId: string, toPortId: string) => void
  onDeleteWire: (wireId: string) => void
  onDeleteNode: (nodeId: string) => void
  onRunWorkflow: () => void
  onToggleChat: () => void
  onOpenAddDrawer: () => void
}

export const SwarmCanvas: React.FC<SwarmCanvasProps> = ({
  nodes,
  wires,
  selectedNodeId,
  selectedWireId,
  isExecuting,
  isChatOpen,
  isLightTheme,
  onSelectNode,
  onSelectWire,
  onDoubleClickNode,
  onUpdateNodePosition,
  onAddWire,
  onDeleteWire,
  onDeleteNode,
  onRunWorkflow,
  onToggleChat,
  onOpenAddDrawer,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // Canvas Transform State (Pan & Zoom)
  const [zoom, setZoom] = useState(0.95)
  const [pan, setPan] = useState({ x: 80, y: 50 })
  const [isPanning, setIsPanning] = useState(false)
  const [startPan, setStartPan] = useState({ x: 0, y: 0 })

  // Node Dragging State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Wire Connection Dragging State
  const [connectingFrom, setConnectingFrom] = useState<{
    nodeId: string
    portId: string
    portType: string
    x: number
    y: number
  } | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Handle Zooming via Wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92
    const newZoom = Math.max(0.3, Math.min(2.5, zoom * zoomFactor))
    setZoom(newZoom)
  }

  // Handle Pan Start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true)
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      onSelectNode(null)
      onSelectWire(null)
    }
  }

  // Handle Mouse Move for Pan / Drag Node / Draw Wire
  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const curX = (e.clientX - rect.left - pan.x) / zoom
      const curY = (e.clientY - rect.top - pan.y) / zoom
      setMousePos({ x: curX, y: curY })
    }

    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      })
    } else if (draggingNodeId) {
      const node = nodes.find((n) => n.id === draggingNodeId)
      if (node) {
        const nextX = Math.round((e.clientX - dragOffset.x - pan.x) / zoom)
        const nextY = Math.round((e.clientY - dragOffset.y - pan.y) / zoom)
        onUpdateNodePosition(draggingNodeId, nextX, nextY)
      }
    }
  }

  // Handle Mouse Up
  const handleMouseUp = () => {
    setIsPanning(false)
    setDraggingNodeId(null)
    setConnectingFrom(null)
  }

  // Node Drag Trigger
  const handleNodeSelect = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectNode(nodeId)
    onSelectWire(null)

    const node = nodes.find((n) => n.id === nodeId)
    if (node) {
      setDraggingNodeId(nodeId)
      setDragOffset({
        x: e.clientX - (node.x * zoom + pan.x),
        y: e.clientY - (node.y * zoom + pan.y),
      })
    }
  }

  // Start / End Drawing Wire
  const handleStartConnect = (
    nodeId: string,
    portId: string,
    portType: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation()
    if (connectingFrom) {
      if (connectingFrom.nodeId !== nodeId) {
        onAddWire(connectingFrom.nodeId, connectingFrom.portId, nodeId, portId)
      }
      setConnectingFrom(null)
    } else {
      const node = nodes.find((n) => n.id === nodeId)
      if (node) {
        setConnectingFrom({
          nodeId,
          portId,
          portType,
          x: node.x + (node.width || 200),
          y: node.y + (node.height || 90) / 2,
        })
      }
    }
  }

  // Canvas View Controls
  const handleResetZoom = () => {
    setZoom(1)
    setPan({ x: 100, y: 60 })
  }

  const handleFitView = () => {
    if (nodes.length === 0) return
    const minX = Math.min(...nodes.map((n) => n.x))
    const maxX = Math.max(...nodes.map((n) => n.x + (n.width || 200)))
    const minY = Math.min(...nodes.map((n) => n.y))
    const maxY = Math.max(...nodes.map((n) => n.y + (n.height || 100)))

    const containerW = containerRef.current?.clientWidth || 1000
    const containerH = containerRef.current?.clientHeight || 600

    const scaleX = (containerW - 200) / (maxX - minX || 1)
    const scaleY = (containerH - 200) / (maxY - minY || 1)
    const fitZoom = Math.max(0.4, Math.min(1.2, Math.min(scaleX, scaleY)))

    setZoom(fitZoom)
    setPan({
      x: (containerW - (maxX + minX) * fitZoom) / 2,
      y: (containerH - (maxY + minY) * fitZoom) / 2 - 20,
    })
  }

  // Keyboard Shortcuts (Delete node/wire)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA'
        ) {
          return
        }
        if (selectedNodeId) {
          onDeleteNode(selectedNodeId)
        } else if (selectedWireId) {
          onDeleteWire(selectedWireId)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodeId, selectedWireId, onDeleteNode, onDeleteWire])

  const dotColor = isLightTheme ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)'

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`relative w-full h-full overflow-hidden select-none cursor-default transition-colors duration-200 ${
        isLightTheme ? 'bg-[#F4F5F7]' : 'bg-[#0E0E12]'
      }`}
      style={{
        backgroundImage: `radial-gradient(circle, ${dotColor} 1.2px, transparent 1.2px)`,
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
    >
      {/* Canvas SVG Layer (Wires & Connectors) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          <linearGradient id="wire-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>

        {/* Render Established Wires */}
        {wires.map((wire) => {
          const fromNode = nodes.find((n) => n.id === wire.fromNodeId)
          const toNode = nodes.find((n) => n.id === wire.toNodeId)
          return (
            <SwarmWire
              key={wire.id}
              wire={wire}
              fromNode={fromNode}
              toNode={toNode}
              isSelected={selectedWireId === wire.id}
              isExecuting={isExecuting}
              isLightTheme={isLightTheme}
              onSelect={onSelectWire}
              onDelete={onDeleteWire}
            />
          )
        })}

        {/* Dynamic Pending Wire during Connection Drag */}
        {connectingFrom && (
          <path
            d={`M ${connectingFrom.x} ${connectingFrom.y} C ${
              connectingFrom.x + 80
            } ${connectingFrom.y}, ${mousePos.x - 80} ${mousePos.y}, ${mousePos.x} ${
              mousePos.y
            }`}
            fill="none"
            stroke="#10B981"
            strokeWidth={2.5}
            strokeDasharray="5 5"
            className="animate-pulse"
          />
        )}
      </svg>

      {/* Nodes Layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {nodes.map((node) => (
          <div key={node.id} className="pointer-events-auto">
            <SwarmNodeView
              node={node}
              isSelected={selectedNodeId === node.id}
              isExecuting={isExecuting}
              isLightTheme={isLightTheme}
              onSelect={handleNodeSelect}
              onDoubleClick={onDoubleClickNode}
              onStartConnect={handleStartConnect}
              onPortPlusClick={() => onOpenAddDrawer()}
            />
          </div>
        ))}
      </div>

      {/* ================= BOTTOM CANVAS CONTROLS ================= */}

      {/* Bottom Left: Navigation & Zoom Toolbar */}
      <div
        className={`absolute bottom-6 left-6 z-20 flex items-center backdrop-blur-xl border rounded-2xl p-1.5 shadow-2xl gap-1 transition-all duration-200 ${
          isLightTheme
            ? 'bg-white/90 border-zinc-200 text-zinc-600 shadow-zinc-200/50'
            : 'bg-[#16161C]/90 border-zinc-800 text-zinc-400 shadow-black/80'
        }`}
        style={{ bottom: isChatOpen ? '335px' : '24px' }}
      >
        <button
          type="button"
          onClick={handleFitView}
          className="p-2 hover:text-[var(--color-foreground)] hover:bg-[var(--color-hover)] rounded-xl transition-colors"
          title="Fit to Screen"
        >
          <span className="text-xs">⛶</span>
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.3, z - 0.15))}
          className="p-2 hover:text-[var(--color-foreground)] hover:bg-[var(--color-hover)] rounded-xl transition-colors font-bold text-xs"
          title="Zoom Out"
        >
          -
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
          className="p-2 hover:text-[var(--color-foreground)] hover:bg-[var(--color-hover)] rounded-xl transition-colors font-bold text-xs"
          title="Zoom In"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleResetZoom}
          className="p-2 hover:text-[var(--color-foreground)] hover:bg-[var(--color-hover)] rounded-xl transition-colors"
          title="Reset Zoom (100%)"
        >
          <IcRotate className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-mono px-2 text-[var(--color-muted)] font-semibold">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Bottom Center: Action Controls */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 transition-all duration-200"
        style={{ bottom: isChatOpen ? '335px' : '24px' }}
      >
        {/* Test Workflow Action Button with Glow */}
        <button
          type="button"
          onClick={onRunWorkflow}
          disabled={isExecuting}
          className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2.5 shadow-lg shadow-rose-500/30 transition-all disabled:opacity-50 cursor-pointer"
        >
          <span className={`text-sm ${isExecuting ? 'animate-spin' : ''}`}>
            {isExecuting ? '⏳' : '⚡'}
          </span>
          <span>{isExecuting ? 'Executing Swarm...' : 'Test workflow'}</span>
        </button>

        {/* Hide / Show Chat Toggle */}
        <button
          type="button"
          onClick={onToggleChat}
          className={`px-4 py-2.5 rounded-2xl backdrop-blur-xl border font-semibold text-xs flex items-center gap-2 shadow-lg transition-all ${
            isLightTheme
              ? 'bg-white/90 border-zinc-200 text-zinc-800 hover:bg-zinc-100'
              : 'bg-[#181822]/90 border-zinc-700/70 text-zinc-200 hover:bg-[#20202C]'
          }`}
        >
          <span>💬</span>
          <span>{isChatOpen ? 'Hide chat' : 'Show chat'}</span>
        </button>

        {/* Delete Selection */}
        {(selectedNodeId || selectedWireId) && (
          <button
            type="button"
            onClick={() => {
              if (selectedNodeId) onDeleteNode(selectedNodeId)
              else if (selectedWireId) onDeleteWire(selectedWireId)
            }}
            className="p-2.5 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-300 hover:bg-rose-900 transition-colors shadow-lg"
            title="Delete Selected Element"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Bottom Right: AI Assistant Sparkle button */}
      <div
        className="absolute bottom-6 right-6 z-20 transition-all duration-200"
        style={{ bottom: isChatOpen ? '335px' : '24px' }}
      >
        <button
          type="button"
          onClick={onOpenAddDrawer}
          className="p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-500/25 hover:scale-105 active:scale-95 transition-all"
          title="Add Nodes & AI Assistance"
        >
          <IcSparkles className="w-5 h-5 text-purple-200" />
        </button>
      </div>
    </div>
  )
}
