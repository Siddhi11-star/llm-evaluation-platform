import React from 'react'
import { JudgeAISwarmSession } from './judgeAISwarmData'
import { Clock, Cpu, Zap, Activity } from 'lucide-react'

interface SwarmProgressHeaderProps {
  session: JudgeAISwarmSession
  isLightTheme?: boolean
}

export const SwarmProgressHeader: React.FC<SwarmProgressHeaderProps> = ({
  session,
  isLightTheme,
}) => {
  const completedAgents = session.tasks.filter((t) => t.status === 'completed').length
  const totalAgents = session.tasks.length

  return (
    <div className="w-full px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Left: Swarm Title & Status */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-purple-400">
            SWARM EXECUTION
          </span>
          <span className="text-[10px] font-mono text-[var(--color-muted)]">
            • {totalAgents} agents · Parallel execution
          </span>
        </div>
        <h3 className="text-xs font-bold text-[var(--color-foreground)] truncate max-w-md">
          {session.prompt}
        </h3>
      </div>

      {/* Center: Dynamic Progress Bar */}
      <div className="flex flex-col flex-1 max-w-xs md:max-w-sm space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-muted)]">
          <span>{completedAgents} / {totalAgents} agents completed</span>
          <span className="font-bold text-purple-400">{session.swarmProgress}%</span>
        </div>
        <div className="w-full bg-[var(--color-surface-deep)] border border-[var(--color-border-faint)] rounded-full h-2 overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-400 transition-all duration-700 shadow-sm"
            style={{ width: `${session.swarmProgress}%` }}
          />
        </div>
      </div>

      {/* Right: Key Performance Telemetry Metrics (Requirement #12) */}
      <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--color-muted)] shrink-0">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-purple-400" />
          <span>{session.elapsedTime}</span>
        </div>
        <div className="flex items-center gap-1">
          <Cpu className="w-3 h-3 text-indigo-400" />
          <span>{(session.totalTokens / 1000).toFixed(1)}K tok</span>
        </div>
        <div className="flex items-center gap-1 font-semibold text-emerald-400">
          <span>{session.cost}</span>
        </div>
      </div>
    </div>
  )
}
