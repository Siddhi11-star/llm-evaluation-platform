import React, { useState } from 'react'
import { JudgeAISwarmSession } from './judgeAISwarmData'
import { Sparkles, Copy, Check, Bot, Brain, Shield, Search } from 'lucide-react'
import { Message, MessageContent, MessageAvatar } from '@/components/ui/message'

interface SwarmOutputCardProps {
  session: JudgeAISwarmSession
  isLightTheme?: boolean
}

export const SwarmOutputCard: React.FC<SwarmOutputCardProps> = ({
  session,
  isLightTheme,
}) => {
  const [copied, setCopied] = useState(false)
  const [activeOutputTab, setActiveOutputTab] = useState<'synthesis' | 'retrieval' | 'inference' | 'guard'>('synthesis')

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const workerTasks = session.tasks[0]?.role?.toLowerCase().includes('orchestrator')
    ? session.tasks.slice(1)
    : session.tasks

  const retrievalTask = workerTasks.find((t) => t.role.toLowerCase().includes('vector') || t.role.toLowerCase().includes('retrieval')) || workerTasks[0]
  const inferenceTask = workerTasks.find((t) => t.role.toLowerCase().includes('reasoning') || t.role.toLowerCase().includes('inference')) || workerTasks[1]
  const guardTask = workerTasks.find((t) => t.role.toLowerCase().includes('guard') || t.role.toLowerCase().includes('verification')) || workerTasks[2]

  const mainOutputText = session.deliverable?.content || (
    session.is_trivial
      ? session.orchestrator.task
      : `### [JudgeAI Swarm Output]\n\n${session.synthesisNode.task}\n\n${session.orchestrator.task}`
  )

  // Stock verified avatars
  const USER_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"
  const AI_AVATAR = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=256&auto=format&fit=crop"

  return (
    <div className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] backdrop-blur-xl shadow-lg flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--color-border-faint)] flex items-center justify-between bg-[var(--color-hover)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-sm shadow-inner">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-400">
                SWARM EXECUTION OUTPUT
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                {session.modelName || 'minimax-m3:cloud'}
              </span>
            </div>
            <h3 className="text-xs font-bold text-[var(--color-foreground)] truncate max-w-md">
              {session.is_trivial ? 'Direct Orchestrator Output' : session.title || 'Synthesized Multi-Agent Output'}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCopy(mainOutputText)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-hover-strong)] text-xs font-medium text-[var(--color-foreground)] transition-colors shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[var(--color-muted)]" />}
            <span className="font-mono text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs for Substantive Multi-Agent Outputs */}
      {!session.is_trivial && workerTasks.length > 0 && (
        <div className="px-4 py-2 border-b border-[var(--color-border-faint)] flex items-center gap-1.5 overflow-x-auto bg-[var(--color-surface-deep)]">
          <button
            onClick={() => setActiveOutputTab('synthesis')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition-all ${
              activeOutputTab === 'synthesis'
                ? 'bg-purple-600 text-white font-bold shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-hover)]'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Final Synthesis</span>
          </button>

          {retrievalTask && (
            <button
              onClick={() => setActiveOutputTab('retrieval')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                activeOutputTab === 'retrieval'
                  ? 'bg-purple-600 text-white font-bold shadow-sm'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-hover)]'
              }`}
            >
              <Search className="w-3 h-3" />
              <span>Knowledge Retrieval</span>
            </button>
          )}

          {inferenceTask && (
            <button
              onClick={() => setActiveOutputTab('inference')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                activeOutputTab === 'inference'
                  ? 'bg-purple-600 text-white font-bold shadow-sm'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-hover)]'
              }`}
            >
              <Brain className="w-3 h-3" />
              <span>Deep Inference</span>
            </button>
          )}

          {guardTask && (
            <button
              onClick={() => setActiveOutputTab('guard')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                activeOutputTab === 'guard'
                  ? 'bg-purple-600 text-white font-bold shadow-sm'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-hover)]'
              }`}
            >
              <Shield className="w-3 h-3" />
              <span>Hallucination Guard</span>
            </button>
          )}
        </div>
      )}

      {/* Main Chat / Output Stream using @/components/ui/message */}
      <div className="p-4 flex-1 overflow-y-auto max-h-[480px] custom-scrollbar bg-[var(--color-card)] text-xs text-[var(--color-foreground)] leading-relaxed space-y-4">
        {/* 1. User Message */}
        <Message from="user">
          <MessageContent className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium shadow-md">
            {session.prompt}
          </MessageContent>
          <MessageAvatar src={USER_AVATAR} name="User" />
        </Message>

        {/* 2. Assistant Response */}
        <Message from="assistant">
          <MessageContent className="bg-[var(--color-surface-deep)] border border-[var(--color-border-faint)] text-[var(--color-foreground)] w-full">
            {session.is_trivial ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-mono text-[10px] text-purple-400 font-semibold">
                  <Bot className="w-3.5 h-3.5" />
                  <span>Orchestrator Direct Reply</span>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed text-xs">
                  {session.orchestrator.task}
                </p>
                <div className="pt-2 border-t border-[var(--color-border-faint)] text-[10px] text-[var(--color-muted)] font-mono flex items-center justify-between">
                  <span>Latency: <strong className="text-purple-300">{session.elapsedTime}</strong></span>
                  <span>Tokens: <strong className="text-[var(--color-foreground)]">{session.totalTokens}</strong></span>
                  <span className="text-emerald-400">Zero Worker Overhead ✓</span>
                </div>
              </div>
            ) : (
              <div>
                {activeOutputTab === 'synthesis' && (
                  <div className="space-y-2">
                    <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-[var(--color-foreground)]">
                      {session.deliverable?.content || mainOutputText}
                    </pre>
                  </div>
                )}

                {activeOutputTab === 'retrieval' && retrievalTask && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-muted)] pb-1.5 border-b border-[var(--color-border-faint)]">
                      <span>Agent: <strong className="text-[var(--color-foreground)]">{retrievalTask.name}</strong></span>
                      <span>Model: <strong className="text-purple-300">{retrievalTask.model}</strong> · {retrievalTask.latencyMs}ms</span>
                    </div>
                    <div className="text-xs text-[var(--color-foreground)] whitespace-pre-wrap leading-relaxed">
                      {retrievalTask.detailInfo?.artifactOutput?.content || retrievalTask.taskPrompt}
                    </div>
                  </div>
                )}

                {activeOutputTab === 'inference' && inferenceTask && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-muted)] pb-1.5 border-b border-[var(--color-border-faint)]">
                      <span>Agent: <strong className="text-[var(--color-foreground)]">{inferenceTask.name}</strong></span>
                      <span>Model: <strong className="text-purple-300">{inferenceTask.model}</strong> · {inferenceTask.latencyMs}ms</span>
                    </div>
                    <div className="text-xs text-[var(--color-foreground)] whitespace-pre-wrap leading-relaxed">
                      {inferenceTask.detailInfo?.artifactOutput?.content || inferenceTask.taskPrompt}
                    </div>
                  </div>
                )}

                {activeOutputTab === 'guard' && guardTask && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-muted)] pb-1.5 border-b border-[var(--color-border-faint)]">
                      <span>Agent: <strong className="text-[var(--color-foreground)]">{guardTask.name}</strong></span>
                      <span>Model: <strong className="text-purple-300">{guardTask.model}</strong> · {guardTask.latencyMs}ms</span>
                    </div>
                    <div className="text-xs text-[var(--color-foreground)] whitespace-pre-wrap leading-relaxed">
                      {guardTask.detailInfo?.artifactOutput?.content || guardTask.taskPrompt}
                    </div>
                  </div>
                )}
              </div>
            )}
          </MessageContent>
          <MessageAvatar src={AI_AVATAR} name="JudgeAI" />
        </Message>
      </div>
    </div>
  )
}
