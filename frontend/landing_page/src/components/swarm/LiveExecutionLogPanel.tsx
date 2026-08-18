import React, { useState } from 'react'
import { JudgeAISwarmSession } from './judgeAISwarmData'
import { Terminal, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react'

interface LiveExecutionLogPanelProps {
  session: JudgeAISwarmSession
  isLightTheme?: boolean
}

export const LiveExecutionLogPanel: React.FC<LiveExecutionLogPanelProps> = ({
  session,
  isLightTheme,
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [copied, setCopied] = useState(false)

  const handleCopyLogs = () => {
    const raw = session.liveLogs.map((l) => `${l.time} [${l.agent}] ${l.text}`).join('\n')
    navigator.clipboard.writeText(raw)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] backdrop-blur-xl overflow-hidden shadow-lg font-sans">
      {/* Panel Header */}
      <div className="px-4 py-2.5 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-xs font-bold text-[var(--color-foreground)] hover:text-purple-400 transition-colors"
        >
          <Terminal className="w-3.5 h-3.5 text-purple-400" />
          <span>LIVE EXECUTION LOG</span>
          <span className="text-[10px] font-mono text-[var(--color-muted)] font-normal">
            ({session.liveLogs.length} events)
          </span>
          <span className="text-[10px] text-[var(--color-muted)]">
            {isExpanded ? '▾' : '▸'}
          </span>
        </button>

        <button
          onClick={handleCopyLogs}
          className="p-1 rounded-md text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-hover)] transition-colors text-xs flex items-center gap-1 font-mono text-[10px]"
          title="Copy Live Logs"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Logs Body */}
      {isExpanded && (
        <div className="p-3 max-h-48 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1.5 custom-scrollbar bg-black/40">
          {session.liveLogs.map((log, lIdx) => {
            const getAgentColor = (agent: string) => {
              if (agent === 'ORCHESTRATOR') return 'text-purple-400 font-bold'
              if (agent === 'VECTOR') return 'text-blue-400 font-bold'
              if (agent === 'REASONING') return 'text-amber-400 font-bold'
              if (agent === 'JUDGE') return 'text-emerald-400 font-bold'
              return 'text-zinc-400 font-bold'
            }

            return (
              <div key={lIdx} className="flex items-start gap-2.5 hover:bg-white/5 px-1.5 py-0.5 rounded transition-colors">
                <span className="text-[10px] text-zinc-500 shrink-0 select-none">{log.time}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded bg-white/5 shrink-0 ${getAgentColor(log.agent)}`}>
                  {log.agent}
                </span>
                <span className="text-zinc-300 leading-snug flex-1">{log.text}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
