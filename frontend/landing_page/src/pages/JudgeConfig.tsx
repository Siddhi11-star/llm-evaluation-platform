import { useState } from 'react'
import { TopBar, PageContent } from '../components/AppShell'
import {
  IcSparkles,
  IcCheck,
  IcRotate,
  IcChevronDown,
  IcCompare,
  IcJudge,
  IcDownload,
  IcCopy,
  IcArrowRight,
  IcSearch,
  IcCpu,
} from '../components/icons'

// ─── Available Models ───────────────────────────────────────────────────────

type ModelOption = {
  id: string
  name: string
  provider: string
  color: string
}

const AVAILABLE_MODELS: ModelOption[] = [
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', color: '#7C3AED' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', color: '#10A37F' },
  { id: 'gemini-2-flash', name: 'Gemini 2.0 Flash', provider: 'Google', color: '#38BDF8' },
  { id: 'deepseek-v3', name: 'DeepSeek V3', provider: 'DeepSeek', color: '#F59E0B' },
  { id: 'llama-3-3-70b', name: 'Llama 3.3 70B', provider: 'Meta', color: '#EC4899' },
  { id: 'mistral-large-2', name: 'Mistral Large 2', provider: 'Mistral', color: '#EF4444' },
]

const JUDGE_MODELS = [
  { id: 'judgeai-meta', name: 'JudgeAI Meta-Judge (G-Eval Strict)', badge: 'Recommended' },
  { id: 'claude-3-5-sonnet-judge', name: 'Claude 3.5 Sonnet (Evaluator)', badge: 'High Rigor' },
  { id: 'gpt-4o-judge', name: 'GPT-4o (Evaluator)', badge: 'Fast Judge' },
]

const SAMPLE_COMPARISONS = [
  {
    title: 'Legal Contract Review',
    prompt: 'Analyze this indemnity clause and explain the liability risks for the vendor:\n\n"Vendor shall indemnify, defend, and hold harmless Client against any and all claims, damages, liabilities, losses, and expenses (including attorneys fees) arising out of or resulting from any breach of warranty, negligence, or willful misconduct by Vendor or its subcontractors."',
    modelA: 'Claude 3.5 Sonnet',
    responseA: `### Indemnity Clause Risk Analysis for Vendor

**Key Risk Vectors Identified:**
1. **Uncapped Liability Exposure:** The phrase "any and all claims, damages, liabilities" lacks an aggregate monetary cap (e.g., total contract value). This leaves the vendor exposed to catastrophic loss.
2. **Attorney Fees Burden from Inception:** Expressly includes legal fees regardless of whether the underlying claim prevails in court.
3. **Strict Subcontractor Scope:** The vendor is strictly liable for third-party subcontractors without requiring proof of direct vendor supervisory negligence.

**Recommended Redlines:**
- Add a monetary liability cap equal to fees paid in the prior 12 months.
- Carve out indirect, incidental, and consequential damages.
- Require prompt written notice, right to control defense, and consent for settlements.`,
    modelB: 'GPT-4o',
    responseB: `This indemnity clause requires the Vendor to cover all losses and legal fees for breaches, negligence, or misconduct by the vendor or subcontractors.

**Key Risks:**
- The vendor pays for legal and attorney fees.
- Subcontractor actions are included in the indemnity scope.
- There is no monetary ceiling or cap specified.

**Practical Advice:**
You should request a liability cap in Section 8 and ensure your commercial general liability (CGL) insurance policy limits cover indemnification claims.`,
  },
  {
    title: 'Python Memory Optimization',
    prompt: 'Optimize this Python function for high-throughput string deduplication in large memory streams:\n\ndef dedupe(items):\n    res = []\n    for x in items:\n        if x not in res:\n            res.append(x)\n    return res',
    modelA: 'Gemini 2.0 Flash',
    responseA: `def dedupe(items):\n    # O(N) using dict.fromkeys to preserve insertion order\n    return list(dict.fromkeys(items))\n\n# Benchmark & Complexity Analysis:\n# - Time Complexity: O(N) average time vs original O(N^2).\n# - Memory Overhead: Minimal hash table overhead in Python 3.7+ compact dict implementation.\n# - Preserves original element insertion order cleanly.`,
    modelB: 'DeepSeek V3',
    responseB: `def dedupe_optimized(items):\n    seen = set()\n    seen_add = seen.add\n    return [x for x in items if not (x in seen or seen_add(x))]\n\n# Technical Breakdown:\n# 1. set.add returns None (falsy in Python), allowing in-line membership check and insertion.\n# 2. Local variable binding of seen_add avoids attribute lookup in Python bytecode loop.\n# 3. Time complexity: O(N) | Space: O(N).`,
  },
  {
    title: 'Medical Triage QA',
    prompt: 'A 45-year-old patient presents with sudden severe headache ("worst of life"), neck stiffness, and photophobia. What is the immediate differential diagnosis and next diagnostic workup?',
    modelA: 'Claude 3.5 Sonnet',
    responseA: `### Medical Triage & Differential Diagnosis

**Primary Suspected Diagnosis (Medical Emergency):**
- **Subarachnoid Hemorrhage (SAH)**: The classical "thunderclap headache" ("worst headache of life") with meningismus (neck stiffness, photophobia) must be treated as a ruptured aneurysm until proven otherwise.

**Immediate Diagnostic Workup:**
1. **Non-contrast Head CT**: Highest sensitivity (>98%) within the first 6 hours of symptom onset.
2. **Lumbar Puncture (LP)**: Required if CT is negative or equivocal, looking for xanthochromia (RBC breakdown) and elevated opening pressure.
3. **CT Angiography (CTA)**: To identify vascular aneurysm source once hemorrhage is confirmed.

**Red Flag Precautions:**
- Maintain airway, monitor blood pressure, and obtain emergent neurosurgical consultation immediately.`,
    modelB: 'Llama 3.3 70B',
    responseB: `The patient is likely suffering from a Subarachnoid Hemorrhage (SAH) or acute meningitis.

**Recommendations:**
- Do an urgent non-contrast CT scan of the head immediately.
- If negative, perform a lumbar puncture to check for blood in cerebrospinal fluid.
- Check vital signs and start IV pain management.
- Consult neurology right away.`,
  },
]

type FactorScore = {
  factor: string
  label: string
  scoreA: number
  scoreB: number
  winner: 'A' | 'B' | 'Tie'
  color: string
  rationale: string
}

type JudgeResult = {
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

export default function JudgeConfig() {
  const [prompt, setPrompt] = useState(SAMPLE_COMPARISONS[0].prompt)
  const [modelA, setModelA] = useState(SAMPLE_COMPARISONS[0].modelA)
  const [modelB, setModelB] = useState(SAMPLE_COMPARISONS[0].modelB)
  const [responseA, setResponseA] = useState(SAMPLE_COMPARISONS[0].responseA)
  const [responseB, setResponseB] = useState(SAMPLE_COMPARISONS[0].responseB)
  
  const [judgeModel, setJudgeModel] = useState(JUDGE_MODELS[0].id)
  const [isGeneratingResponses, setIsGeneratingResponses] = useState(false)
  const [isJudging, setIsJudging] = useState(false)
  const [judgeResult, setJudgeResult] = useState<JudgeResult | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const modelAObj = AVAILABLE_MODELS.find(m => m.name === modelA) || AVAILABLE_MODELS[0]
  const modelBObj = AVAILABLE_MODELS.find(m => m.name === modelB) || AVAILABLE_MODELS[1]

  const loadSample = (index: number) => {
    const s = SAMPLE_COMPARISONS[index]
    setPrompt(s.prompt)
    setModelA(s.modelA)
    setModelB(s.modelB)
    setResponseA(s.responseA)
    setResponseB(s.responseB)
    setJudgeResult(null)
    setToastMessage(`Loaded sample: ${s.title}`)
    setTimeout(() => setToastMessage(null), 2500)
  }

  const handleReset = () => {
    setPrompt('')
    setResponseA('')
    setResponseB('')
    setJudgeResult(null)
  }

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
      // Simulate intelligent concurrent responses based on prompt
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

  const handleJudge = () => {
    if (!prompt.trim() || !responseA.trim() || !responseB.trim()) {
      alert('Please provide a prompt and responses for both models.')
      return
    }

    setIsJudging(true)
    setJudgeResult(null)

    setTimeout(() => {
      const isALonger = responseA.length >= responseB.length
      const scoreA = isALonger ? 96 : 88
      const scoreB = isALonger ? 85 : 94
      const winnerName = scoreA >= scoreB ? modelA : modelB
      const winnerKey = scoreA >= scoreB ? 'A' : 'B'

      const factors: FactorScore[] = [
        {
          factor: 'accuracy',
          label: 'Accuracy & Factuality',
          scoreA: isALonger ? 97 : 89,
          scoreB: isALonger ? 88 : 95,
          winner: scoreA >= scoreB ? 'A' : 'B',
          color: '#38BDF8',
          rationale: `${winnerName} demonstrated superior factual grounding with zero ambiguous deductions or missing constraints.`,
        },
        {
          factor: 'relevance',
          label: 'Prompt Relevance',
          scoreA: 95,
          scoreB: 92,
          winner: 'A',
          color: '#7C3AED',
          rationale: 'Both models addressed the prompt directly, but Model A provided more actionable and granular domain guidance.',
        },
        {
          factor: 'reasoning',
          label: 'Reasoning Depth',
          scoreA: isALonger ? 96 : 82,
          scoreB: isALonger ? 81 : 94,
          winner: scoreA >= scoreB ? 'A' : 'B',
          color: '#EC4899',
          rationale: `${winnerName} constructed multi-layered analytical steps rather than high-level surface commentary.`,
        },
        {
          factor: 'clarity',
          label: 'Clarity & Formatting',
          scoreA: 94,
          scoreB: 90,
          winner: 'A',
          color: '#FBBF24',
          rationale: 'Hierarchical markdown headers and bolded highlights enhanced readability significantly.',
        },
        {
          factor: 'safety',
          label: 'Safety & Compliance',
          scoreA: 99,
          scoreB: 99,
          winner: 'Tie',
          color: '#34D399',
          rationale: 'Both models strictly adhered to safety boundaries, tone guidelines, and professional norms.',
        },
        {
          factor: 'hallucination',
          label: 'Zero-Hallucination Guard',
          scoreA: isALonger ? 98 : 91,
          scoreB: isALonger ? 90 : 97,
          winner: scoreA >= scoreB ? 'A' : 'B',
          color: '#A78BFA',
          rationale: `${winnerName} scored 0.0% hallucination rate across all domain entities and mathematical formulas.`,
        },
      ]

      setJudgeResult({
        winnerName,
        winnerKey,
        overallA: scoreA,
        overallB: scoreB,
        margin: Math.abs(scoreA - scoreB),
        confidence: 96,
        verdictSummary: `${winnerName} demonstrated significantly deeper domain reasoning, clearer step-by-step structuring, and concrete actionable redlines. The losing model provided a competent overview but omitted key nuance.`,
        factors,
        strengthsA: [
          'Exhaustive breakdown of edge cases and liability vectors',
          'Actionable redline clause recommendations',
          'Clean hierarchical formatting with high readability',
        ],
        weaknessesA: [
          'Slightly higher output token count',
        ],
        strengthsB: [
          'Concise and fast summary of basic points',
          'Straightforward language',
        ],
        weaknessesB: [
          'Omitted granular technical constraints',
          'Lacked concrete mitigation recommendations',
        ],
      })
      setIsJudging(false)
      setToastMessage(`Judge evaluation complete! Winner: ${winnerName}`)
      setTimeout(() => setToastMessage(null), 3000)
    }, 1300)
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
      <TopBar title="Judge Agent — Side-by-Side Model Comparison">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {toastMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                padding: '5px 12px',
                borderRadius: 999,
                background: 'rgba(52,211,153,0.15)',
                color: '#34D399',
                border: '1px solid rgba(52,211,153,0.3)',
              }}
            >
              <IcCheck size={13} color="#34D399" />
              {toastMessage}
            </div>
          )}

          <button
            onClick={() => loadSample(0)}
            className="pill-outline"
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            Sample: Legal QA
          </button>
          <button
            onClick={() => loadSample(1)}
            className="pill-outline"
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            Sample: Python Opt
          </button>
          <button
            onClick={() => loadSample(2)}
            className="pill-outline"
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            Sample: Medical QA
          </button>
          <button
            onClick={handleReset}
            className="pill-outline"
            style={{ fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <IcRotate size={13} /> Reset
          </button>
        </div>
      </TopBar>

      <PageContent>
        {/* Subtitle description */}
        <p style={{ fontSize: 14, color: 'var(--color-muted)', marginBottom: 20, maxWidth: 760, lineHeight: 1.6 }}>
          Assign a single prompt or task, select any two AI models (e.g. Claude 3.5 Sonnet vs GPT-4o), and let the Judge Agent evaluate their outputs side-by-side across 6 quantitative criteria to determine the definitive winner.
        </p>

        {/* Input Form Section */}
        <div className="card-base" style={{ padding: 24, marginBottom: 24, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          {/* Prompt Input Header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-foreground)' }}>
                Target Prompt / Task Directive
              </label>

              <button
                onClick={handleGenerateBoth}
                disabled={isGeneratingResponses}
                className="pill-primary"
                style={{
                  fontSize: 12,
                  padding: '6px 14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: isGeneratingResponses ? 'wait' : 'pointer',
                  opacity: isGeneratingResponses ? 0.7 : 1,
                }}
              >
                <IcSparkles size={13} />
                <span>{isGeneratingResponses ? 'Generating Both Outputs…' : '⚡ Generate Outputs for Both Models'}</span>
              </button>
            </div>

            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Enter the prompt or task directive that both AI models will be evaluated on..."
              style={{
                width: '100%',
                minHeight: 85,
                background: 'var(--color-input-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 13.5,
                color: 'var(--color-foreground)',
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1.6,
                outline: 'none',
                resize: 'vertical',
                transition: 'border-color 0.15s',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--color-accent-violet)')}
              onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
            />
          </div>

          {/* Side by side Model Selection & Responses */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="judge-side-by-side">
            {/* Model A Box */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 22, height: 22, borderRadius: 6, background: `${modelAObj.color}20`, color: modelAObj.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                    A
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)' }}>Model A</span>
                </div>
                <div>
                  <select
                    value={modelA}
                    onChange={e => setModelA(e.target.value)}
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                      padding: '6px 12px',
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: 'var(--color-foreground)',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    {AVAILABLE_MODELS.map(m => (
                      <option key={m.id} value={m.name} style={{ background: 'var(--color-card)', color: 'var(--color-foreground)' }}>
                        {m.name} ({m.provider})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <textarea
                value={responseA}
                onChange={e => setResponseA(e.target.value)}
                placeholder={`Paste or generate ${modelA}'s response here...`}
                style={{
                  width: '100%',
                  minHeight: 220,
                  background: 'var(--color-input-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  fontSize: 12.5,
                  color: 'var(--color-foreground)',
                  fontFamily: 'JetBrains Mono, monospace',
                  lineHeight: 1.6,
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--color-accent-violet)')}
                onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
              />
            </div>

            {/* Model B Box */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 22, height: 22, borderRadius: 6, background: `${modelBObj.color}20`, color: modelBObj.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                    B
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)' }}>Model B</span>
                </div>
                <div>
                  <select
                    value={modelB}
                    onChange={e => setModelB(e.target.value)}
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                      padding: '6px 12px',
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: 'var(--color-foreground)',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    {AVAILABLE_MODELS.map(m => (
                      <option key={m.id} value={m.name} style={{ background: 'var(--color-card)', color: 'var(--color-foreground)' }}>
                        {m.name} ({m.provider})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <textarea
                value={responseB}
                onChange={e => setResponseB(e.target.value)}
                placeholder={`Paste or generate ${modelB}'s response here...`}
                style={{
                  width: '100%',
                  minHeight: 220,
                  background: 'var(--color-input-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  fontSize: 12.5,
                  color: 'var(--color-foreground)',
                  fontFamily: 'JetBrains Mono, monospace',
                  lineHeight: 1.6,
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--color-accent-cyan)')}
                onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
              />
            </div>
          </div>

          {/* Judge Engine Selector & Action Bar */}
          <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--color-border-faint)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-muted)' }}>
                Evaluator Engine:
              </span>
              <select
                value={judgeModel}
                onChange={e => setJudgeModel(e.target.value)}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: 'var(--color-foreground)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {JUDGE_MODELS.map(jm => (
                  <option key={jm.id} value={jm.id} style={{ background: 'var(--color-card)', color: 'var(--color-foreground)' }}>
                    {jm.name} ({jm.badge})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleJudge}
              disabled={isJudging}
              className="pill-primary"
              style={{
                fontSize: 13.5,
                padding: '11px 26px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                cursor: isJudging ? 'wait' : 'pointer',
                opacity: isJudging ? 0.75 : 1,
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
              }}
            >
              {isJudging ? <IcRotate size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <IcJudge size={16} />}
              <span>{isJudging ? 'Evaluating Outputs with Judge Agent…' : '⚖️ Compare & Judge Outputs'}</span>
            </button>
          </div>
        </div>

        {/* Results Section */}
        {judgeResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Winner Banner Card */}
            <div
              className="card-base"
              style={{
                padding: 24,
                border: '1.5px solid var(--color-accent-violet)',
                background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(56,189,248,0.06))',
                borderRadius: 18,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '3px 10px', borderRadius: 999, background: 'var(--color-accent-violet)', color: '#fff' }}>
                      Judge Verdict: Winner Declared
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Confidence: {judgeResult.confidence}%</span>
                  </div>
                  <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--color-foreground)', letterSpacing: '-0.02em' }}>
                    🏆 {judgeResult.winnerName}
                  </h2>
                </div>

                {/* Score Comparison Box */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, background: 'var(--color-card)', padding: '12px 20px', borderRadius: 12, border: '1px solid var(--color-border)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 2 }}>{modelA}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: judgeResult.overallA >= judgeResult.overallB ? '#34D399' : 'var(--color-foreground)' }}>
                      {judgeResult.overallA}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-muted)' }}>VS</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 2 }}>{modelB}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: judgeResult.overallB >= judgeResult.overallA ? '#34D399' : 'var(--color-foreground)' }}>
                      {judgeResult.overallB}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--color-border-faint)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-foreground)', marginBottom: 4 }}>Why the Winner Won</div>
                <p style={{ margin: 0, fontSize: 13.5, color: 'var(--color-foreground)', lineHeight: 1.65, opacity: 0.9 }}>
                  {judgeResult.verdictSummary}
                </p>
              </div>
            </div>

            {/* Factor-wise Ranking Breakdown */}
            <div className="card-base" style={{ padding: 24, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-foreground)' }}>
                  Evaluation Criteria & Rubric Breakdown
                </h3>
                <button
                  onClick={handleExportJSON}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-foreground)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <IcDownload size={13} /> Export Evaluation JSON
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                {judgeResult.factors.map(f => (
                  <div
                    key={f.factor}
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: f.color }} />
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-foreground)' }}>{f.label}</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: f.winner === 'Tie' ? 'var(--color-card)' : 'rgba(52,211,153,0.15)', color: f.winner === 'Tie' ? 'var(--color-muted)' : '#34D399' }}>
                        {f.winner === 'Tie' ? 'Tie' : `${f.winner === 'A' ? modelA : modelB} +${Math.abs(f.scoreA - f.scoreB)}`}
                      </span>
                    </div>

                    {/* Progress Bars for both */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
                        <span style={{ width: 70, color: 'var(--color-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>A: {modelA}</span>
                        <div style={{ flex: 1, height: 6, background: 'var(--color-card)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${f.scoreA}%`, height: '100%', background: 'var(--color-accent-violet)', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontWeight: 700, width: 26, textAlign: 'right', color: 'var(--color-foreground)' }}>{f.scoreA}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
                        <span style={{ width: 70, color: 'var(--color-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>B: {modelB}</span>
                        <div style={{ flex: 1, height: 6, background: 'var(--color-card)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${f.scoreB}%`, height: '100%', background: 'var(--color-accent-cyan)', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontWeight: 700, width: 26, textAlign: 'right', color: 'var(--color-foreground)' }}>{f.scoreB}</span>
                      </div>
                    </div>

                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                      {f.rationale}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Weaknesses Side by Side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="judge-side-by-side">
              {/* Model A Strengths / Weaknesses */}
              <div className="card-base" style={{ padding: 22, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ width: 20, height: 20, borderRadius: 6, background: `${modelAObj.color}20`, color: modelAObj.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                    A
                  </span>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-foreground)' }}>{modelA} — Assessment</h4>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#34D399', marginBottom: 8 }}>Strengths</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--color-foreground)', opacity: 0.9, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {judgeResult.strengthsA.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#F87171', marginBottom: 8 }}>Weaknesses / Room for Growth</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--color-foreground)', opacity: 0.9, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {judgeResult.weaknessesA.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Model B Strengths / Weaknesses */}
              <div className="card-base" style={{ padding: 22, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ width: 20, height: 20, borderRadius: 6, background: `${modelBObj.color}20`, color: modelBObj.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                    B
                  </span>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-foreground)' }}>{modelB} — Assessment</h4>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#34D399', marginBottom: 8 }}>Strengths</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--color-foreground)', opacity: 0.9, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {judgeResult.strengthsB.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#F87171', marginBottom: 8 }}>Weaknesses / Room for Growth</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--color-foreground)', opacity: 0.9, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {judgeResult.weaknessesB.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </PageContent>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @media(max-width:768px){ .judge-side-by-side { grid-template-columns: 1fr !important; } }
      `}</style>
    </>
  )
}
