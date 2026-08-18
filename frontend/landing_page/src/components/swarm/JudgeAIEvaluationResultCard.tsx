import React from 'react'
import { JudgeAIEvaluationResult } from './judgeAISwarmData'
import { Trophy, Award, ShieldCheck, CheckCircle2, TrendingUp, Zap } from 'lucide-react'

interface JudgeAIEvaluationResultCardProps {
  evaluation?: JudgeAIEvaluationResult | null
  isTrivial?: boolean
  isLightTheme?: boolean
}

export const JudgeAIEvaluationResultCard: React.FC<JudgeAIEvaluationResultCardProps> = ({
  evaluation,
  isTrivial,
  isLightTheme,
}) => {
  // If evaluation is null/trivial, show informative skipped banner
  if (!evaluation || isTrivial) {
    return (
      <div className="w-full p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] backdrop-blur-xl shadow-lg space-y-3 font-sans">
        <div className="flex items-center justify-between pb-2.5 border-b border-[var(--color-border-faint)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-400">
                FINAL SWARM RESULT
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800/60 text-zinc-400 border border-zinc-700/50 font-semibold">
                Triage Direct Reply
              </span>
            </div>
            <h3 className="text-sm font-bold text-[var(--color-foreground)] mt-0.5">
              Conversational Turn (Rubrics Bypassed)
            </h3>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-zinc-800/40 border border-zinc-700/50 text-[10px] font-mono text-zinc-400">
            <span>Rubric Evaluation Skipped</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-purple-950/10 border border-purple-500/20 text-xs text-[var(--color-muted)] leading-relaxed">
          <strong className="text-[var(--color-foreground)]">Triage Short-Circuit Active: </strong>
          The incoming message was classified as a greeting or short acknowledgement.
          The swarm returned a direct orchestrator response immediately, bypassing Knowledge Retrieval, Deep Inference, and Judge Rubric scoring to eliminate compute latency.
        </div>
      </div>
    )
  }

  return (
    <div className="w-full p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] backdrop-blur-xl shadow-lg space-y-4 font-sans">
      {/* Header with Overall Score */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-faint)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-400">
              FINAL SWARM RESULT
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
              Confidence: {evaluation.confidence}
            </span>
          </div>
          <h3 className="text-sm font-bold text-[var(--color-foreground)] mt-0.5">
            Multi-Agent Consensus Evaluation
          </h3>
        </div>

        {/* Overall Score Circle/Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/40">
          <Award className="w-4 h-4 text-purple-400" />
          <div className="flex flex-col text-right">
            <span className="text-[9px] font-mono uppercase text-[var(--color-muted)]">Overall Score</span>
            <span className="text-base font-extrabold text-[var(--color-foreground)] leading-none">
              {evaluation.overallScore} <span className="text-xs font-normal text-[var(--color-muted)]">/100</span>
            </span>
          </div>
        </div>
      </div>

      {/* Criteria Breakdown Grid (Accuracy, Reasoning, Groundedness, Safety, Consistency) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {Object.entries(evaluation.criteria).map(([criterion, score]) => (
          <div
            key={criterion}
            className="p-2 rounded-xl bg-[var(--color-surface-deep)] border border-[var(--color-border-faint)] flex flex-col justify-between"
          >
            <span className="text-[10px] font-mono uppercase text-[var(--color-muted)] capitalize">
              {criterion}
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-bold text-[var(--color-foreground)]">{score}</span>
              <span className="text-[9px] font-mono text-emerald-400">
                {score >= 90 ? '★ Optimal' : score >= 80 ? '✓ Valid' : '— Good'}
              </span>
            </div>
            <div className="w-full bg-black/40 rounded-full h-1 mt-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-400"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Best Model Leaderboard Card (Requirement #11) */}
      <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-sm shadow-inner">
            🏆
          </div>
          <div>
            <span className="text-[9px] font-mono font-bold uppercase text-purple-400 block">
              BEST PERFORMING MODEL
            </span>
            <h4 className="text-xs font-bold text-[var(--color-foreground)]">
              {evaluation.bestModel?.name || 'minimax-m3:cloud'}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-[10px] text-[var(--color-muted)] block">Score</span>
            <span className="font-bold text-emerald-400">{evaluation.bestModel?.score ?? evaluation.overallScore}</span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--color-muted)] block">Cost</span>
            <span className="font-bold text-[var(--color-foreground)]">{evaluation.bestModel?.cost || '$0.0018'}</span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--color-muted)] block">Latency</span>
            <span className="font-bold text-purple-300">{evaluation.bestModel?.latency || '145ms'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
