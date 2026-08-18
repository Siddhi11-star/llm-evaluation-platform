import React, { useState } from 'react'
import { FEATURED_SWARM_CASES } from './judgeAISwarmData'
import { Sparkles, Paperclip } from 'lucide-react'

interface JudgeAISwarmLandingProps {
  onStartSwarm: (prompt: string, modelName: string) => void
  isLightTheme?: boolean
}

export const JudgeAISwarmLanding: React.FC<JudgeAISwarmLandingProps> = ({
  onStartSwarm,
  isLightTheme,
}) => {
  const [prompt, setPrompt] = useState('')
  const selectedModel = 'minimax-m3:cloud'

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!prompt.trim()) return
    onStartSwarm(prompt.trim(), selectedModel)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 md:p-8 overflow-y-auto font-sans relative select-none bg-[var(--color-background)] text-[var(--color-foreground)]">
      {/* Background Radial Glow Layer */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(circle 680px at 50% 42%, rgba(124, 58, 237, 0.22), transparent 70%)`,
        }}
      />

      {/* Central Content Container */}
      <div className="w-full max-w-3xl flex flex-col items-center z-10 my-auto py-4">
        {/* Swarm Illustration Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="relative mb-3 group">
            <img
              src="/swarm-illustration.png"
              alt="JudgeAI Autonomous Swarm"
              className="w-72 sm:w-80 md:w-[380px] lg:w-[430px] max-w-full h-auto drop-shadow-[0_18px_40px_rgba(139,92,246,0.28)] select-none pointer-events-none transition-transform duration-300 hover:scale-105"
            />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-[38px] font-extrabold tracking-tight text-[var(--color-foreground)] leading-tight">
            What would you like the Swarm to build today?
          </h1>
          <p className="text-xs sm:text-sm md:text-[15px] text-[var(--color-muted)] mt-2 font-medium max-w-xl">
            Parallel multi-agent decomposition across research, reasoning, code synthesis, and verification
          </p>
        </div>

        {/* Input Box */}
        <div
          style={{
            background: 'var(--color-card, #14121E)',
            border: '1px solid var(--color-border)',
            borderRadius: 22,
            padding: '14px 18px 12px',
            position: 'relative',
            boxShadow: isLightTheme
              ? '0 10px 30px rgba(0, 0, 0, 0.08), 0 0 0 1px var(--color-border)'
              : '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(20px)',
          }}
          className="w-full transition-all focus-within:border-purple-500/50"
        >
          {/* Prompt Textarea */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask JudgeAI Swarm anything... (e.g. Compare LLM architectures, audit code security, parallel web research)"
            rows={2}
            className="w-full bg-transparent resize-none outline-none text-sm md:text-base leading-relaxed placeholder:text-[var(--color-muted)] font-sans text-[var(--color-foreground)]"
          />

          {/* Bottom Toolbar inside Input Box */}
          <div className="flex items-center justify-between pt-3 mt-1 border-t border-[var(--color-border-faint)]">
            {/* Left Controls: Plus & Swarm Pill */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-hover)] transition-colors flex items-center gap-1 text-xs"
                title="Attach files"
              >
                <Paperclip className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/15 border border-purple-500/30 text-purple-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Agent Swarm</span>
              </div>
            </div>

            {/* Right Controls: Send Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!prompt.trim()}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  prompt.trim()
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/25'
                    : 'bg-[var(--color-surface-deep)] text-[var(--color-muted)] cursor-not-allowed border border-[var(--color-border)]'
                }`}
                title="Send Prompt (Enter)"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
