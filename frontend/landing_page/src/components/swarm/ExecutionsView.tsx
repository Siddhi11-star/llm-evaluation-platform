import React, { useState } from 'react'
import { SwarmExecutionRecord } from './types'
import { IcSearch, IcRotate } from '../icons'

interface ExecutionsViewProps {
  executions: SwarmExecutionRecord[]
  isLightTheme?: boolean
  onRerun: (id: string) => void
}

export const ExecutionsView: React.FC<ExecutionsViewProps> = ({ executions, isLightTheme, onRerun }) => {
  const [selectedExec, setSelectedExec] = useState<SwarmExecutionRecord | null>(executions[0] || null)
  const [search, setSearch] = useState('')

  const filtered = executions.filter(
    (e) =>
      e.prompt.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase()) ||
      e.trigger.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 flex overflow-hidden text-[var(--color-foreground)]">
      {/* Executions Table */}
      <div className="w-1/2 border-r border-[var(--color-border)] flex flex-col">
        {/* Filter / Search Bar */}
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between gap-4 bg-[var(--color-surface)]">
          <div className="relative flex-1">
            <IcSearch className="w-3.5 h-3.5 text-[var(--color-muted)] absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search execution traces..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-[var(--color-input-bg)] border border-[var(--color-border)] text-xs text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-purple-500"
            />
          </div>
          <span className="text-xs text-[var(--color-muted)] font-mono font-semibold">{filtered.length} Runs</span>
        </div>

        {/* Table Rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-border-faint)] custom-scrollbar">
          {filtered.map((exec) => {
            const isCur = selectedExec?.id === exec.id
            return (
              <div
                key={exec.id}
                onClick={() => setSelectedExec(exec)}
                className={`p-4 cursor-pointer transition-all flex items-start justify-between ${
                  isCur
                    ? isLightTheme
                      ? 'bg-purple-50/80 border-l-4 border-purple-600 shadow-sm'
                      : 'bg-zinc-800/80 border-l-4 border-purple-500 shadow-sm'
                    : 'hover:bg-[var(--color-hover)]'
                }`}
              >
                <div className="space-y-1.5 min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        exec.status === 'success'
                          ? 'bg-emerald-400'
                          : exec.status === 'failed'
                          ? 'bg-rose-500'
                          : 'bg-amber-400 animate-ping'
                      }`}
                    />
                    <span className="text-xs font-bold text-[var(--color-foreground)] truncate">{exec.prompt}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[var(--color-muted)]">
                    <span>{exec.timestamp}</span>
                    <span>•</span>
                    <span className="font-mono text-purple-400 font-bold">{exec.duration}</span>
                    <span>•</span>
                    <span>{exec.nodesCount} nodes</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      exec.status === 'success'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {exec.status.toUpperCase()}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Execution Detail Pane */}
      <div className="w-1/2 flex flex-col bg-[var(--color-card)] p-6 overflow-y-auto custom-scrollbar">
        {selectedExec ? (
          <div className="space-y-6 max-w-xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] text-[var(--color-muted)] font-mono font-bold">
                  TRACE ID: {selectedExec.id}
                </span>
                <h2 className="text-sm font-bold text-[var(--color-foreground)] mt-1">{selectedExec.prompt}</h2>
              </div>
              <button
                onClick={() => onRerun(selectedExec.id)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <IcRotate className="w-3.5 h-3.5" />
                Rerun Flow
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-muted)] block">Status</span>
                <span className="text-xs font-bold text-emerald-400 capitalize">{selectedExec.status}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-muted)] block">Duration</span>
                <span className="text-xs font-bold text-[var(--color-foreground)]">{selectedExec.duration}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-muted)] block">Total Tokens</span>
                <span className="text-xs font-bold text-[var(--color-foreground)]">{selectedExec.totalTokens}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-muted)] block">Est. Cost</span>
                <span className="text-xs font-bold text-purple-400">{selectedExec.cost}</span>
              </div>
            </div>

            {/* Result Summary */}
            <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-2">
              <span className="text-xs font-bold text-[var(--color-foreground)]">Execution Result Summary</span>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed">{selectedExec.resultSummary}</p>
            </div>

            {/* Mock JSON Trace */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[var(--color-foreground)]">Raw Telemetry Trace</span>
              <pre
                className={`p-4 rounded-2xl border font-mono text-[11px] overflow-x-auto custom-scrollbar leading-relaxed ${
                  isLightTheme
                    ? 'bg-zinc-50 border-zinc-200 text-purple-800'
                    : 'bg-zinc-950 border-zinc-800 text-emerald-300'
                }`}
              >
                {JSON.stringify(
                  {
                    executionId: selectedExec.id,
                    trigger: selectedExec.trigger,
                    timestamp: selectedExec.timestamp,
                    nodesExecuted: [
                      'When chat message received',
                      'Slack',
                      'AI Agent',
                      'Vector Store Tool',
                      'Qdrant Vector Store1',
                      'Embeddings OpenAI3',
                      'OpenAI Chat Model',
                    ],
                    metrics: {
                      hallucinationRate: '0.00%',
                      confidenceScore: '99.8%',
                      tokens: selectedExec.totalTokens,
                    },
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--color-muted)] text-xs">
            Select an execution to inspect detailed run telemetry
          </div>
        )}
      </div>
    </div>
  )
}
