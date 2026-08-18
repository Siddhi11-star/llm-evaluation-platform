import React from 'react'
import { JudgeAIAgentTask, JudgeAISwarmSession } from './judgeAISwarmData'
import { CheckCircle2, Loader2, Sparkles, Cpu, Clock, Terminal } from 'lucide-react'

interface SelectedAgentDetailCardProps {
  session: JudgeAISwarmSession
  selectedTaskIndex: number
  isLightTheme?: boolean
}

export const SelectedAgentDetailCard: React.FC<SelectedAgentDetailCardProps> = ({
  session,
  selectedTaskIndex,
  isLightTheme,
}) => {
  const workerTasks = session.tasks[0]?.role?.toLowerCase().includes('orchestrator')
    ? session.tasks.slice(1)
    : session.tasks

  // 1. Orchestrator Card (index 0)
  if (selectedTaskIndex === 0) {
    return (
      <div className="w-full p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] backdrop-blur-xl shadow-lg space-y-3 font-sans">
        <div className="flex items-center justify-between pb-2.5 border-b border-[var(--color-border-faint)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-900/30 border border-purple-500/40 flex items-center justify-center text-base shadow-inner">
              {session.orchestrator.avatar}
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
                BOSS ORCHESTRATOR & DECOMPOSER
              </span>
              <h3 className="text-xs font-bold text-[var(--color-foreground)]">
                {session.orchestrator.name}
              </h3>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            {session.is_trivial ? '✓ DIRECT REPLY' : '✓ COMPLETED'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-[var(--color-muted)] bg-[var(--color-surface-deep)] p-2.5 rounded-xl border border-[var(--color-border-faint)]">
          <div>Model: <strong className="text-[var(--color-foreground)]">{session.orchestrator.model}</strong></div>
          <div>Progress: <strong className="text-emerald-400">100%</strong></div>
          <div>Tokens: <strong className="text-[var(--color-foreground)]">{session.orchestrator.tokens.toLocaleString()}</strong></div>
          <div>Latency: <strong className="text-[var(--color-foreground)]">{session.orchestrator.latency || '25ms'}</strong></div>
        </div>

        <div className="text-xs text-[var(--color-muted)] leading-relaxed">
          <strong className="text-[var(--color-foreground)]">Task: </strong>
          {session.orchestrator.task}
        </div>

        <div className="space-y-1.5 pt-1 border-t border-[var(--color-border-faint)]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-muted)]">
            CURRENT ACTIVITY
          </span>
          <div className="space-y-1.5 text-xs text-[var(--color-foreground)]">
            {session.is_trivial ? (
              <>
                <div className="flex items-center gap-2 leading-tight">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Triage classifier detected conversational query</span>
                </div>
                <div className="flex items-center gap-2 leading-tight">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Generated direct conversational reply without worker compute overhead</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 leading-tight">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Decomposed user goal into 3 parallel execution vectors</span>
                </div>
                <div className="flex items-center gap-2 leading-tight">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Dispatched non-blocking worker threads to Knowledge, Reasoning, and Guard agents</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 2. Synthesis Node (last index)
  if (selectedTaskIndex > workerTasks.length) {
    return (
      <div className="w-full p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] backdrop-blur-xl shadow-lg space-y-3 font-sans">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-faint)]">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{session.synthesisNode.avatar}</span>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-purple-400">
                FINAL SYNTHESIS NODE
              </span>
              <h3 className="text-xs font-bold text-[var(--color-foreground)]">
                {session.synthesisNode.name}
              </h3>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
            {session.is_trivial ? '○ SKIPPED' : '✓ COMPLETED'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-[var(--color-muted)] bg-[var(--color-surface-deep)] p-2.5 rounded-xl border border-[var(--color-border-faint)]">
          <div>Status: <strong className="text-[var(--color-foreground)]">{session.is_trivial ? 'Skipped' : 'Completed'}</strong></div>
          <div>Model: <strong className="text-[var(--color-foreground)]">{session.synthesisNode.model}</strong></div>
          <div>Progress: <strong className="text-emerald-400">100%</strong></div>
          <div>Confidence: <strong className="text-purple-400">{session.evaluationResult?.confidence || (session.is_trivial ? 'N/A' : 'High')}</strong></div>
        </div>

        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-muted)]">
            CURRENT ACTIVITY
          </span>
          <div className="space-y-1 text-xs text-[var(--color-foreground)]">
            {session.is_trivial ? (
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">○</span>
                <span className="text-zinc-400">Synthesis step skipped for direct conversational reply</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Parsed {workerTasks.length} parallel sub-agent evaluation vectors</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Calculated composite rubric score: {session.evaluationResult?.overallScore || 93.7} / 100</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Compiled final synthesis report & telemetry dossier</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 3. Worker Task Card (indices 1 to workerTasks.length)
  const activeTask: JudgeAIAgentTask = workerTasks[selectedTaskIndex - 1] || workerTasks[0] || session.tasks[0]

  return (
    <div className="w-full p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] backdrop-blur-xl shadow-lg space-y-3 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[var(--color-border-faint)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-surface-deep)] border border-[var(--color-border)] flex items-center justify-center text-base shadow-inner">
            {activeTask.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
                Agent {activeTask.number} — {activeTask.role}
              </span>
            </div>
            <h3 className="text-xs font-bold text-[var(--color-foreground)]">
              {activeTask.name}
            </h3>
          </div>
        </div>

        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
            session.is_trivial
              ? 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/50'
              : activeTask.status === 'completed'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-purple-500/15 text-purple-400 border border-purple-500/30 animate-pulse'
          }`}
        >
          {session.is_trivial ? 'SKIPPED' : activeTask.status.toUpperCase()}
        </span>
      </div>

      {/* Stats Matrix Grid (Requirement #7) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-[var(--color-muted)] bg-[var(--color-surface-deep)] p-2.5 rounded-xl border border-[var(--color-border-faint)]">
        <div>Model: <strong className="text-[var(--color-foreground)]">{activeTask.model}</strong></div>
        <div>Progress: <strong className="text-emerald-400">{session.is_trivial ? 0 : activeTask.progress}%</strong></div>
        <div>Tokens: <strong className="text-[var(--color-foreground)]">{activeTask.tokensGenerated.toLocaleString()}</strong></div>
        <div>Latency: <strong className="text-purple-300">{activeTask.latencyMs}ms</strong></div>
      </div>

      {/* Task Description */}
      <div className="text-xs text-[var(--color-muted)] leading-relaxed">
        <strong className="text-[var(--color-foreground)]">Task: </strong>
        {activeTask.taskPrompt}
      </div>

      {/* Current Activity Live Steps */}
      <div className="space-y-1.5 pt-1 border-t border-[var(--color-border-faint)]">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-muted)]">
          CURRENT ACTIVITY
        </span>
        <div className="space-y-1.5 text-xs text-[var(--color-foreground)]">
          {session.is_trivial ? (
            <div className="flex items-center gap-2 text-zinc-400 leading-tight">
              <span>○</span>
              <span>Worker bypassed by Triage router for direct conversational reply</span>
            </div>
          ) : (
            (activeTask.detailInfo?.currentActivity || []).map((activity, aIdx) => (
              <div key={aIdx} className="flex items-center gap-2 leading-tight">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{activity}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
