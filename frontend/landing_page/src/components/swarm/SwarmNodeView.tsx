import React from 'react'
import { SwarmCanvasNode } from './types'

interface SwarmNodeViewProps {
  node: SwarmCanvasNode
  isSelected: boolean
  isExecuting?: boolean
  isLightTheme?: boolean
  onSelect: (nodeId: string, e: React.MouseEvent) => void
  onDoubleClick: (nodeId: string) => void
  onStartConnect: (nodeId: string, portId: string, portType: string, e: React.MouseEvent) => void
  onPortPlusClick?: (nodeId: string, portId: string, e: React.MouseEvent) => void
}

export const SwarmNodeView: React.FC<SwarmNodeViewProps> = ({
  node,
  isSelected,
  isExecuting,
  isLightTheme,
  onSelect,
  onDoubleClick,
  onStartConnect,
  onPortPlusClick,
}) => {
  const isCircleNode = node.type === 'model' || node.type === 'embeddings' || node.type === 'memory'
  const isMainAgent = node.type === 'agent'
  const isTrigger = node.type === 'trigger'
  const isTool = node.type === 'tool' || node.type === 'vectorStore'
  const isEvaluator = node.type === 'evaluator'

  // Render circular/badge model node
  if (isCircleNode) {
    return (
      <div
        id={`node-${node.id}`}
        style={{
          transform: `translate(${node.x}px, ${node.y}px)`,
          width: node.width || 140,
        }}
        onClick={(e) => onSelect(node.id, e)}
        onDoubleClick={() => onDoubleClick(node.id)}
        className="absolute cursor-move select-none group transition-all duration-200 flex flex-col items-center justify-center font-sans"
      >
        {/* Top Input Handle */}
        {node.inputs.map((port) => (
          <div
            key={port.id}
            onClick={(e) => {
              e.stopPropagation()
              onStartConnect(node.id, port.id, port.type, e)
            }}
            className="absolute -top-3 w-4 h-4 rounded-full bg-[var(--color-surface,bg-zinc-800)] border-2 border-emerald-500 hover:scale-125 transition-transform flex items-center justify-center cursor-crosshair z-20 shadow-md"
            title={`Connect ${port.name}`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
        ))}

        {/* Circular Node Body with glassmorphism */}
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative backdrop-blur-md ${
            isSelected
              ? 'border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.5)] ring-2 ring-sky-400/30'
              : isExecuting
              ? 'border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.6)] scale-105 animate-pulse'
              : node.isDeactivated
              ? 'border-zinc-700/60 bg-zinc-900/50 opacity-50'
              : isLightTheme
              ? 'border-emerald-500/60 bg-white/90 shadow-lg hover:border-emerald-500 hover:scale-105'
              : 'border-emerald-500/70 bg-[#16161C]/90 shadow-xl hover:border-emerald-400 hover:scale-105'
          }`}
        >
          {/* Node Icon */}
          <div className="text-xl">
            {node.icon === '🟢' ? (
              <div className="w-7 h-7 rounded-full bg-emerald-950/80 border border-emerald-500/70 flex items-center justify-center text-[11px] text-emerald-400 font-bold font-mono">
                AI
              </div>
            ) : node.icon === '🔴' ? (
              <div className="w-7 h-7 rounded-full bg-rose-950/80 border border-rose-500/70 flex items-center justify-center text-[11px] text-rose-400 font-bold font-mono">
                Q
              </div>
            ) : node.icon === '💾' ? (
              <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center text-xs text-zinc-400">
                💾
              </div>
            ) : (
              node.icon || '⚙️'
            )}
          </div>

          {/* Success Checkmark / Badge */}
          {node.stage === 'done' && !node.isDeactivated && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center text-[9px] font-black shadow-md ring-2 ring-black/40 font-mono">
              ✓
            </div>
          )}
        </div>

        {/* Node Label Below */}
        <div className="mt-2 text-center">
          <div className="text-xs font-semibold text-[var(--color-foreground)] group-hover:text-emerald-400 transition-colors tracking-tight leading-snug max-w-[150px] truncate font-sans">
            {node.name}
          </div>
          {node.subtitle && (
            <div className="text-[10px] text-[var(--color-muted)] font-medium font-sans">
              {node.subtitle}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Regular / Agent / Trigger / Tool / Evaluator Node
  return (
    <div
      id={`node-${node.id}`}
      style={{
        transform: `translate(${node.x}px, ${node.y}px)`,
        width: node.width || 230,
      }}
      onClick={(e) => onSelect(node.id, e)}
      onDoubleClick={() => onDoubleClick(node.id)}
      className={`absolute cursor-move select-none group transition-all duration-200 rounded-2xl backdrop-blur-xl border-2 shadow-2xl font-sans ${
        isSelected
          ? 'border-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.4)] ring-2 ring-sky-400/20'
          : isExecuting
          ? 'border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.45)] animate-pulse'
          : isMainAgent
          ? 'border-emerald-500/80 hover:border-emerald-400'
          : isTrigger
          ? 'border-purple-500/80 hover:border-purple-400'
          : isEvaluator
          ? 'border-emerald-500/80 hover:border-emerald-400'
          : isLightTheme
          ? 'border-zinc-300 hover:border-zinc-400'
          : 'border-zinc-800/90 hover:border-zinc-600'
      } ${
        isLightTheme
          ? 'bg-white/95 text-zinc-900 shadow-zinc-200/50'
          : 'bg-[#16161D]/95 text-zinc-100 shadow-black/60'
      }`}
    >
      {/* Top / Left Input Handles */}
      {node.inputs.map((port, idx) => (
        <div
          key={port.id}
          onClick={(e) => {
            e.stopPropagation()
            onStartConnect(node.id, port.id, port.type, e)
          }}
          style={{
            top: port.position === 'top' ? '-8px' : `${((idx + 1) / (node.inputs.length + 1)) * 100}%`,
            left: port.position === 'top' ? '50%' : '-8px',
            transform: port.position === 'top' ? 'translateX(-50%)' : 'translateY(-50%)',
          }}
          className="absolute w-4 h-4 rounded-full bg-[var(--color-surface,bg-zinc-800)] border-2 border-emerald-500 hover:scale-125 transition-transform flex items-center justify-center cursor-crosshair z-20 shadow-md"
          title={`Input: ${port.name}`}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>
      ))}

      {/* Main Node Header / Body */}
      <div className="p-3.5">
        <div className="flex items-center gap-3">
          {/* Icon Container with glowing background */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg border shadow-sm font-sans"
            style={{
              backgroundColor: `${node.color || '#10B981'}18`,
              borderColor: `${node.color || '#10B981'}50`,
              color: node.color || '#10B981',
            }}
          >
            {node.icon || '⚡'}
          </div>

          {/* Title & Subtitle */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[var(--color-foreground)] truncate block group-hover:text-emerald-400 transition-colors font-sans tracking-tight">
                {node.name}
              </span>
              {node.stage === 'done' && (
                <span className="text-emerald-400 text-xs font-bold font-mono" title="Completed">
                  ✓
                </span>
              )}
            </div>
            <div className="text-[11px] text-[var(--color-muted)] truncate mt-0.5 font-medium font-sans">
              {node.subtitle || (isTrigger ? 'Trigger' : 'Step Node')}
            </div>
          </div>
        </div>

        {/* Live Progress Bar if active */}
        {isExecuting && node.progress > 0 && node.progress < 100 && (
          <div className="mt-2.5 w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full transition-all duration-300 rounded-full"
              style={{ width: `${node.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* AI Agent Sub-Socket Ports Row (Chat Model, Memory, Tool, +) */}
      {node.subPorts && node.subPorts.length > 0 && (
        <div
          className={`border-t px-2.5 py-1.5 rounded-b-2xl flex items-center justify-between text-[10px] font-medium font-sans ${
            isLightTheme
              ? 'border-zinc-200/80 bg-zinc-100/70 text-zinc-600'
              : 'border-zinc-800/80 bg-zinc-900/80 text-zinc-400'
          }`}
        >
          {node.subPorts.map((subPort) => (
            <div
              key={subPort.id}
              onClick={(e) => {
                e.stopPropagation()
                onStartConnect(node.id, subPort.id, subPort.type, e)
              }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-[var(--color-hover,rgba(255,255,255,0.08))] cursor-pointer transition-colors group/sub font-sans"
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subPort.color || '#10B981' }} />
              <span className="group-hover/sub:text-[var(--color-foreground)] transition-colors font-medium">
                {subPort.label || subPort.name}
              </span>
            </div>
          ))}

          {/* Quick Plus on Sub-Ports */}
          <button
            type="button"
            onClick={(e) => onPortPlusClick && onPortPlusClick(node.id, 'sub-add', e)}
            className="w-4 h-4 rounded border border-dashed border-zinc-500 hover:border-emerald-400 text-zinc-400 hover:text-emerald-400 flex items-center justify-center transition-colors text-[10px] font-mono"
            title="Add sub-component (Model / Tool / Memory)"
          >
            +
          </button>
        </div>
      )}

      {/* Right Output Handle */}
      {node.outputs.map((port, idx) => (
        <div
          key={port.id}
          onClick={(e) => {
            e.stopPropagation()
            onStartConnect(node.id, port.id, port.type, e)
          }}
          style={{
            top: `${((idx + 1) / (node.outputs.length + 1)) * 100}%`,
            right: '-8px',
            transform: 'translateY(-50%)',
          }}
          className="absolute w-4 h-4 rounded-full bg-[var(--color-surface,bg-zinc-800)] border-2 border-emerald-500 hover:scale-125 transition-transform flex items-center justify-center cursor-crosshair z-20 group-hover:shadow-[0_0_10px_rgba(16,185,129,0.7)]"
          title={`Output: ${port.name}`}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>
      ))}
    </div>
  )
}
