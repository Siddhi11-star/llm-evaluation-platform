import React, { useState } from 'react'
import { JudgeAIDeliverableArtifact } from './types'
import { IcCopy, IcCheck } from '../icons'

interface SwarmDeliverablesViewProps {
  deliverable?: JudgeAIDeliverableArtifact
  isLightTheme?: boolean
}

export const SwarmDeliverablesView: React.FC<SwarmDeliverablesViewProps> = ({
  deliverable,
  isLightTheme,
}) => {
  const [copied, setCopied] = useState(false)

  if (!deliverable) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center font-sans">
        <h3 className="text-sm font-bold text-[var(--color-foreground)] mb-1">
          No Deliverable Generated Yet
        </h3>
        <p className="text-xs text-[var(--color-muted)]">
          Run a swarm execution to generate synthesized multi-agent reports.
        </p>
      </div>
    )
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(deliverable.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full h-full flex flex-col p-6 overflow-y-auto font-sans bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] mb-6 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">📄</span>
            <h2 className="text-sm font-bold text-[var(--color-foreground)]">{deliverable.title}</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
              {deliverable.type.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-[var(--color-muted)]">{deliverable.summary}</p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-hover)] hover:bg-[var(--color-hover-strong)] text-xs font-semibold text-[var(--color-foreground)] transition-colors"
        >
          {copied ? <IcCheck className="w-3.5 h-3.5 text-emerald-400" /> : <IcCopy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Deliverable'}</span>
        </button>
      </div>

      <div className="flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 overflow-y-auto shadow-inner">
        <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-[var(--color-foreground)]">
          {deliverable.content}
        </pre>
      </div>
    </div>
  )
}
