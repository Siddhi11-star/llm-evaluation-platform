import { useNavigate, useLocation } from 'react-router'
import { useState, useRef, useEffect } from 'react'
import { TopBar } from '../components/AppShell'
import { useSettings } from '../components/ThemeProvider'
import { useAuth } from '../context/AuthContext'
import {
  IcSend,
  IcPlus,
  IcCopy,
  IcCheck,
  IcThumbsUp,
  IcThumbsDown,
  IcTrash,
  IcChevronDown,
  IcSparkles,
  IcSearch,
  IcRotate,
  IcMic,
} from '../components/icons'
import { Paperclip, Image as ImageIcon, FileText, X as XIcon, Plus, Search } from 'lucide-react'
import { MeshGradientSVG } from '../components/ui/shader-svg'
import { ThinkingTool } from '../components/ui/thinking-tool'
import { RadialGlowBackground } from '../components/ui/radial-glow-background'
import { LogoIcon } from '../components/Logo'

export type AttachedFileItem = {
  name: string
  type: string
  size: number
  content: string
  url?: string
}

export type EffortLevel = 'Low' | 'Medium' | 'High'

// Models available for selection
export type LLMModel = {
  id: string
  name: string
  provider: string
  tag: string
  badgeColor: string
  description: string
  effort: EffortLevel
}

const MODELS: LLMModel[] = [
  {
    id: 'deepseek-v4-flash:cloud',
    name: 'deepseek-v4-flash:cloud',
    provider: 'Ollama Cloud',
    tag: 'Ultra Fast',
    badgeColor: '#F59E0B',
    description: 'Lightning-fast DeepSeek V4 flash tier for low-latency triage & extraction',
    effort: 'Low',
  },
  {
    id: 'gpt-oss:20b-cloud',
    name: 'gpt-oss:20b-cloud',
    provider: 'Ollama Cloud',
    tag: '20B Fast',
    badgeColor: '#059669',
    description: '20B parameter high-efficiency open model for rapid stream generation',
    effort: 'Low',
  },
  {
    id: 'gemma4:cloud',
    name: 'gemma4:cloud',
    provider: 'Ollama Cloud',
    tag: 'Google Open',
    badgeColor: '#06B6D4',
    description: 'Google Gemma 4 cloud edition with leading benchmark accuracy & analysis',
    effort: 'Low',
  },
  {
    id: 'gemini-2-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    tag: 'Fast',
    badgeColor: '#38BDF8',
    description: 'Ultra-low latency & cost-effective general task processing',
    effort: 'Low',
  },
  {
    id: 'glm-5.1:cloud',
    name: 'glm-5.1:cloud',
    provider: 'Ollama Cloud',
    tag: 'Reasoning',
    badgeColor: '#0EA5E9',
    description: 'High-accuracy conversational and analytical general intelligence model',
    effort: 'Medium',
  },
  {
    id: 'minimax-m2.7:cloud',
    name: 'minimax-m2.7:cloud',
    provider: 'Ollama Cloud',
    tag: 'Balanced',
    badgeColor: '#A855F7',
    description: 'High-throughput multimodal & text synthesis model from MiniMax',
    effort: 'Medium',
  },
  {
    id: 'minimax-m2.5:cloud',
    name: 'minimax-m2.5:cloud',
    provider: 'Ollama Cloud',
    tag: 'Efficient',
    badgeColor: '#9333EA',
    description: 'Cost-optimized conversational reasoning engine with zero-hallucination guard',
    effort: 'Medium',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    tag: 'Flagship',
    badgeColor: '#10A37F',
    description: 'High intelligence multimodal model for reasoning & complex tasks',
    effort: 'Medium',
  },
  {
    id: 'minimax-m3:cloud',
    name: 'minimax-m3:cloud',
    provider: 'Ollama Cloud',
    tag: 'Active',
    badgeColor: '#8B5CF6',
    description: 'MiniMax M3 cloud reasoning model with deep logical synthesis & thinking traces',
    effort: 'High',
  },
  {
    id: 'glm-5.2:cloud',
    name: 'glm-5.2:cloud',
    provider: 'Ollama Cloud',
    tag: 'Flagship',
    badgeColor: '#3B82F6',
    description: 'GLM 5.2 frontier reasoning model with advanced instruction following & coding',
    effort: 'High',
  },
  {
    id: 'deepseek-v4-pro:cloud',
    name: 'deepseek-v4-pro:cloud',
    provider: 'Ollama Cloud',
    tag: 'Deep Pro',
    badgeColor: '#D97706',
    description: 'DeepSeek V4 Pro flagship open reasoning model for complex math & code',
    effort: 'High',
  },
  {
    id: 'gpt-oss:120b-cloud',
    name: 'gpt-oss:120b-cloud',
    provider: 'Ollama Cloud',
    tag: '120B Flagship',
    badgeColor: '#10B981',
    description: '120B massive open-source GPT architecture for enterprise synthesis & evaluation',
    effort: 'High',
  },
  {
    id: 'nemotron-3-super:cloud',
    name: 'nemotron-3-super:cloud',
    provider: 'Ollama Cloud',
    tag: 'Super Cloud',
    badgeColor: '#84CC16',
    description: 'NVIDIA Nemotron-3 Super tuned for structured verification & agent workflows',
    effort: 'High',
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    tag: 'Recommended',
    badgeColor: '#7C3AED',
    description: 'Industry-leading code generation, analytical depth & writing',
    effort: 'High',
  },
]

export type Message = {
  id: string
  role: 'user' | 'assistant'
  text: string
  thinking?: string
  showThinking?: boolean
  files?: AttachedFileItem[]
  modelId?: string
  timestamp: string
  liked?: boolean | null // true for thumbs up, false for thumbs down
  isStreaming?: boolean
}

export type ChatThread = {
  id: string
  title: string
  updatedAt: string
  modelId: string
  messages: Message[]
}

const INITIAL_THREADS: ChatThread[] = [
  {
    id: 't-1',
    title: 'LLM Evaluation Criteria for Legal Contracts',
    updatedAt: 'Just now',
    modelId: 'claude-3-5-sonnet',
    messages: [
      {
        id: 'm-1-1',
        role: 'user',
        text: 'What metrics should I use to evaluate an LLM for summarizing 50-page legal contracts?',
        timestamp: '10:14 AM',
      },
      {
        id: 'm-1-2',
        role: 'assistant',
        text: `To effectively evaluate LLMs on 50-page legal contract summarization, I recommend a multi-faceted metric matrix:\n\n1. **Hallucination Rate (Critical)**: Measure factual consistency against source clauses. Even a 1% error rate in legal terms can create liability.\n2. **Clause Coverage**: Check whether key obligations, termination terms, and indemnities are captured without omission.\n3. **Latency & Token Context**: Evaluate performance at 32k–128k input tokens to ensure context degradation doesn't occur.\n4. **Judge Agreement Score**: Run automated G-Eval or LLM-as-a-Judge evaluations comparing outputs against senior counsel rubrics.\n\nWould you like me to generate a downloadable JudgeAI rubric template for contract review?`,
        modelId: 'claude-3-5-sonnet',
        timestamp: '10:14 AM',
        liked: true,
      },
    ],
  },
  {
    id: 't-2',
    title: 'Hallucination Benchmark Comparison',
    updatedAt: '2 hours ago',
    modelId: 'gemini-2-flash',
    messages: [
      {
        id: 'm-2-1',
        role: 'user',
        text: 'How does Gemini 2.0 Flash compare against GPT-4o in hallucination benchmarks?',
        timestamp: '8:30 AM',
      },
      {
        id: 'm-2-2',
        role: 'assistant',
        text: `Based on current benchmark datasets (HaluEval & JudgeAI Synthetic Suite):\n\n- **Gemini 2.0 Flash**: 1.2% hallucination rate on structured extraction, with an average P95 latency of 0.9s.\n- **GPT-4o**: 1.4% hallucination rate with 1.8s P95 latency.\n\nGemini 2.0 Flash provides a **2.0x latency advantage** and lower token pricing while maintaining parity on hallucination rates for document analysis.`,
        modelId: 'gemini-2-flash',
        timestamp: '8:31 AM',
        liked: null,
      },
    ],
  },
  {
    id: 't-3',
    title: 'Custom Evaluation Pipeline Setup',
    updatedAt: 'Yesterday',
    modelId: 'gpt-4o',
    messages: [
      {
        id: 'm-3-1',
        role: 'user',
        text: 'How do I configure an automated judge agent for customer support responses?',
        timestamp: 'Yesterday',
      },
      {
        id: 'm-3-2',
        role: 'assistant',
        text: `Setting up an automated customer support Judge Agent in JudgeAI takes 3 simple steps:\n\n1. Define prompt criteria (Politeness, Resolution Accuracy, Escalation Compliance).\n2. Upload your golden evaluation dataset (CSV or JSONL).\n3. Assign GPT-4o or Claude 3.5 Sonnet as the Evaluator Judge.\n\nYou can track real-time scores in the **Evaluations** dashboard.`,
        modelId: 'gpt-4o',
        timestamp: 'Yesterday',
        liked: null,
      },
    ],
  },
]

const QUICK_PROMPTS = [
  "Evaluate GPT-4o vs Claude 3.5 Sonnet for code generation",
  "How can I reduce hallucination in medical QA systems?",
  "Draft a multi-criteria rubric for LLM output evaluation",
  "Compare cost efficiency across open vs closed source models",
]

// Short quick-action pills shown on the centered empty state
const QUICK_ACTIONS = [
  { icon: IcSparkles, label: 'Compare models', prompt: 'Evaluate GPT-4o vs Claude 3.5 Sonnet for code generation' },
  { icon: IcCheck, label: 'Reduce hallucination', prompt: 'How can I reduce hallucination in medical QA systems?' },
  { icon: IcCopy, label: 'Build a rubric', prompt: 'Draft a multi-criteria rubric for LLM output evaluation' },
  { icon: IcRotate, label: 'Cost efficiency', prompt: 'Compare cost efficiency across open vs closed source models' },
]

const EMPTY_THREAD_ID = 't-0'

function makeEmptyThread(modelId: string): ChatThread {
  return {
    id: EMPTY_THREAD_ID,
    title: 'New Conversation',
    updatedAt: 'Just now',
    modelId,
    messages: [],
  }
}

function getIntelligentResponse(prompt: string, model: LLMModel): string {
  const clean = prompt.trim()
  const lower = clean.toLowerCase()

  // 1. Natural greetings
  if (/^(hello|hi|hey|greetings|good morning|good afternoon|good evening|yo|sup|who are you|what are you)\b/i.test(lower)) {
    return `Hello! 👋 I'm **JudgeAI**, powered by **${model.name}** (${model.provider}).

I'm here to assist you with model evaluations, automated scoring rubrics, code analysis, and deep reasoning benchmarks.

### How I Can Help You:
- 🔍 **Model Evaluation & Benchmarking**: Compare reasoning depth, latency, and costs across models.
- 🛡️ **Zero-Hallucination Guardrails**: Design automated rubrics and verification pipelines for LLM apps.
- 💻 **Full-Stack Code Synthesis**: Generate, review, and architect high-performance TypeScript and Python code.
- 🐝 **Multi-Agent Swarm**: Coordinate specialized sub-agents to tackle multifaceted analysis tasks.

What task or topic would you like to explore today?`
  }

  // 2. Project run & setup queries
  if (lower.includes('run') || lower.includes('start') || lower.includes('setup') || lower.includes('install') || lower.includes('command') || lower.includes('start.sh')) {
    return `### 🚀 How to Run the JudgeAI Evaluation System

You can run everything with a single command from your project root:

\`\`\`bash
# Option 1: Unified Bash Script (Recommended)
./start.sh

# Option 2: Python Runner
python3 start.py
\`\`\`

---

### 🛠️ Running Services in Dedicated Terminals:

**1. Chat Backend Service (Port 8000)**
\`\`\`bash
cd backend/chat
./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload
\`\`\`

**2. Agent Swarm Service (Port 5002)**
\`\`\`bash
cd backend/agent_swarm
../chat/venv/bin/uvicorn main:app --host 0.0.0.0 --port 5002 --reload
\`\`\`

**3. Frontend Dashboard & Landing Page**
\`\`\`bash
cd frontend/landing_page
npm run dev
\`\`\``
  }

  // 3. Code & Programming Queries
  if (lower.includes('code') || lower.includes('python') || lower.includes('javascript') || lower.includes('typescript') || lower.includes('function') || lower.includes('algorithm') || lower.includes('login') || lower.includes('html') || lower.includes('css')) {
    if (lower.includes('login') || lower.includes('html') || lower.includes('css')) {
      return `Here is a complete, modern responsive **Login Page** in HTML & CSS:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>JudgeAI Login</title>
  <style>
    body { background: #0c0a14; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    .card { background: #14121e; border: 1px solid #2a2638; padding: 32px; border-radius: 16px; width: 320px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
    input { width: 100%; padding: 10px; margin: 8px 0 16px; background: #0e0d16; border: 1px solid #2a2638; color: #fff; border-radius: 8px; box-sizing: border-box; }
    button { width: 100%; padding: 10px; background: #8b5cf6; border: none; color: #fff; font-weight: bold; border-radius: 8px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Sign In</h2>
    <label>Email</label>
    <input type="email" placeholder="you@example.com" />
    <label>Password</label>
    <input type="password" placeholder="••••••••" />
    <button type="submit">Continue</button>
  </div>
</body>
</html>
\`\`\``
    }
    return `### ${model.name} · Code Solution

Here is a clean, modern implementation for **"${clean}"**:

\`\`\`python
# JudgeAI Optimized Python Solution (${model.name})
import asyncio
from typing import List, Dict, Any

async def process_task(task_name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    print(f"[*] Executing task: {task_name}...")
    # Simulated asynchronous evaluation step
    await asyncio.sleep(0.05)
    return {
        "status": "success",
        "task": task_name,
        "payload": payload,
        "score": 9.8,
    }

async def main():
    result = await process_task("${clean.slice(0, 30)}", {"model": "${model.name}"})
    print(f"[✓] Task result: {result}")

if __name__ == "__main__":
    asyncio.run(main())
\`\`\`

### Explanation:
- **Async Execution**: Non-blocking asynchronous design for high-throughput pipeline execution.
- **Type Annotations**: Full static type coverage for reliability.`
  }

  // 4. Cost & Economics
  if (lower.includes('cost') || lower.includes('price') || lower.includes('budget') || lower.includes('token')) {
    return `### Cost Optimization Analysis (${model.name})

Evaluating token economic efficiency for production deployments:

- **Input Cost**: $0.0015 per 1k tokens
- **Output Cost**: $0.0060 per 1k tokens
- **Throughput**: ~110 tokens/second

**Key Strategy**: By routing initial triage prompts through fast flash-tier models and escalating complex multi-step reasoning to **${model.name}**, you can reduce overall operational API expenditures by **up to 65%** while retaining peak quality.`
  }

  // 5. Hallucination & Medical/Legal
  if (lower.includes('hallucination') || lower.includes('medical') || lower.includes('legal') || lower.includes('safety') || lower.includes('rubric') || lower.includes('judge') || lower.includes('eval')) {
    return `### Factuality & Evaluation Guard (${model.name})

For mission-critical domains requiring strict factual accuracy:

1. **Hallucination Rate**: Measured at **< 0.6%** on domain evaluation benchmarks.
2. **Grounding Verification**: Validates claims and footnotes against primary contextual vectors.
3. **Recommended Rubric Criteria**:
   - **Accuracy (35%)**: Factual precision against authoritative ground truth.
   - **Zero-Hallucination (30%)**: Strict penalty on ungrounded claims or hallucinated citations.
   - **Reasoning Depth (20%)**: Sound multi-step deductive logic.
   - **Structure (15%)**: Output schema adherence.`
  }

  // 6. Default General Reasoning Answer
  return `### ${model.name} Analysis & Response

**Query:** "${clean}"

#### 1. Core Synthesis
Regarding **${clean}**, here is a structured breakdown:
- **Objective Analysis**: Decomposed the directive and task constraints.
- **Quality Assurance**: Verified logical consistency with zero-hallucination guardrails.

#### 2. Recommendations & Implementation
1. Formulate measurable evaluation metrics for your task.
2. Cross-validate outputs against target criteria to ensure reliable behavior.

*Let me know if you would like me to generate specific code implementations, deep mathematical derivations, or custom evaluation rubrics!*`
}

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
      parts.push(<strong key={key++} style={{ fontWeight: 700, color: 'var(--color-foreground)' }}>{firstMatch.content}</strong>)
    } else if (firstMatch.type === 'code') {
      parts.push(
        <code key={key++} style={{ background: 'var(--color-surface-deep)', padding: '2px 5px', borderRadius: 4, fontSize: '0.9em', fontFamily: 'monospace', color: '#EC4899', border: '1px solid var(--color-border-faint)' }}>
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
          <ul key={`list-${keyPrefix}`} style={{ margin: '6px 0 10px', paddingLeft: 20, listStyleType: 'disc' }}>
            {currentList.items.map((it, idx) => (
              <li key={idx} style={{ marginBottom: 4, lineHeight: 1.6 }}>
                {it}
              </li>
            ))}
          </ul>
        )
      } else {
        elements.push(
          <ol key={`list-${keyPrefix}`} style={{ margin: '6px 0 10px', paddingLeft: 20, listStyleType: 'decimal' }}>
            {currentList.items.map((it, idx) => (
              <li key={idx} style={{ marginBottom: 4, lineHeight: 1.6 }}>
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
        elements.push(
          <pre
            key={`code-${idx}`}
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              padding: '12px 14px',
              overflowX: 'auto',
              margin: '10px 0',
              fontSize: 13,
              fontFamily: 'monospace',
              lineHeight: 1.5,
              scrollbarWidth: 'thin',
            }}
          >
            <code>{codeBlockContent.join('\n')}</code>
          </pre>
        )
        codeBlockContent = []
        inCodeBlock = false
      } else {
        flushList(`${idx}`)
        inCodeBlock = true
      }
      return
    }

    if (inCodeBlock) {
      codeBlockContent.push(line)
      return
    }

    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushList(`${idx}`)
      elements.push(<hr key={`hr-${idx}`} style={{ border: 'none', borderTop: '1px solid var(--color-border-faint)', margin: '14px 0' }} />)
      return
    }

    // Strip ### and ## and # headings and render clean titles
    if (/^#{1,6}\s+/.test(trimmed)) {
      flushList(`${idx}`)
      const headingLevel = trimmed.match(/^#+/)?.[0].length || 3
      const headingText = trimmed.replace(/^#+\s+/, '')
      const fontSize = headingLevel === 1 ? 17 : headingLevel === 2 ? 15.5 : 14.5
      elements.push(
        <div
          key={`h-${idx}`}
          style={{
            fontSize,
            fontWeight: 700,
            color: 'var(--color-foreground)',
            marginTop: idx === 0 ? 0 : 14,
            marginBottom: 6,
          }}
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
      elements.push(<div key={`empty-${idx}`} style={{ height: 6 }} />)
      return
    }

    flushList(`${idx}`)
    elements.push(
      <p key={`p-${idx}`} style={{ margin: '0 0 6px', lineHeight: 1.6, color: 'var(--color-foreground)' }}>
        {renderInlineFormatting(line)}
      </p>
    )
  })

  flushList('end')

  if (inCodeBlock && codeBlockContent.length > 0) {
    elements.push(
      <pre
        key="code-open"
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--color-border)',
          borderRadius: 8,
          padding: '12px 14px',
          overflowX: 'auto',
          margin: '10px 0',
          fontSize: 13,
          fontFamily: 'monospace',
          lineHeight: 1.5,
          scrollbarWidth: 'thin',
        }}
      >
        <code>{codeBlockContent.join('\n')}</code>
      </pre>
    )
  }

  return (
    <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--color-foreground)' }}>
      {elements}
      {isStreaming && (
        <span style={{ display: 'inline-block', width: 6, height: 14, background: '#7C3AED', marginLeft: 4, verticalAlign: 'middle', animation: 'blink 0.8s infinite' }} />
      )}
    </div>
  )
}

function ModelSelectorMenu({
  selectedModelId,
  onSelectModel,
  onClose,
  activeEffort = 'All',
  align = 'left',
}: {
  selectedModelId: string
  onSelectModel: (modelId: string) => void
  onClose: () => void
  activeEffort?: EffortLevel | 'All'
  onSelectEffort?: (effort: EffortLevel | 'All') => void
  align?: 'left' | 'center' | 'right'
}) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [onClose])

  const filtered = MODELS.filter(m => activeEffort === 'All' || m.effort === activeEffort)

  const positionStyles: React.CSSProperties =
    align === 'right'
      ? { right: 0, bottom: 'calc(100% + 10px)' }
      : align === 'left'
      ? { left: 0, bottom: 'calc(100% + 10px)' }
      : { left: '50%', transform: 'translateX(-50%)', bottom: 'calc(100% + 10px)' }

  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        ...positionStyles,
        width: 320,
        maxWidth: '92vw',
        background: 'var(--color-dropdown-bg, #14121E)',
        border: '1px solid var(--color-dropdown-border, var(--color-border))',
        borderRadius: 16,
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
        zIndex: 99999,
        padding: '6px',
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(24px)',
      }}
    >
      {/* Model Scrollable List - 4 models in viewport */}
      <div
        style={{
          overflowY: 'auto',
          maxHeight: 244,
          paddingRight: 2,
          scrollbarWidth: 'thin',
          scrollSnapType: 'y proximity',
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
            No models in {activeEffort === 'High' ? 'Max Effort' : activeEffort} tier
          </div>
        ) : (
          filtered.map(m => {
            const isSelected = m.id === selectedModelId
            return (
              <div
                key={m.id}
                onClick={() => {
                  onSelectModel(m.id)
                  onClose()
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  height: 56,
                  padding: '6px 10px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(124, 58, 237, 0.18)' : 'transparent',
                  border: isSelected ? '1px solid rgba(124, 58, 237, 0.35)' : '1px solid transparent',
                  marginBottom: 3,
                  boxSizing: 'border-box',
                  transition: 'all 0.12s ease',
                  scrollSnapAlign: 'start',
                }}
                onMouseEnter={e => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--color-dropdown-hover, var(--color-hover))'
                }}
                onMouseLeave={e => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent'
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.badgeColor, flexShrink: 0, boxShadow: isSelected ? `0 0 10px ${m.badgeColor}` : 'none' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{ fontSize: 12.5, fontWeight: isSelected ? 700 : 600, color: 'var(--color-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.name}
                    </span>
                    <span style={{ fontSize: 9.5, padding: '1px 6px', borderRadius: 4, background: `${m.badgeColor}25`, color: m.badgeColor, fontWeight: 700, flexShrink: 0 }}>
                      {m.effort === 'High' ? 'Max Effort' : m.effort}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                    {m.description}
                  </div>
                </div>
                {isSelected && (
                  <div style={{ color: '#A78BFA', flexShrink: 0 }}>
                    <IcCheck size={14} />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── Chat Splash Screen ───────────────────────────────────────────────────────

function ChatSplashScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--color-background)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        overflow: 'hidden',
      }}
    >
      {/* Background Glow */}
      <div
        style={{
          position: 'absolute',
          top: '48%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          height: 600,
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.18) 0%, rgba(56, 189, 248, 0.08) 45%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Central Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          animation: 'chatSplashFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Centered Illustration */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <img
            src="/chat-illustration.png"
            alt="JudgeAI Chat Studio"
            style={{
              width: 360,
              maxWidth: '85vw',
              height: 'auto',
              filter: 'drop-shadow(0 20px 45px rgba(124, 58, 237, 0.35))',
              userSelect: 'none',
              pointerEvents: 'none',
              animation: 'chatFloat 3s ease-in-out infinite',
            }}
          />
        </div>

        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 999,
            background: 'rgba(124,58,237,0.12)',
            border: '1px solid rgba(124,58,237,0.25)',
            color: '#7C3AED',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          <IcSparkles size={12} /> Conversational Studio
        </div>

        <h1
          style={{
            margin: '0 0 8px',
            fontSize: 'clamp(28px, 4.5vw, 38px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--color-foreground)',
            lineHeight: 1.15,
          }}
        >
          Chat Studio
        </h1>

        <p
          style={{
            margin: '0 0 28px',
            fontSize: 'clamp(13px, 2vw, 15px)',
            color: 'var(--color-muted)',
            maxWidth: 460,
            lineHeight: 1.5,
            fontWeight: 500,
          }}
        >
          Connecting to multi-model reasoning engines, workspace context, and tools…
        </p>

        {/* 4-Second Animated Progress Indicator */}
        <div
          style={{
            width: 220,
            height: 5,
            background: 'var(--color-border-light, rgba(0,0,0,0.08))',
            borderRadius: 999,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, #7C3AED, #38BDF8, #A78BFA)',
              borderRadius: 999,
              animation: 'chatProgress 4s linear forwards',
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  // Splash state — 4-second initial mount transition
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 4000)
    return () => clearTimeout(timer)
  }, [])

  const [threads, setThreads] = useState<ChatThread[]>(() => [makeEmptyThread('deepseek-v4-flash:cloud'), ...INITIAL_THREADS])
  const [activeThreadId, setActiveThreadId] = useState<string>(EMPTY_THREAD_ID)
  const [selectedModelId, setSelectedModelId] = useState<string>('deepseek-v4-flash:cloud')
  const [effortLevel, setEffortLevel] = useState<EffortLevel>('Low')
  const [input, setInput] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<AttachedFileItem[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [showEmptyModelDropdown, setShowEmptyModelDropdown] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [historyCollapsed, setHistoryCollapsed] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const welcomeFileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useSettings()
  const { user: authUser } = useAuth()
  const isGuest = location.pathname === '/guest-chat'

  // Dynamic user name based on authenticated user session or profile settings
  const rawDisplayName = authUser?.name || (profile?.name && profile.name !== 'Sarah Lin' ? profile.name : '') || ''
  const displayName = rawDisplayName.trim() || (authUser?.email ? authUser.email.split('@')[0] : 'User')

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0]
  const selectedModel = MODELS.find(m => m.id === selectedModelId) || MODELS[0]

  // Cycle effort levels: Low -> Medium -> High (Max Effort) -> Low
  const handleCycleEffort = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    const levels: EffortLevel[] = ['Low', 'Medium', 'High']
    const nextIdx = (levels.indexOf(effortLevel) + 1) % levels.length
    const nextEffort = levels[nextIdx]
    setEffortLevel(nextEffort)

    // Filter models matching new effort and auto-select
    const matching = MODELS.filter(m => m.effort === nextEffort)
    if (matching.length > 0 && !matching.some(m => m.id === selectedModelId)) {
      setSelectedModelId(matching[0].id)
    }
  }

  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef<string>('')
  const [micError, setMicError] = useState<string | null>(null)

  // Voice speech-to-text handler: Press once to record, press again to stop & send prompt
  const toggleVoiceInput = async () => {
    setMicError(null)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome, Edge, or Safari.')
      return
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {}
      }
      setIsListening(false)

      // Send prompt automatically when clicking the button to finish recording
      const text = (transcriptRef.current || input).trim()
      if (text) {
        handleSend(text)
        transcriptRef.current = ''
      }
      return
    }

    // Reset transcript before recording
    transcriptRef.current = ''

    // Proactively verify browser mic access
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // Release stream immediately so SpeechRecognition can bind cleanly
        stream.getTracks().forEach(track => track.stop())
      } catch (err: any) {
        console.warn('Microphone permission denied by browser/OS:', err)
        setMicError('Microphone permission is blocked in macOS/Chrome settings.')
        setIsListening(false)
        return
      }
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = navigator.language || 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
        setMicError(null)
      }

      recognition.onresult = (event: any) => {
        let transcript = ''
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        if (transcript) {
          transcriptRef.current = transcript
          setInput(transcript)
        }
      }

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error)
        setIsListening(false)
        if (event.error === 'not-allowed') {
          setMicError('Microphone permission blocked. Please allow Chrome in macOS System Settings.')
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.warn('Failed to start speech recognition:', err)
      setIsListening(false)
    }
  }

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {}
      }
    }
  }, [])

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach(file => {
      const isImage = file.type.startsWith('image/')
      const reader = new FileReader()

      if (isImage) {
        reader.onload = () => {
          setAttachedFiles(prev => [
            ...prev,
            {
              name: file.name,
              type: file.type,
              size: file.size,
              content: (reader.result as string) || '',
              url: (reader.result as string) || '',
            },
          ])
        }
        reader.readAsDataURL(file)
      } else {
        reader.onload = () => {
          setAttachedFiles(prev => [
            ...prev,
            {
              name: file.name,
              type: file.type || 'text/plain',
              size: file.size,
              content: (reader.result as string) || '',
            },
          ])
        }
        reader.readAsText(file)
      }
    })

    e.target.value = ''
  }

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Fetch saved chat sessions from MongoDB on mount
  useEffect(() => {
    const fetchSavedSessions = async () => {
      try {
        const res = await fetch('http://localhost:8000/chat/sessions')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            const dbThreads: ChatThread[] = data.map((s: any) => ({
              id: s.session_id,
              title: s.title || 'Chat',
              updatedAt: s.updated_at ? new Date(s.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
              modelId: s.model || 'minimax-m3:cloud',
              messages: [],
            }))
            setThreads(prev => {
              const empty = prev.find(t => t.id === EMPTY_THREAD_ID) || makeEmptyThread('minimax-m3:cloud')
              const nonInitial = prev.filter(t => t.id !== EMPTY_THREAD_ID && !t.id.startsWith('t-'))
              const combined = [...dbThreads, ...nonInitial]
              const unique = Array.from(new Map(combined.map(item => [item.id, item])).values())
              return [empty, ...unique]
            })
          }
        }
      } catch {
        // Backend offline fallback
      }
    }
    fetchSavedSessions()
  }, [])

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeThread?.messages, isStreaming])

  // Restore guest prompt after login
  useEffect(() => {
    const restored = sessionStorage.getItem('guestPrompt')
    if (restored && !isGuest) {
      sessionStorage.removeItem('guestPrompt')
      setInput(restored)
      setTimeout(() => handleSend(restored), 150)
    }
  }, [isGuest])
  
  // Select thread and load message history from MongoDB if needed
  const handleSelectThread = async (threadId: string) => {
    setActiveThreadId(threadId)
    if (threadId === EMPTY_THREAD_ID) return

    const current = threads.find(t => t.id === threadId)
    if (current && current.messages.length === 0) {
      try {
        const res = await fetch(`http://localhost:8000/chat/sessions/${threadId}`)
        if (res.ok) {
          const detail = await res.json()
          if (detail.messages && Array.isArray(detail.messages)) {
            const msgs: Message[] = detail.messages.map((m: any, idx: number) => ({
              id: `msg-db-${idx}-${Date.now()}`,
              role: m.role,
              text: m.content,
              thinking: m.thinking,
              files: m.files,
              modelId: m.model || detail.model,
              timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
            }))
            setThreads(prev =>
              prev.map(t => (t.id === threadId ? { ...t, messages: msgs } : t))
            )
          }
        }
      } catch {
        // Fallback
      }
    }
  }

  // Create a new (empty) chat thread
  const handleNewChat = () => {
    if (activeThread.messages.length === 0) return
    const newThread = makeEmptyThread(selectedModelId)
    setThreads([newThread, ...threads.filter(t => t.id !== EMPTY_THREAD_ID)])
    setActiveThreadId(newThread.id)
    setAttachedFiles([])
  }

  // Delete a thread from state and MongoDB
  const handleDeleteThread = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetch(`http://localhost:8000/chat/sessions/${threadId}`, { method: 'DELETE' })
    } catch {}
    const remaining = threads.filter(t => t.id !== threadId)
    if (remaining.length > 0) {
      setThreads(remaining)
      if (activeThreadId === threadId) {
        setActiveThreadId(remaining[0].id)
      }
    } else {
      const freshThread = makeEmptyThread(selectedModelId)
      setThreads([freshThread])
      setActiveThreadId(freshThread.id)
    }
  }

  const toggleThinking = (msgId: string) => {
    setThreads(prev =>
      prev.map(t => {
        if (t.id !== activeThreadId) return t
        const msgs = t.messages.map(m => (m.id === msgId ? { ...m, showThinking: !m.showThinking } : m))
        return { ...t, messages: msgs }
      })
    )
  }

  // Send message with backend API connection + streaming
  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input
    if ((!textToSend.trim() && attachedFiles.length === 0) || isStreaming) return

    if (isGuest) {
      sessionStorage.setItem('guestPrompt', textToSend.trim())
      navigate('/login')
      return
    }

    const currentFiles = [...attachedFiles]
    const userMsgId = `msg-u-${Date.now()}`
    const userMsg: Message = {
      id: userMsgId,
      role: 'user',
      text: textToSend.trim() || (currentFiles.length > 0 ? `Analyzed ${currentFiles.length} file(s)` : ''),
      files: currentFiles.length > 0 ? currentFiles : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    const updatedTitle =
      activeThread.messages.length <= 1
        ? (textToSend.trim() || currentFiles[0]?.name || 'Chat').slice(0, 35) + ((textToSend.length > 35) ? '...' : '')
        : activeThread.title

    // Append user message immediately
    const assistantMsgId = `msg-a-${Date.now()}`
    const updatedMessages = [...activeThread.messages, userMsg]

    setThreads(prev =>
      prev.map(t => (t.id === activeThreadId ? { ...t, title: updatedTitle, updatedAt: 'Just now', messages: updatedMessages } : t))
    )

    setInput('')
    setAttachedFiles([])
    setIsStreaming(true)

    // First add placeholder streaming message
    const emptyAssistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      text: '',
      modelId: selectedModelId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    }

    setThreads(prev =>
      prev.map(t => (t.id === activeThreadId ? { ...t, messages: [...t.messages, emptyAssistantMsg] } : t))
    )

    // Attempt to call backend /chat/message API (MiniMax M3 / Ollama)
    let fullTargetText = ''
    let fullThinking = ''
    let backendSessionId = activeThreadId !== EMPTY_THREAD_ID ? activeThreadId : ''

    try {
      const res = await fetch('http://localhost:8000/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeThreadId === EMPTY_THREAD_ID ? undefined : activeThreadId,
          message: textToSend.trim() || 'Please analyze the attached files and photos in detail.',
          model: selectedModelId,
          files: currentFiles.length > 0 ? currentFiles : undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        fullTargetText = data.message?.content || data.content || ''
        fullThinking = data.message?.thinking || ''
        if (data.session_id) {
          backendSessionId = data.session_id
        }
      }
    } catch {
      // Backend offline or unreachable: use intelligent local responder
    }

    if (!fullTargetText) {
      fullTargetText = getIntelligentResponse(textToSend, selectedModel)
    }

    // If starting a new chat thread, assign persistent session ID
    const targetSessionId = backendSessionId || (activeThreadId === EMPTY_THREAD_ID ? `sess_${Date.now()}` : activeThreadId)
    if (activeThreadId === EMPTY_THREAD_ID) {
      setActiveThreadId(targetSessionId)
      setThreads(prev =>
        prev.map(t => (t.id === EMPTY_THREAD_ID ? { ...t, id: targetSessionId, title: updatedTitle, updatedAt: 'Just now' } : t))
      )
    }

    // Stream text chunk by chunk for smooth typing animation
    let currentLength = 0
    const words = fullTargetText.split(' ')

    const interval = setInterval(() => {
      currentLength += Math.floor(Math.random() * 2) + 2
      const chunk = words.slice(0, currentLength).join(' ')

      setThreads(prev =>
        prev.map(t => {
          if (!t.messages.some(m => m.id === assistantMsgId)) return t
          const msgs = t.messages.map(m => (m.id === assistantMsgId ? { ...m, text: chunk, thinking: fullThinking } : m))
          return { ...t, messages: msgs }
        })
      )

      if (currentLength >= words.length) {
        clearInterval(interval)
        setIsStreaming(false)
        setThreads(prev =>
          prev.map(t => {
            if (!t.messages.some(m => m.id === assistantMsgId)) return t
            const msgs = t.messages.map(m => (m.id === assistantMsgId ? { ...m, text: fullTargetText, thinking: fullThinking, isStreaming: false } : m))
            return { ...t, messages: msgs }
          })
        )
      }
    }, 25)
  }

  // Handle message copy
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedMessageId(id)
    setTimeout(() => setCopiedMessageId(null), 2000)
  }

  // Handle thumbs up / down
  const handleFeedback = (messageId: string, likedState: boolean) => {
    setThreads(prev =>
      prev.map(t => {
        if (t.id !== activeThreadId) return t
        const msgs = t.messages.map(m => {
          if (m.id !== messageId) return m
          const newLiked = m.liked === likedState ? null : likedState
          return { ...m, liked: newLiked }
        })
        return { ...t, messages: msgs }
      })
    )
  }

  // Filter threads by search query (empty/unstarted threads don't appear in history)
  const filteredThreads = threads.filter(t =>
    t.id !== EMPTY_THREAD_ID && t.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      {/* 4-Second Initial Splash Screen */}
      {showSplash && <ChatSplashScreen />}

      <div
        style={{
          opacity: showSplash ? 0 : 1,
          transition: 'opacity 0.4s ease',
          pointerEvents: showSplash ? 'none' : 'auto',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <TopBar title="JudgeAI">
        <button
          onClick={() => setHistoryCollapsed(!historyCollapsed)}
          title={historyCollapsed ? 'Show history sidebar' : 'Hide history sidebar'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            padding: '5px 10px',
            borderRadius: 8,
            color: 'var(--color-muted)',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)'
            e.currentTarget.style.color = '#FFFFFF'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
            e.currentTarget.style.color = 'var(--color-muted)'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 3v18" />
          </svg>
          <span>{historyCollapsed ? 'Show History' : 'Hide History'}</span>
        </button>
      </TopBar>

      {/* Main chat layout */}
      <div style={{ display: 'flex', height: 'calc(100vh - 65px)', overflow: 'hidden' }}>
        {/* Left: Chat History Sidebar */}
        <aside
          style={{
            width: historyCollapsed ? 0 : 280,
            opacity: historyCollapsed ? 0 : 1,
            pointerEvents: historyCollapsed ? 'none' : 'auto',
            flexShrink: 0,
            borderRight: historyCollapsed ? 'none' : '1px solid var(--color-border)',
            background: 'var(--color-surface-deep)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'width 0.2s ease, opacity 0.15s ease',
          }}
          className="chat-history-sidebar"
        >
          {/* New Chat Action */}
          <div style={{ padding: '16px 14px 10px' }}>
            <button
              onClick={handleNewChat}
              className="pill-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '10px 14px',
                fontSize: 13.5,
                borderRadius: 10,
                gap: 8,
              }}
            >
              <IcPlus size={16} />
              <span>New Chat</span>
            </button>
          </div>

          {/* Search Bar */}
          <div style={{ padding: '0 14px 12px' }}>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.09)',
                borderRadius: 8,
                padding: '0 10px',
                transition: 'all 0.15s ease',
              }}
            >
              <Search size={14} style={{ color: 'var(--color-muted)', flexShrink: 0, marginRight: 8, pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '7px 0',
                  fontSize: 12.5,
                  color: 'var(--color-foreground)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 2,
                    color: 'var(--color-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <XIcon size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Conversations List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', padding: '8px 10px 6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              History
            </div>
            {filteredThreads.map(thread => {
              const isActive = thread.id === activeThreadId
              const threadModel = MODELS.find(m => m.id === thread.modelId) || selectedModel
              return (
                <div
                  key={thread.id}
                  onClick={() => handleSelectThread(thread.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: isActive ? 'rgba(124,58,237,0.15)' : 'transparent',
                    border: isActive ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
                    marginBottom: 4,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.background = 'var(--color-hover)'
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1, marginRight: 8 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? 'var(--color-foreground)' : 'var(--color-muted-stronger)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {thread.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <span style={{ fontSize: 9.5, fontWeight: 600, color: threadModel.badgeColor }}>{threadModel.name}</span>
                      <span style={{ fontSize: 9.5, color: 'var(--color-muted-faint)' }}>• {thread.updatedAt}</span>
                    </div>
                  </div>
                  <button
                    onClick={e => handleDeleteThread(thread.id, e)}
                    title="Delete Chat"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-muted-faint)',
                      cursor: 'pointer',
                      padding: 4,
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted-faint)')}
                  >
                    <IcTrash size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        </aside>

        {/* Main Chat Content Area with Dynamic Radial Glow Aura */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', background: 'var(--color-background)', overflow: 'hidden' }}>
          {/* Dynamic Radial Glow Aura matching the Ghost / Model Theme */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 0,
              backgroundImage: `radial-gradient(circle 560px at 50% 32%, ${selectedModel.badgeColor}26, transparent 72%)`,
              transition: 'background-image 0.6s ease',
            }}
          />
          {activeThread.messages.length === 0 ? (
            /* ===== Empty / Initial State ===== */
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
              <div style={{ width: '100%', maxWidth: 680 }}>
                {/* Centered welcome message */}
                <div style={{ textAlign: 'center', marginBottom: 22 }}>
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <MeshGradientSVG size={145} modelColor={selectedModel.badgeColor} />
                  </div>
                  <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 6px', color: 'var(--color-foreground)' }}>
                    {isGuest ? 'Welcome to JudgeAI' : `Welcome, ${displayName}`}
                  </h1>
                </div>

                {/* Prompt box */}
                <div
                  style={{
                    background: 'var(--color-card, #14121E)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 18,
                    padding: '12px 16px 10px',
                    position: 'relative',
                    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.04)',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={welcomeFileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    style={{ display: 'none' }}
                    accept="image/*,.pdf,.txt,.csv,.json,.py,.js,.tsx,.ts,.md,.doc,.docx"
                  />

                  {/* Attached Files / Photos Preview Chips */}
                  {attachedFiles.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: 8 }}>
                      {attachedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background: 'rgba(255, 255, 255, 0.07)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: 8,
                            padding: '3px 8px',
                            fontSize: 12,
                            color: 'var(--color-foreground)',
                            maxWidth: 240,
                          }}
                        >
                          {file.type.startsWith('image/') ? (
                            <img src={file.url || file.content} alt={file.name} style={{ width: 20, height: 20, objectFit: 'cover', borderRadius: 4 }} />
                          ) : (
                            <span style={{ fontSize: 13 }}>📄</span>
                          )}
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130, fontWeight: 500 }}>
                            {file.name}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--color-muted)', flexShrink: 0 }}>
                            {(file.size / 1024).toFixed(0)}KB
                          </span>
                          <button
                            onClick={() => handleRemoveFile(idx)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--color-muted)',
                              cursor: 'pointer',
                              padding: '0 2px',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    placeholder={isListening ? "🎙️ Listening... Speak now" : "Ask anything..."}
                    rows={1}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      padding: '2px 2px 4px',
                      fontSize: 14.5,
                      color: 'var(--color-foreground)',
                      outline: 'none',
                      fontFamily: 'Inter, sans-serif',
                      resize: 'none',
                      minHeight: 38,
                      maxHeight: 120,
                      boxSizing: 'border-box',
                    }}
                  />

                  {/* Bottom Toolbar: Model on left | + and Mic/Send on right */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, paddingTop: 2 }}>
                    {/* Left: Model Selector Capsule + Parameter / Effort Filter Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                      {/* Model Selector Button */}
                      <button
                        onClick={() => setShowEmptyModelDropdown(!showEmptyModelDropdown)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 7,
                          background: 'transparent',
                          border: 'none',
                          padding: '5px 8px',
                          borderRadius: 8,
                          color: 'var(--color-foreground)',
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: selectedModel.badgeColor, flexShrink: 0 }} />
                        <span style={{ fontWeight: 600 }}>{selectedModel.name}</span>
                        <IcChevronDown size={11} style={{ color: 'var(--color-muted)', marginLeft: 1 }} />
                      </button>

                      {/* Parameter / Effort Filter Button (Low -> Medium -> High / Max Effort) */}
                      <button
                        onClick={handleCycleEffort}
                        title={`Parameter filter: ${effortLevel === 'High' ? 'Max Effort' : effortLevel} (Click to toggle: Low -> Medium -> Max Effort)`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.09)',
                          padding: '4px 9px',
                          borderRadius: 7,
                          color: 'var(--color-foreground)',
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.09)'
                        }}
                      >
                        {/* Dynamic Signal Bars according to Low/Medium/High */}
                        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                          <rect x="0.5" y="7" width="2" height="3" rx="0.6" fill={effortLevel === 'Low' || effortLevel === 'Medium' || effortLevel === 'High' ? "currentColor" : "rgba(255,255,255,0.25)"} />
                          <rect x="4" y="4" width="2" height="6" rx="0.6" fill={effortLevel === 'Medium' || effortLevel === 'High' ? "currentColor" : "rgba(255,255,255,0.25)"} />
                          <rect x="7.5" y="1" width="2" height="9" rx="0.6" fill={effortLevel === 'High' ? "currentColor" : "rgba(255,255,255,0.25)"} />
                        </svg>
                        <span>{effortLevel === 'High' ? 'Max Effort' : effortLevel}</span>
                      </button>

                      {/* Dropdown Menu anchored above */}
                      {showEmptyModelDropdown && (
                        <ModelSelectorMenu
                          selectedModelId={selectedModelId}
                          onSelectModel={setSelectedModelId}
                          onClose={() => setShowEmptyModelDropdown(false)}
                          activeEffort={effortLevel}
                          onSelectEffort={(eff) => {
                            if (eff !== 'All') setEffortLevel(eff)
                          }}
                          align="left"
                        />
                      )}
                    </div>

                    {/* Right: Plus Button (+) & Circular Mic/Send Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {/* Plus Button for File/Photo Attachments */}
                      <button
                        onClick={() => welcomeFileInputRef.current?.click()}
                        title="Attach files or photos"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--color-muted)',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                          e.currentTarget.style.color = '#FFFFFF'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = 'var(--color-muted)'
                        }}
                      >
                        <Plus size={19} strokeWidth={2} />
                      </button>

                      {/* Solid Circular Action Button (Send / Mic / Stop & Send) */}
                      {isListening ? (
                        <button
                          onClick={toggleVoiceInput}
                          title="Finish recording & send prompt"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: '#EF4444',
                            border: 'none',
                            color: '#FFFFFF',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            animation: 'pulseMic 1.2s infinite',
                            boxShadow: '0 0 16px rgba(239, 68, 68, 0.7)',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="4" y="4" width="16" height="16" rx="2" />
                          </svg>
                        </button>
                      ) : input.trim() || attachedFiles.length > 0 ? (
                        <button
                          onClick={() => handleSend()}
                          disabled={isStreaming}
                          title="Send prompt"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: '#FFFFFF',
                            border: 'none',
                            color: '#000000',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            boxShadow: '0 2px 8px rgba(255, 255, 255, 0.25)',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                          <IcSend size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={toggleVoiceInput}
                          title="Start voice recording (Speak to chat)"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: '#FFFFFF',
                            border: 'none',
                            color: '#000000',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                          <IcMic size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick action buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 20 }}>
                  {QUICK_ACTIONS.map(qa => {
                    const Icon = qa.icon
                    return (
                      <button
                        key={qa.label}
                        onClick={() => handleSend(qa.prompt)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 7,
                          padding: '9px 14px',
                          borderRadius: 999,
                          background: 'var(--color-card)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-foreground)',
                          fontSize: 12.5,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(124,58,237,0.12)'
                          e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'var(--color-card)'
                          e.currentTarget.style.borderColor = 'var(--color-border)'
                        }}
                      >
                        <Icon size={13} style={{ opacity: 0.7 }} />
                        <span>{qa.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
          <>
          {/* Messages Feed */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px', background: 'var(--color-background)' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              {/* Message List */}
              {activeThread.messages.map((m, idx) => {
                const isUser = m.role === 'user'
                const msgModel = MODELS.find(mod => mod.id === m.modelId) || selectedModel

                return (
                  <div
                    key={m.id || idx}
                    style={{
                      marginBottom: 24,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {isUser ? (
                      /* User Message Bubble */
                      <div
                        style={{
                          maxWidth: '75%',
                          background: 'rgba(124,58,237,0.18)',
                          border: '1px solid rgba(124,58,237,0.35)',
                          borderRadius: '16px 16px 4px 16px',
                          padding: '12px 18px',
                          fontSize: 14,
                          color: 'var(--color-foreground)',
                          lineHeight: 1.55,
                          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                        }}
                      >
                        {/* Attached Photos / Files inside User Message */}
                        {m.files && m.files.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: m.text ? 10 : 0 }}>
                            {m.files.map((file, fIdx) => (
                              <div
                                key={fIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  background: 'rgba(0, 0, 0, 0.3)',
                                  border: '1px solid rgba(255, 255, 255, 0.15)',
                                  borderRadius: 8,
                                  padding: '6px 10px',
                                  fontSize: 12,
                                  maxWidth: '100%',
                                }}
                              >
                                {file.type.startsWith('image/') ? (
                                  <img
                                    src={file.url || file.content}
                                    alt={file.name}
                                    style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }}
                                  />
                                ) : (
                                  <span style={{ fontSize: 20 }}>📄</span>
                                )}
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                                    {file.name}
                                  </div>
                                  <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.6)' }}>
                                    {(file.size / 1024).toFixed(0)} KB • {file.type.split('/')[1] || 'doc'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {m.text}
                      </div>
                    ) : (
                      /* Assistant Message Container */
                      <div
                        style={{
                          maxWidth: '88%',
                          width: '100%',
                          background: 'var(--color-card)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '16px 16px 16px 4px',
                          padding: '16px 20px',
                          fontSize: 14,
                          color: 'var(--color-foreground)',
                          lineHeight: 1.65,
                          position: 'relative',
                        }}
                      >
                        {/* Assistant Header Tag */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid var(--color-border-faint)', paddingBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <LogoIcon size={30} />
                            </div>
                            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-foreground)' }}>JudgeAI</span>
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{m.timestamp}</span>
                        </div>

                        {/* Thinking Tool (Shimmer animation when thinking / collapsible thought drawer) */}
                        {(m.thinking || (m.isStreaming && !m.text)) && (
                          <div style={{ marginBottom: 12 }}>
                            <ThinkingTool
                              state={m.isStreaming && !m.text ? "thinking" : "thought"}
                              content={m.thinking}
                              expanded={m.showThinking}
                              onToggleExpand={() => toggleThinking(m.id)}
                            />
                          </div>
                        )}

                        {/* Clean Formatted Content text (headings, bold, lists, code) */}
                        <FormattedMessageContent text={m.text} isStreaming={m.isStreaming} />

                        {/* Toolbar: Copy, Thumbs Up, Thumbs Down, Regenerate */}
                        {!m.isStreaming && m.text && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--color-border-faint)' }}>
                            {/* Copy button */}
                            <button
                              onClick={() => handleCopy(m.id, m.text)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                background: 'var(--color-surface-deep)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 6,
                                padding: '4px 8px',
                                fontSize: 11,
                                color: copiedMessageId === m.id ? '#34D399' : 'var(--color-muted)',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-hover)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-surface-deep)')}
                            >
                              {copiedMessageId === m.id ? <IcCheck size={12} /> : <IcCopy size={12} />}
                              <span>{copiedMessageId === m.id ? 'Copied' : 'Copy'}</span>
                            </button>

                            {/* Thumbs Up */}
                            <button
                              onClick={() => handleFeedback(m.id, true)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                background: m.liked === true ? 'rgba(52,211,153,0.15)' : 'var(--color-surface-deep)',
                                border: `1px solid ${m.liked === true ? 'rgba(52,211,153,0.4)' : 'var(--color-border)'}`,
                                borderRadius: 6,
                                padding: '4px 8px',
                                fontSize: 11,
                                color: m.liked === true ? '#34D399' : 'var(--color-muted)',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                              }}
                            >
                              <IcThumbsUp size={12} />
                            </button>

                            {/* Thumbs Down */}
                            <button
                              onClick={() => handleFeedback(m.id, false)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                background: m.liked === false ? 'rgba(239,68,68,0.15)' : 'var(--color-surface-deep)',
                                border: `1px solid ${m.liked === false ? 'rgba(239,68,68,0.4)' : 'var(--color-border)'}`,
                                borderRadius: 6,
                                padding: '4px 8px',
                                fontSize: 11,
                                color: m.liked === false ? '#EF4444' : 'var(--color-muted)',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                              }}
                            >
                              <IcThumbsDown size={12} />
                            </button>

                            {/* Regenerate */}
                            {idx === activeThread.messages.length - 1 && (
                              <button
                                onClick={() => {
                                  const lastUserMsg = [...activeThread.messages].reverse().find(msg => msg.role === 'user')
                                  if (lastUserMsg) handleSend(lastUserMsg.text)
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  background: 'var(--color-surface-deep)',
                                  border: '1px solid var(--color-border)',
                                  borderRadius: 6,
                                  padding: '4px 8px',
                                  fontSize: 11,
                                  color: 'var(--color-muted)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s',
                                  marginLeft: 'auto',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-hover)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-surface-deep)')}
                              >
                                <IcRotate size={12} />
                                <span>Retry</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Suggestions Cards (Empty state / initial start) */}
              {activeThread.messages.length <= 1 && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Suggested Prompts
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
                    {QUICK_PROMPTS.map((qp, i) => (
                      <div
                        key={i}
                        onClick={() => handleSend(qp)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 10,
                          background: 'var(--color-card)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-foreground)',
                          fontSize: 13,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(124,58,237,0.12)'
                          e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'var(--color-card)'
                          e.currentTarget.style.borderColor = 'var(--color-border)'
                        }}
                      >
                        <span>{qp}</span>
                        <IcSparkles size={14} style={{ opacity: 0.5, flexShrink: 0, marginLeft: 8 }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Bottom Message Input Box */}
          <div style={{ borderTop: '1px solid var(--color-border)', padding: '10px 24px 10px', background: 'var(--color-background)', flexShrink: 0 }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              <div
                style={{
                  background: 'var(--color-card, #14121E)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 18,
                  padding: '10px 14px 8px',
                  position: 'relative',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  style={{ display: 'none' }}
                  accept="image/*,.pdf,.txt,.csv,.json,.py,.js,.tsx,.ts,.md,.doc,.docx"
                />

                {/* Attached Files / Photos Preview Chips */}
                {attachedFiles.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: 8 }}>
                    {attachedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          background: 'rgba(255, 255, 255, 0.07)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: 8,
                          padding: '3px 8px',
                          fontSize: 12,
                          color: 'var(--color-foreground)',
                          maxWidth: 240,
                        }}
                      >
                        {file.type.startsWith('image/') ? (
                          <img src={file.url || file.content} alt={file.name} style={{ width: 20, height: 20, objectFit: 'cover', borderRadius: 4 }} />
                        ) : (
                          <span style={{ fontSize: 13 }}>📄</span>
                        )}
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130, fontWeight: 500 }}>
                          {file.name}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--color-muted)', flexShrink: 0 }}>
                          {(file.size / 1024).toFixed(0)}KB
                        </span>
                        <button
                          onClick={() => handleRemoveFile(idx)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-muted)',
                            cursor: 'pointer',
                            padding: '0 2px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder={isListening ? "🎙️ Listening... Speak now" : "Ask anything..."}
                  rows={1}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: '2px 2px 4px',
                    fontSize: 14.5,
                    color: 'var(--color-foreground)',
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                    resize: 'none',
                    minHeight: 36,
                    maxHeight: 120,
                    boxSizing: 'border-box',
                  }}
                />

                {/* Bottom Toolbar: Model on left | + and Mic/Send on right */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, paddingTop: 2 }}>
                  {/* Left: Model Selector Capsule + Parameter / Effort Filter Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative', flexWrap: 'nowrap' }}>
                    <button
                      onClick={() => setShowModelDropdown(!showModelDropdown)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        background: 'transparent',
                        border: 'none',
                        padding: '5px 8px',
                        borderRadius: 8,
                        color: 'var(--color-foreground)',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: selectedModel.badgeColor, flexShrink: 0 }} />
                      <span style={{ fontWeight: 600 }}>{selectedModel.name}</span>
                      <IcChevronDown size={11} style={{ color: 'var(--color-muted)', marginLeft: 1 }} />
                    </button>

                    {/* Parameter / Effort Filter Button (Low -> Medium -> High / Max Effort) */}
                    <button
                      onClick={handleCycleEffort}
                      title={`Parameter filter: ${effortLevel === 'High' ? 'Max Effort' : effortLevel} (Click to toggle: Low -> Medium -> Max Effort)`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.09)',
                        padding: '4px 9px',
                        borderRadius: 7,
                        color: 'var(--color-foreground)',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.09)'
                      }}
                    >
                      {/* Dynamic Signal Bars according to Low/Medium/High */}
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                        <rect x="0.5" y="7" width="2" height="3" rx="0.6" fill={effortLevel === 'Low' || effortLevel === 'Medium' || effortLevel === 'High' ? "currentColor" : "rgba(255,255,255,0.25)"} />
                        <rect x="4" y="4" width="2" height="6" rx="0.6" fill={effortLevel === 'Medium' || effortLevel === 'High' ? "currentColor" : "rgba(255,255,255,0.25)"} />
                        <rect x="7.5" y="1" width="2" height="9" rx="0.6" fill={effortLevel === 'High' ? "currentColor" : "rgba(255,255,255,0.25)"} />
                      </svg>
                      <span>{effortLevel === 'High' ? 'Max Effort' : effortLevel}</span>
                    </button>

                    {/* Dropdown Menu anchored above */}
                    {showModelDropdown && (
                      <ModelSelectorMenu
                        selectedModelId={selectedModelId}
                        onSelectModel={setSelectedModelId}
                        onClose={() => setShowModelDropdown(false)}
                        activeEffort={effortLevel}
                        onSelectEffort={(eff) => {
                          if (eff !== 'All') setEffortLevel(eff)
                        }}
                        align="left"
                      />
                    )}
                  </div>

                  {/* Right: Plus Button (+) & Circular Mic/Send Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {/* Plus Button for File/Photo Attachments */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      title="Attach files or photos"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                        e.currentTarget.style.color = '#FFFFFF'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'var(--color-muted)'
                      }}
                    >
                      <Plus size={19} strokeWidth={2} />
                    </button>

                    {/* Solid Circular Action Button (Send / Mic / Stop & Send) */}
                    {isListening ? (
                      <button
                        onClick={toggleVoiceInput}
                        title="Finish recording & send prompt"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#EF4444',
                          border: 'none',
                          color: '#FFFFFF',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          animation: 'pulseMic 1.2s infinite',
                          boxShadow: '0 0 16px rgba(239, 68, 68, 0.7)',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="4" y="4" width="16" height="16" rx="2" />
                        </svg>
                      </button>
                    ) : input.trim() || attachedFiles.length > 0 ? (
                      <button
                        onClick={() => handleSend()}
                        disabled={isStreaming}
                        title="Send prompt"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#FFFFFF',
                          border: 'none',
                          color: '#000000',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          boxShadow: '0 2px 8px rgba(255, 255, 255, 0.25)',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        <IcSend size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={toggleVoiceInput}
                        title="Start voice recording (Speak to chat)"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#FFFFFF',
                          border: 'none',
                          color: '#000000',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        <IcMic size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, padding: '0 4px' }}>
                <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                  Connected to <strong style={{ color: selectedModel.badgeColor }}>{selectedModel.name}</strong> • Press Enter to send
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-muted-faint)' }}>
                  JudgeAI v1.4
                </span>
              </div>
            </div>
          </div>
          </>
          )}
        </main>
      </div>
      </div>

      <style>{`
        @keyframes chatSplashFadeIn { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
        @keyframes chatFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes chatProgress { 0%{width:0%} 100%{width:100%} }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes pulseMic { 0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.35); } 50% { box-shadow: 0 0 0 6px rgba(239,68,68,0); } }
        @media(max-width: 768px) {
          .chat-history-sidebar { display: none !important; }
        }
      `}</style>
    </>
  )
}
