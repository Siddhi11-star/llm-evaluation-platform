import { useState, useEffect, useRef, useMemo } from 'react'
import { TopBar, PageContent } from '../components/AppShell'
import { History, Trash2, Filter } from 'lucide-react'
import {
  IcSparkles,
  IcCheck,
  IcRotate,
  IcChevronDown,
  IcJudge,
  IcDownload,
  IcCopy,
  IcArrowRight,
  IcSearch,
  IcCpu,
  IcExternalLink,
} from '../components/icons'

// ─── Available Models ───────────────────────────────────────────────────────

export type ModelOption = {
  id: string
  name: string
  provider: string
  color: string
}

export const AVAILABLE_MODELS: ModelOption[] = [
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', color: '#7C3AED' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', color: '#10A37F' },
  { id: 'gemini-2-flash', name: 'Gemini 2.0 Flash', provider: 'Google', color: '#38BDF8' },
  { id: 'deepseek-v3', name: 'DeepSeek V3', provider: 'DeepSeek', color: '#F59E0B' },
  { id: 'llama-3-3-70b', name: 'Llama 3.3 70B', provider: 'Meta', color: '#EC4899' },
  { id: 'mistral-large-2', name: 'Mistral Large 2', provider: 'Mistral', color: '#EF4444' },
]

export const JUDGE_MODELS = [
  { id: 'judgeai-meta', name: 'JudgeAI Meta-Judge (G-Eval Strict)', badge: 'Recommended' },
  { id: 'claude-3-5-sonnet-judge', name: 'Claude 3.5 Sonnet (Evaluator)', badge: 'High Rigor' },
  { id: 'gpt-4o-judge', name: 'GPT-4o (Evaluator)', badge: 'Fast Judge' },
]

export type FactorScore = {
  factor: string
  label: string
  scoreA: number
  scoreB: number
  winner: 'A' | 'B' | 'Tie'
  color: string
  rationale: string
}

export type JudgeResult = {
  winnerName: string
  winnerKey: 'A' | 'B' | 'Tie'
  overallA: number
  overallB: number
  margin: number
  confidence: number
  verdictSummary: string
  factors: FactorScore[]
  strengthsA: string[]
  weaknessesA: string[]
  strengthsB: string[]
  weaknessesB: string[]
}

export type JudgeHistoryItem = {
  id: string
  timestamp: string
  title?: string
  prompt: string
  modelA: string
  modelB: string
  responseA: string
  responseB: string
  judgeModel: string
  judgeResult: JudgeResult
}

export const INITIAL_JUDGE_HISTORY: JudgeHistoryItem[] = [
  {
    id: 'judge-rec-101',
    timestamp: 'Today, 02:45 PM',
    title: 'Legal Contract Indemnity Review',
    prompt: 'Analyze this indemnity clause and explain the liability risks for the vendor:\n\n"Vendor shall indemnify, defend, and hold harmless Client against any and all claims, damages, liabilities, losses, and expenses (including attorneys fees) arising out of or resulting from any breach of warranty, negligence, or willful misconduct by Vendor or its subcontractors."',
    modelA: 'Claude 3.5 Sonnet',
    modelB: 'GPT-4o',
    responseA: `### Indemnity Clause Risk Analysis for Vendor\n\n**Key Risk Vectors Identified:**\n1. **Uncapped Liability Exposure:** The phrase "any and all claims, damages, liabilities" lacks an aggregate monetary cap (e.g., total contract value). This leaves the vendor exposed to catastrophic loss.\n2. **Attorney Fees Burden from Inception:** Expressly includes legal fees regardless of whether the underlying claim prevails in court.\n3. **Strict Subcontractor Scope:** The vendor is strictly liable for third-party subcontractors without requiring proof of direct vendor supervisory negligence.\n\n**Recommended Redlines:**\n- Add a monetary liability cap equal to fees paid in the prior 12 months.\n- Carve out indirect, incidental, and consequential damages.\n- Require prompt written notice, right to control defense, and consent for settlements.`,
    responseB: `This indemnity clause requires the Vendor to cover all losses and legal fees for breaches, negligence, or misconduct by the vendor or subcontractors.\n\n**Key Risks:**\n- The vendor pays for legal and attorney fees.\n- Subcontractor actions are included in the indemnity scope.\n- There is no monetary ceiling or cap specified.\n\n**Practical Advice:**\nYou should request a liability cap in Section 8 and ensure your commercial general liability (CGL) insurance policy limits cover indemnification claims.`,
    judgeModel: 'judgeai-meta',
    judgeResult: {
      winnerName: 'Claude 3.5 Sonnet',
      winnerKey: 'A',
      overallA: 9.4,
      overallB: 8.1,
      margin: 1.3,
      confidence: 88,
      verdictSummary: 'Claude 3.5 Sonnet provided a far more comprehensive legal risk breakdown with concrete contractual redlines, while GPT-4o only offered high-level bullet points without granular indemnity risk mitigations.',
      factors: [
        { factor: 'Legal Precision & Nuance', label: 'Legal Precision', scoreA: 9.6, scoreB: 8.2, winner: 'A', color: '#7C3AED', rationale: 'Identified absence of consequential damage carveouts and uncapped liability.' },
        { factor: 'Actionable Redlines', label: 'Redline Quality', scoreA: 9.5, scoreB: 7.8, winner: 'A', color: '#38BDF8', rationale: 'Provided clause-by-clause contract redline modifications.' },
        { factor: 'Completeness', label: 'Completeness', scoreA: 9.3, scoreB: 8.4, winner: 'A', color: '#10A37F', rationale: 'Evaluated subcontractor negligence liabilities thoroughly.' },
        { factor: 'Conciseness & Structure', label: 'Structure', scoreA: 9.1, scoreB: 8.6, winner: 'A', color: '#F59E0B', rationale: 'Crisp markdown formatting with distinct sections.' },
        { factor: 'Risk Identification', label: 'Risk ID', scoreA: 9.5, scoreB: 8.0, winner: 'A', color: '#EC4899', rationale: 'Flagged immediate attorney fees burden risk.' },
        { factor: 'Practical Advice', label: 'Actionability', scoreA: 9.0, scoreB: 7.9, winner: 'A', color: '#6366F1', rationale: 'Concrete actionable remedies suggested.' },
      ],
      strengthsA: ['Granular identification of uncapped liability exposure', 'Explicit contractual redline suggestions', 'Professional corporate legal taxonomy'],
      weaknessesA: ['Could incorporate insurance subrogation nuances'],
      strengthsB: ['Clear and quick to read', 'Mentioned CGL insurance policy alignment'],
      weaknessesB: ['Missed consequential damages distinction', 'Lacks specific redlining clauses'],
    },
  },
  {
    id: 'judge-rec-102',
    timestamp: 'Yesterday, 06:15 PM',
    title: 'Python Memory Optimization',
    prompt: 'Optimize this Python function for high-throughput string deduplication in large memory streams:\n\ndef dedupe(items):\n    res = []\n    for x in items:\n        if x not in res:\n            res.append(x)\n    return res',
    modelA: 'Gemini 2.0 Flash',
    modelB: 'DeepSeek V3',
    responseA: `def dedupe(items):\n    # O(N) using dict.fromkeys to preserve insertion order\n    return list(dict.fromkeys(items))\n\n# Benchmark & Complexity Analysis:\n# - Time Complexity: O(N) average time vs original O(N^2).\n# - Memory Overhead: Minimal hash table overhead in Python 3.7+ compact dict implementation.\n# - Preserves original element insertion order cleanly.`,
    responseB: `def dedupe_optimized(items):\n    seen = set()\n    seen_add = seen.add\n    return [x for x in items if not (x in seen or seen_add(x))]\n\n# Technical Breakdown:\n# 1. set.add returns None (falsy in Python), allowing in-line membership check and insertion.\n# 2. Local variable binding of seen_add avoids attribute lookup in Python bytecode loop.\n# 3. Time complexity: O(N) | Space: O(N).`,
    judgeModel: 'judgeai-meta',
    judgeResult: {
      winnerName: 'DeepSeek V3',
      winnerKey: 'B',
      overallA: 8.8,
      overallB: 9.2,
      margin: 0.4,
      confidence: 76,
      verdictSummary: 'DeepSeek V3 provided an advanced bytecode-level optimization (local bound method lookup) with comprehensive algorithmic rationale, giving it a slight edge over Gemini 2.0 Flash.',
      factors: [
        { factor: 'Algorithmic Efficiency', label: 'Efficiency', scoreA: 8.9, scoreB: 9.4, winner: 'B', color: '#F59E0B', rationale: 'Local method binding saves CPython opcode dispatch cycles.' },
        { factor: 'Memory Overhead', label: 'Memory', scoreA: 8.8, scoreB: 9.0, winner: 'B', color: '#10A37F', rationale: 'Set footprint is comparable, but list comprehension stream overhead is minimal.' },
        { factor: 'Idiomatic Style', label: 'Idiomatic', scoreA: 9.2, scoreB: 8.9, winner: 'A', color: '#38BDF8', rationale: 'dict.fromkeys is more commonly accepted Python idiom.' },
        { factor: 'Explanation Depth', label: 'Explanation', scoreA: 8.5, scoreB: 9.3, winner: 'B', color: '#7C3AED', rationale: 'Explains bytecode attribute lookup avoidance in detail.' },
        { factor: 'Order Preservation', label: 'Order', scoreA: 9.0, scoreB: 9.0, winner: 'Tie', color: '#EC4899', rationale: 'Both solutions preserve insertion order.' },
      ],
      strengthsA: ['Extremely clean Python standard idiom using dict.fromkeys', 'Clear complexity annotations'],
      weaknessesA: ['Did not demonstrate custom generator/streaming for infinite iterators'],
      strengthsB: ['Demonstrated deep CPython runtime knowledge with local seen_add binding', 'Fastest execution for large datasets'],
      weaknessesB: ['Less readable for beginner Python engineers'],
    },
  },
  {
    id: 'judge-rec-103',
    timestamp: 'Aug 29, 11:20 AM',
    title: 'Medical Emergency Triage QA',
    prompt: 'A 45-year-old patient presents with sudden severe headache ("worst of life"), neck stiffness, and photophobia. What is the immediate differential diagnosis and next diagnostic workup?',
    modelA: 'Claude 3.5 Sonnet',
    modelB: 'Llama 3.3 70B',
    responseA: `### Medical Triage & Differential Diagnosis\n\n**Primary Suspected Diagnosis (Medical Emergency):**\n- **Subarachnoid Hemorrhage (SAH)**: The classical "thunderclap headache" ("worst headache of life") with meningismus (neck stiffness, photophobia) must be treated as a ruptured aneurysm until proven otherwise.\n\n**Immediate Diagnostic Workup:**\n1. **Non-contrast Head CT**: Highest sensitivity (>98%) within the first 6 hours of symptom onset.\n2. **Lumbar Puncture (LP)**: Required if CT is negative or equivocal, looking for xanthochromia (RBC breakdown) and elevated opening pressure.\n3. **CT Angiography (CTA)**: To identify vascular aneurysm source once hemorrhage is confirmed.\n\n**Red Flag Precautions:**\n- Maintain airway, monitor blood pressure, and obtain emergent neurosurgical consultation immediately.`,
    responseB: `The patient is likely suffering from a Subarachnoid Hemorrhage (SAH) or acute meningitis.\n\n**Recommendations:**\n- Do an urgent non-contrast CT scan of the head immediately.\n- If negative, perform a lumbar puncture to check for blood in cerebrospinal fluid.\n- Check vital signs and start IV pain management.\n- Consult neurology right away.`,
    judgeModel: 'judgeai-meta',
    judgeResult: {
      winnerName: 'Claude 3.5 Sonnet',
      winnerKey: 'A',
      overallA: 9.7,
      overallB: 8.1,
      margin: 1.6,
      confidence: 92,
      verdictSummary: 'Claude 3.5 Sonnet exhibited clinical-grade rigor, specifying diagnostic sensitivities, xanthochromia detection on lumbar puncture, and CTA sequencing.',
      factors: [
        { factor: 'Clinical Accuracy', label: 'Accuracy', scoreA: 9.8, scoreB: 8.3, winner: 'A', color: '#7C3AED', rationale: 'Correctly outlined exact emergency protocol and 6-hour CT sensitivity.' },
        { factor: 'Diagnostic Sequencing', label: 'Sequencing', scoreA: 9.7, scoreB: 8.0, winner: 'A', color: '#38BDF8', rationale: 'Outlined CT -> LP (xanthochromia) -> CTA workflow.' },
        { factor: 'Patient Safety & Red Flags', label: 'Safety', scoreA: 9.6, scoreB: 8.2, winner: 'A', color: '#10A37F', rationale: 'Explicit warnings on airway and emergent neurosurgical consult.' },
        { factor: 'Clarity & Urgency', label: 'Clarity', scoreA: 9.5, scoreB: 8.4, winner: 'A', color: '#EC4899', rationale: 'Professional emergency medicine formatting.' },
      ],
      strengthsA: ['Precise diagnostic sensitivity windows and xanthochromia metrics', 'Clear emergency precautions'],
      weaknessesA: ['Could mention specific blood pressure targets (e.g. SBP < 140)'],
      strengthsB: ['Direct and urgent tone', 'Correct high-level testing order'],
      weaknessesB: ['Did not mention CTA or CSF xanthochromia markers'],
    },
  },
]

// ─── Judge Agent Minimal Splash Screen ────────────────────────────────────────

function JudgeSplashScreen() {
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
      {/* Ambient Glow */}
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
          animation: 'judgeSplashFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Prominent Illustration */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <img
            src="/judge-agent-illustration.png"
            alt="Judge Agent Battle"
            style={{
              width: 340,
              maxWidth: '85vw',
              height: 'auto',
              filter: 'drop-shadow(0 20px 45px rgba(124, 58, 237, 0.35))',
              userSelect: 'none',
              pointerEvents: 'none',
              animation: 'judgeFloat 3s ease-in-out infinite',
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
          <IcSparkles size={12} /> Pairwise Model Arbitration
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
          Judge Agent
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
          Comparing AI responses and determining the stronger answer…
        </p>

        {/* 5-Second Progress Indicator */}
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
              animation: 'judgeProgress 5s linear forwards',
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Main Component: JudgeConfig ─────────────────────────────────────────────

export default function JudgeConfig() {
  // Splash state — 5-second initial mount transition
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  const [viewMode, setViewMode] = useState<'workspace' | 'history'>('workspace')
  const [judgeHistory, setJudgeHistory] = useState<JudgeHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('judge_agent_history')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {}
    return INITIAL_JUDGE_HISTORY
  })
  const [historyQuery, setHistoryQuery] = useState('')
  const [historyWinnerFilter, setHistoryWinnerFilter] = useState<'all' | 'A' | 'B' | 'Tie'>('all')

  const [prompt, setPrompt] = useState(INITIAL_JUDGE_HISTORY[0].prompt)
  const [modelA, setModelA] = useState(INITIAL_JUDGE_HISTORY[0].modelA)
  const [modelB, setModelB] = useState(INITIAL_JUDGE_HISTORY[0].modelB)
  const [responseA, setResponseA] = useState(INITIAL_JUDGE_HISTORY[0].responseA)
  const [responseB, setResponseB] = useState(INITIAL_JUDGE_HISTORY[0].responseB)

  const [judgeModel, setJudgeModel] = useState(JUDGE_MODELS[0].id)
  const [isGeneratingResponses, setIsGeneratingResponses] = useState(false)
  const [isJudging, setIsJudging] = useState(false)
  const [judgeResult, setJudgeResult] = useState<JudgeResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const promptTextareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (promptTextareaRef.current) {
      promptTextareaRef.current.style.height = 'auto'
      promptTextareaRef.current.style.height = `${Math.max(90, promptTextareaRef.current.scrollHeight + 4)}px`
    }
  }, [prompt])

  const modelAObj = AVAILABLE_MODELS.find(m => m.name === modelA) || AVAILABLE_MODELS[0]
  const modelBObj = AVAILABLE_MODELS.find(m => m.name === modelB) || AVAILABLE_MODELS[1]

  const handleReset = () => {
    setPrompt('')
    setResponseA('')
    setResponseB('')
    setJudgeResult(null)
    setErrorMessage(null)
    setToastMessage('Workspace cleared')
    setTimeout(() => setToastMessage(null), 2000)
  }

  const loadHistoryItem = (item: JudgeHistoryItem) => {
    setPrompt(item.prompt)
    setModelA(item.modelA)
    setModelB(item.modelB)
    setResponseA(item.responseA)
    setResponseB(item.responseB)
    setJudgeModel(item.judgeModel || JUDGE_MODELS[0].id)
    setJudgeResult(item.judgeResult)
    setViewMode('workspace')
    setToastMessage(`Loaded comparison: ${item.title || item.judgeResult.winnerName}`)
    setTimeout(() => setToastMessage(null), 2500)
  }

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setJudgeHistory(prev => {
      const updated = prev.filter(item => item.id !== id)
      try { localStorage.setItem('judge_agent_history', JSON.stringify(updated)) } catch (err) {}
      return updated
    })
    setToastMessage('Comparison removed from history')
    setTimeout(() => setToastMessage(null), 2000)
  }

  const handleClearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear all judge comparison history?')) {
      setJudgeHistory([])
      try { localStorage.removeItem('judge_agent_history') } catch (err) {}
      setToastMessage('All history cleared')
      setTimeout(() => setToastMessage(null), 2000)
    }
  }

  const filteredHistory = useMemo(() => {
    return judgeHistory.filter(item => {
      const matchQuery =
        !historyQuery.trim() ||
        item.prompt.toLowerCase().includes(historyQuery.toLowerCase()) ||
        item.modelA.toLowerCase().includes(historyQuery.toLowerCase()) ||
        item.modelB.toLowerCase().includes(historyQuery.toLowerCase()) ||
        item.judgeResult.winnerName.toLowerCase().includes(historyQuery.toLowerCase()) ||
        (item.title && item.title.toLowerCase().includes(historyQuery.toLowerCase()))

      const matchWinner =
        historyWinnerFilter === 'all' ||
        item.judgeResult.winnerKey === historyWinnerFilter

      return matchQuery && matchWinner
    })
  }, [judgeHistory, historyQuery, historyWinnerFilter])

  const handleGenerateBoth = () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt first.')
      return
    }

    setIsGeneratingResponses(true)
    setResponseA('')
    setResponseB('')
    setJudgeResult(null)

    setTimeout(() => {
      const text = prompt.toLowerCase()
      let genA = ''
      let genB = ''

      if (text.includes('code') || text.includes('python') || text.includes('function') || text.includes('optimize')) {
        genA = `### ${modelA} Optimization & Analysis\n\n\`\`\`python\ndef optimize_stream(data):\n    # O(N) time and minimal memory allocation\n    return list(dict.fromkeys(data))\n\`\`\`\n\n- **Time Complexity:** O(N) linear time.\n- **Space Complexity:** O(N) hash footprint.\n- **Benefits:** Cleanest Pythonic implementation with C-level speed.`
        genB = `### ${modelB} Implementation\n\n\`\`\`python\ndef dedupe(seq):\n    seen = set()\n    return [x for x in seq if not (x in seen or seen.add(x))]\n\`\`\`\n\n- Uses inline set caching for fast lookups.\n- Preserves order while iterating over stream elements.`
      } else if (text.includes('legal') || text.includes('contract') || text.includes('indemnity')) {
        genA = `### ${modelA} Comprehensive Legal Assessment\n\n1. **Uncapped Liability Exposure:** The phrase covers unlimited indemnification without contractual ceiling.\n2. **Attorney Fees:** Includes all litigation costs regardless of outcome.\n3. **Recommendation:** Add a 12-month fee cap and mutual indemnity language.`
        genB = `### ${modelB} Summary\n\n- Vendor is responsible for subcontractor faults and all legal expenses.\n- There is no liability limit.\n- **Advice:** Negotiate an aggregate cap before signing.`
      } else {
        genA = `### ${modelA} Detailed Response\n\nRegarding: *"${prompt.slice(0, 70)}..."*\n\n1. **Structured Breakdown:** Evaluated all constraints with precision.\n2. **Depth of Analysis:** Provided step-by-step reasoning with edge case coverage.\n3. **Actionable Recommendations:** Outlined concrete next steps.`
        genB = `### ${modelB} Direct Response\n\nHere is the resolution for your inquiry:\n\n- Directly addresses the core prompt objective.\n- Concise summary with clear takeaways.\n- Recommended next actions provided.`
      }

      setResponseA(genA)
      setResponseB(genB)
      setIsGeneratingResponses(false)
      setToastMessage('Generated responses for Model A and Model B!')
      setTimeout(() => setToastMessage(null), 2500)
    }, 1000)
  }

  const handleJudge = async () => {
    if (!prompt.trim() || !responseA.trim() || !responseB.trim()) {
      alert('Please provide a prompt and responses for both models.')
      return
    }

    setIsJudging(true)
    setJudgeResult(null)
    setErrorMessage(null)

    try {
      const res = await fetch('http://localhost:8002/judge/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model_a: modelA,
          model_b: modelB,
          response_a: responseA.trim(),
          response_b: responseB.trim(),
          judge_model: 'gpt-oss:120b-cloud',
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || `Judge server returned status ${res.status}`)
      }

      const data: JudgeResult = await res.json()
      setJudgeResult(data)
      setToastMessage(`Judge evaluation complete! Winner: ${data.winnerName}`)
      setTimeout(() => setToastMessage(null), 3000)

      // Automatically persist to judge comparison history
      const newHistoryItem: JudgeHistoryItem = {
        id: `judge-${Date.now()}`,
        timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        title: prompt.slice(0, 38) + (prompt.length > 38 ? '…' : ''),
        prompt: prompt.trim(),
        modelA: modelA,
        modelB: modelB,
        responseA: responseA.trim(),
        responseB: responseB.trim(),
        judgeModel: judgeModel,
        judgeResult: data,
      }
      setJudgeHistory(prev => {
        const updated = [newHistoryItem, ...prev]
        try { localStorage.setItem('judge_agent_history', JSON.stringify(updated)) } catch (e) {}
        return updated
      })
    } catch (err: any) {
      console.error('Judge Agent error:', err)
      const msg = err.message || 'Failed to connect to Judge Agent backend at http://localhost:8002'
      setErrorMessage(msg)
      setToastMessage(`Evaluation failed: ${msg}`)
      setTimeout(() => setToastMessage(null), 4000)
    } finally {
      setIsJudging(false)
    }
  }

  const handleExportJSON = () => {
    if (!judgeResult) return
    const exportData = {
      task_prompt: prompt,
      model_a: { name: modelA, response: responseA, overall_score: judgeResult.overallA },
      model_b: { name: modelB, response: responseB, overall_score: judgeResult.overallB },
      judge_engine: judgeModel,
      verdict: {
        winner: judgeResult.winnerName,
        margin: judgeResult.margin,
        confidence: `${judgeResult.confidence}%`,
        summary: judgeResult.verdictSummary,
        rubric_factors: judgeResult.factors,
      },
      evaluated_at: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `judge-agent-comparison-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setToastMessage('Exported Judge Evaluation JSON!')
    setTimeout(() => setToastMessage(null), 2500)
  }

  return (
    <>
      {/* 5-Second Initial Splash Screen */}
      {showSplash && <JudgeSplashScreen />}

      {/* Main Judge Agent Workspace */}
      <div
        style={{
          opacity: showSplash ? 0 : 1,
          transition: 'opacity 0.45s ease-in-out',
          pointerEvents: showSplash ? 'none' : 'auto',
          minHeight: '100%',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* TopBar Header with Illustration, Title, Subtitle & Action Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--color-border)',
            flexWrap: 'wrap',
            gap: 16,
            background: 'var(--color-surface-subtle, transparent)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 500px' }}>
            {/* Free Judge Illustration with Glow */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {/* Ambient Glow */}
              <div
                style={{
                  position: 'absolute',
                  width: 110,
                  height: 70,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(124,58,237,0.45) 0%, rgba(56,189,248,0.25) 60%, transparent 80%)',
                  filter: 'blur(16px)',
                  pointerEvents: 'none',
                }}
              />
              <img
                src="/judge-agent-illustration.png"
                alt="Judge Agent"
                style={{
                  height: 82,
                  width: 'auto',
                  maxWidth: 145,
                  objectFit: 'contain',
                  position: 'relative',
                  filter: 'drop-shadow(0 8px 22px rgba(124,58,237,0.55))',
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-foreground)', fontFamily: "'Inter', sans-serif" }}>
                  {viewMode === 'history' ? 'Judge Agent — Comparison History' : 'Pairwise Model Arbitration & Judging'}
                </h1>
                {viewMode === 'workspace' && (
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: 'rgba(124,58,237,0.15)',
                      color: 'var(--color-accent-violet, #7C3AED)',
                      border: '1px solid rgba(124,58,237,0.3)',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Judge v1.0
                  </span>
                )}
              </div>
              <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.4, maxWidth: 780, fontFamily: "'Inter', sans-serif" }}>
                {viewMode === 'history'
                  ? 'Review, search, and reload previous side-by-side model evaluations and multi-rubric verdicts.'
                  : 'Assign a target prompt, select two models (Candidate A vs Candidate B), and let the Judge Agent evaluate both outputs side-by-side across 6 quantitative criteria with synthesized confidence and win-margin analysis.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {toastMessage && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '5px 12px',
                  borderRadius: 999,
                  background: errorMessage ? 'rgba(239,68,68,0.15)' : 'rgba(52,211,153,0.15)',
                  color: errorMessage ? '#EF4444' : '#34D399',
                  border: errorMessage ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(52,211,153,0.3)',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {errorMessage ? <span style={{ fontSize: 13 }}>⚠️</span> : <IcCheck size={13} color="#34D399" />}
                {toastMessage}
              </div>
            )}

            {viewMode === 'workspace' ? (
              <>
                <button
                  type="button"
                  onClick={handleReset}
                  className="pill-outline"
                  style={{ fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
                >
                  <IcRotate size={13} /> Reset
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('history')}
                  className="pill-primary"
                  style={{ fontSize: 12.5, padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
                >
                  <History size={14} /> History ({judgeHistory.length})
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setViewMode('workspace')}
                className="pill-primary"
                style={{ fontSize: 12.5, padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
              >
                <IcSparkles size={14} /> + New Comparison
              </button>
            )}
          </div>
        </div>

        <PageContent style={{ paddingBottom: 64 }}>
          {viewMode === 'workspace' ? (
            <>
              {/* Workspace Runner Area with Glowing Ambient Background Card */}
              <div
                className="card-base"
                style={{
                  padding: 28,
                  marginBottom: 28,
                  borderRadius: 18,
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(56,189,248,0.03) 50%, var(--color-card, #13111C) 100%)',
                  border: '1px solid rgba(124,58,237,0.22)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
                }}
              >
                {/* Step 1: Target Prompt Input */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-muted)' }}>
                        Target Prompt / Task Directive
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateBoth}
                      disabled={isGeneratingResponses || !prompt.trim()}
                      className="pill-primary"
                      style={{
                        fontSize: 12,
                        padding: '7px 16px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: isGeneratingResponses || !prompt.trim() ? 'not-allowed' : 'pointer',
                        opacity: isGeneratingResponses || !prompt.trim() ? 0.6 : 1,
                      }}
                    >
                      {isGeneratingResponses ? <IcRotate size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <IcSparkles size={13} />}
                      <span>{isGeneratingResponses ? 'Generating Candidate Responses…' : '⚡ Generate Outputs for Both Models'}</span>
                    </button>
                  </div>

                  <textarea
                    ref={promptTextareaRef}
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="Enter the prompt or task directive that both AI models will be evaluated on..."
                    style={{
                      width: '100%',
                      minHeight: 90,
                      background: 'var(--color-input-bg, rgba(0,0,0,0.25))',
                      border: '1px solid var(--color-border)',
                      borderRadius: 12,
                      padding: 16,
                      fontSize: 13.5,
                      color: 'var(--color-foreground)',
                      outline: 'none',
                      resize: 'none',
                      lineHeight: 1.6,
                      fontFamily: 'Inter, sans-serif',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'var(--color-accent-violet, #7C3AED)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
                  />
                </div>

                {/* Step 2: Side-by-Side Model Responses & Selection */}
                <div
                  className="judge-side-by-side"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 20,
                    marginBottom: 22,
                  }}
                >
                  {/* Candidate A Card */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      background: 'var(--color-surface, rgba(255,255,255,0.02))',
                      padding: 18,
                      borderRadius: 14,
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: `${modelAObj.color}25`,
                            color: modelAObj.color,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 800,
                            border: `1px solid ${modelAObj.color}40`,
                          }}
                        >
                          A
                        </span>
                        <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--color-foreground)' }}>Candidate A</span>
                      </div>
                      <div>
                        <select
                          value={modelA}
                          onChange={e => setModelA(e.target.value)}
                          style={{
                            borderRadius: 8,
                            padding: '6px 12px',
                            fontSize: 12.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          {AVAILABLE_MODELS.map(m => (
                            <option key={m.id} value={m.name}>
                              {m.name} ({m.provider})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <textarea
                      rows={10}
                      value={responseA}
                      onChange={e => setResponseA(e.target.value)}
                      placeholder={`Paste or generate ${modelA}'s response here...`}
                      style={{
                        width: '100%',
                        background: 'var(--color-input-bg, rgba(0,0,0,0.25))',
                        border: '1px solid var(--color-border)',
                        borderRadius: 10,
                        padding: 14,
                        fontSize: 13,
                        color: 'var(--color-foreground)',
                        fontFamily: 'JetBrains Mono, monospace',
                        lineHeight: 1.6,
                        outline: 'none',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => (e.target.style.borderColor = modelAObj.color)}
                      onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
                    />
                  </div>

                  {/* Candidate B Card */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      background: 'var(--color-surface, rgba(255,255,255,0.02))',
                      padding: 18,
                      borderRadius: 14,
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: `${modelBObj.color}25`,
                            color: modelBObj.color,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 800,
                            border: `1px solid ${modelBObj.color}40`,
                          }}
                        >
                          B
                        </span>
                        <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--color-foreground)' }}>Candidate B</span>
                      </div>
                      <div>
                        <select
                          value={modelB}
                          onChange={e => setModelB(e.target.value)}
                          style={{
                            borderRadius: 8,
                            padding: '6px 12px',
                            fontSize: 12.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          {AVAILABLE_MODELS.map(m => (
                            <option key={m.id} value={m.name}>
                              {m.name} ({m.provider})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <textarea
                      rows={10}
                      value={responseB}
                      onChange={e => setResponseB(e.target.value)}
                      placeholder={`Paste or generate ${modelB}'s response here...`}
                      style={{
                        width: '100%',
                        background: 'var(--color-input-bg, rgba(0,0,0,0.25))',
                        border: '1px solid var(--color-border)',
                        borderRadius: 10,
                        padding: 14,
                        fontSize: 13,
                        color: 'var(--color-foreground)',
                        fontFamily: 'JetBrains Mono, monospace',
                        lineHeight: 1.6,
                        outline: 'none',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => (e.target.style.borderColor = modelBObj.color)}
                      onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
                    />
                  </div>
                </div>

                {/* Step 3: Judge Engine Bar & Trigger Button */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16,
                    paddingTop: 18,
                    borderTop: '1px solid var(--color-border-faint, rgba(255,255,255,0.06))',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <IcCpu size={18} color="var(--color-accent-violet, #7C3AED)" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)' }}>Evaluator Engine:</span>
                    </div>
                    <div>
                      <select
                        value={judgeModel}
                        onChange={e => setJudgeModel(e.target.value)}
                        style={{
                          borderRadius: 8,
                          padding: '8px 12px',
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        {JUDGE_MODELS.map(jm => (
                          <option key={jm.id} value={jm.id}>
                            {jm.name} ({jm.badge})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleJudge}
                    disabled={isJudging}
                    className="pill-primary"
                    style={{
                      fontSize: 13.5,
                      padding: '10px 24px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: isJudging ? 'not-allowed' : 'pointer',
                      opacity: isJudging ? 0.7 : 1,
                    }}
                  >
                    {isJudging ? <IcRotate size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <IcJudge size={15} />}
                    <span>{isJudging ? 'Arbitrating & Evaluating…' : '⚖️ Execute Judge Agent'}</span>
                  </button>
                </div>
              </div>

              {/* Step 4: Full Pairwise Verdict & Evaluation Results */}
              {judgeResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Verdict Top Highlight Banner */}
                  <div
                    className="card-base"
                    style={{
                      padding: 28,
                      background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(56,189,248,0.06) 100%)',
                      border: '1px solid rgba(124,58,237,0.3)',
                      borderRadius: 18,
                      boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #7C3AED, #38BDF8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <IcSparkles size={18} color="#fff" />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)' }}>
                            Arbitration Outcome
                          </div>
                          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--color-foreground)' }}>
                            Winner: <span style={{ color: judgeResult.winnerKey === 'A' ? modelAObj.color : modelBObj.color }}>{judgeResult.winnerName}</span>
                          </h3>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            padding: '6px 14px',
                            borderRadius: 999,
                            background: 'rgba(52,211,153,0.15)',
                            color: '#34D399',
                            border: '1px solid rgba(52,211,153,0.35)',
                          }}
                        >
                          Margin: +{judgeResult.margin.toFixed(1)} / 10
                        </span>

                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            padding: '6px 14px',
                            borderRadius: 999,
                            background: 'rgba(124,58,237,0.15)',
                            color: 'var(--color-accent-violet, #7C3AED)',
                            border: '1px solid rgba(124,58,237,0.35)',
                          }}
                        >
                          Confidence: {judgeResult.confidence}%
                        </span>

                        <button
                          type="button"
                          onClick={handleExportJSON}
                          className="pill-outline"
                          style={{ fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                        >
                          <IcDownload size={13} /> Export JSON
                        </button>
                      </div>
                    </div>

                    <p style={{ margin: 0, fontSize: 14, color: 'var(--color-foreground)', opacity: 0.9, lineHeight: 1.6 }}>
                      {judgeResult.verdictSummary}
                    </p>
                  </div>

                  {/* Consensus Overall Score Meters */}
                  <div
                    className="card-base"
                    style={{
                      padding: 24,
                      background: 'var(--color-card, #13111C)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 18,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: 18 }}>
                      Quantitative Composite Scores (0 - 10 Scale)
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                      {/* Candidate A Score Meter */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)' }}>{modelA}</span>
                          <span style={{ fontSize: 16, fontWeight: 800, color: modelAObj.color }}>{judgeResult.overallA.toFixed(1)} / 10</span>
                        </div>
                        <div style={{ width: '100%', height: 10, borderRadius: 999, background: 'var(--color-border-light)', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${(judgeResult.overallA / 10) * 100}%`,
                              height: '100%',
                              borderRadius: 999,
                              background: modelAObj.color,
                              transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                            }}
                          />
                        </div>
                      </div>

                      {/* Candidate B Score Meter */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)' }}>{modelB}</span>
                          <span style={{ fontSize: 16, fontWeight: 800, color: modelBObj.color }}>{judgeResult.overallB.toFixed(1)} / 10</span>
                        </div>
                        <div style={{ width: '100%', height: 10, borderRadius: 999, background: 'var(--color-border-light)', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${(judgeResult.overallB / 10) * 100}%`,
                              height: '100%',
                              borderRadius: 999,
                              background: modelBObj.color,
                              transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 6-Factor Qualitative Rubric Breakdown Cards */}
                  <div
                    className="card-base"
                    style={{
                      padding: 24,
                      background: 'var(--color-card, #13111C)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 18,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: 18 }}>
                      6-Factor Evaluation Rubrics & Judge Rationale
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                      {judgeResult.factors.map(f => (
                        <div
                          key={f.factor}
                          style={{
                            padding: 16,
                            borderRadius: 12,
                            background: 'var(--color-surface, rgba(255,255,255,0.02))',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)' }}>{f.label}</span>
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: 4,
                                background: f.winner === 'A' ? `${modelAObj.color}25` : f.winner === 'B' ? `${modelBObj.color}25` : 'rgba(255,255,255,0.1)',
                                color: f.winner === 'A' ? modelAObj.color : f.winner === 'B' ? modelBObj.color : 'var(--color-muted)',
                              }}
                            >
                              Advantage: {f.winner === 'A' ? modelA : f.winner === 'B' ? modelB : 'Equal'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--color-muted)' }}>
                            <span>
                              {modelA}: <strong style={{ color: 'var(--color-foreground)' }}>{f.scoreA}</strong>
                            </span>
                            <span>vs</span>
                            <span>
                              {modelB}: <strong style={{ color: 'var(--color-foreground)' }}>{f.scoreB}</strong>
                            </span>
                          </div>

                          <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5, opacity: 0.9 }}>
                            {f.rationale}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strengths & Weaknesses Breakdown */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {/* Model A Strengths / Weaknesses */}
                    <div className="card-base" style={{ padding: 24, background: 'var(--color-card, #13111C)', border: '1px solid var(--color-border)', borderRadius: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            background: `${modelAObj.color}25`,
                            color: modelAObj.color,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          A
                        </span>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--color-foreground)' }}>{modelA} — Assessment</h4>
                      </div>

                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#34D399', marginBottom: 8 }}>
                          Strengths
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--color-foreground)', opacity: 0.95, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {judgeResult.strengthsA.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#F87171', marginBottom: 8 }}>
                          Weaknesses / Room for Growth
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--color-foreground)', opacity: 0.95, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {judgeResult.weaknessesA.map((w, idx) => (
                            <li key={idx}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Model B Strengths / Weaknesses */}
                    <div className="card-base" style={{ padding: 24, background: 'var(--color-card, #13111C)', border: '1px solid var(--color-border)', borderRadius: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            background: `${modelBObj.color}25`,
                            color: modelBObj.color,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          B
                        </span>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--color-foreground)' }}>{modelB} — Assessment</h4>
                      </div>

                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#34D399', marginBottom: 8 }}>
                          Strengths
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--color-foreground)', opacity: 0.95, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {judgeResult.strengthsB.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#F87171', marginBottom: 8 }}>
                          Weaknesses / Room for Growth
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--color-foreground)', opacity: 0.95, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {judgeResult.weaknessesB.map((w, idx) => (
                            <li key={idx}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* History View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* History Search & Filter Bar */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 10, flex: '1 1 300px', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                    <IcSearch size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                    <input
                      type="text"
                      value={historyQuery}
                      onChange={e => setHistoryQuery(e.target.value)}
                      placeholder="Search comparisons by prompt, model, or winner..."
                      style={{
                        width: '100%',
                        fontSize: 13,
                        padding: '9px 12px 9px 36px',
                        borderRadius: 10,
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-input-bg, rgba(0,0,0,0.25))',
                        color: 'var(--color-foreground)',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <select
                    value={historyWinnerFilter}
                    onChange={e => setHistoryWinnerFilter(e.target.value as any)}
                    style={{
                      borderRadius: 10,
                      padding: '9px 14px',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      outline: 'none',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-input-bg, rgba(0,0,0,0.25))',
                      color: 'var(--color-foreground)',
                    }}
                  >
                    <option value="all">All Outcomes</option>
                    <option value="A">Candidate A Won</option>
                    <option value="B">Candidate B Won</option>
                    <option value="Tie">Tied Verdict</option>
                  </select>
                </div>

                {judgeHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllHistory}
                    className="pill-outline"
                    style={{ fontSize: 12, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#F87171' }}
                  >
                    <Trash2 size={13} /> Clear History
                  </button>
                )}
              </div>

              {/* History Records List */}
              {filteredHistory.length === 0 ? (
                <div
                  className="card-base"
                  style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    borderRadius: 16,
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-card, #13111C)',
                  }}
                >
                  <IcJudge size={36} color="var(--color-muted)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
                  <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--color-foreground)' }}>
                    No Comparison History Found
                  </h4>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)' }}>
                    {historyQuery || historyWinnerFilter !== 'all'
                      ? 'No past comparisons match your filters.'
                      : 'Run a new side-by-side model judging comparison to see it saved here automatically.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {filteredHistory.map(item => {
                    const modA = AVAILABLE_MODELS.find(m => m.name === item.modelA) || AVAILABLE_MODELS[0]
                    const modB = AVAILABLE_MODELS.find(m => m.name === item.modelB) || AVAILABLE_MODELS[1]

                    return (
                      <div
                        key={item.id}
                        className="card-base"
                        onClick={() => loadHistoryItem(item)}
                        style={{
                          padding: 20,
                          borderRadius: 16,
                          background: 'var(--color-card, #13111C)',
                          border: '1px solid var(--color-border)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 14,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'var(--color-accent-violet, #7C3AED)'
                          e.currentTarget.style.transform = 'translateY(-2px)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'var(--color-border)'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}
                      >
                        {/* Card Top Row: Matchup, Winner Badge, Timestamp & Action */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 800, color: modA.color }}>{item.modelA}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)' }}>vs</span>
                              <span style={{ fontSize: 13, fontWeight: 800, color: modB.color }}>{item.modelB}</span>
                            </div>

                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 6,
                                background: 'rgba(52, 211, 153, 0.14)',
                                color: '#34D399',
                                border: '1px solid rgba(52, 211, 153, 0.3)',
                              }}
                            >
                              Winner: {item.judgeResult.winnerName} ({item.judgeResult.confidence}% confidence)
                            </span>

                            <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                              +{item.judgeResult.margin.toFixed(1)} margin
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{item.timestamp}</span>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-muted)',
                                cursor: 'pointer',
                                padding: 4,
                                borderRadius: 6,
                              }}
                              title="Delete from history"
                            >
                              <Trash2 size={14} />
                            </button>
                            <button
                              type="button"
                              className="pill-primary"
                              style={{ fontSize: 11.5, padding: '5px 12px', gap: 4, display: 'flex', alignItems: 'center' }}
                            >
                              Review in Workspace <IcArrowRight size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Prompt Excerpt */}
                        <div
                          style={{
                            fontSize: 12.5,
                            color: 'var(--color-foreground)',
                            opacity: 0.9,
                            background: 'var(--color-surface, rgba(255,255,255,0.02))',
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: '1px solid var(--color-border-faint, rgba(255,255,255,0.05))',
                            fontFamily: 'JetBrains Mono, monospace',
                            maxHeight: 64,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.prompt}
                        </div>

                        {/* Scores and Verdict Summary */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                          <div style={{ fontSize: 12, color: 'var(--color-muted)', maxWidth: '75%', lineHeight: 1.4 }}>
                            {item.judgeResult.verdictSummary}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12.5, fontWeight: 700 }}>
                            <span style={{ color: modA.color }}>A: {item.judgeResult.overallA.toFixed(1)}/10</span>
                            <span style={{ color: modB.color }}>B: {item.judgeResult.overallB.toFixed(1)}/10</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </PageContent>
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes judgeFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes judgeSplashFadeIn { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
        @keyframes judgeProgress { 0%{width:0%} 100%{width:100%} }
        @media(max-width:768px){ .judge-side-by-side { grid-template-columns: 1fr !important; } }
      `}</style>
    </>
  )
}
