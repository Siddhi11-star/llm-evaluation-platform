import React, { useState, useRef, useEffect } from 'react'
import { SwarmCanvasNode, ChatMessage } from './types'
import {
  IcSend,
  IcRotate,
  IcCopy,
  IcCheck,
  IcThumbsUp,
  IcThumbsDown,
  IcChevronDown,
  IcX,
  IcSparkles,
} from '../icons'
import { Paperclip } from 'lucide-react'

interface SwarmBottomDrawerProps {
  isOpen: boolean
  nodes: SwarmCanvasNode[]
  selectedNodeId: string | null
  chatMessages: ChatMessage[]
  sessionId: string
  isExecuting: boolean
  isLightTheme?: boolean
  onSelectNode: (nodeId: string) => void
  onSendMessage: (text: string) => void
  onResetSession: () => void
  onToggleOpen: () => void
}

// ─── Inline Markdown Formatter matching Chat.tsx ───────────────────────────

function renderInlineFormatting(line: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let remaining = line
  let key = 0

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)$/)
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`(.*)$/)

    let firstMatch: { type: 'bold' | 'code'; before: string; content: string; after: string } | null = null

    if (boldMatch) {
      firstMatch = { type: 'bold', before: boldMatch[1], content: boldMatch[2], after: boldMatch[3] }
    }
    if (codeMatch && (!firstMatch || codeMatch[1].length < firstMatch.before.length)) {
      firstMatch = { type: 'code', before: codeMatch[1], content: codeMatch[2], after: codeMatch[3] }
    }

    if (!firstMatch) {
      parts.push(<span key={key++}>{remaining}</span>)
      break
    }

    if (firstMatch.before) {
      parts.push(<span key={key++}>{firstMatch.before}</span>)
    }

    if (firstMatch.type === 'bold') {
      parts.push(
        <strong key={key++} className="font-bold text-[var(--color-foreground)]">
          {firstMatch.content}
        </strong>
      )
    } else if (firstMatch.type === 'code') {
      parts.push(
        <code
          key={key++}
          className="bg-[var(--color-hover)] px-1.5 py-0.5 rounded text-[11px] font-mono text-purple-400 border border-[var(--color-border)]"
        >
          {firstMatch.content}
        </code>
      )
    }

    remaining = firstMatch.after
  }

  return parts.length > 0 ? parts : [line]
}

function FormattedMessageContent({ text, isStreaming }: { text: string; isStreaming?: boolean }) {
  if (!text) return null

  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let inCodeBlock = false
  let codeBlockContent: string[] = []
  let currentList: { type: 'ul' | 'ol'; items: React.ReactNode[] } | null = null

  const flushList = (keyPrefix: string) => {
    if (currentList) {
      if (currentList.type === 'ul') {
        elements.push(
          <ul key={`list-${keyPrefix}`} className="my-1.5 pl-4 list-disc space-y-1">
            {currentList.items.map((it, idx) => (
              <li key={idx} className="leading-relaxed text-xs">
                {it}
              </li>
            ))}
          </ul>
        )
      } else {
        elements.push(
          <ol key={`list-${keyPrefix}`} className="my-1.5 pl-4 list-decimal space-y-1">
            {currentList.items.map((it, idx) => (
              <li key={idx} className="leading-relaxed text-xs">
                {it}
              </li>
            ))}
          </ol>
        )
      }
      currentList = null
    }
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushList(`${idx}`)
        elements.push(
          <pre
            key={`code-${idx}`}
            className="bg-black/50 border border-[var(--color-border)] rounded-xl p-3 my-2 overflow-x-auto text-[11px] font-mono leading-relaxed text-purple-300 custom-scrollbar"
          >
            <code>{codeBlockContent.join('\n')}</code>
          </pre>
        )
        codeBlockContent = []
        inCodeBlock = false
      } else {
        flushList(`${idx}`)
        inCodeBlock = true
        codeBlockContent = []
      }
      return
    }

    if (inCodeBlock) {
      codeBlockContent.push(line)
      return
    }

    if (trimmed === '---' || trimmed === '***') {
      flushList(`${idx}`)
      elements.push(<hr key={`hr-${idx}`} className="border-t border-[var(--color-border)] my-2" />)
      return
    }

    if (/^#{1,6}\s+/.test(trimmed)) {
      flushList(`${idx}`)
      const headingLevel = trimmed.match(/^#+/)?.[0].length || 3
      const headingText = trimmed.replace(/^#+\s+/, '')
      elements.push(
        <div
          key={`h-${idx}`}
          className={`font-bold text-[var(--color-foreground)] tracking-tight ${
            headingLevel === 1 ? 'text-sm mt-3 mb-1' : headingLevel === 2 ? 'text-xs mt-2 mb-1' : 'text-xs mt-1.5 mb-0.5'
          }`}
        >
          {renderInlineFormatting(headingText)}
        </div>
      )
      return
    }

    const ulMatch = line.match(/^(\s*)([-*])\s+(.+)$/)
    if (ulMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList(`${idx}`)
        currentList = { type: 'ul', items: [] }
      }
      currentList.items.push(renderInlineFormatting(ulMatch[3]))
      return
    }

    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/)
    if (olMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList(`${idx}`)
        currentList = { type: 'ol', items: [] }
      }
      currentList.items.push(renderInlineFormatting(olMatch[3]))
      return
    }

    if (!trimmed) {
      flushList(`${idx}`)
      elements.push(<div key={`empty-${idx}`} className="h-1.5" />)
      return
    }

    flushList(`${idx}`)
    elements.push(
      <p key={`p-${idx}`} className="mb-1 leading-relaxed text-xs text-[var(--color-foreground)]">
        {renderInlineFormatting(line)}
      </p>
    )
  })

  flushList('end')

  if (inCodeBlock && codeBlockContent.length > 0) {
    elements.push(
      <pre
        key="code-open"
        className="bg-black/50 border border-[var(--color-border)] rounded-xl p-3 my-2 overflow-x-auto text-[11px] font-mono leading-relaxed text-purple-300 custom-scrollbar"
      >
        <code>{codeBlockContent.join('\n')}</code>
      </pre>
    )
  }

  return (
    <div className="text-xs leading-relaxed text-[var(--color-foreground)] font-sans">
      {elements}
      {isStreaming && (
        <span className="inline-block w-1.5 h-3.5 bg-purple-500 ml-1 align-middle animate-pulse" />
      )}
    </div>
  )
}

// ─── Swarm Bottom Drawer Component ─────────────────────────────────────────

export const SwarmBottomDrawer: React.FC<SwarmBottomDrawerProps> = ({
  isOpen,
  nodes,
  selectedNodeId,
  chatMessages,
  sessionId,
  isExecuting,
  isLightTheme,
  onSelectNode,
  onSendMessage,
  onResetSession,
  onToggleOpen,
}) => {
  const [inputText, setInputText] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [likedMap, setLikedMap] = useState<Record<string, boolean | null>>({})
  const [isInputExpanded, setIsInputExpanded] = useState(true)
  const [isOutputExpanded, setIsOutputExpanded] = useState(true)
  const [effortLevel, setEffortLevel] = useState<'Low' | 'Medium' | 'High'>('Medium')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isExecuting])

  if (!isOpen) return null

  const selectedNode =
    nodes.find((n) => n.id === selectedNodeId) ||
    nodes.find((n) => n.id === 'node-qdrant') ||
    nodes[0]

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputText.trim()) return
    onSendMessage(inputText.trim())
    setInputText('')
  }

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleFeedback = (id: string, isPositive: boolean) => {
    setLikedMap((prev) => ({
      ...prev,
      [id]: prev[id] === isPositive ? null : isPositive,
    }))
  }

  const handleCycleEffort = () => {
    setEffortLevel((prev) => (prev === 'Low' ? 'Medium' : prev === 'Medium' ? 'High' : 'Low'))
  }

  return (
    <div
      className={`absolute bottom-0 inset-x-0 z-30 border-t backdrop-blur-2xl flex flex-col h-[350px] transition-all duration-300 shadow-2xl font-sans ${
        isLightTheme
          ? 'bg-white/95 border-zinc-200 shadow-zinc-300/40 text-zinc-900'
          : 'bg-[#0E0E14]/95 border-zinc-800 shadow-black/90 text-zinc-100'
      }`}
    >
      {/* Top Drawer Drag Handle */}
      <div className="h-1.5 w-full bg-[var(--color-border-faint)] hover:bg-[var(--color-border)] cursor-row-resize flex items-center justify-center transition-colors">
        <div className="w-12 h-0.5 rounded-full bg-[var(--color-muted-strong)]" />
      </div>

      {/* Main Split Body: Left Chat UI (50%) | Right Live Execution Logs (50%) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-x divide-[var(--color-border)] overflow-hidden">
        {/* ================= LEFT HALF: RICH CHAT UI ================= */}
        <div className="flex flex-col h-full overflow-hidden">
          {/* Chat Header matching Chat.tsx */}
          <div
            className={`px-4 py-2 border-b flex items-center justify-between font-sans ${
              isLightTheme ? 'border-zinc-200 bg-zinc-50/70' : 'border-zinc-800 bg-zinc-900/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-[var(--color-foreground)] tracking-tight">Swarm Chat</span>
              <span className="text-[10px] text-[var(--color-muted)] font-mono px-2 py-0.5 rounded-full bg-[var(--color-hover)] border border-[var(--color-border)]">
                Session {sessionId}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onResetSession}
                title="Reset Chat Session"
                className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-hover)] transition-colors"
              >
                <IcRotate className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Chat Message Stream matching Chat.tsx layout */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs leading-relaxed font-sans">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="space-y-1.5 animate-in fade-in duration-200 font-sans">
                {msg.sender === 'user' ? (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md font-medium text-xs">
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {/* Model & Agent Identity Pill */}
                    <div className="flex items-center gap-2 text-[11px] text-[var(--color-muted)] font-semibold font-sans">
                      <div className="w-5 h-5 rounded-md bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-xs">
                        {msg.agentAvatar || '🤖'}
                      </div>
                      <span className="text-[var(--color-foreground)] font-bold">{msg.agentName || 'AI Agent'}</span>
                      <span className="text-[10px] text-[var(--color-muted)] font-mono">• {msg.time}</span>
                    </div>

                    {/* Formatted Markdown Bubble */}
                    <div
                      className={`rounded-2xl p-4 border backdrop-blur-md shadow-sm font-sans ${
                        isLightTheme
                          ? 'bg-zinc-50 border-zinc-200/80 text-zinc-800'
                          : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-200'
                      }`}
                    >
                      <FormattedMessageContent text={msg.text} isStreaming={msg.stage === 'working'} />

                      {/* Action buttons (Copy / Thumbs) matching Chat.tsx */}
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[var(--color-border-faint)] text-[var(--color-muted)]">
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.text)}
                          className="flex items-center gap-1 text-[10px] hover:text-[var(--color-foreground)] transition-colors p-1 rounded hover:bg-[var(--color-hover)]"
                          title="Copy message"
                        >
                          {copiedId === msg.id ? (
                            <IcCheck className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <IcCopy className="w-3 h-3" />
                          )}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button
                          onClick={() => toggleFeedback(msg.id, true)}
                          className={`p-1 rounded hover:bg-[var(--color-hover)] transition-colors ${
                            likedMap[msg.id] === true ? 'text-emerald-400' : 'hover:text-[var(--color-foreground)]'
                          }`}
                          title="Good response"
                        >
                          <IcThumbsUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => toggleFeedback(msg.id, false)}
                          className={`p-1 rounded hover:bg-[var(--color-hover)] transition-colors ${
                            likedMap[msg.id] === false ? 'text-rose-400' : 'hover:text-[var(--color-foreground)]'
                          }`}
                          title="Bad response"
                        >
                          <IcThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isExecuting && (
              <div className="flex items-center gap-2 text-purple-400 text-xs py-1 animate-pulse font-sans">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                <span className="font-semibold">Decomposing axioms and querying vector store...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Container directly copying Chat.tsx card styling */}
          <div className="p-3 pt-0">
            <div
              className={`rounded-2xl p-2.5 border backdrop-blur-xl transition-all ${
                isLightTheme
                  ? 'bg-white border-zinc-300 shadow-sm'
                  : 'bg-zinc-900/80 border-zinc-700/70 shadow-lg'
              }`}
            >
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Ask anything or dispatch task to swarm..."
                rows={1}
                className="w-full bg-transparent border-none text-xs text-[var(--color-foreground)] placeholder-[var(--color-muted)] outline-none resize-none font-sans px-1"
              />

              {/* Bottom Toolbar inside input capsule */}
              <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-faint)] mt-1">
                {/* Left: Model Pill & Effort Level toggle */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[var(--color-hover)] text-[11px] font-semibold text-[var(--color-foreground)] border border-[var(--color-border)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>GPT-4o</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCycleEffort}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--color-hover)] hover:bg-[var(--color-hover-strong)] text-[10px] font-mono text-[var(--color-muted)] hover:text-[var(--color-foreground)] border border-[var(--color-border)] transition-colors"
                    title="Toggle Reasoning Effort: Low -> Medium -> High"
                  >
                    <span>Effort: {effortLevel}</span>
                  </button>
                </div>

                {/* Right: Attachment + Circular Send Button */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {}}
                    className="p-1.5 text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-hover)] rounded-lg transition-colors"
                    title="Attach file or context"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={!inputText.trim() || isExecuting}
                    className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-30 text-white flex items-center justify-center shadow-md shadow-purple-500/25 transition-all cursor-pointer"
                  >
                    <IcSend className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT HALF: NODE EXECUTION LOGS ================= */}
        <div className="flex flex-col h-full overflow-hidden font-sans">
          {/* Header */}
          <div
            className={`px-4 py-2 border-b flex items-center justify-between font-sans ${
              isLightTheme ? 'border-zinc-200 bg-zinc-50/70' : 'border-zinc-800 bg-zinc-900/40'
            }`}
          >
            <span className="text-xs font-bold text-[var(--color-foreground)] tracking-tight">
              Latest Logs from <span className="text-emerald-400 font-mono">{selectedNode?.name}</span> node
            </span>
            <div className="flex items-center gap-2">
              {selectedNode?.executionData?.output && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedNode.executionData?.output, null, 2))
                    setCopiedId('logs-out')
                    setTimeout(() => setCopiedId(null), 2000)
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[var(--color-hover)] hover:bg-[var(--color-hover-strong)] text-[var(--color-foreground)] text-[10px] font-semibold flex items-center gap-1 transition-colors border border-[var(--color-border)] font-sans"
                >
                  {copiedId === 'logs-out' ? (
                    <IcCheck className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <IcCopy className="w-3 h-3" />
                  )}
                  <span>{copiedId === 'logs-out' ? 'Copied' : 'Copy JSON'}</span>
                </button>
              )}
              <button
                onClick={onToggleOpen}
                className="text-[var(--color-muted)] hover:text-[var(--color-foreground)] p-1 text-xs"
                title="Minimize Drawer"
              >
                <IcX className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Logs Split: Left Node Hierarchy | Right Payload & Logs */}
          <div className="flex-1 grid grid-cols-12 overflow-hidden">
            {/* Hierarchy Tree (4 cols) */}
            <div
              className={`col-span-4 border-r p-2 overflow-y-auto space-y-1 custom-scrollbar ${
                isLightTheme ? 'border-zinc-200 bg-zinc-50/50' : 'border-zinc-800 bg-zinc-950/40'
              }`}
            >
              {nodes.map((n) => {
                const isCur = n.id === selectedNode?.id
                return (
                  <button
                    key={n.id}
                    onClick={() => onSelectNode(n.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center gap-2 transition-all font-sans ${
                      isCur
                        ? isLightTheme
                          ? 'bg-purple-50 text-purple-700 font-bold border border-purple-200 shadow-sm'
                          : 'bg-zinc-800/90 text-emerald-400 font-bold border border-zinc-700 shadow-sm'
                        : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-hover)]'
                    }`}
                  >
                    <span className="text-xs">{n.icon || '⚙️'}</span>
                    <span className="text-[11px] truncate flex-1 font-medium">{n.name}</span>
                    {n.stage === 'done' && !n.isDeactivated && (
                      <span className="text-[9px] text-emerald-400 font-bold font-mono">✓</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Execution Inspector Details (8 cols) */}
            <div className="col-span-8 p-3.5 overflow-y-auto space-y-3 custom-scrollbar text-xs font-mono">
              {/* Timing Banner */}
              <div className="flex items-center gap-2 text-[var(--color-muted)] text-[11px] font-mono">
                <span className="font-bold text-[var(--color-foreground)]">{selectedNode?.name}</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">
                  {selectedNode?.executionData?.latencyMs || 1089}ms
                </span>
                <span>|</span>
                <span>Started at {selectedNode?.executionData?.startTime || '8:49:40 PM'}</span>
              </div>

              {/* Collapsible Input Payload */}
              <div
                className={`border rounded-xl overflow-hidden ${
                  isLightTheme ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-800 bg-zinc-950/60'
                }`}
              >
                <button
                  onClick={() => setIsInputExpanded(!isInputExpanded)}
                  className={`w-full px-3 py-1.5 flex items-center justify-between text-[11px] font-semibold hover:bg-[var(--color-hover)] transition-colors font-sans ${
                    isLightTheme ? 'bg-zinc-100/70 text-zinc-700' : 'bg-zinc-900/50 text-zinc-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-sans">
                    <IcChevronDown
                      className={`w-3 h-3 text-zinc-400 transition-transform ${
                        isInputExpanded ? '' : '-rotate-90'
                      }`}
                    />
                    Input Payload
                  </span>
                  <span className="text-[10px] text-[var(--color-muted)] font-mono">JSON</span>
                </button>
                {isInputExpanded && (
                  <pre
                    className={`p-3 text-[11px] font-mono overflow-x-auto custom-scrollbar leading-relaxed ${
                      isLightTheme ? 'text-purple-700' : 'text-emerald-300'
                    }`}
                  >
                    {JSON.stringify(
                      selectedNode?.executionData?.input || {
                        query: 'n8n',
                        k: 25,
                      },
                      null,
                      2
                    )}
                  </pre>
                )}
              </div>

              {/* Collapsible Output Payload */}
              <div
                className={`border rounded-xl overflow-hidden ${
                  isLightTheme ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-800 bg-zinc-950/60'
                }`}
              >
                <button
                  onClick={() => setIsOutputExpanded(!isOutputExpanded)}
                  className={`w-full px-3 py-1.5 flex items-center justify-between text-[11px] font-semibold hover:bg-[var(--color-hover)] transition-colors font-sans ${
                    isLightTheme ? 'bg-zinc-100/70 text-zinc-700' : 'bg-zinc-900/50 text-zinc-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-sans">
                    <IcChevronDown
                      className={`w-3 h-3 text-zinc-400 transition-transform ${
                        isOutputExpanded ? '' : '-rotate-90'
                      }`}
                    />
                    Output Stream
                  </span>
                  <span className="text-[10px] text-[var(--color-muted)] font-mono">JSON</span>
                </button>
                {isOutputExpanded && (
                  <pre
                    className={`p-3 text-[11px] font-mono overflow-x-auto custom-scrollbar leading-relaxed ${
                      isLightTheme ? 'text-sky-700' : 'text-sky-300'
                    }`}
                  >
                    {JSON.stringify(
                      selectedNode?.executionData?.output || {
                        status: 'success',
                        confidence: 0.998,
                        retrievedItems: 25,
                      },
                      null,
                      2
                    )}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
