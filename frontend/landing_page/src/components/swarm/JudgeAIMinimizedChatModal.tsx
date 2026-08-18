import React, { useState } from 'react'
import { JudgeAISwarmSession } from './judgeAISwarmData'
import { LogoIcon } from '../Logo'
import { Message, MessageContent, MessageAvatar } from '@/components/ui/message'

interface JudgeAIMinimizedChatModalProps {
  session: JudgeAISwarmSession
  isOpen: boolean
  isLightTheme?: boolean
  onClose: () => void
  onSendMessage: (text: string) => void
}

export const JudgeAIMinimizedChatModal: React.FC<JudgeAIMinimizedChatModalProps> = ({
  session,
  isOpen,
  isLightTheme,
  onClose,
  onSendMessage,
}) => {
  const [inputMessage, setInputMessage] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)

  if (!isOpen) return null

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim()) return
    onSendMessage(inputMessage.trim())
    setInputMessage('')
  }

  const USER_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"
  const AI_AVATAR = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=256&auto=format&fit=crop"

  return (
    <div
      className={`fixed z-50 transition-all duration-300 shadow-2xl font-sans ${
        isMinimized
          ? 'bottom-6 right-6 w-80 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] backdrop-blur-xl'
          : 'bottom-6 right-6 w-[450px] h-[550px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] backdrop-blur-2xl flex flex-col'
      } text-[var(--color-foreground)]`}
      style={{
        boxShadow: isLightTheme
          ? '0 10px 40px rgba(0, 0, 0, 0.12)'
          : '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* Header */}
      <div className="h-12 px-4 border-b border-[var(--color-border)] flex items-center justify-between shrink-0 bg-[var(--color-surface)] rounded-t-2xl">
        <div className="flex items-center gap-2">
          <LogoIcon size={22} />
          <span className="text-xs font-bold text-[var(--color-foreground)]">
            JudgeAI Swarm Chat
          </span>
          <span className="text-[10px] font-mono text-[var(--color-muted)] px-1.5 py-0.5 rounded bg-[var(--color-hover)] border border-[var(--color-border-faint)]">
            {session.modelName.split(':')[0]}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded-md text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-hover)] transition-colors text-xs font-mono"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? '↗' : '—'}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-hover)] transition-colors text-xs"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Message History Stream using Message components */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs leading-relaxed custom-scrollbar bg-[var(--color-background)]">
            {/* User Prompt */}
            <Message from="user">
              <MessageContent className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium shadow-md">
                {session.prompt}
              </MessageContent>
              <MessageAvatar src={USER_AVATAR} name="User" />
            </Message>

            {/* Assistant / Swarm Response */}
            <Message from="assistant">
              <MessageContent className="bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-foreground)] space-y-2 shadow-sm">
                <div className="font-bold text-purple-400 text-[10px] font-mono uppercase">
                  JudgeAI Orchestrator ({session.modelName.split(':')[0]})
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">
                  {session.is_trivial ? session.orchestrator.task : (session.deliverable?.content || session.orchestrator.task)}
                </p>
                <div className="pt-2 border-t border-[var(--color-border-faint)] text-[10px] text-[var(--color-muted)] font-mono flex items-center justify-between">
                  <span>⚡ Delegated across {session.tasks.length} sub-agents</span>
                  <span className="text-purple-400 font-semibold">{session.elapsedTime}</span>
                </div>
              </MessageContent>
              <MessageAvatar src={AI_AVATAR} name="JudgeAI" />
            </Message>
          </div>

          {/* Quick Input Bar */}
          <form
            onSubmit={handleSend}
            className="p-3 border-t border-[var(--color-border)] flex items-center gap-2 bg-[var(--color-surface)] rounded-b-2xl"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Send follow-up prompt to swarm..."
              className="flex-1 bg-[var(--color-card)] px-3 py-1.5 text-xs outline-none text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] rounded-xl border border-[var(--color-border)] focus:border-purple-500/50"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white text-xs font-bold transition-all disabled:opacity-40 shadow-sm"
            >
              Send
            </button>
          </form>
        </>
      )}
    </div>
  )
}
