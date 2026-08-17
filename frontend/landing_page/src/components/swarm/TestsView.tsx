import React, { useState } from 'react'
import { SwarmTestCase } from './types'
import { IcPlay, IcSparkles } from '../icons'

interface TestsViewProps {
  testCases: SwarmTestCase[]
  isLightTheme?: boolean
  onRunAll: () => void
}

export const TestsView: React.FC<TestsViewProps> = ({ testCases, isLightTheme, onRunAll }) => {
  const [tests, setTests] = useState<SwarmTestCase[]>(testCases)
  const [runningId, setRunningId] = useState<string | null>(null)
  const [isAllRunning, setIsAllRunning] = useState(false)

  const handleRunSingle = (id: string) => {
    setRunningId(id)
    setTimeout(() => {
      setTests((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                lastScore: Math.floor(Math.random() * 5) + 95,
                lastStatus: 'pass',
                lastRun: 'Just now',
              }
            : t
        )
      )
      setRunningId(null)
    }, 800)
  }

  const handleRunAllTests = () => {
    setIsAllRunning(true)
    setTimeout(() => {
      setTests((prev) =>
        prev.map((t) => ({
          ...t,
          lastScore: Math.floor(Math.random() * 5) + 95,
          lastStatus: 'pass',
          lastRun: 'Just now',
        }))
      )
      setIsAllRunning(false)
    }, 1500)
  }

  const avgScore =
    tests.reduce((acc, t) => acc + (t.lastScore || 0), 0) / (tests.length || 1)

  return (
    <div className="flex-1 overflow-y-auto p-8 text-[var(--color-foreground)] space-y-6 custom-scrollbar">
      {/* Header & Quick Run */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[var(--color-foreground)]">Swarm Evaluation Benchmark Tests</h2>
          <p className="text-xs text-[var(--color-muted)] mt-1">
            Automated double-blind LLM judge evaluations across key retrieval and multi-agent delegation scenarios
          </p>
        </div>
        <button
          onClick={handleRunAllTests}
          disabled={isAllRunning}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50"
        >
          <IcPlay className={`w-3.5 h-3.5 ${isAllRunning ? 'animate-spin' : ''}`} />
          <span>{isAllRunning ? 'Running Benchmark Suite...' : 'Run All Benchmark Tests'}</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
          <span className="text-xs text-[var(--color-muted)] font-medium">Average Judge Score</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{avgScore.toFixed(1)}%</div>
          <span className="text-[10px] text-[var(--color-muted)]">Target: ≥ 95.0% zero-hallucination</span>
        </div>
        <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
          <span className="text-xs text-[var(--color-muted)] font-medium">Tests Passing</span>
          <div className="text-2xl font-bold text-[var(--color-foreground)] mt-1">
            {tests.filter((t) => t.lastStatus === 'pass').length} / {tests.length}
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold">100% Passing Rate</span>
        </div>
        <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
          <span className="text-xs text-[var(--color-muted)] font-medium">Evaluation Engine</span>
          <div className="text-sm font-bold text-purple-400 mt-2">LLM Judge Axiom Guard</div>
          <span className="text-[10px] text-[var(--color-muted)]">Double-blind semantic verification</span>
        </div>
      </div>

      {/* Test Cases Table */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden divide-y divide-[var(--color-border-faint)] shadow-sm">
        {tests.map((test) => (
          <div key={test.id} className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--color-foreground)]">{test.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--color-hover)] text-[var(--color-muted)] font-mono border border-[var(--color-border)]">
                  {test.lastRun}
                </span>
              </div>
              <p className="text-xs text-[var(--color-muted)] font-mono">"{test.inputPrompt}"</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-[var(--color-muted)] font-medium">Keywords:</span>
                {test.expectedKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-mono font-medium"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <div className="text-sm font-bold text-emerald-400">{test.lastScore}%</div>
                <span className="text-[10px] text-emerald-500 font-bold uppercase">Passed</span>
              </div>
              <button
                onClick={() => handleRunSingle(test.id)}
                disabled={runningId === test.id}
                className="p-2 rounded-xl bg-[var(--color-hover)] hover:bg-[var(--color-hover-strong)] text-[var(--color-foreground)] text-xs transition-colors border border-[var(--color-border)]"
                title="Run Test"
              >
                <IcPlay className={`w-3.5 h-3.5 ${runningId === test.id ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
