import React from 'react'
import { JudgeAISwarmSession, AgentStatus } from './judgeAISwarmData'

interface BottomAgentSwitcherProps {
  session: JudgeAISwarmSession
  selectedTaskIndex: number
  onSelectTaskIndex: (index: number) => void
  isLightTheme?: boolean
}

export const BottomAgentSwitcher: React.FC<BottomAgentSwitcherProps> = ({
  session,
  selectedTaskIndex,
  onSelectTaskIndex,
  isLightTheme,
}) => {
  const getStatusIcon = (status: AgentStatus) => {
    switch (status) {
      case 'completed':
        return <span className="text-emerald-400 font-bold">✓</span>
      case 'running':
        return <span className="text-purple-400 font-bold animate-pulse">●</span>
      case 'thinking':
        return <span className="text-amber-400 font-bold">◐</span>
      case 'waiting':
        return <span className="text-[var(--color-muted)]">○</span>
      case 'failed':
        return <span className="text-rose-400 font-bold">×</span>
      default:
        return <span className="text-zinc-500">●</span>
    }
  }

  return (
    <div className="w-full px-4 py-2.5 border-t border-[var(--color-border)] bg-[var(--color-surface)] backdrop-blur-md flex items-center justify-between gap-2 overflow-x-auto shrink-0 font-sans">
      <div className="flex items-center gap-2 max-w-full overflow-x-auto custom-scrollbar">
        {/* Orchestrator Tab */}
        <button
          onClick={() => onSelectTaskIndex(0)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono transition-all shrink-0 border ${
            selectedTaskIndex === 0
              ? 'bg-purple-950/30 border-purple-500/80 text-[var(--color-foreground)] font-bold shadow-sm ring-1 ring-purple-500/30'
              : 'bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-hover)]'
          }`}
        >
          <span className="text-[10px] font-bold text-purple-400">00</span>
          <span className="text-xs">{session.orchestrator.avatar}</span>
          <span className="truncate max-w-[120px] font-sans font-medium">{session.orchestrator.name}</span>
          <span className="text-emerald-400 font-bold">✓</span>
        </button>

        {/* Worker Tasks */}
        {session.tasks.map((task, idx) => {
          const actualIndex = idx + 1
          const isSelected = selectedTaskIndex === actualIndex

          return (
            <button
              key={task.id || idx}
              onClick={() => onSelectTaskIndex(actualIndex)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono transition-all shrink-0 border ${
                isSelected
                  ? 'bg-purple-950/30 border-purple-500/80 text-[var(--color-foreground)] font-bold shadow-sm ring-1 ring-purple-500/30'
                  : 'bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-hover)]'
              }`}
            >
              <span className="text-[10px] font-bold text-purple-400">{task.number || `0${actualIndex}`}</span>
              <span className="text-xs">{task.avatar}</span>
              <span className="truncate max-w-[120px] font-sans font-medium">{task.name}</span>
              {session.is_trivial ? <span className="text-zinc-500 text-[10px]">○</span> : getStatusIcon(task.status)}
            </button>
          )
        })}

        {/* Synthesis Node Tab */}
        <button
          onClick={() => onSelectTaskIndex(session.tasks.length + 1)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono transition-all shrink-0 border ${
            selectedTaskIndex >= session.tasks.length + 1
              ? 'bg-purple-950/30 border-purple-500/80 text-[var(--color-foreground)] font-bold shadow-sm ring-1 ring-purple-500/30'
              : 'bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-hover)]'
          }`}
        >
          <span className="text-[10px] font-bold text-indigo-400">04</span>
          <span className="text-xs">{session.synthesisNode.avatar}</span>
          <span className="font-sans font-medium">Final Synthesis</span>
          {session.is_trivial ? <span className="text-zinc-500 text-[10px]">○</span> : <span className="text-emerald-400 font-bold">✓</span>}
        </button>
      </div>

      <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono text-[var(--color-muted)] shrink-0 pl-2">
        <span>Click node or card to focus agent details</span>
      </div>
    </div>
  )
}
