import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router'
import { TopBar, PageContent } from '../components/AppShell'
import { useSettings } from '../components/ThemeProvider'
import {
  IcSearch,
  IcChevronRight,
  IcFilter,
  IcPlus,
  IcRotate,
  IcCheck,
  IcSparkles,
  IcChevronDown,
  IcX,
  IcCopy,
  IcFlag,
  IcJudge,
  IcJudgeAccuracy,
  IcJudgeRelevance,
  IcJudgeReasoning,
  IcJudgeHallucination,
  IcJudgeSafety,
  IcJudgeStyle,
} from '../components/icons'

// Backend Evaluation Agent API URL
const DEFAULT_API_BASE = import.meta.env.VITE_EVALUATION_API_URL || 'http://localhost:8001'

export type ModelOption = {
  id: string
  name: string
  provider: string
  color: string
  category?: 'Cloud' | 'Open' | 'Proprietary'
}

export const MODELS: ModelOption[] = [
  { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', color: '#7C3AED', category: 'Proprietary' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', color: '#10A37F', category: 'Proprietary' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google', color: '#38BDF8', category: 'Proprietary' },
  { id: 'deepseek-v3', name: 'DeepSeek V3', provider: 'DeepSeek', color: '#F59E0B', category: 'Open' },
  { id: 'deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', color: '#EF4444', category: 'Open' },
  { id: 'minimax-m3:cloud', name: 'MiniMax M3 (Cloud)', provider: 'MiniMax', color: '#8B5CF6', category: 'Cloud' },
  { id: 'glm-5.2:cloud', name: 'GLM 5.2 (Cloud)', provider: 'Zhipu AI', color: '#3B82F6', category: 'Cloud' },
  { id: 'nemotron-3-super:cloud', name: 'Nemotron-3 Super', provider: 'NVIDIA', color: '#84CC16', category: 'Cloud' },
  { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', provider: 'Meta', color: '#EC4899', category: 'Open' },
  { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', provider: 'Meta', color: '#D946EF', category: 'Open' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', color: '#059669', category: 'Proprietary' },
  { id: 'mistral-large-2', name: 'Mistral Large 2', provider: 'Mistral', color: '#F97316', category: 'Proprietary' },
  { id: 'qwen-2.5-72b', name: 'Qwen 2.5 72B', provider: 'Alibaba', color: '#06B6D4', category: 'Open' },
  { id: 'gemma4:cloud', name: 'Gemma 4 (Cloud)', provider: 'Google', color: '#6366F1', category: 'Cloud' },
]

export type RubricScore = {
  key: string
  label: string
  score: number
  color: string
  weight: number
  reasoning: string
  judge_model_used?: string
  provider?: string
}

export type EvalRunItem = {
  id: string
  task: string
  model: string
  score: number
  judges: number
  ts: string
  status: 'Passed' | 'Flagged'
  prompt?: string
  response?: string
  rubrics?: RubricScore[]
  judge_model?: string
  consensus_confidence?: number
  summary?: string
}

export const SAMPLE_RUNS: EvalRunItem[] = [
  { id: '1234', task: 'Legal contract summarization', model: 'gemini-2.0-flash', score: 94, judges: 6, ts: '2 min ago', status: 'Passed' },
  { id: '1233', task: 'Customer support response drafting', model: 'claude-3.5-sonnet', score: 91, judges: 6, ts: '14 min ago', status: 'Passed' },
  { id: '1232', task: 'Financial report Q&A', model: 'gpt-4o', score: 88, judges: 6, ts: '31 min ago', status: 'Passed' },
  { id: '1231', task: 'Medical symptom triage', model: 'llama-3.1-70b', score: 71, judges: 6, ts: '1 hr ago', status: 'Flagged' },
  { id: '1230', task: 'Code review assistant', model: 'claude-3.5-sonnet', score: 96, judges: 6, ts: '2 hrs ago', status: 'Passed' },
  { id: '1229', task: 'Blog post generation', model: 'deepseek-v3', score: 83, judges: 6, ts: '3 hrs ago', status: 'Passed' },
  { id: '1228', task: 'Product description rewrite', model: 'gpt-4o', score: 89, judges: 6, ts: '4 hrs ago', status: 'Passed' },
  { id: '1227', task: 'SQL query generation', model: 'claude-3.5-sonnet', score: 97, judges: 6, ts: '5 hrs ago', status: 'Passed' },
  { id: '1226', task: 'Insurance claim summarization', model: 'gemini-2.0-flash', score: 68, judges: 6, ts: '6 hrs ago', status: 'Flagged' },
  { id: '1225', task: 'Meeting notes summarization', model: 'llama-3.1-70b', score: 79, judges: 6, ts: '7 hrs ago', status: 'Passed' },
  { id: '1224', task: 'Resume screening rationale', model: 'gpt-4o', score: 85, judges: 6, ts: '9 hrs ago', status: 'Passed' },
]

const PROMPT_TEMPLATES = [
  {
    label: 'Legal Contract SLA',
    task: 'Legal contract clause extraction & summarization',
    prompt: `Summarize the attached Service Level Agreement (SLA). Highlight:\n1. Key obligations of both parties\n2. Payment terms, caps, and late fee penalties\n3. Termination notice requirements\n4. Indemnity and aggregate liability limits`,
    output: `### Service Level Agreement (SLA) — Executive Summary\n\n**1. Key Obligations:**\n- **Provider:** Maintain 99.9% uptime across primary APIs, resolve P1 outages within 2 hours.\n- **Client:** Provide authorized access tokens, report anomalies within 24 hours of discovery.\n\n**2. Commercial Terms:**\n- Invoices billed Net 30; late balances accrue 1.5% monthly compound interest.\n- Maximum service credit cap: 25% of monthly recurring charge (MRC).\n\n**3. Termination & Exit:**\n- 60-day written notice for convenience by either party.\n- Immediate termination upon material breach unremedied for 14 calendar days.\n\n**4. Liability & Indemnification:**\n- Mutual indemnification against 3rd-party IP infringement.\n- Aggregate liability ceiling strictly limited to total fees paid over prior 12 months.`,
  },
  {
    label: 'Customer Support Triage',
    task: 'Customer support draft & billing escalation policy',
    prompt: `Draft a polite customer support response for a user experiencing billing synchronization delay. Include step-by-step troubleshooting, refund request procedure, and manager escalation path if unresolved.`,
    output: `Hello Alex,\n\nThank you for reaching out to JudgeAI Support. I completely understand how frustrating billing synchronization delays can be, and I am here to ensure this is resolved immediately.\n\n**Immediate Troubleshooting Steps:**\n1. Log into your Dashboard and navigate to **Settings → Billing**.\n2. Click **Sync Invoices** to force a real-time ledger refresh.\n3. Verify your primary payment method shows a verified status badge.\n\n**Refund & Adjustment Procedure:**\nIf duplicate pending charges appear on your bank statement, our system will automatically release payment holds within 3-5 business days. You can also submit an automated credit request directly from the invoice panel.\n\n**Direct Escalation:**\nIf your balance does not update within 2 hours, please reply directly to this ticket with code **#BILLING-PRIORITY-ESC**, and I will escalate this to our Senior Accounts Manager for manual clearance.\n\nBest regards,\n**Sarah Jenkins** | Senior Customer Operations`,
  },
  {
    label: 'Code Review & Security',
    task: 'TypeScript API handler code review',
    prompt: `Review the following API route for security vulnerabilities, memory leaks, and error handling:\n\nasync function handleUserData(req, res) {\n  const user = await db.query("SELECT * FROM users WHERE id = " + req.query.id);\n  res.json(user);\n}`,
    output: `### Security & Code Quality Audit\n\n#### Critical Vulnerability: SQL Injection (CWE-89)\n- **Issue:** Direct string concatenation with unsanitized user query parameter \`req.query.id\` allows arbitrary SQL command execution.\n- **Exploit Vector:** An attacker passing \`?id=1 OR 1=1\` can dump the complete users table or drop databases.\n\n#### Missing Safeguards:\n1. **No Error Handling:** Unhandled database exceptions will crash the Node worker process.\n2. **Type Safety:** Missing parameter validation for missing or non-numeric IDs.\n\n#### Remediated Implementation:\n\`\`\`typescript\nimport { Request, Response } from 'express';\nimport { z } from 'zod';\n\nconst querySchema = z.object({ id: z.coerce.number().int().positive() });\n\nexport async function handleUserData(req: Request, res: Response) {\n  try {\n    const parsed = querySchema.safeParse(req.query);\n    if (!parsed.success) {\n      return res.status(400).json({ error: 'Invalid user ID parameter' });\n    }\n    const result = await db.query('SELECT id, name, email FROM users WHERE id = $1', [parsed.data.id]);\n    if (result.rows.length === 0) {\n      return res.status(404).json({ error: 'User not found' });\n    }\n    return res.status(200).json(result.rows[0]);\n  } catch (err) {\n    logger.error('handleUserData database failure', err);\n    return res.status(500).json({ error: 'Internal server error' });\n  }\n}\n\`\`\``,
  },
  {
    label: 'Medical Symptom QA',
    task: 'Clinical symptom advisory analysis',
    prompt: `Evaluate the following patient advisory note for medical accuracy and potential hallucination:\n"Patient presents with mild fever and sore throat. Recommend 500mg Amoxicillin daily without prescription."`,
    output: `### Medical Advisory Evaluation & Safety Critique\n\n**Clinical Review:**\n1. **Antibiotic Stewardship Violation:** Recommending prescription antibiotic (Amoxicillin) without confirmed bacterial etiology (e.g., positive rapid strep culture) promotes antimicrobial resistance and risks unnecessary allergic reactions.\n2. **Legal & Regulatory Non-Compliance:** Prescribing prescription-only medication without physician evaluation and license violates medical safety standards.\n\n**Correct Protocol:**\n- Advise symptomatic relief (hydration, saline gargle, over-the-counter analgesics like Acetaminophen or Ibuprofen if tolerated).\n- Provide warning signs for immediate medical evaluation (dysphagia, difficulty breathing, fever >38.5°C persisting >72 hours).`,
  },
]

// ─── Automated Professional Task Name Generator ──────────────────────────────

export function titleCase(str: string): string {
  const acronyms = new Set([
    'TCP', 'UDP', 'SQL', 'API', 'HTML', 'CSS', 'JSON', 'REST', 'LLM', 'AI',
    'SLA', 'IP', 'IPV4', 'IPV6', 'AWS', 'GCP', 'CPU', 'GPU', 'UUID', 'JWT',
    'QA', 'UI', 'UX', 'HTTP', 'HTTPS', 'DNS', 'SSH', 'FTP', 'SMTP', 'DOM',
  ])
  const lowerWords = new Set([
    'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'the', 'to', 'up', 'vs', 'with',
  ])
  return str
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w, i) => {
      const up = w.toUpperCase()
      if (acronyms.has(up)) return up
      if (up === 'IPV4') return 'IPv4'
      if (up === 'IPV6') return 'IPv6'
      const low = w.toLowerCase()
      if (i > 0 && lowerWords.has(low)) return low
      return low.charAt(0).toUpperCase() + low.slice(1)
    })
    .join(' ')
}

export function cleanTopic(topic: string): string {
  return topic
    .replace(/^(?:a|an|the|to|for|me|how\s+to|please|can\s+you|i\s+want\s+to|how|what\s+is)\s+/i, '')
    .replace(/\s+(?:in\s+python|in\s+javascript|in\s+typescript|in\s+java|in\s+c\+\+|in\s+golang|in\s+rust|in\s+sql)$/i, '')
    .replace(/[?.!]+$/, '')
    .trim()
}

export function generateTaskName(rawPrompt: string): string {
  if (!rawPrompt || !rawPrompt.trim()) return 'General Task Evaluation'
  const text = rawPrompt.trim().replace(/\r?\n/g, ' ').replace(/\s+/g, ' ')
  const lower = text.toLowerCase()

  // 1. Palindrome number
  if (lower.includes('palindrome')) {
    if (lower.includes('python')) return 'Palindrome Number — Python Code'
    if (lower.includes('javascript') || lower.includes('js')) return 'Palindrome Number — JavaScript Code'
    return 'Palindrome Number Verification'
  }

  // 2. TCP vs UDP Comparison
  if (lower.includes('tcp') && lower.includes('udp')) {
    return 'TCP vs UDP Comparison'
  }

  // 3. SQL duplicate records / detection
  if (lower.includes('sql') && (lower.includes('duplicate') || lower.includes('dup'))) {
    return 'SQL Duplicate Record Detection'
  }

  // 4. Contract liability risks
  if (
    (lower.includes('contract') || lower.includes('clause') || lower.includes('indemnity') || lower.includes('sla') || lower.includes('agreement')) &&
    (lower.includes('liability') || lower.includes('risk') || lower.includes('legal') || lower.includes('indemnif'))
  ) {
    return 'Contract Liability Risk Analysis'
  }

  // 5. Binary search algorithm
  if (lower.includes('binary search')) {
    return 'Binary Search Algorithm Explanation'
  }

  // Common algorithm & data structure patterns
  if (lower.includes('merge sort') || lower.includes('mergesort')) {
    return 'Merge Sort Algorithm Implementation'
  }
  if (lower.includes('quick sort') || lower.includes('quicksort')) {
    return 'Quick Sort Algorithm Implementation'
  }
  if (lower.includes('factorial')) {
    return 'Factorial Calculation — Python Code'
  }
  if (lower.includes('fibonacci')) {
    return 'Fibonacci Sequence Generation'
  }
  if (lower.includes('dedup') || (lower.includes('duplicate') && lower.includes('string'))) {
    return 'High-Throughput String Deduplication'
  }
  if (lower.includes('ipv4') || lower.includes('ip address')) {
    return 'IPv4 Address Validation'
  }

  // Medical triage / clinical symptom
  if (
    lower.includes('headache') ||
    lower.includes('triage') ||
    lower.includes('differential diagnosis') ||
    lower.includes('patient presents') ||
    lower.includes('symptom')
  ) {
    return 'Emergency Clinical Symptom Triage'
  }

  // Comparison: "difference between X and Y" / "compare X and Y" / "X vs Y"
  const diffMatch = lower.match(/(?:difference between|compare|difference of)\s+([a-z0-9_\-\.\s]+?)\s+(?:and|with|versus|vs\.?)\s+([a-z0-9_\-\.\s]+?)(?:\.|\?|,|;|$|in|for)/i)
  if (diffMatch) {
    return `${titleCase(cleanTopic(diffMatch[1]))} vs ${titleCase(cleanTopic(diffMatch[2]))} Comparison`
  }

  // Code request with language
  const codeMatch = lower.match(/(?:write|give me|create|provide|generate|implement)\s+(?:a\s+|an\s+)?([a-z#+]+)?\s*(?:code|script|function|program|class|algorithm|query)?\s+(?:for|to|that)\s+([^.?!]+)/i)
  if (codeMatch) {
    const lang = codeMatch[1] && ['python', 'javascript', 'typescript', 'java', 'cpp', 'c++', 'golang', 'rust', 'sql', 'bash', 'ruby', 'c#'].includes(codeMatch[1].toLowerCase()) ? titleCase(codeMatch[1].trim()) : ''
    const topic = titleCase(cleanTopic(codeMatch[2]))
    if (lang) return `${topic} — ${lang} Code`
    return `${topic} Implementation`
  }

  // Explanation
  const explainMatch = lower.match(/(?:explain how|explain why|explain|what is|how does)\s+([^.?!]+?)(?:\s+works?|\s+functions?|\.|\?|$)/i)
  if (explainMatch) {
    const topic = titleCase(cleanTopic(explainMatch[1]))
    return `${topic} Explanation`
  }

  // SQL queries
  const sqlMatch = lower.match(/sql\s+(?:query|statement|command)?\s+(?:to|for)\s+([^.?!]+)/i)
  if (sqlMatch) {
    const topic = titleCase(cleanTopic(sqlMatch[1]))
    return `SQL ${topic}`
  }

  // Optimization
  const optMatch = lower.match(/optimize\s+([^.?!]+?)(?:\s+for\s+([^.?!]+))?(?:\.|\?|$)/i)
  if (optMatch) {
    const topic = titleCase(cleanTopic(optMatch[1]))
    return `${topic} Optimization`
  }

  // Review / Analysis
  const reviewMatch = lower.match(/(?:review|analyze|audit|evaluate|check)\s+([^.?!]+?)(?:\s+for\s+([^.?!]+))?(?:\.|\?|$)/i)
  if (reviewMatch) {
    const topic = titleCase(cleanTopic(reviewMatch[1]))
    const goal = reviewMatch[2] ? ` — ${titleCase(cleanTopic(reviewMatch[2]))}` : ' Analysis'
    return `${topic}${goal}`
  }

  // Fallback: extract key words
  const words = text
    .split(/[\s,.;:!?]+/)
    .filter(
      w =>
        w.length > 2 &&
        !['the', 'and', 'for', 'with', 'from', 'this', 'that', 'please', 'give', 'write', 'can', 'you', 'want'].includes(w.toLowerCase())
    )
    .slice(0, 5)

  return words.length > 0 ? `${titleCase(words.join(' '))} Task` : 'General Task Evaluation'
}

// ─── Searchable Target Model Dropdown Component ─────────────────────────────

function SearchableModelDropdown({
  selectedModelId,
  onSelect,
}: {
  selectedModelId: string
  onSelect: (modelId: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedModel = MODELS.find(m => m.id === selectedModelId) || {
    id: selectedModelId,
    name: selectedModelId,
    provider: 'Custom',
    color: '#8B5CF6',
  }

  // Filter models based on search query
  const filteredModels = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return MODELS
    return MODELS.filter(
      m =>
        m.name.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        (m.category && m.category.toLowerCase().includes(q))
    )
  }, [search])

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    } else {
      setSearch('')
    }
  }, [isOpen])

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--color-input-bg, #ffffff)',
          border: isOpen ? '1px solid var(--color-accent-violet, #7C3AED)' : '1px solid var(--color-border)',
          borderRadius: 10,
          padding: '10px 14px',
          fontSize: 13,
          color: 'var(--color-foreground)',
          cursor: 'pointer',
          boxShadow: isOpen ? '0 0 0 3px rgba(124, 58, 237, 0.15)' : 'none',
          transition: 'all 0.15s ease',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: selectedModel.color,
              flexShrink: 0,
              boxShadow: `0 0 8px ${selectedModel.color}88`,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontWeight: 600, color: 'var(--color-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedModel.name}
            </span>
            <span style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.2 }}>
              {selectedModel.provider}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span
            style={{
              fontSize: 10.5,
              padding: '2px 7px',
              borderRadius: 6,
              background: 'var(--color-surface-deep)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-muted-stronger)',
              fontWeight: 600,
            }}
          >
            {selectedModel.category || 'LLM'}
          </span>
          <IcChevronDown
            size={14}
            style={{
              color: 'var(--color-muted)',
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
        </div>
      </button>

      {/* Floating Search Popover Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-border-light, rgba(140, 140, 140, 0.25))',
            borderRadius: 12,
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(20px)',
            overflow: 'hidden',
            animation: 'dropdownFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Search Input Header */}
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid var(--color-border)',
              background: 'var(--color-surface-deep)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <IcSearch size={14} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Type to search any model or provider..."
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: 12.5,
                color: 'var(--color-foreground)',
                fontFamily: 'Inter, sans-serif',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-muted)',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                }}
              >
                <IcX size={13} />
              </button>
            )}
          </div>

          {/* Model Options List */}
          <div style={{ maxHeight: 250, overflowY: 'auto', padding: '6px' }}>
            {filteredModels.length === 0 ? (
              <div style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 8 }}>
                  No default model found matching "{search}"
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(search.trim())
                    setIsOpen(false)
                  }}
                  style={{
                    fontSize: 12,
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: 'rgba(124, 58, 237, 0.15)',
                    border: '1px solid rgba(124, 58, 237, 0.35)',
                    color: 'var(--color-accent-violet, #7C3AED)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Use Custom Model: <span style={{ fontWeight: 700 }}>"{search}"</span>
                </button>
              </div>
            ) : (
              filteredModels.map(m => {
                const isSelected = m.id === selectedModelId
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      onSelect(m.id)
                      setIsOpen(false)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderRadius: 8,
                      background: isSelected ? 'rgba(124, 58, 237, 0.12)' : 'transparent',
                      border: isSelected ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--color-hover)'
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: m.color,
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: isSelected ? 700 : 500,
                            color: isSelected ? 'var(--color-accent-violet, #7C3AED)' : 'var(--color-foreground)',
                          }}
                        >
                          {m.name}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                          {m.provider} • <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{m.id}</span>
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {m.category && (
                        <span
                          style={{
                            fontSize: 10,
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: 'var(--color-surface-deep)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-muted)',
                          }}
                        >
                          {m.category}
                        </span>
                      )}
                      {isSelected && <IcCheck size={14} style={{ color: 'var(--color-accent-violet, #7C3AED)' }} />}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Radial Gauge Score Visualizer Component ─────────────────────────────────

function PolishedScoreGauge({ score, status }: { score: number; status: 'Passed' | 'Flagged' }) {
  const isPassed = status === 'Passed'
  const strokeColor = score >= 90 ? '#34D399' : score >= 80 ? '#38BDF8' : score >= 70 ? '#FBBF24' : '#F87171'
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '16px 20px',
        borderRadius: 14,
        background: isPassed
          ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.08) 0%, rgba(56, 189, 248, 0.04) 100%)'
          : 'linear-gradient(135deg, rgba(248, 113, 113, 0.1) 0%, rgba(251, 191, 36, 0.04) 100%)',
        border: `1px solid ${isPassed ? 'rgba(52, 211, 153, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
        boxShadow: isPassed
          ? '0 8px 24px rgba(52, 211, 153, 0.12)'
          : '0 8px 24px rgba(248, 113, 113, 0.12)',
      }}
    >
      {/* SVG Radial Gauge */}
      <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
        <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background Track */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke="var(--color-border-light, rgba(255, 255, 255, 0.1))"
            strokeWidth="7"
          />
          {/* Progress Stroke */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </svg>

        {/* Inner Score Number */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 24, fontWeight: 900, color: strokeColor, lineHeight: 1, letterSpacing: '-0.02em' }}>
            {score}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', marginTop: 2, letterSpacing: '0.04em' }}>
            /100
          </span>
        </div>
      </div>

      {/* Status & Verdict Information */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 9999,
              background: isPassed ? 'rgba(52, 211, 153, 0.18)' : 'rgba(248, 113, 113, 0.18)',
              border: `1.5px solid ${isPassed ? '#34D399' : '#F87171'}`,
              color: isPassed ? '#34D399' : '#F87171',
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              boxShadow: isPassed ? '0 0 14px rgba(52, 211, 153, 0.25)' : '0 0 14px rgba(248, 113, 113, 0.25)',
            }}
          >
            {isPassed ? <IcCheck size={14} /> : <IcFlag size={14} />}
            {status}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-muted-stronger)' }}>
            {isPassed ? 'Ready for Production' : 'Requires Review'}
          </span>
        </div>

        <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.4 }}>
          {isPassed
            ? 'All 6 judge consensus thresholds achieved with zero safety violations.'
            : 'Fails quality threshold or guardrail verification. Inspect rubric breakdown below.'}
        </div>
      </div>
    </div>
  )
}

// ─── Judge Score Card Component ──────────────────────────────────────────────

function JudgeScoreCard({ rubric }: { rubric: RubricScore }) {
  const getJudgeIcon = (key: string) => {
    switch (key) {
      case 'accuracy':
        return <IcJudgeAccuracy size={20} color={rubric.color} />
      case 'relevance':
        return <IcJudgeRelevance size={20} color={rubric.color} />
      case 'reasoning':
        return <IcJudgeReasoning size={20} color={rubric.color} />
      case 'hallucination':
        return <IcJudgeHallucination size={20} color={rubric.color} />
      case 'safety':
        return <IcJudgeSafety size={20} color={rubric.color} />
      case 'style':
        return <IcJudgeStyle size={20} color={rubric.color} />
      default:
        return <IcJudge size={20} color={rubric.color} />
    }
  }

  return (
    <div
      style={{
        background: 'var(--color-surface-deep)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `${rubric.color}66`
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = `0 6px 20px ${rubric.color}15`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--color-border)'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Top Row: Icon, Title & Score Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: `${rubric.color}15`,
              border: `1px solid ${rubric.color}33`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {getJudgeIcon(rubric.key)}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)' }}>
              {rubric.label}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--color-muted)', fontWeight: 500 }}>
              Weight {rubric.weight.toFixed(1)}x • {rubric.judge_model_used || 'gpt-oss:120b-cloud'}
            </div>
          </div>
        </div>

        {/* Score Number Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 2,
            padding: '4px 10px',
            borderRadius: 8,
            background: `${rubric.color}18`,
            border: `1px solid ${rubric.color}44`,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 900, color: rubric.color }}>{rubric.score}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)' }}>/100</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${rubric.score}%`,
            background: `linear-gradient(90deg, ${rubric.color}88, ${rubric.color})`,
            borderRadius: 3,
            boxShadow: `0 0 8px ${rubric.color}66`,
            transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>

      {/* Reasoning Output */}
      <div
        style={{
          fontSize: 11.5,
          color: 'var(--color-muted-stronger)',
          lineHeight: 1.45,
          background: 'var(--color-card)',
          padding: '8px 10px',
          borderRadius: 8,
          border: '1px solid var(--color-border-faint)',
        }}
      >
        {rubric.reasoning}
      </div>
    </div>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? '#34D399' : score >= 80 ? '#38BDF8' : score >= 70 ? '#FBBF24' : '#F87171'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 24,
        borderRadius: 6,
        background: `${color}18`,
        border: `1px solid ${color}44`,
        fontSize: 12,
        fontWeight: 700,
        color,
      }}
    >
      {score}
    </span>
  )
}

function StatusPill({ status }: { status: string }) {
  const passed = status === 'Passed'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 22,
        padding: '0 8px',
        borderRadius: 9999,
        background: passed ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
        border: `1px solid ${passed ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
        fontSize: 11,
        fontWeight: 600,
        color: passed ? '#34D399' : '#F87171',
      }}
    >
      {status}
    </span>
  )
}

// ─── Main Component: Evaluations ─────────────────────────────────────────────

export default function Evaluations() {
  const navigate = useNavigate()
  const { profile } = useSettings()
  const currentUserEmail = profile?.email || 'sarah@judgeai.dev'

  const [runs, setRuns] = useState<EvalRunItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [showWorkspace, setShowWorkspace] = useState(true)

  // Form State for New Evaluation (Task Name is automatically derived from prompt)
  const [promptText, setPromptText] = useState(PROMPT_TEMPLATES[0].prompt)
  const [taskName, setTaskName] = useState(() => generateTaskName(PROMPT_TEMPLATES[0].prompt))
  const [selectedModel, setSelectedModel] = useState('claude-3.5-sonnet')
  const [modelOutputText, setModelOutputText] = useState(PROMPT_TEMPLATES[0].output)
  const [copiedReport, setCopiedReport] = useState(false)

  // Automatically synchronize task name whenever prompt text changes
  useEffect(() => {
    if (promptText.trim()) {
      setTaskName(generateTaskName(promptText))
    } else {
      setTaskName('General Task Evaluation')
    }
  }, [promptText])

  // Running State & Results
  const [isRunning, setIsRunning] = useState(false)
  const [evalStep, setEvalStep] = useState<string>('')
  const [evalError, setEvalError] = useState<string | null>(null)
  const [activeResult, setActiveResult] = useState<{
    id: string
    task: string
    model: string
    compositeScore: number
    status: 'Passed' | 'Flagged'
    prompt: string
    response: string
    rubrics: RubricScore[]
  } | null>(null)

  // Filter Bar State
  const [query, setQuery] = useState('')
  const [filterModel, setFilterModel] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 8

  // Load persistent evaluation runs from backend for the authenticated user
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-User-Email': currentUserEmail,
        'X-User-Id': currentUserEmail,
      }
      let res = await fetch(`${DEFAULT_API_BASE}/evaluations/history?limit=100`, { headers }).catch(() => null)
      if (!res || !res.ok) {
        res = await fetch(`${DEFAULT_API_BASE}/evaluations?limit=100`, { headers }).catch(() => null)
      }
      if (!res || !res.ok) {
        res = await fetch(`http://localhost:8000/evaluations/history?limit=100`, { headers }).catch(() => null)
      }
      if (!res || !res.ok) {
        res = await fetch(`http://localhost:8000/evaluations?limit=100`, { headers }).catch(() => null)
      }

      if (res && res.ok) {
        const data = await res.json()
        if (data.runs && Array.isArray(data.runs)) {
          const dbRuns: EvalRunItem[] = data.runs.map((r: any) => ({
            id: r.id,
            task: r.task,
            model: r.model,
            score: r.score,
            judges: r.judges || 6,
            ts: r.ts || 'Recent',
            status: r.status,
            prompt: r.prompt,
            response: r.response,
            rubrics: r.rubrics,
            judge_model: r.judge_model,
            consensus_confidence: r.consensus_confidence,
            summary: r.summary,
          }))
          setRuns(dbRuns)
        } else {
          setRuns([])
        }
      }
    } catch {
      // Error handling
    } finally {
      setLoadingHistory(false)
    }
  }, [currentUserEmail])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // Execute Real LLM Evaluation Run via POST /evaluations/run
  const handleRunEvaluation = async () => {
    if (!taskName.trim() || !promptText.trim() || !modelOutputText.trim() || isRunning) return

    setIsRunning(true)
    setEvalError(null)
    setActiveResult(null)
    setEvalStep('Dispatching task prompt & model output to Evaluation Agent (gpt-oss:120b-cloud)...')

    try {
      const payload = {
        task_name: taskName.trim(),
        prompt_input: promptText.trim(),
        model_output: modelOutputText.trim(),
        target_model: selectedModel,
        judge_model: 'gpt-oss:120b-cloud',
        user_id: currentUserEmail,
      }

      let res: Response | null = null
      let networkError: any = null

      const authHeaders = {
        'Content-Type': 'application/json',
        'X-User-Email': currentUserEmail,
        'X-User-Id': currentUserEmail,
      }

      // Attempt primary backend URL (port 8001)
      try {
        res = await fetch(`${DEFAULT_API_BASE}/evaluations/run`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(payload),
        })
      } catch (err) {
        networkError = err
      }

      // If port 8001 was unreachable, attempt fallback to port 8000
      if (!res || !res.ok) {
        try {
          const fallbackRes = await fetch('http://localhost:8000/evaluations/run', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify(payload),
          })
          if (fallbackRes.ok) {
            res = fallbackRes
            networkError = null
          }
        } catch {}
      }

      if (networkError && (!res || !res.ok)) {
        throw new Error(
          `Unable to connect to the Evaluation Agent at ${DEFAULT_API_BASE}/evaluations/run. Please ensure the backend is running.`
        )
      }

      if (!res || !res.ok) {
        let errDetail = `Server returned HTTP ${res?.status || 500}`
        try {
          const errData = await res?.json()
          errDetail = errData.detail || errData.message || errDetail
        } catch {}
        throw new Error(errDetail)
      }

      const data = await res.json()

      const newRunItem: EvalRunItem = {
        id: data.id,
        task: data.task,
        model: data.model,
        score: data.score,
        judges: data.judges || data.rubrics?.length || 6,
        ts: data.ts || 'Just now',
        status: data.status,
        prompt: data.prompt,
        response: data.response,
        rubrics: data.rubrics || [],
        judge_model: data.judge_model || 'gpt-oss:120b-cloud',
        consensus_confidence: data.consensus_confidence,
        summary: data.summary,
      }

      setRuns(prev => [newRunItem, ...prev.filter(r => r.id !== newRunItem.id)])
      setActiveResult({
        id: data.id,
        task: data.task,
        model: data.model,
        compositeScore: data.score,
        status: data.status,
        prompt: data.prompt,
        response: data.response,
        rubrics: data.rubrics || [],
      })
    } catch (err: any) {
      setEvalError(err?.message || 'Evaluation run failed. Please verify the backend connection.')
    } finally {
      setIsRunning(false)
      setEvalStep('')
    }
  }

  // Handle Copy Report
  const handleCopyReport = () => {
    if (!activeResult) return
    const report = `JudgeAI Evaluation Report: ${activeResult.task}\nTarget Model: ${activeResult.model}\nOverall Composite Score: ${activeResult.compositeScore}/100 (${activeResult.status})\n\nRubric Breakdown:\n${activeResult.rubrics.map(r => `- ${r.label}: ${r.score}/100 -> ${r.reasoning}`).join('\n')}`
    navigator.clipboard.writeText(report)
    setCopiedReport(true)
    setTimeout(() => setCopiedReport(false), 2000)
  }

  // Filtered evaluation history
  const filtered = useMemo(() => {
    return runs.filter(r => {
      if (query && !r.task.toLowerCase().includes(query.toLowerCase()) && !r.id.includes(query)) return false
      if (filterModel !== 'all' && r.model !== filterModel) return false
      if (filterStatus !== 'all' && r.status !== filterStatus) return false
      return true
    })
  }, [runs, query, filterModel, filterStatus])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const selectStyle: React.CSSProperties = {
    fontSize: 12.5,
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid var(--color-border)',
    background: 'var(--color-input-bg)',
    color: 'var(--color-foreground)',
    outline: 'none',
    cursor: 'pointer',
  }

  return (
    <>
      <TopBar title="Evaluations Workspace">
        <button
          onClick={() => setShowWorkspace(!showWorkspace)}
          className="pill-primary"
          style={{ fontSize: 13, padding: '8px 16px', gap: 6, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        >
          <IcPlus size={14} /> {showWorkspace ? 'Hide Form' : 'New Evaluation'}
        </button>
      </TopBar>

      <PageContent>
        {/* Workspace Runner Area */}
        {showWorkspace && (
          <div
            className="card-base"
            style={{
              padding: 24,
              marginBottom: 28,
              borderRadius: 16,
              background: 'linear-gradient(180deg, rgba(124,58,237,0.06) 0%, var(--color-card) 100%)',
              border: '1px solid rgba(124,58,237,0.25)',
            }}
          >
            {/* Header with Title & Quick Preset Templates */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #7C3AED, #38BDF8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IcSparkles size={18} style={{ color: '#fff' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-foreground)' }}>
                    Run New Model Evaluation
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                    Evaluate prompts & model outputs across 6 core multi-agent quality rubrics powered by <span style={{ fontWeight: 600, color: 'var(--color-accent-violet, #7C3AED)' }}>gpt-oss:120b-cloud</span>
                  </div>
                </div>
              </div>

              {/* Template Selectors */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', marginRight: 2 }}>Presets:</span>
                {PROMPT_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPromptText(tmpl.prompt)
                      setModelOutputText(tmpl.output)
                      setEvalError(null)
                    }}
                    style={{
                      fontSize: 11,
                      padding: '5px 11px',
                      borderRadius: 7,
                      background: 'var(--color-surface-deep)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-muted-stronger)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(124,58,237,0.15)'
                      e.currentTarget.style.borderColor = 'rgba(124,58,237,0.35)'
                      e.currentTarget.style.color = 'var(--color-foreground)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'var(--color-surface-deep)'
                      e.currentTarget.style.borderColor = 'var(--color-border)'
                      e.currentTarget.style.color = 'var(--color-muted-stronger)'
                    }}
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Top Inputs: Task Name (Auto-Generated) & Searchable Model Dropdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1.4fr) minmax(240px, 1fr)', gap: 16, marginBottom: 18 }}>
              {/* Task Title (Auto-Generated from Prompt) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Evaluation Task Name
                  </label>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--color-accent-violet, #7C3AED)', background: 'rgba(124,58,237,0.1)', padding: '1px 7px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <IcSparkles size={11} /> Auto-Generated
                  </span>
                </div>
                <input
                  type="text"
                  value={taskName}
                  readOnly
                  placeholder="Auto-generated from Prompt / Task Input..."
                  style={{
                    width: '100%',
                    background: 'var(--color-input-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 10,
                    padding: '11px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-foreground)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'default',
                  }}
                />
              </div>

              {/* Searchable Model Selector */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Select Target Model
                </label>
                <SearchableModelDropdown
                  selectedModelId={selectedModel}
                  onSelect={id => setSelectedModel(id)}
                />
              </div>
            </div>

            {/* SEPARATED TEXT AREAS: Prompt / Task Input & Model Output */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 20 }}>
              {/* Text Area 1: Prompt / Task Input */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Prompt / Task Input
                  </label>
                  <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                    {promptText.length} chars
                  </span>
                </div>
                <textarea
                  value={promptText}
                  onChange={e => setPromptText(e.target.value)}
                  placeholder="Enter system instructions, user prompt, or criteria given to the model..."
                  rows={6}
                  style={{
                    width: '100%',
                    background: 'var(--color-input-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    fontSize: 12.5,
                    color: 'var(--color-foreground)',
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    lineHeight: 1.5,
                  }}
                />
              </div>

              {/* Text Area 2: Model Output to Evaluate */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Model Output to Evaluate
                  </label>
                  <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                    {modelOutputText.length} chars
                  </span>
                </div>
                <textarea
                  value={modelOutputText}
                  onChange={e => setModelOutputText(e.target.value)}
                  placeholder="Paste the AI-generated model response, draft, or code to evaluate..."
                  rows={6}
                  style={{
                    width: '100%',
                    background: 'var(--color-input-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    fontSize: 12.5,
                    color: 'var(--color-foreground)',
                    outline: 'none',
                    fontFamily: 'JetBrains Mono, monospace',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    lineHeight: 1.5,
                  }}
                />
              </div>
            </div>

            {/* Run Button & Evaluation Meta Action */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <IcJudge size={15} style={{ color: 'var(--color-accent-violet, #7C3AED)' }} />
                <span>Runs 6 Parallel Judges: Accuracy, Relevance, Reasoning, Hallucination, Safety & Style</span>
              </div>
              <button
                type="button"
                onClick={handleRunEvaluation}
                disabled={isRunning || !taskName.trim() || !promptText.trim() || !modelOutputText.trim()}
                className="pill-primary"
                style={{
                  padding: '10px 24px',
                  fontSize: 14,
                  fontWeight: 600,
                  gap: 8,
                  opacity: isRunning || !taskName.trim() || !promptText.trim() || !modelOutputText.trim() ? 0.5 : 1,
                  cursor: isRunning ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {isRunning ? <IcRotate size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <IcSparkles size={16} />}
                <span>{isRunning ? 'Evaluating with Judges...' : 'Run Evaluation'}</span>
              </button>
            </div>

            {/* Running Step Status Indicator */}
            {isRunning && (
              <div
                style={{
                  marginTop: 18,
                  padding: '14px 18px',
                  borderRadius: 10,
                  background: 'rgba(124,58,237,0.12)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#38BDF8', animation: 'ping 1s infinite' }} />
                <span style={{ fontSize: 13, color: 'var(--color-foreground)', fontWeight: 500 }}>{evalStep}</span>
              </div>
            )}

            {/* Error Message Alert */}
            {evalError && (
              <div
                style={{
                  marginTop: 18,
                  padding: '14px 18px',
                  borderRadius: 10,
                  background: 'rgba(248, 113, 113, 0.12)',
                  border: '1px solid rgba(248, 113, 113, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  color: '#F87171',
                  fontSize: 13,
                }}
              >
                <IcFlag size={16} style={{ flexShrink: 0 }} />
                <span><strong>Evaluation Error:</strong> {evalError}</span>
              </div>
            )}

            {/* PROMINENT POLISHED EVALUATION RESULTS CARD */}
            {activeResult && !isRunning && (
              <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--color-border)' }}>
                {/* Result Header & Prominent Score Visualizer */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'center', marginBottom: 24 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#34D399',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          background: 'rgba(52, 211, 153, 0.12)',
                          padding: '2px 8px',
                          borderRadius: 6,
                          border: '1px solid rgba(52, 211, 153, 0.25)',
                        }}
                      >
                        Evaluation Complete
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--color-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                        ID: #{activeResult.id}
                      </span>
                    </div>
                    <h4 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: 'var(--color-foreground)' }}>
                      {activeResult.task}
                    </h4>
                    <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                      Target Model: <span style={{ fontWeight: 600, color: 'var(--color-foreground)' }}>{activeResult.model}</span> • Evaluated with <span style={{ fontWeight: 600, color: 'var(--color-accent-violet, #7C3AED)' }}>gpt-oss:120b-cloud</span>
                    </div>
                  </div>

                  {/* Polished Radial Gauge & Status Visualizer */}
                  <PolishedScoreGauge
                    score={activeResult.compositeScore}
                    status={activeResult.status}
                  />
                </div>

                {/* Actions Toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    6 Automated Judge Score Breakdown
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={handleCopyReport}
                      className="pill-outline"
                      style={{ fontSize: 12, padding: '6px 12px', gap: 6, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                    >
                      {copiedReport ? <IcCheck size={14} style={{ color: '#34D399' }} /> : <IcCopy size={14} />}
                      <span>{copiedReport ? 'Report Copied!' : 'Copy Summary'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/evaluations/${activeResult.id}`)}
                      className="pill-primary"
                      style={{ fontSize: 12, padding: '6px 14px', gap: 4, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                    >
                      View Deep Analysis <IcChevronRight size={14} />
                    </button>
                  </div>
                </div>

                {/* 6 Score Breakdown Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 24 }}>
                  {activeResult.rubrics.map(r => (
                    <JudgeScoreCard key={r.key} rubric={r} />
                  ))}
                </div>

                {/* Model Response Box */}
                <div style={{ background: 'var(--color-surface-deep)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Evaluated Model Output ({activeResult.model})
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                      Evaluated against ground truth
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: 'var(--color-foreground)',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'JetBrains Mono, monospace',
                      background: 'var(--color-card)',
                      padding: 12,
                      borderRadius: 8,
                      border: '1px solid var(--color-border-faint)',
                      maxHeight: 220,
                      overflowY: 'auto',
                    }}
                  >
                    {activeResult.response}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Evaluation History Header & Filter Bar */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-foreground)', marginRight: 8 }}>
            Evaluation History ({filtered.length})
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
            <IcSearch size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
            <input
              value={query}
              onChange={e => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Search by task or run ID…"
              style={{
                width: '100%',
                fontSize: 12.5,
                padding: '8px 12px 8px 34px',
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                background: 'var(--color-input-bg)',
                color: 'var(--color-foreground)',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-muted)' }}>
            <IcFilter size={14} />
          </div>

          <select
            value={filterModel}
            onChange={e => {
              setFilterModel(e.target.value)
              setPage(1)
            }}
            style={selectStyle}
          >
            <option value="all">All models</option>
            {MODELS.map(m => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={e => {
              setFilterStatus(e.target.value)
              setPage(1)
            }}
            style={selectStyle}
          >
            <option value="all">All statuses</option>
            <option value="Passed">Passed</option>
            <option value="Flagged">Flagged</option>
          </select>

          {(query || filterModel !== 'all' || filterStatus !== 'all') && (
            <button
              onClick={() => {
                setQuery('')
                setFilterModel('all')
                setFilterStatus('all')
                setPage(1)
              }}
              style={{ fontSize: 12, color: 'var(--color-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* History Table */}
        <div className="card-base" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Task', 'Model', 'Overall Score', 'Judges', 'Time', 'Status', ''].map(h => (
                    <th
                      key={h}
                      style={{
                        padding: '12px 20px',
                        textAlign: 'left',
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--color-muted)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px 24px', textAlign: 'center', fontSize: 13, color: 'var(--color-muted)' }}>
                      No evaluation runs match these filters.
                    </td>
                  </tr>
                )}
                {visible.map(r => (
                  <tr
                    key={r.id}
                    onClick={() => navigate(`/dashboard/evaluations/${r.id}`)}
                    style={{ borderBottom: '1px solid var(--color-border-faint)', transition: 'background 0.1s', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '13px 20px', fontSize: 13, color: 'var(--color-foreground)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                      {r.task}
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: 12, color: 'var(--color-muted)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>
                      {r.model}
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <ScoreBadge score={r.score} />
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: 13, color: 'var(--color-muted)' }}>
                      {r.judges}/6
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: 12, color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                      {r.ts}
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <StatusPill status={r.status} />
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <Link
                        to={`/dashboard/evaluations/${r.id}`}
                        style={{ fontSize: 12, color: 'var(--color-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-foreground)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
                      >
                        View <IcChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderTop: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                Page {page} of {pageCount}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{
                    fontSize: 12,
                    padding: '6px 12px',
                    borderRadius: 7,
                    border: '1px solid var(--color-border)',
                    background: 'transparent',
                    color: page === 1 ? 'var(--color-muted-weak)' : 'var(--color-muted-stronger)',
                    cursor: page === 1 ? 'default' : 'pointer',
                  }}
                >
                  Previous
                </button>
                <button
                  disabled={page === pageCount}
                  onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                  style={{
                    fontSize: 12,
                    padding: '6px 12px',
                    borderRadius: 7,
                    border: '1px solid var(--color-border)',
                    background: 'transparent',
                    color: page === pageCount ? 'var(--color-muted-weak)' : 'var(--color-muted-stronger)',
                    cursor: page === pageCount ? 'default' : 'pointer',
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </PageContent>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes ping { 0% { transform: scale(1); opacity: 1; } 75%, 100% { transform: scale(2); opacity: 0; } }
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  )
}
