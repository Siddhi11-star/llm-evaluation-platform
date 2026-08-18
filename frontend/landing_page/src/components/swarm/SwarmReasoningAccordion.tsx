import React, { useState } from 'react'
import { JudgeAISwarmSession } from './judgeAISwarmData'
import { Brain, ChevronDown, ChevronRight, Sparkles, ArrowRight } from 'lucide-react'

interface SwarmReasoningAccordionProps {
  session: JudgeAISwarmSession
  isLightTheme?: boolean
}

export const SwarmReasoningAccordion: React.FC<SwarmReasoningAccordionProps> = ({
  session,
  isLightTheme,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] backdrop-blur-xl overflow-hidden shadow-lg font-sans">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-hover)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          <span className="font-bold">Reasoning & Strategy</span>
          <span className="text-[10px] font-mono text-[var(--color-muted)] font-normal">
            (Why these agents were selected)
          </span>
        </div>
        <span className="text-[10px] text-[var(--color-muted)]">
          {isExpanded ? '▾' : '▸'}
        </span>
      </button>

      {isExpanded && (
        <div className="p-4 pt-1 text-xs text-[var(--color-muted)] space-y-3 border-t border-[var(--color-border-faint)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {session.thoughtSteps.map((step, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-[var(--color-surface-deep)] border border-[var(--color-border-faint)] space-y-1"
              >
                <div className="flex items-center gap-1.5 text-[var(--color-foreground)] font-bold text-xs">
                  <span className="text-purple-400">{step.agentName}</span>
                  <span className="text-[var(--color-muted)]">→</span>
                  <span className="text-xs font-medium text-purple-200">{step.why}</span>
                </div>
                <p className="text-[11px] text-[var(--color-muted)] leading-relaxed font-sans">
                  {step.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
