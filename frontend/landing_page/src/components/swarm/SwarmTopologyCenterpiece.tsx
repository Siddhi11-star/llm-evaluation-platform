import React from 'react'
import { JudgeAISwarmSession, JudgeAIAgentTask, AgentStatus } from './judgeAISwarmData'
import { Sparkles, CheckCircle2, Clock, PlayCircle, AlertCircle, PauseCircle } from 'lucide-react'

interface SwarmTopologyCenterpieceProps {
  session: JudgeAISwarmSession
  selectedTaskIndex: number
  onSelectTaskIndex: (index: number) => void
  isLightTheme?: boolean
}

export const SwarmTopologyCenterpiece: React.FC<SwarmTopologyCenterpieceProps> = ({
  session,
  selectedTaskIndex,
  onSelectTaskIndex,
  isLightTheme,
}) => {
  const getStatusBadge = (status: AgentStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-400">
            <span>✓</span>
            <span>Completed</span>
          </span>
        )
      case 'running':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-medium text-purple-400">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
            <span>Running</span>
          </span>
        )
      case 'thinking':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-medium text-amber-400">
            <span>◐</span>
            <span>Thinking</span>
          </span>
        )
      case 'waiting':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-medium text-[var(--color-muted)]">
            <span>○</span>
            <span>Waiting</span>
          </span>
        )
      case 'failed':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-medium text-rose-400">
            <span>×</span>
            <span>Failed</span>
          </span>
        )
      case 'paused':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-medium text-zinc-400">
            <span>⏸</span>
            <span>Paused</span>
          </span>
        )
      default:
        return null
    }
  }

  const isOrchestratorSelected = selectedTaskIndex === 0
  const isSynthesisSelected = selectedTaskIndex >= session.tasks.length + (session.tasks[0]?.role?.toLowerCase().includes('orchestrator') ? 0 : 1)

  // Worker tasks: if task[0] is orchestrator, filter it out; otherwise all tasks are workers
  const workerTasks = session.tasks[0]?.role?.toLowerCase().includes('orchestrator')
    ? session.tasks.slice(1)
    : session.tasks

  return (
    <div className="w-full flex flex-col items-center justify-between p-4 py-6 font-sans relative select-none">
      {/* Background Subtle Grid Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `radial-gradient(var(--color-border) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* ================= 1. ORCHESTRATOR NODE (TOP) ================= */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
        <div
          onClick={() => onSelectTaskIndex(0)}
          className={`w-full p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer backdrop-blur-xl group ${
            isOrchestratorSelected
              ? 'bg-purple-950/20 border-purple-500/80 shadow-[0_0_25px_rgba(168,85,247,0.25)] ring-1 ring-purple-500/50'
              : 'bg-[var(--color-card)] border-[var(--color-border)] hover:border-purple-500/40 hover:bg-[var(--color-hover)]'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-base">{session.orchestrator.avatar}</span>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 block">
                  ORCHESTRATOR
                </span>
                <h4 className="text-xs font-bold text-[var(--color-foreground)]">
                  {session.orchestrator.name}
                </h4>
              </div>
            </div>
            {session.is_trivial ? (
              <span className="flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-400">
                <span>✓</span>
                <span>Direct Reply</span>
              </span>
            ) : (
              getStatusBadge(session.orchestrator.status)
            )}
          </div>

          <p className="text-[11px] text-[var(--color-muted)] line-clamp-1 mb-2">
            {session.orchestrator.task}
          </p>

          <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-muted)] pt-2 border-t border-[var(--color-border-faint)]">
            <span>Model: <strong className="text-[var(--color-foreground)]">{session.orchestrator.model}</strong></span>
            <span>{session.orchestrator.tokens.toLocaleString()} tokens · {session.orchestrator.latency || '25ms'}</span>
          </div>
        </div>

        {/* Stem Line down from Orchestrator */}
        <div className="w-0.5 h-6 bg-gradient-to-b from-purple-500/60 to-[var(--color-border)] relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
        </div>
      </div>

      {/* ================= 2. CONNECTING BUS / SPLIT ================= */}
      <div className="w-full max-w-2xl px-6 relative z-0">
        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent relative">
          <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 rounded-full bg-purple-500/40" />
        </div>
      </div>

      {/* ================= 3. PARALLEL WORKER AGENTS ROW (MIDDLE) ================= */}
      <div className="w-full max-w-3xl my-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 z-10 px-2">
        {workerTasks.map((task, idx) => {
          const actualIndex = idx + 1
          const isSelected = selectedTaskIndex === actualIndex

          return (
            <div
              key={task.id || idx}
              onClick={() => onSelectTaskIndex(actualIndex)}
              className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between backdrop-blur-xl relative group ${
                isSelected
                  ? 'bg-purple-950/20 border-purple-500/80 shadow-[0_0_20px_rgba(168,85,247,0.2)] ring-1 ring-purple-500/50'
                  : 'bg-[var(--color-card)] border-[var(--color-border)] hover:border-purple-500/40 hover:bg-[var(--color-hover)]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{task.avatar}</span>
                    <div>
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-purple-400 block truncate max-w-[120px]">
                        {task.role}
                      </span>
                      <h4 className="text-xs font-bold text-[var(--color-foreground)] truncate max-w-[130px]">
                        {task.name}
                      </h4>
                    </div>
                  </div>
                  {session.is_trivial ? (
                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/40 px-1.5 py-0.5 rounded border border-zinc-700/50">
                      ○ Skipped
                    </span>
                  ) : (
                    getStatusBadge(task.status)
                  )}
                </div>

                <p className="text-[11px] text-[var(--color-muted)] line-clamp-2 leading-relaxed mb-3">
                  {task.taskPrompt}
                </p>
              </div>

              {/* Progress Bar & Footer */}
              <div className="space-y-2 pt-2 border-t border-[var(--color-border-faint)]">
                <div className="w-full bg-[var(--color-surface-deep)] rounded-full h-1 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                    style={{ width: `${session.is_trivial ? 0 : task.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-muted)]">
                  <span>Model: <strong className="text-[var(--color-foreground)]">{task.model}</strong></span>
                  <div className="flex items-center gap-1.5">
                    <span>{task.tokensGenerated.toLocaleString()} tok</span>
                    <span>·</span>
                    <strong className="text-purple-300">{task.latencyMs}ms</strong>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ================= 4. CONVERGENCE BUS (BOTTOM SPLIT) ================= */}
      <div className="w-full max-w-2xl px-6 relative z-0">
        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent relative">
          <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 rounded-full bg-purple-500/40" />
        </div>
      </div>

      {/* Stem Line down to Final Synthesis */}
      <div className="w-0.5 h-6 bg-gradient-to-b from-[var(--color-border)] to-purple-500/60 relative z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
      </div>

      {/* ================= 5. FINAL SYNTHESIS NODE (BOTTOM) ================= */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
        <div
          onClick={() => onSelectTaskIndex(session.tasks.length + 1)}
          className={`w-full p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer backdrop-blur-xl group ${
            isSynthesisSelected
              ? 'bg-purple-950/20 border-purple-500/80 shadow-[0_0_25px_rgba(168,85,247,0.25)] ring-1 ring-purple-500/50'
              : 'bg-[var(--color-card)] border-[var(--color-border)] hover:border-purple-500/40 hover:bg-[var(--color-hover)]'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-base">{session.synthesisNode.avatar}</span>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 block">
                  SYNTHESIS
                </span>
                <h4 className="text-xs font-bold text-[var(--color-foreground)]">
                  {session.synthesisNode.name}
                </h4>
              </div>
            </div>
            {session.is_trivial ? (
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/40 px-1.5 py-0.5 rounded border border-zinc-700/50">
                ○ Skipped
              </span>
            ) : (
              getStatusBadge(session.synthesisNode.status)
            )}
          </div>

          <p className="text-[11px] text-[var(--color-muted)] line-clamp-1 mb-2">
            {session.synthesisNode.task}
          </p>

          <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-muted)] pt-2 border-t border-[var(--color-border-faint)]">
            <span>Model: <strong className="text-[var(--color-foreground)]">{session.synthesisNode.model}</strong></span>
            {session.is_trivial ? (
              <span className="text-zinc-400">Direct Reply Served</span>
            ) : (
              <span className="text-emerald-400 font-semibold">Meta Consensus Ready ✓</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
