import React from 'react'
import { JudgeAISubAgentPod } from './types'

interface SwarmMatrixViewProps {
  pods: JudgeAISubAgentPod[]
  isExecuting?: boolean
  isLightTheme?: boolean
}

export const SwarmMatrixView: React.FC<SwarmMatrixViewProps> = ({
  pods,
  isExecuting,
  isLightTheme,
}) => {
  return (
    <div className="w-full h-full p-4 overflow-y-auto font-sans bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div className="grid grid-cols-1 gap-3">
        {pods.map((pod) => (
          <div
            key={pod.id}
            className="p-3.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] flex flex-col justify-between space-y-2.5 backdrop-blur-md shadow-md hover:border-purple-500/40 transition-all"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl shrink-0">{pod.avatar}</span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[var(--color-foreground)] truncate">{pod.name}</h4>
                  <p className="text-[10px] text-purple-400 font-mono truncate">{pod.role}</p>
                </div>
              </div>
              <span
                className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                  pod.status === 'completed'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-purple-500/15 text-purple-400 border border-purple-500/30 animate-pulse'
                }`}
              >
                {pod.status.toUpperCase()}
              </span>
            </div>

            <p className="text-xs text-[var(--color-muted)] line-clamp-2 leading-relaxed">
              {pod.taskDescription}
            </p>

            <div className="space-y-1.5 pt-2 border-t border-[var(--color-border-faint)] text-[10px] font-mono text-[var(--color-muted)]">
              <div className="flex justify-between items-center gap-2">
                <span className="shrink-0">Model:</span>
                <span className="text-[var(--color-foreground)] font-semibold truncate max-w-[200px] text-right">{pod.model}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="shrink-0">Tokens Generated:</span>
                <span className="text-[var(--color-foreground)] font-semibold">{pod.tokensGenerated.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="shrink-0">Latency:</span>
                <span className="text-[var(--color-foreground)] font-semibold">{pod.latencyMs}ms</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
