import React from 'react'
import { JudgeAITimelineStep } from './types'

interface SwarmTimelineViewProps {
  timelineSteps: JudgeAITimelineStep[]
  isExecuting?: boolean
  isLightTheme?: boolean
}

export const SwarmTimelineView: React.FC<SwarmTimelineViewProps> = ({
  timelineSteps,
  isExecuting,
  isLightTheme,
}) => {
  const maxTimeMs = Math.max(...timelineSteps.map((s) => s.startMs + s.durationMs), 1600)
  const timeMarkers = [0, 250, 500, 750, 1000, 1250, 1500]

  return (
    <div className="w-full h-full flex flex-col p-6 overflow-y-auto font-sans bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden backdrop-blur-md flex flex-col flex-1 shadow-lg">
        <div className="flex items-center border-b border-[var(--color-border-faint)] px-4 py-3 bg-[var(--color-hover)] text-[11px] font-mono text-[var(--color-muted)]">
          <div className="w-64 font-semibold text-[var(--color-foreground)]">Sub-Agent & Task</div>
          <div className="flex-1 relative h-5">
            {timeMarkers.map((time) => {
              const leftPercent = (time / maxTimeMs) * 100
              if (leftPercent > 95) return null
              return (
                <div
                  key={time}
                  style={{ left: `${leftPercent}%` }}
                  className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center"
                >
                  <span>{time}ms</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="divide-y divide-[var(--color-border-faint)] flex-1 overflow-y-auto">
          {timelineSteps.map((step, idx) => {
            const leftPct = (step.startMs / maxTimeMs) * 100
            const widthPct = Math.max((step.durationMs / maxTimeMs) * 100, 6)

            return (
              <div key={idx} className="flex items-center px-4 py-3 hover:bg-[var(--color-hover)] transition-colors">
                <div className="w-64 flex flex-col pr-4">
                  <span className="text-xs font-bold text-[var(--color-foreground)] truncate">
                    {step.agentName}
                  </span>
                  <span className="text-[10px] text-[var(--color-muted)] font-mono">
                    {step.role} {step.toolName && `• ${step.toolName}`}
                  </span>
                </div>

                <div className="flex-1 relative h-6 bg-[var(--color-surface-deep)] rounded-lg overflow-hidden border border-[var(--color-border-faint)]">
                  <div
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      backgroundColor: step.color || '#8B5CF6',
                    }}
                    className="absolute top-0 bottom-0 rounded-md shadow-md flex items-center justify-between px-2 text-[10px] text-white font-mono transition-all duration-500"
                  >
                    <span className="truncate">{step.durationMs}ms</span>
                    {step.status === 'running' && <span className="animate-spin">⚙️</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
