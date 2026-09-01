import { useState, useEffect } from 'react'
import { TopBar, PageContent } from '../components/AppShell'
import { IcChevronDown, IcSparkles } from '../components/icons'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

const ALL_MODELS = ['claude-3.5-sonnet', 'gpt-4o', 'gemini-2.0-flash', 'llama-3.1-70b', 'gpt-4o-mini', 'mistral-large']

const MODEL_DATA: Record<string, { accuracy: number; relevance: number; reasoning: number; hallucination: number; safety: number; style: number; cost: number; latency: number; color: string }> = {
  'claude-3.5-sonnet':  { accuracy: 94, relevance: 91, reasoning: 92, hallucination: 97, safety: 99, style: 88, cost: 1.8, latency: 2.1, color: '#7C3AED' },
  'gpt-4o':             { accuracy: 93, relevance: 90, reasoning: 91, hallucination: 96, safety: 98, style: 87, cost: 2.5, latency: 1.9, color: '#0284C7' },
  'gemini-2.0-flash':   { accuracy: 94, relevance: 89, reasoning: 88, hallucination: 98, safety: 99, style: 81, cost: 0.2, latency: 1.4, color: '#10B981' },
  'llama-3.1-70b':      { accuracy: 78, relevance: 80, reasoning: 75, hallucination: 88, safety: 91, style: 74, cost: 0.08, latency: 2.8, color: '#F59E0B' },
  'gpt-4o-mini':        { accuracy: 84, relevance: 83, reasoning: 85, hallucination: 92, safety: 92, style: 84, cost: 0.15, latency: 0.9, color: '#EC4899' },
  'mistral-large':      { accuracy: 82, relevance: 81, reasoning: 83, hallucination: 91, safety: 91, style: 82, cost: 2.0, latency: 2.3, color: '#F97316' },
}

const RUBRICS = ['accuracy', 'relevance', 'reasoning', 'hallucination', 'safety', 'style'] as const

// ─── Model Comparison Splash Screen ──────────────────────────────────────────

function ModelComparisonSplashScreen() {
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
          animation: 'compSplashFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Centered Illustration */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <img
            src="/model-comparison.png"
            alt="Model Comparison Benchmark"
            style={{
              width: 340,
              maxWidth: '85vw',
              height: 'auto',
              filter: 'drop-shadow(0 20px 45px rgba(124, 58, 237, 0.35))',
              userSelect: 'none',
              pointerEvents: 'none',
              animation: 'compFloat 3s ease-in-out infinite',
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
          <IcSparkles size={12} /> Multi-Model Benchmarking
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
          Model Comparison
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
          Comparing model latency, cost efficiency, and multi-rubric benchmarks…
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
              animation: 'compProgress 4s linear forwards',
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ModelComparison() {
  // Splash state — 4-second initial mount transition
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 4000)
    return () => clearTimeout(timer)
  }, [])

  const [selected, setSelected] = useState(['claude-3.5-sonnet', 'gpt-4o', 'gemini-2.0-flash'])
  const [dropOpen, setDropOpen] = useState(false)

  const toggle = (m: string) => setSelected(s => s.includes(m) ? (s.length > 2 ? s.filter(x => x !== m) : s) : s.length < 4 ? [...s, m] : s)

  const radarData = RUBRICS.map(r => ({ subject: r.charAt(0).toUpperCase() + r.slice(1), ...Object.fromEntries(selected.map(m => [m, MODEL_DATA[m]?.[r] ?? 0])) }))

  const costData = selected.map(m => ({ model: m.split('-').slice(0, 2).join('-'), cost: MODEL_DATA[m]?.cost ?? 0, latency: MODEL_DATA[m]?.latency ?? 0 }))

  return (
    <>
      {/* 4-Second Initial Splash Screen */}
      {showSplash && <ModelComparisonSplashScreen />}

      {/* Main Model Comparison Workspace */}
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
        <TopBar title="Compare Models">
          {/* Model multi-select */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setDropOpen(!dropOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 9,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-foreground)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                transition: 'border-color 0.15s ease, background 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-border-light)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            >
              <span>{selected.length} models selected</span>
              <IcChevronDown size={14} style={{ transform: dropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--color-muted)' }} />
            </button>
            {dropOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  width: 240,
                  background: 'var(--color-dropdown-bg, #14131F)',
                  border: '1px solid var(--color-dropdown-border, var(--color-border))',
                  borderRadius: 12,
                  overflow: 'hidden',
                  zIndex: 50,
                  boxShadow: '0 16px 48px rgba(0,0,0,0.25)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                {ALL_MODELS.map(m => {
                  const on = selected.includes(m)
                  return (
                    <div
                      key={m}
                      onClick={() => toggle(m)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 14px',
                        cursor: 'pointer',
                        transition: 'background 0.1s',
                        background: on ? 'rgba(124,58,237,0.12)' : 'transparent',
                        color: 'var(--color-foreground)',
                      }}
                      onMouseEnter={e => {
                        if (!on) (e.currentTarget as HTMLDivElement).style.background = 'var(--color-dropdown-hover, var(--color-hover))'
                      }}
                      onMouseLeave={e => {
                        if (!on) (e.currentTarget as HTMLDivElement).style.background = 'transparent'
                      }}
                    >
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          border: `1px solid ${on ? 'var(--color-accent-violet)' : 'var(--color-border)'}`,
                          background: on ? 'var(--color-accent-violet)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {on && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      {MODEL_DATA[m] && <div style={{ width: 8, height: 8, borderRadius: '50%', background: MODEL_DATA[m].color, flexShrink: 0 }} />}
                      <span style={{ fontSize: 12, fontWeight: on ? 600 : 400, color: on ? 'var(--color-foreground)' : 'var(--color-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{m}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </TopBar>

        <PageContent style={{ paddingBottom: 64 }}>
          {/* Comparison table */}
          <div className="card-base" style={{ overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ padding: '18px 24px 0', fontWeight: 700, fontSize: 15, marginBottom: 16, color: 'var(--color-foreground)' }}>Rubric Score Comparison</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '10px 24px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rubric</th>
                    {selected.map(m => (
                      <th key={m} style={{ padding: '10px 20px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: MODEL_DATA[m]?.color ?? 'var(--color-foreground)', letterSpacing: '0.04em', whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace' }}>{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RUBRICS.map(r => {
                    const scores = selected.map(m => MODEL_DATA[m]?.[r] ?? 0)
                    const best = Math.max(...scores)
                    return (
                      <tr key={r} style={{ borderBottom: '1px solid var(--color-border-faint)' }}>
                        <td style={{ padding: '13px 24px', fontSize: 13, fontWeight: 600, color: 'var(--color-foreground)', textTransform: 'capitalize' }}>{r}</td>
                        {selected.map((m) => {
                          const s = MODEL_DATA[m]?.[r] ?? 0
                          const isBest = s === best
                          return (
                            <td key={m} style={{ padding: '13px 20px', textAlign: 'center', background: isBest ? 'rgba(52,211,153,0.1)' : 'transparent' }}>
                              <span style={{ fontSize: 15, fontWeight: 700, color: isBest ? '#10B981' : 'var(--color-muted-stronger)' }}>{s}</span>
                              {isBest && <span style={{ fontSize: 10, color: '#10B981', marginLeft: 4 }}>★</span>}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="compare-charts">
            {/* Radar chart */}
            <div className="card-base" style={{ padding: '20px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, paddingLeft: 8, color: 'var(--color-foreground)' }}>Rubric Profile Radar</div>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} />
                  {selected.map(m => (
                    <Radar key={m} name={m} dataKey={m} stroke={MODEL_DATA[m]?.color} fill={MODEL_DATA[m]?.color} fillOpacity={0.15} strokeWidth={2} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8, color: 'var(--color-foreground)' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Cost/Latency bar chart */}
            <div className="card-base" style={{ padding: '20px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, paddingLeft: 8, color: 'var(--color-foreground)' }}>Cost & Latency</div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 16, paddingLeft: 8 }}>Cost $/1k tokens (blue) · Latency P95 in seconds (purple)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={costData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="4 4" />
                  <XAxis dataKey="model" tick={{ fontSize: 10, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 12, color: 'var(--color-foreground)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }} labelStyle={{ color: 'var(--color-foreground)', fontWeight: 600 }} />
                  <Bar dataKey="cost" name="Cost $/1k" fill="#38BDF8" radius={[4,4,0,0]} fillOpacity={0.85} />
                  <Bar dataKey="latency" name="Latency s" fill="#7C3AED" radius={[4,4,0,0]} fillOpacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </PageContent>
      </div>

      <style>{`
        @keyframes compFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes compSplashFadeIn { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
        @keyframes compProgress { 0%{width:0%} 100%{width:100%} }
        @media(max-width:768px){.compare-charts{grid-template-columns:1fr !important;}}
      `}</style>
    </>
  )
}
