import React, { useState } from 'react'
import { JudgeAISwarmSession, JudgeAIAgentTask } from './judgeAISwarmData'
import { IcChevronDown, IcPlus, IcRotate, IcCheck, IcSearch, IcSparkles } from '../icons'
import { Paperclip, Sparkles, ChevronDown, ChevronRight, MessageSquare } from 'lucide-react'

interface JudgeAITaskDistributionPanelProps {
  session: JudgeAISwarmSession
  selectedTaskIndex: number
  allSessions: JudgeAISwarmSession[]
  isExecuting: boolean
  isLightTheme?: boolean
  onSelectTaskIndex: (index: number) => void
  onSelectSession: (session: JudgeAISwarmSession) => void
  onNewSession: () => void
  onSendMessage: (text: string) => void
  onToggleChatModal?: () => void
}

export const JudgeAITaskDistributionPanel: React.FC<JudgeAITaskDistributionPanelProps> = ({
  session,
  selectedTaskIndex,
  allSessions,
  isExecuting,
  isLightTheme,
  onSelectTaskIndex,
  onSelectSession,
  onNewSession,
  onSendMessage,
  onToggleChatModal,
}) => {
  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false)
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false)
  const [hoveredTask, setHoveredTask] = useState<JudgeAIAgentTask | null>(null)
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [inputText, setInputText] = useState('')

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputText.trim()) return
    onSendMessage(inputText.trim())
    setInputText('')
  }

  const handleTaskMouseEnter = (task: JudgeAIAgentTask, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setHoverPos({ x: rect.right + 10, y: rect.top - 10 })
    setHoveredTask(task)
  }

  return (
    <div className="w-full h-full flex flex-col justify-between overflow-hidden bg-[var(--color-background)] text-[var(--color-foreground)] select-none font-sans relative">
      {/* Top Header of Left Panel */}
      <div className="h-10 px-3.5 border-b border-[var(--color-border)] flex items-center justify-between shrink-0 bg-[var(--color-surface)]">
        {/* Left: New Swarm + Session Dropdown */}
        <div className="flex items-center gap-1.5 relative">
          <button
            onClick={onNewSession}
            className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-hover)] transition-colors border border-[var(--color-border-faint)]"
            title="Start New Swarm Chat"
          >
            <span className="text-xs font-bold">+</span>
          </button>

          {/* Session Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSessionDropdownOpen(!isSessionDropdownOpen)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold text-[var(--color-foreground)] hover:bg-[var(--color-hover)] transition-colors border border-[var(--color-border-faint)]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span className="truncate max-w-[150px]">{session.title}</span>
              <IcChevronDown className="w-3 h-3 text-[var(--color-muted)]" />
            </button>

            {isSessionDropdownOpen && (
              <div
                className={`absolute top-full left-0 mt-1 w-64 rounded-xl border shadow-2xl p-1 z-50 backdrop-blur-2xl ${
                  isLightTheme ? 'bg-white border-zinc-200 shadow-xl' : 'bg-[#181622] border-[#2A2638] shadow-2xl'
                }`}
              >
                <div className="text-[9px] font-mono font-bold uppercase text-[var(--color-muted)] px-2 py-1">
                  Active Swarms
                </div>
                {allSessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectSession(s)
                      setIsSessionDropdownOpen(false)
                    }}
                    className={`w-full text-left p-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      session.id === s.id
                        ? 'bg-purple-500/15 text-purple-400 font-semibold'
                        : 'hover:bg-[var(--color-hover)] text-[var(--color-foreground)]'
                    }`}
                  >
                    <span className="truncate">{s.title}</span>
                    <span className="text-[9px] text-[var(--color-muted)] font-mono">
                      {s.tasks.length}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Attachments Pill */}
        <div className="flex items-center gap-1 text-[11px] text-[var(--color-muted)] font-mono px-2 py-0.5 rounded bg-[var(--color-hover)] border border-[var(--color-border-faint)]">
          <Paperclip className="w-2.5 h-2.5" />
          <span className="font-semibold text-[var(--color-foreground)]">{session.attachmentsCount}</span>
        </div>
      </div>

      {/* Main Task Stream Scroll Container */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 text-xs leading-relaxed custom-scrollbar">
        {/* Delegation Lead Text */}
        <p className="text-[var(--color-foreground)] font-medium text-xs leading-snug">
          {session.delegationLeadText}
        </p>

        {/* Subagent Summary Chip */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="text-purple-400">⚡</span>
            <span>Created {session.tasks.length} parallel sub-agents for prompt execution</span>
          </div>
          <span className="text-[10px] font-mono text-purple-400 font-bold">›</span>
        </div>

        {/* Task Distribution Box (Container with 7 Tasks or 3 Tasks) */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-2.5 shadow-lg backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between px-1.5 pb-2 border-b border-[var(--color-border-faint)] text-xs">
            <div className="flex items-center gap-1.5 text-[var(--color-foreground)] font-bold">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Agent Swarm {session.tasks.length} Tasks</span>
            </div>
            <span className="text-[10px] font-mono text-purple-400 font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
              Parallel Matrix
            </span>
          </div>

          {/* List of Sub-Agent Tasks */}
          <div className="divide-y divide-[var(--color-border-faint)] mt-1">
            {session.tasks.map((task, idx) => {
              const isSelected = selectedTaskIndex === idx

              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTaskIndex(idx)}
                  onMouseEnter={(e) => handleTaskMouseEnter(task, e)}
                  onMouseLeave={() => setHoveredTask(null)}
                  className={`p-2 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 group relative ${
                    isSelected
                      ? 'bg-purple-600/15 border border-purple-500/50 text-[var(--color-foreground)] shadow-sm'
                      : 'hover:bg-[var(--color-hover)] text-[var(--color-muted)]'
                  }`}
                >
                  {/* Left: Avatar, Name & Task Prompt */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-[var(--color-hover)] flex items-center justify-center text-xs shrink-0 border border-[var(--color-border)]">
                      {task.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-[var(--color-foreground)]">
                          {task.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--color-muted)] truncate leading-tight">
                        ↳ {task.taskPrompt}
                      </p>
                    </div>
                  </div>

                  {/* Right: Viewing Badge & Dot Matrix Bars */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isSelected ? (
                      <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        Viewing {task.number}
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-[var(--color-muted)]">
                        {task.number}
                      </span>
                    )}

                    {/* Dot Matrix Live Activity Indicator */}
                    <div className="flex items-center gap-0.5 text-zinc-500 text-[9px] font-mono">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          task.status === 'Analyzing' || task.status === 'Writing'
                            ? 'bg-purple-400 animate-ping'
                            : 'bg-zinc-600'
                        }`}
                      />
                      <span>::::</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Collapsible Reasoning Block */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
          <button
            onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
            className="w-full px-3 py-2 flex items-center justify-between text-xs font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-hover)] transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-purple-400 text-xs">💡</span>
              <span className="text-xs">Reasoning & Strategy</span>
            </div>
            <span className="text-[var(--color-muted)] font-mono text-[10px]">
              {isThinkingExpanded ? '▾' : '▸'}
            </span>
          </button>

          {isThinkingExpanded && (
            <div className="p-2.5 pt-1 text-xs text-[var(--color-muted)] space-y-1.5 border-t border-[var(--color-border-faint)]">
              {session.thoughtSteps.map((st, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-semibold text-[var(--color-foreground)] text-[11px]">{st.title}</div>
                  <p className="text-[10px] text-[var(--color-muted)] leading-relaxed font-sans">
                    {st.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Synthesis Text */}
        <p className="text-[var(--color-foreground)] text-xs leading-relaxed">{session.synthesisText}</p>

        {/* File Creation Chip */}
        {session.createdFile && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] text-xs text-[var(--color-foreground)] hover:border-purple-500/40 cursor-pointer group transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-xs">📄</span>
              <span className="font-mono text-[var(--color-foreground)] text-xs">
                Creating {session.createdFile.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-purple-400 font-bold">
                {session.createdFile.progress}%
              </span>
              <span className="text-[var(--color-muted)] group-hover:translate-x-0.5 transition-transform">
                ›
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Hover Popover */}
      {hoveredTask && (
        <div
          className={`fixed z-50 w-80 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 pointer-events-none ${
            isLightTheme
              ? 'bg-white/95 border-zinc-200 text-zinc-900 shadow-xl'
              : 'bg-[#181622]/95 border-[#2A2638] text-zinc-100 shadow-2xl'
          }`}
          style={{ top: hoverPos.y, left: hoverPos.x }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-[var(--color-hover)] flex items-center justify-center text-xs border border-[var(--color-border)]">
              {hoveredTask.avatar}
            </div>
            <div>
              <h4 className="text-xs font-bold text-[var(--color-foreground)]">{hoveredTask.name}</h4>
              <p className="text-[10px] text-purple-400 font-mono">{hoveredTask.role}</p>
            </div>
          </div>

          <p className="text-xs text-[var(--color-muted)] leading-relaxed mb-2">
            {hoveredTask.detailInfo.overview}
          </p>

          <div className="space-y-1 text-[10px] text-[var(--color-muted)] font-sans border-t border-[var(--color-border-faint)] pt-1.5">
            {hoveredTask.detailInfo.subtasks.map((st, i) => (
              <div key={i} className="leading-tight">
                {st}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Input Dock */}
      <div className="p-2.5 border-t border-[var(--color-border)] shrink-0 bg-[var(--color-surface)]">
        <div className="text-[9px] text-[var(--color-muted)] mb-1 px-1 font-mono">
          Task executed by JudgeAI Agent Swarm. Follow-ups will route through the orchestrator.
        </div>

        <form
          onSubmit={handleSend}
          className="flex items-center justify-between p-1 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] focus-within:border-purple-500/50 shadow-inner"
        >
          <div className="flex items-center gap-1.5 pl-2">
            <button
              type="button"
              className="text-[var(--color-muted)] hover:text-[var(--color-foreground)] text-xs"
              title="Add attachment"
            >
              +
            </button>
            <span className="text-[9px] text-[var(--color-muted)] font-mono">🌐 37 left</span>
          </div>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask follow-up..."
            className="flex-1 bg-transparent px-2 text-xs outline-none text-[var(--color-foreground)] placeholder:text-[var(--color-muted)]"
          />

          <div className="flex items-center gap-1.5 pr-1">
            <span className="text-[9px] text-[var(--color-muted)] font-medium hidden sm:inline">
              {session.modelName.split(' ')[0]} ▾
            </span>
            <button
              type="submit"
              className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold hover:scale-105 active:scale-95 transition-transform shadow-md"
            >
              •
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
