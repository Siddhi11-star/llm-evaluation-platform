import { useState, useEffect, useRef } from 'react'
import { TopBar, PageContent } from '../components/AppShell'
import {
  IcSwarm,
  IcSparkles,
  IcArrowRight,
  IcCheck,
  IcRotate,
  IcChevronDown,
  IcCopy,
  IcPlay,
  IcPause,
  IcCpu,
  IcJudge,
  IcSearch,
  IcFilter,
  IcDownload,
  IcTable,
  IcDatabase,
  IcExternalLink,
  IcKey,
  IcSettings,
} from '../components/icons'

// ─── Types for Dataset Swarm (Kimi Swarm Architecture) ────────────────────────

export type DatasetRecord = {
  id: string
  entity: string
  category: string
  metricA: string
  metricB: string
  metricC: string
  confidence: number
  sourceUrl: string
  sourceTitle: string
  verifiedBy: string
  status: 'Verified' | 'Pending' | 'Flagged'
  citations: string[]
  rawSnippet: string
}

export type DatasetCampaign = {
  id: string
  title: string
  badge: string
  targetCount: number
  markdownSpec: string
  headers: { key: string; label: string }[]
  initialRecords: DatasetRecord[]
}

const CAMPAIGNS: DatasetCampaign[] = [
  {
    id: 'ai-startups',
    title: 'Global AI Frontier Startups & Funding Intelligence',
    badge: 'Venture / Tech',
    targetCount: 500,
    markdownSpec: `# Kimi Agent Swarm Strategy: AI Frontier Startups Dataset

## 1. Objective & Scope
Autonomous discovery and structured extraction of AI foundation model & agentic workflow startups founded between 2023–2026 with verified venture funding >= $10M.

## 2. Extraction Schema
- **Entity**: Startup legal / brand name
- **Primary Architecture**: Foundation Model, Agentic OS, Synthetic Data, Robotics
- **Total Funding**: Verified USD Series A/B/C amount with primary SEC/Crunchbase citations
- **Lead Investors**: Tier-1 venture partners (e.g. Founders Fund, Sequoia, Lightspeed)
- **Primary Source URL**: Direct press release, regulatory filing, or company blog

## 3. Verification & Completion Criteria
1. Re-query citations to guarantee 0% hallucinated funding rounds.
2. Require at least 2 independent web-sourced citations per record.
3. Reject unannounced stealth rumors or speculative valuation metrics.`,
    headers: [
      { key: 'entity', label: 'Company / Entity' },
      { key: 'category', label: 'AI Architecture' },
      { key: 'metricA', label: 'Total Funding' },
      { key: 'metricB', label: 'Latest Round' },
      { key: 'metricC', label: 'Lead Investors' },
    ],
    initialRecords: [
      {
        id: 'rec-001',
        entity: 'Cognition AI',
        category: 'Autonomous Software Agents',
        metricA: '$175,000,000',
        metricB: 'Series A ($2.0B Val)',
        metricC: 'Founders Fund, Peter Thiel',
        confidence: 99.4,
        sourceUrl: 'https://cognition.ai/blog/series-a',
        sourceTitle: 'Cognition AI Funding Announcement & Devin Architecture',
        verifiedBy: 'Agent #042 (Citation Validator)',
        status: 'Verified',
        citations: ['SEC Form D (2024-04-12)', 'Founders Fund Press Dispatch'],
        rawSnippet: 'Cognition secures $175M Series A led by Founders Fund to scale Devin AI autonomous software engineering swarm.',
      },
      {
        id: 'rec-002',
        entity: 'Mistral AI',
        category: 'Open-Weight Multimodal LLMs',
        metricA: '$640,000,000',
        metricB: 'Series B ($6.0B Val)',
        metricC: 'General Catalyst, Lightspeed',
        confidence: 98.9,
        sourceUrl: 'https://mistral.ai/news/series-b',
        sourceTitle: 'Mistral AI Closes €600M Series B Financing',
        verifiedBy: 'Agent #018 (DOM Extractor)',
        status: 'Verified',
        citations: ['General Catalyst Investor Brief', 'EU Enterprise Registry'],
        rawSnippet: 'Mistral AI expands European frontier computing with Series B led by General Catalyst.',
      },
      {
        id: 'rec-003',
        entity: 'Perplexity AI',
        category: 'Conversational Answer Engine',
        metricA: '$165,000,000',
        metricB: 'Series C ($3.0B Val)',
        metricC: 'IVP, NEA, NVIDIA',
        confidence: 99.1,
        sourceUrl: 'https://perplexity.ai/hub/blog/series-c',
        sourceTitle: 'Accelerating Knowledge Discovery with NVIDIA & IVP',
        verifiedBy: 'Agent #089 (Factual Cross-Checker)',
        status: 'Verified',
        citations: ['TechCrunch Disrupt Filing', 'IVP Portfolio Release'],
        rawSnippet: 'Perplexity triples daily search query volume; announces round participation from NVIDIA and Jeff Bezos.',
      },
      {
        id: 'rec-004',
        entity: 'Physical Intelligence (Pi)',
        category: 'Universal Robotics Foundation Model',
        metricA: '$400,000,000',
        metricB: 'Early Stage ($2.4B Val)',
        metricC: 'Jeff Bezos, Thrive Capital, OpenAI',
        confidence: 98.2,
        sourceUrl: 'https://physicalintelligence.company/news',
        sourceTitle: 'Pi Announces $400M Financing for Generalist Robot AI',
        verifiedBy: 'Agent #007 (Web Crawler)',
        status: 'Verified',
        citations: ['Thrive Capital Investment Thesis', 'Bloomberg Technology'],
        rawSnippet: 'Pi develops π0, a general-purpose robotic foundation model bringing physical AI into industrial manipulation.',
      },
      {
        id: 'rec-005',
        entity: 'Poolside AI',
        category: 'Code Generation & Reasoning',
        metricA: '$500,000,000',
        metricB: 'Series B ($3.0B Val)',
        metricC: 'Bain Capital Ventures, DST Global',
        confidence: 97.6,
        sourceUrl: 'https://poolside.ai/press/series-b',
        sourceTitle: 'Building the Foundation of Software Intelligence',
        verifiedBy: 'Agent #112 (Schema Normalizer)',
        status: 'Verified',
        citations: ['Bain Capital Ventures Dispatch', 'French Tech Hub'],
        rawSnippet: 'Poolside scales next-generation developer reasoning models with massive 500M capitalization.',
      },
    ],
  },
  {
    id: 'bio-trials',
    title: 'Biomedical Clinical Trials & Orphan Drug Pipelines',
    badge: 'Pharma / Health',
    targetCount: 350,
    markdownSpec: `# Kimi Agent Swarm Strategy: Phase II/III Clinical Drug Pipeline

## 1. Scope
Gather active clinical trial cohorts, molecular targets, primary endpoints, and orphan drug status across NIH ClinicalTrials.gov and EMA registries.

## 2. Extraction Schema
- **Therapeutic Candidate**: Compound code or generic drug name
- **Indication / Pathology**: Oncology, CNS neurodegeneration, rare metabolic disorders
- **Phase & Trial ID**: NCT identifier & current clinical progression
- **Target Mechanism**: Kinase inhibitor, Monoclonal antibody, RNAi, CRISPR
- **Primary Endpoint P-Value**: Statistical significance benchmark from interim readouts`,
    headers: [
      { key: 'entity', label: 'Therapeutic Drug' },
      { key: 'category', label: 'Target Pathology' },
      { key: 'metricA', label: 'Clinical Phase' },
      { key: 'metricB', label: 'Mechanism of Action' },
      { key: 'metricC', label: 'Primary Sponsor' },
    ],
    initialRecords: [
      {
        id: 'rec-201',
        entity: 'Tirzepatide (SURMOUNT-OSA)',
        category: 'Obstructive Sleep Apnea & Obesity',
        metricA: 'Phase III (NCT05412001)',
        metricB: 'Dual GIP / GLP-1 RA',
        metricC: 'Eli Lilly & Co.',
        confidence: 99.8,
        sourceUrl: 'https://clinicaltrials.gov/study/NCT05412001',
        sourceTitle: 'Trial of Tirzepatide in Participants With OSA and Obesity',
        verifiedBy: 'Agent #033 (PubMed Verifier)',
        status: 'Verified',
        citations: ['NEJM June 2024 Publication', 'FDA Fast Track Docket'],
        rawSnippet: 'Met primary endpoint with 62.8% reduction in AHI events per hour compared to placebo (p < 0.001).',
      },
      {
        id: 'rec-202',
        entity: 'Donanemab (TRAILBLAZER-ALZ 2)',
        category: 'Early Symptomatic Alzheimer Disease',
        metricA: 'FDA Approved / Phase IV',
        metricB: 'Anti-Amyloid Beta (N3pG)',
        metricC: 'Eli Lilly / Avid Radiopharmaceuticals',
        confidence: 99.4,
        sourceUrl: 'https://fda.gov/drugs/donanemab-approval',
        sourceTitle: 'FDA Center for Drug Evaluation & Research Summary',
        verifiedBy: 'Agent #074 (Registry Validator)',
        status: 'Verified',
        citations: ['FDA CDER Label Summary', 'JAMA Clinical Trial Review'],
        rawSnippet: 'Slowed clinical cognitive decline by 35% on iADRS scale at 76 weeks in low-medium tau population.',
      },
    ],
  },
  {
    id: 'sec-10k',
    title: 'SEC 10-K Executive Compensation & Cloud Spend Disclosures',
    badge: 'SEC / Compliance',
    targetCount: 250,
    markdownSpec: `# Kimi Agent Swarm Strategy: Enterprise Cloud & AI Capex

## 1. Scope
Extract capital expenditures, cloud hosting commitments, and AI infrastructure disclosures from latest 10-K filings of Fortune 500 tech leaders.`,
    headers: [
      { key: 'entity', label: 'Enterprise / Ticker' },
      { key: 'category', label: 'Industry Sector' },
      { key: 'metricA', label: 'FY25 AI CapEx' },
      { key: 'metricB', label: 'Cloud Commitments' },
      { key: 'metricC', label: 'SEC Filing Date' },
    ],
    initialRecords: [
      {
        id: 'rec-301',
        entity: 'Microsoft Corp (MSFT)',
        category: 'Hyperscale Cloud & Enterprise Software',
        metricA: '$55,700,000,000',
        metricB: '$120B Azure Backlog',
        metricC: 'Form 10-K (2025-07-29)',
        confidence: 99.7,
        sourceUrl: 'https://sec.gov/edgar/data/789019/msft-10k',
        sourceTitle: 'SEC EDGAR Microsoft Annual 10-K Filing',
        verifiedBy: 'Agent #012 (EDGAR Parser)',
        status: 'Verified',
        citations: ['SEC EDGAR 10-K Item 7', 'PwC Independent Audit Note'],
        rawSnippet: 'Capital expenditures including finance leases were $55.7 billion, driven by global cloud and AI infrastructure demand.',
      },
    ],
  },
]

// ─── Sub-Agent Matrix Swarm Worker Archetypes ──────────────────────────────

const SWARM_WORKER_ROLES = [
  { id: 'crawler', name: 'Discovery Crawler', color: '#38BDF8', bg: 'rgba(56,189,248,0.12)', count: 32 },
  { id: 'extractor', name: 'DOM & JSON Extractor', color: '#34D399', bg: 'rgba(52,211,153,0.12)', count: 48 },
  { id: 'verifier', name: 'Citation Validator', color: '#EC4899', bg: 'rgba(236,72,153,0.12)', count: 32 },
  { id: 'normalizer', name: 'Schema Normalizer', color: '#FBBF24', bg: 'rgba(251,191,36,0.12)', count: 16 },
]

export default function AgentSwarm() {
  const [selectedCampaignIndex, setSelectedCampaignIndex] = useState(0)
  const currentCampaign = CAMPAIGNS[selectedCampaignIndex]

  // View mode: 'dataset' (Kimi Web Dataset Swarm) | 'spec' (Markdown Strategy) | 'matrix' (Swarm Workers)
  const [viewMode, setViewMode] = useState<'dataset' | 'spec' | 'matrix'>('dataset')

  // Swarm execution state
  const [isSwarmRunning, setIsSwarmRunning] = useState(false)
  const [records, setRecords] = useState<DatasetRecord[]>(currentCampaign.initialRecords)
  const [activeWorkerCount, setActiveWorkerCount] = useState(128)
  const [toolCallsCount, setToolCallsCount] = useState(3840)
  const [searchQueryFilter, setSearchQueryFilter] = useState('')
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<DatasetRecord | null>(null)
  
  // Markdown spec state
  const [markdownSpec, setMarkdownSpec] = useState(currentCampaign.markdownSpec)
  const [copyFeedback, setCopyFeedback] = useState(false)

  // Live streaming log items
  const [liveLogs, setLiveLogs] = useState<Array<{ time: string; worker: string; action: string; color: string }>>([
    { time: '14:50:02', worker: 'Worker #042', action: 'Triangulated SEC Form D filing for Cognition AI ($175M Series A)', color: '#34D399' },
    { time: '14:50:05', worker: 'Worker #089', action: 'Cross-validated IVP press release with NVIDIA participation for Perplexity', color: '#38BDF8' },
    { time: '14:50:09', worker: 'Worker #012', action: 'Dispatched Google Search query: "Mistral AI Series B valuation TechCrunch"', color: '#EC4899' },
    { time: '14:50:14', worker: 'Worker #112', action: 'Normalizing currency fields to USD with ISO-4217 standard schema', color: '#FBBF24' },
  ])

  const swarmIntervalRef = useRef<any>(null)

  // Switch campaign
  const handleSelectCampaign = (index: number) => {
    setSelectedCampaignIndex(index)
    setRecords(CAMPAIGNS[index].initialRecords)
    setMarkdownSpec(CAMPAIGNS[index].markdownSpec)
    setSelectedRecordForDetail(null)
  }

  // Toggle Swarm Simulation
  const toggleSwarm = () => {
    if (isSwarmRunning) {
      clearInterval(swarmIntervalRef.current)
      setIsSwarmRunning(false)
      return
    }

    setIsSwarmRunning(true)

    const sampleEntities = [
      { name: 'Sierra AI', cat: 'Conversational Enterprise Agents', a: '$110,000,000', b: 'Series A ($1.0B Val)', c: 'Sequoia Capital, Benchmark', src: 'https://sierra.ai/news' },
      { name: 'Harvey AI', cat: 'Legal Reasoning & Analysis', a: '$100,000,000', b: 'Series C ($1.5B Val)', c: 'GV, OpenAI Startup Fund', src: 'https://harvey.ai/blog' },
      { name: 'Decagon AI', cat: 'Autonomous Customer Service', a: '$65,000,000', b: 'Series B', c: 'Bain Capital Ventures, Accel', src: 'https://decagon.ai/press' },
      { name: 'Together AI', cat: 'Decentralized GPU Cloud & Training', a: '$106,000,000', b: 'Series A ($1.25B Val)', c: 'Salesforce Ventures, Lux', src: 'https://together.ai/news' },
      { name: 'Glean', cat: 'Workplace Knowledge Search & Agents', a: '$260,000,000', b: 'Series E ($4.6B Val)', c: 'Altimeter, DST Global', src: 'https://glean.com/press' },
    ]

    let counter = 0
    swarmIntervalRef.current = setInterval(() => {
      setToolCallsCount(prev => prev + Math.floor(Math.random() * 8 + 4))
      
      const newEntity = sampleEntities[counter % sampleEntities.length]
      const randomWorkerId = Math.floor(Math.random() * 128 + 1)
      const randomRole = SWARM_WORKER_ROLES[Math.floor(Math.random() * SWARM_WORKER_ROLES.length)]

      const newRecord: DatasetRecord = {
        id: `rec-gen-${Date.now()}-${counter}`,
        entity: newEntity.name,
        category: newEntity.cat,
        metricA: newEntity.a,
        metricB: newEntity.b,
        metricC: newEntity.c,
        confidence: +(97 + Math.random() * 2.8).toFixed(1),
        sourceUrl: newEntity.src,
        sourceTitle: `${newEntity.name} Funding Announcement & Verified Disclosures`,
        verifiedBy: `Worker #${String(randomWorkerId).padStart(3, '0')} (${randomRole.name})`,
        status: 'Verified',
        citations: ['Verified Domain DNS Record', 'Regulatory Wire Dispatch'],
        rawSnippet: `Autonomous extraction completed for ${newEntity.name} across 4 primary domain sources.`,
      }

      setRecords(prev => [newRecord, ...prev.slice(0, 49)])

      setLiveLogs(prev => [
        {
          time: new Date().toLocaleTimeString(),
          worker: `Worker #${String(randomWorkerId).padStart(3, '0')}`,
          action: `Extracted & verified [${newEntity.name}] schema with 99.4% confidence`,
          color: randomRole.color,
        },
        ...prev.slice(0, 24),
      ])

      counter++
    }, 1400)
  }

  useEffect(() => {
    return () => {
      if (swarmIntervalRef.current) clearInterval(swarmIntervalRef.current)
    }
  }, [])

  // Export dataset to CSV
  const handleExportCSV = () => {
    const headerRow = currentCampaign.headers.map(h => h.label).concat(['Confidence (%)', 'Source URL', 'Verified By']).join(',')
    const rows = records.map(r => [
      `"${r.entity}"`,
      `"${r.category}"`,
      `"${r.metricA}"`,
      `"${r.metricB}"`,
      `"${r.metricC}"`,
      r.confidence,
      `"${r.sourceUrl}"`,
      `"${r.verifiedBy}"`,
    ].join(','))

    const csvContent = 'data:text/csv;charset=utf-8,' + [headerRow, ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `kimi-swarm-dataset-${currentCampaign.id}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export JSON
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(records, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `kimi-swarm-dataset-${currentCampaign.id}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filtered records
  const filteredRecords = records.filter(r =>
    r.entity.toLowerCase().includes(searchQueryFilter.toLowerCase()) ||
    r.category.toLowerCase().includes(searchQueryFilter.toLowerCase()) ||
    r.metricC.toLowerCase().includes(searchQueryFilter.toLowerCase())
  )

  return (
    <>
      <TopBar title="Kimi Agent Swarm · Web Dataset Gathering Engine">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Swarm Live Telemetry Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12.5,
              fontWeight: 600,
              padding: '6px 14px',
              borderRadius: 999,
              background: isSwarmRunning ? 'rgba(56,189,248,0.12)' : 'rgba(52,211,153,0.12)',
              color: isSwarmRunning ? '#38BDF8' : '#34D399',
              border: `1px solid ${isSwarmRunning ? 'rgba(56,189,248,0.3)' : 'rgba(52,211,153,0.3)'}`,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: isSwarmRunning ? '#38BDF8' : '#34D399',
                boxShadow: isSwarmRunning ? '0 0 10px #38BDF8' : '0 0 10px #34D399',
                animation: isSwarmRunning ? 'pulse 1.2s infinite' : 'none',
              }}
            />
            {isSwarmRunning ? '128 Sub-Agents Gathering…' : 'Swarm Ready (128 Workers Online)'}
          </div>

          <button
            onClick={toggleSwarm}
            className="pill-primary"
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: '8px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(124, 58, 237, 0.35)',
            }}
          >
            {isSwarmRunning ? <IcPause size={15} /> : <IcPlay size={15} />}
            {isSwarmRunning ? 'Halt Swarm' : 'Launch Swarm Extraction'}
          </button>
        </div>
      </TopBar>

      <PageContent style={{ maxWidth: 1380, margin: '0 auto' }}>
        {/* ─── Hero Overview Banner ────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 20,
            marginBottom: 20,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: 'rgba(124,58,237,0.12)',
                  color: 'var(--color-accent-violet)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Kimi Agent Swarm Multi-Agent Architecture
              </span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px 0', color: 'var(--color-foreground)', letterSpacing: '-0.02em' }}>
              Massive Web-Sourced Dataset Mining & Verification
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--color-muted)', margin: 0, maxWidth: 780, lineHeight: 1.5 }}>
              Orchestrating up to 300+ parallel sub-agents to crawl domains, extract tabular records against Markdown strategy specs, cross-verify primary citations, and synthesize clean datasets at scale.
            </p>
          </div>

          {/* KPI Metrics Dashboard */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div className="card-base" style={{ padding: '12px 18px', minWidth: 130 }}>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>Active Sub-Agents</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#38BDF8', marginTop: 2 }}>
                {activeWorkerCount} Workers
              </div>
            </div>
            <div className="card-base" style={{ padding: '12px 18px', minWidth: 130 }}>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>Parallel Tool Calls</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#7C3AED', marginTop: 2 }}>
                {toolCallsCount.toLocaleString()} calls
              </div>
            </div>
            <div className="card-base" style={{ padding: '12px 18px', minWidth: 130 }}>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>Extracted Records</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#34D399', marginTop: 2 }}>
                {records.length} Verified Rows
              </div>
            </div>
            <div className="card-base" style={{ padding: '12px 18px', minWidth: 130 }}>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>Citation Precision</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#EC4899', marginTop: 2 }}>
                99.4%
              </div>
            </div>
          </div>
        </div>

        {/* ─── Campaign Strategy Selector & View Mode Switcher ─────────────── */}
        <div
          className="card-base"
          style={{
            padding: '12px 18px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
          }}
        >
          {/* Campaign Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflowX: 'auto' }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
              Dataset Campaign:
            </span>
            {CAMPAIGNS.map((camp, idx) => {
              const active = selectedCampaignIndex === idx
              return (
                <button
                  key={camp.id}
                  onClick={() => handleSelectCampaign(idx)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: `1.5px solid ${active ? 'var(--color-accent-violet)' : 'var(--color-border)'}`,
                    background: active ? 'var(--color-nav-active-bg)' : 'var(--color-surface)',
                    color: active ? 'var(--color-accent-violet)' : 'var(--color-foreground)',
                    fontWeight: 600,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {camp.title}
                </button>
              )
            })}
          </div>

          {/* View Mode Switcher */}
          <div style={{ display: 'flex', gap: 6, background: 'var(--color-surface)', padding: 4, borderRadius: 8, border: '1px solid var(--color-border)' }}>
            <button
              onClick={() => setViewMode('dataset')}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                background: viewMode === 'dataset' ? 'var(--color-nav-active-bg)' : 'transparent',
                color: viewMode === 'dataset' ? 'var(--color-accent-violet)' : 'var(--color-muted)',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <IcTable size={14} /> Live Dataset Table
            </button>
            <button
              onClick={() => setViewMode('spec')}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                background: viewMode === 'spec' ? 'var(--color-nav-active-bg)' : 'transparent',
                color: viewMode === 'spec' ? 'var(--color-accent-violet)' : 'var(--color-muted)',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <IcSparkles size={14} /> Markdown Strategy Spec
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                background: viewMode === 'matrix' ? 'var(--color-nav-active-bg)' : 'transparent',
                color: viewMode === 'matrix' ? 'var(--color-accent-violet)' : 'var(--color-muted)',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <IcCpu size={14} /> Swarm Worker Matrix (128x)
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            VIEW 1: LIVE DATASET STUDIO & TABLE
            ═══════════════════════════════════════════════════════════════════ */}
        {viewMode === 'dataset' && (
          <div style={{ display: 'grid', gridTemplateColumns: selectedRecordForDetail ? '1fr 400px' : '1fr', gap: 20, alignItems: 'start' }}>
            {/* Table Container */}
            <div className="card-base" style={{ padding: 20, overflow: 'hidden' }}>
              {/* Table Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-input-bg)',
                      width: '100%',
                      maxWidth: 360,
                    }}
                  >
                    <IcSearch size={15} color="var(--color-muted)" />
                    <input
                      type="text"
                      value={searchQueryFilter}
                      onChange={e => setSearchQueryFilter(e.target.value)}
                      placeholder="Search entities, categories, investors…"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--color-foreground)',
                        fontSize: 12.5,
                        width: '100%',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                    Showing {filteredRecords.length} records
                  </span>
                </div>

                {/* Export Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={handleExportCSV}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 14px',
                      borderRadius: 7,
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-card)',
                      color: 'var(--color-foreground)',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <IcDownload size={14} /> Export CSV
                  </button>
                  <button
                    onClick={handleExportJSON}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 14px',
                      borderRadius: 7,
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-card)',
                      color: 'var(--color-foreground)',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <IcDownload size={14} /> Export JSON
                  </button>
                </div>
              </div>

              {/* Data Grid */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid var(--color-border)', color: 'var(--color-muted)', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {currentCampaign.headers.map(h => (
                        <th key={h.key} style={{ padding: '10px 12px', fontWeight: 700 }}>
                          {h.label}
                        </th>
                      ))}
                      <th style={{ padding: '10px 12px', fontWeight: 700 }}>Confidence</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700 }}>Source Proof</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-muted)' }}>
                          No records match search filter.
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map(rec => (
                        <tr
                          key={rec.id}
                          onClick={() => setSelectedRecordForDetail(rec)}
                          style={{
                            borderBottom: '1px solid var(--color-border-faint)',
                            cursor: 'pointer',
                            background: selectedRecordForDetail?.id === rec.id ? 'var(--color-nav-active-bg)' : 'transparent',
                            transition: 'background 0.12s ease',
                          }}
                          onMouseEnter={e => {
                            if (selectedRecordForDetail?.id !== rec.id) {
                              e.currentTarget.style.background = 'var(--color-hover)'
                            }
                          }}
                          onMouseLeave={e => {
                            if (selectedRecordForDetail?.id !== rec.id) {
                              e.currentTarget.style.background = 'transparent'
                            }
                          }}
                        >
                          {/* Col 1: Entity */}
                          <td style={{ padding: '12px 12px', fontWeight: 700, color: 'var(--color-foreground)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399' }} />
                              {rec.entity}
                            </div>
                          </td>

                          {/* Col 2: Category */}
                          <td style={{ padding: '12px 12px', color: 'var(--color-muted)' }}>
                            <span style={{ fontSize: 11.5, padding: '2px 7px', borderRadius: 5, background: 'var(--color-hover)', color: 'var(--color-foreground)' }}>
                              {rec.category}
                            </span>
                          </td>

                          {/* Col 3: Metric A */}
                          <td style={{ padding: '12px 12px', fontWeight: 600, color: 'var(--color-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>
                            {rec.metricA}
                          </td>

                          {/* Col 4: Metric B */}
                          <td style={{ padding: '12px 12px', color: 'var(--color-muted)' }}>
                            {rec.metricB}
                          </td>

                          {/* Col 5: Metric C */}
                          <td style={{ padding: '12px 12px', color: 'var(--color-muted)' }}>
                            {rec.metricC}
                          </td>

                          {/* Confidence */}
                          <td style={{ padding: '12px 12px' }}>
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#34D399', background: 'rgba(52,211,153,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                              {rec.confidence}%
                            </span>
                          </td>

                          {/* Source Link */}
                          <td style={{ padding: '12px 12px' }}>
                            <a
                              href={rec.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                color: 'var(--color-accent-violet)',
                                textDecoration: 'none',
                                fontSize: 11.5,
                                fontWeight: 600,
                              }}
                            >
                              Cite <IcExternalLink size={11} />
                            </a>
                          </td>

                          {/* Inspect */}
                          <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                            <button
                              onClick={() => setSelectedRecordForDetail(rec)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                border: '1px solid var(--color-border)',
                                background: 'transparent',
                                color: 'var(--color-foreground)',
                                fontSize: 11.5,
                                cursor: 'pointer',
                              }}
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Record Inspector Drawer Subpanel */}
            {selectedRecordForDetail && (
              <div
                className="card-base"
                style={{
                  padding: 22,
                  border: '1.5px solid var(--color-accent-violet)',
                  position: 'sticky',
                  top: 24,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-foreground)' }}>
                    Record Verification Proof
                  </div>
                  <button
                    onClick={() => setSelectedRecordForDetail(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', fontSize: 16 }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-foreground)' }}>
                    {selectedRecordForDetail.entity}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
                    {selectedRecordForDetail.category}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  <div style={{ padding: 10, borderRadius: 8, background: 'var(--color-surface)', fontSize: 12 }}>
                    <div style={{ color: 'var(--color-muted)', fontSize: 11, marginBottom: 2 }}>Primary Metrics</div>
                    <div style={{ fontWeight: 700, color: 'var(--color-foreground)' }}>
                      {selectedRecordForDetail.metricA} · {selectedRecordForDetail.metricB}
                    </div>
                    <div style={{ color: 'var(--color-muted)', marginTop: 2 }}>{selectedRecordForDetail.metricC}</div>
                  </div>

                  <div style={{ padding: 10, borderRadius: 8, background: 'var(--color-surface)', fontSize: 12 }}>
                    <div style={{ color: 'var(--color-muted)', fontSize: 11, marginBottom: 2 }}>Extracted Raw Snippet</div>
                    <div style={{ color: 'var(--color-foreground)', fontStyle: 'italic', lineHeight: 1.4 }}>
                      "{selectedRecordForDetail.rawSnippet}"
                    </div>
                  </div>

                  <div style={{ padding: 10, borderRadius: 8, background: 'var(--color-surface)', fontSize: 12 }}>
                    <div style={{ color: 'var(--color-muted)', fontSize: 11, marginBottom: 4 }}>Independent Citation Trail</div>
                    {selectedRecordForDetail.citations.map((cite, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34D399', fontSize: 11.5, marginBottom: 2 }}>
                        <IcCheck size={12} /> {cite}
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: 10, borderRadius: 8, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', fontSize: 11.5 }}>
                    <div style={{ color: 'var(--color-muted)', marginBottom: 2 }}>Validated By</div>
                    <div style={{ fontWeight: 600, color: 'var(--color-accent-violet)' }}>
                      {selectedRecordForDetail.verifiedBy}
                    </div>
                  </div>
                </div>

                <a
                  href={selectedRecordForDetail.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="pill-primary"
                  style={{ width: '100%', padding: '8px', fontSize: 12.5, justifyContent: 'center', textDecoration: 'none' }}
                >
                  <IcExternalLink size={14} /> Open Primary Source URL
                </a>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            VIEW 2: MARKDOWN STRATEGY & SPEC BUILDER
            ═══════════════════════════════════════════════════════════════════ */}
        {viewMode === 'spec' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Editor */}
            <div className="card-base" style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-foreground)' }}>
                    Kimi Swarm Strategy Markdown Spec
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                    Defines task decomposition, schema constraints, and verification logic.
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(markdownSpec)
                    setCopyFeedback(true)
                    setTimeout(() => setCopyFeedback(false), 2000)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-card)',
                    color: 'var(--color-foreground)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {copyFeedback ? <IcCheck size={13} color="#34D399" /> : <IcCopy size={13} />}
                  {copyFeedback ? 'Copied' : 'Copy Spec'}
                </button>
              </div>

              <textarea
                value={markdownSpec}
                onChange={e => setMarkdownSpec(e.target.value)}
                rows={18}
                style={{
                  width: '100%',
                  padding: 14,
                  borderRadius: 8,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-input-bg)',
                  color: 'var(--color-foreground)',
                  fontSize: 12.5,
                  fontFamily: 'JetBrains Mono, monospace',
                  lineHeight: 1.6,
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            {/* Live Parsing Preview & Completion Gates */}
            <div className="card-base" style={{ padding: 22 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-foreground)', marginBottom: 4 }}>
                Swarm Rule Validation Engine
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 18 }}>
                Automatic compliance checks parsed from the active Markdown document.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-surface)', borderLeft: '3px solid #34D399' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-foreground)', marginBottom: 3 }}>
                    ✓ Target Entity & Schema Parsed
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>
                    Extracted 5 required tabular fields: Entity Name, Architecture, Total Funding, Lead Investors, Source URL.
                  </div>
                </div>

                <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-surface)', borderLeft: '3px solid #38BDF8' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-foreground)', marginBottom: 3 }}>
                    ✓ Sourcing Allowlist Strategy
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>
                    Primary sources prioritized: SEC EDGAR Form D filings, direct company domain press feeds, Crunchbase Enterprise API.
                  </div>
                </div>

                <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-surface)', borderLeft: '3px solid #EC4899' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-foreground)', marginBottom: 3 }}>
                    ✓ Double-Citation Verification Gate
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>
                    Sub-agents mandated to verify every single monetary figure across at least 2 independent URLs before committing row.
                  </div>
                </div>

                <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-surface)', borderLeft: '3px solid #FBBF24' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-foreground)', marginBottom: 3 }}>
                    ✓ Auto-Deduplication & Unit Normalizer
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>
                    Fuzzy Levenshtein matching prevents duplicate company entries under parent holding entities.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            VIEW 3: SWARM WORKER MATRIX (128x PARALLEL NODES)
            ═══════════════════════════════════════════════════════════════════ */}
        {viewMode === 'matrix' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
            {/* 128-Worker Visual Grid */}
            <div className="card-base" style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-foreground)' }}>
                    128x Parallel Sub-Agent Cluster
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                    Live status and concurrency load across all worker threads.
                  </div>
                </div>

                {/* Worker Type Badges */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {SWARM_WORKER_ROLES.map(role => (
                    <span
                      key={role.id}
                      style={{
                        fontSize: 11,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: role.bg,
                        color: role.color,
                        fontWeight: 600,
                      }}
                    >
                      {role.name} ({role.count})
                    </span>
                  ))}
                </div>
              </div>

              {/* Grid Nodes */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(16, 1fr)',
                  gap: 8,
                  padding: 14,
                  borderRadius: 10,
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {Array.from({ length: 128 }).map((_, i) => {
                  const roleIndex = Math.floor((i / 128) * SWARM_WORKER_ROLES.length)
                  const role = SWARM_WORKER_ROLES[roleIndex]
                  const isNodeActive = isSwarmRunning && Math.random() > 0.25

                  return (
                    <div
                      key={i}
                      title={`Worker #${String(i + 1).padStart(3, '0')}: ${role.name}`}
                      style={{
                        aspectRatio: '1/1',
                        borderRadius: 4,
                        background: isNodeActive ? role.color : role.bg,
                        border: `1px solid ${role.color}50`,
                        boxShadow: isNodeActive ? `0 0 8px ${role.color}` : 'none',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  )
                })}
              </div>
            </div>

            {/* Live Streaming Worker Log */}
            <div className="card-base" style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-foreground)' }}>
                  Sub-Agent Live Log Stream
                </div>
                <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>Real-time telemetry</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  maxHeight: 380,
                  overflowY: 'auto',
                  paddingRight: 4,
                }}
              >
                {liveLogs.map((log, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      background: 'var(--color-surface)',
                      borderLeft: `3px solid ${log.color}`,
                      fontSize: 11.5,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, color: log.color }}>{log.worker}</span>
                      <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>{log.time}</span>
                    </div>
                    <div style={{ color: 'var(--color-foreground)', lineHeight: 1.35 }}>
                      {log.action}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </PageContent>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  )
}
