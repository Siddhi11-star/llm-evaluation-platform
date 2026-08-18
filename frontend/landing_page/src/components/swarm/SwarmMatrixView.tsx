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
    <div className="w-full h-full p-6 overflow-y-auto font-sans bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {pods.map((pod) => (
          <div
            key={pod.id}
            className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] flex flex-col justify-between space-y-3 backdrop-blur-md shadow-lg hover:border-purple-500/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{pod.avatar}</span>
                <div>
                  <h4 className="text-xs font-bold text-[var(--color-foreground)]">{pod.name}</h4>
                  <p className="text-[10px] text-purple-400 font-mono">{pod.role}</p>
                </div>
              </div>
              <span
                className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full ${
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

            <div className="space-y-1 pt-2 border-t border-[var(--color-border-faint)] text-[10px] font-mono text-[var(--color-muted)]">
              <div className="flex justify-between">
                <span>Model:</span>
                <span className="text-[var(--color-foreground)] font-semibold">{pod.model}</span>
              </div>
              <div className="flex justify-between">
                <span>Tokens Generated:</span>
                <span className="text-[var(--color-foreground)] font-semibold">{pod.tokensGenerated}</span>
              </div>
              <div className="flex justify-between">
                <span>Latency:</span>
                <span className="text-[var(--color-foreground)] font-semibold">{pod.latencyMs}ms</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
