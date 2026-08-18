import React, { useState } from 'react'
import { JudgeAISwarmSession, JudgeAIAgentTask } from './judgeAISwarmData'
import { IcCopy, IcCheck, IcSparkles, IcRotate, IcChevronRight } from '../icons'
import { LogoIcon } from '../Logo'
import { Monitor, Link as LinkIcon, Plus } from 'lucide-react'

interface JudgeAIComputerPanelProps {
  session: JudgeAISwarmSession
  selectedTaskIndex: number
  isExecuting: boolean
  isLightTheme?: boolean
  onSelectTaskIndex: (index: number) => void
}

export const JudgeAIComputerPanel: React.FC<JudgeAIComputerPanelProps> = ({
  session,
  selectedTaskIndex,
  isExecuting,
  isLightTheme,
  onSelectTaskIndex,
}) => {
  const [viewMode, setViewMode] = useState<'screen' | 'logs' | 'artifact'>('screen')
  const [copied, setCopied] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)

  const activeTask: JudgeAIAgentTask = session.tasks[selectedTaskIndex] || session.tasks[0]

  const handleCopy = () => {
    if (!activeTask.detailInfo.artifactOutput) return
    navigator.clipboard.writeText(activeTask.detailInfo.artifactOutput.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full h-full flex flex-col justify-between overflow-hidden select-none font-sans relative bg-[var(--color-background)] text-[var(--color-foreground)]">
      {/* ================= TOP HEADER (JudgeAI's Computer) ================= */}
      <div className="h-10 px-3.5 border-b border-[var(--color-border)] flex items-center justify-between shrink-0 bg-[var(--color-surface)]">
        {/* Left: Computer Icon + Title + Progress Pill */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center text-xs shadow-inner">
            🖥️
          </div>

          <span className="text-xs font-bold text-[var(--color-foreground)] tracking-tight">
            JudgeAI's Computer
          </span>

          {/* Live Progress Pill */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-muted)]">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="font-semibold text-purple-400">
              Task Progress {selectedTaskIndex + 1}/{session.totalTasks}
            </span>
            <span className="text-[var(--color-muted)] font-normal truncate max-w-[180px] hidden md:inline">
              | {session.prompt.slice(0, 32)}... ›
            </span>
          </div>
        </div>

        {/* Right: Add Tab */}
        <div className="flex items-center gap-1">
          <button
            className="w-6 h-6 rounded-md bg-[var(--color-hover)] hover:bg-[var(--color-hover-strong)] border border-[var(--color-border)] flex items-center justify-center text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
            title="Add tab"
          >
            +
          </button>
        </div>
      </div>

      {/* ================= SUBHEADER (Agent 01 JudgeAI's Computer) ================= */}
      <div className="h-7 px-3.5 border-b border-[var(--color-border)] flex items-center justify-between text-xs shrink-0 bg-[var(--color-surface-deep)]">
        <div className="flex items-center gap-1.5 text-[var(--color-muted)] font-mono text-[10px]">
          <span className="font-bold text-[var(--color-foreground)]">
            Agent {activeTask.number}
          </span>
          <span className="text-[var(--color-muted)]">JudgeAI's Computer</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="flex items-center gap-1 text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors text-[10px]"
          >
            <span>🔗</span>
            <span>Agent's Task</span>
          </button>

          <button
            onClick={handleCopy}
            className="p-0.5 text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors rounded"
            title="Copy Output"
          >
            {copied ? (
              <IcCheck className="w-3 h-3 text-emerald-400" />
            ) : (
              <IcCopy className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {/* ================= MAIN VIRTUAL COMPUTER SCREEN ================= */}
      <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col p-3 justify-between">
        {/* Central Retro Monitor Container */}
        <div className="flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] flex flex-col justify-between overflow-hidden shadow-2xl relative backdrop-blur-xl">
          {/* Virtual Computer Window Content */}
          <div className="flex-1 p-4 flex flex-col items-center justify-center text-center overflow-y-auto">
            {/* Screen State: Retro Computer Graphic + Terminal */}
            <div className="flex flex-col items-center justify-center max-w-md w-full space-y-3 my-auto">
              {/* Retro Computer Illustration */}
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-deep)] border-2 border-[var(--color-border)] flex flex-col items-center justify-center shadow-xl relative group">
                  <div className="w-11 h-9 rounded-lg bg-black/80 border border-[var(--color-border)] flex items-center justify-center text-xl relative overflow-hidden">
                    <span className="group-hover:scale-110 transition-transform">
                      {activeTask.avatar}
                    </span>
                    <div className="absolute inset-0 bg-purple-500/5 pointer-events-none" />
                  </div>
                  <div className="w-7 h-1 bg-[var(--color-hover-strong)] rounded-full mt-1" />
                </div>
              </div>

              {/* Progress & Loading Bar */}
              <div className="w-56 space-y-1">
                <div className="w-full bg-[var(--color-surface-deep)] border border-[var(--color-border)] rounded-full h-1.5 overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-700"
                    style={{ width: `${activeTask.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-muted)]">
                  <span>Loading...</span>
                  <span className="text-purple-400 font-semibold">{activeTask.status}</span>
                </div>
              </div>

              {/* Real-Time Live Logs Box */}
              <div className="w-full max-w-sm bg-black/40 border border-[var(--color-border)] rounded-xl p-2.5 text-left font-mono text-[10px] text-[var(--color-muted)] leading-relaxed space-y-1 custom-scrollbar max-h-28 overflow-y-auto">
                {activeTask.detailInfo.terminalLogs.map((log, lIdx) => (
                  <div key={lIdx} className="truncate">
                    <span className="text-purple-400">›</span> {typeof log === 'string' ? log : log.text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Artifact Preview Bottom Drawer */}
          {activeTask.detailInfo.artifactOutput && (
            <div className="border-t border-[var(--color-border-faint)] px-3 py-2 bg-[var(--color-hover)] flex items-center justify-between text-xs shrink-0 z-10">
              <div className="flex items-center gap-2 truncate pr-2">
                <span className="text-xs">📄</span>
                <span className="font-semibold text-[var(--color-foreground)] text-xs truncate">
                  {activeTask.detailInfo.artifactOutput.title}
                </span>
              </div>
              <button
                onClick={() => setViewMode(viewMode === 'artifact' ? 'screen' : 'artifact')}
                className="text-[10px] font-mono text-purple-400 hover:text-purple-300 font-semibold shrink-0"
              >
                {viewMode === 'artifact' ? 'Hide Details' : 'View Full Output →'}
              </button>
            </div>
          )}

          {/* Artifact Modal / Split View */}
          {viewMode === 'artifact' && activeTask.detailInfo.artifactOutput && (
            <div className="absolute inset-0 bg-[var(--color-background)] z-30 p-4 overflow-y-auto text-left font-sans animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--color-border)]">
                <h3 className="text-xs font-bold text-[var(--color-foreground)]">
                  {activeTask.detailInfo.artifactOutput.title}
                </h3>
                <button
                  onClick={() => setViewMode('screen')}
                  className="px-2 py-0.5 rounded bg-[var(--color-surface-deep)] border border-[var(--color-border)] text-xs text-[var(--color-foreground)] hover:bg-[var(--color-hover)]"
                >
                  Close ✕
                </button>
              </div>

              <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-[var(--color-foreground)]">
                {activeTask.detailInfo.artifactOutput.content}
              </div>
            </div>
          )}

          {/* Floating Action Button (Back to latest) positioned above drawer */}
          <div className="absolute bottom-12 right-3 z-20">
            <button
              onClick={() => onSelectTaskIndex(session.tasks.length - 1)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-card)]/90 border border-[var(--color-border)] hover:bg-[var(--color-hover)] text-[10px] font-mono text-[var(--color-muted)] hover:text-[var(--color-foreground)] shadow-lg backdrop-blur-md transition-all"
            >
              <span>▷</span>
              <span>Back to latest</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM AGENT DOCK (Avatar Selector Bar) ================= */}
      <div className="h-18 px-3 border-t border-[var(--color-border)] flex items-center justify-center shrink-0 bg-[var(--color-surface)] backdrop-blur-md">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-1 max-w-full">
          {session.tasks.map((task, idx) => {
            const isSelected = selectedTaskIndex === idx

            return (
              <button
                key={task.id}
                onClick={() => onSelectTaskIndex(idx)}
                className={`flex flex-col items-center justify-between p-1.5 rounded-xl transition-all duration-200 min-w-[58px] h-13 relative group ${
                  isSelected
                    ? 'bg-purple-600/15 border-2 border-purple-500 shadow-md ring-2 ring-purple-500/20 text-[var(--color-foreground)]'
                    : 'bg-[var(--color-card)] hover:bg-[var(--color-hover)] border border-[var(--color-border)] opacity-70 hover:opacity-100 text-[var(--color-muted)]'
                }`}
              >
                {/* Avatar & Number */}
                <div className="flex items-center gap-1 w-full justify-between px-0.5">
                  <div className="w-4 h-4 rounded-full bg-[var(--color-hover)] flex items-center justify-center text-[10px] border border-[var(--color-border)]">
                    {task.avatar}
                  </div>
                  <span className="text-[8px] font-mono font-bold text-[var(--color-muted)] group-hover:text-[var(--color-foreground)]">
                    {task.number}
                  </span>
                </div>

                {/* Status Text Below */}
                <span
                  className={`text-[8px] font-mono transition-colors truncate max-w-full ${
                    isSelected
                      ? 'text-purple-400 font-bold'
                      : 'text-[var(--color-muted)] group-hover:text-[var(--color-foreground)]'
                  }`}
                >
                  {task.status}
                </span>

                {/* Top Active Indicator Dot */}
                {isSelected && (
                  <div className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-purple-400 shadow-md shadow-purple-500/50" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Agent's Task Detail Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-2xl space-y-3 backdrop-blur-2xl text-[var(--color-foreground)]">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-faint)]">
              <div className="flex items-center gap-2">
                <span className="text-base">{activeTask.avatar}</span>
                <div>
                  <h3 className="text-xs font-bold text-[var(--color-foreground)]">{activeTask.name}</h3>
                  <p className="text-[10px] text-purple-400 font-mono">{activeTask.role}</p>
                </div>
              </div>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="text-[var(--color-muted)] hover:text-[var(--color-foreground)] text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              {activeTask.detailInfo.overview}
            </p>

            <div className="space-y-1 text-[10px] text-[var(--color-muted)] font-mono bg-black/40 p-2 rounded-xl border border-[var(--color-border)]">
              {activeTask.detailInfo.subtasks.map((st, i) => (
                <div key={i}>• {st}</div>
              ))}
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
