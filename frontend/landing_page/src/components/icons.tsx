export type IconProps = { size?: number; className?: string; style?: React.CSSProperties; color?: string; on?: boolean }
const I = ({ size = 18, d, className = '', style, color }: IconProps & { d: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color ?? 'currentColor'}
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ ...(color ? { color } : {}), ...style }}
  >
    <path d={d} />
  </svg>
)

export const IcHome = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={p.className} style={{ ...(p.color ? { color: p.color } : {}), ...p.style }}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </svg>
)
export const IcOverview = IcHome

export const IcEvaluations = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={p.className} style={{ ...(p.color ? { color: p.color } : {}), ...p.style }}>
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <path d="m9 14 2 2 4-4" />
  </svg>
)

export const IcJudge = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={p.className} style={{ ...(p.color ? { color: p.color } : {}), ...p.style }}>
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
  </svg>
)

export const IcAdvisor = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={p.className} style={{ ...(p.color ? { color: p.color } : {}), ...p.style }}>
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M12 2v2" />
  </svg>
)

export const IcCompare = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={p.className} style={{ ...(p.color ? { color: p.color } : {}), ...p.style }}>
    <line x1="18" y1="20" x2="18" y2="4" strokeWidth="2" />
    <line x1="12" y1="20" x2="12" y2="10" strokeWidth="2" />
    <line x1="6" y1="20" x2="6" y2="15" strokeWidth="2" />
    <path d="M3 20h18" strokeWidth="1.5" />
  </svg>
)

export const IcSettings = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={p.className} style={{ ...(p.color ? { color: p.color } : {}), ...p.style }}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
export const IcChevronRight = (p: IconProps) => <I {...p} d="m9 18 6-6-6-6" />
export const IcChevronDown = (p: IconProps) => <I {...p} d="m6 9 6 6 6-6" />
export const IcPlus = (p: IconProps) => <I {...p} d="M12 5v14M5 12h14" />
export const IcSearch = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={p.style}>
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)
export const IcSend = (p: IconProps) => <I {...p} d="m22 2-7 20-4-9-9-4z M22 2 11 13" />
export const IcCheck = (p: IconProps) => <I {...p} d="m20 6-11 11-5-5" />
export const IcX = (p: IconProps) => <I {...p} d="M18 6 6 18M6 6l12 12" />
export const IcFlag = (p: IconProps) => <I {...p} d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7" />
export const IcRotate = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
  </svg>
)
export const IcMenu = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)
export const IcArrowRight = (p: IconProps) => <I {...p} d="M5 12h14M12 5l7 7-7 7" />
export const IcExternalLink = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
)
export const IcEye = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
export const IcEyeOff = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/>
  </svg>
)
export const IcToggle = ({ on, size = 18 }: { on: boolean; size?: number }) => (
  <div style={{ width: size * 2.2, height: size * 1.1, borderRadius: 9999, background: on ? '#7C3AED' : 'rgba(255,255,255,0.12)', position: 'relative', transition: 'background 0.2s', cursor: 'pointer', border: `1px solid ${on ? '#7C3AED' : 'rgba(255,255,255,0.15)'}`, flexShrink: 0 }}>
    <div style={{ position: 'absolute', top: 2, left: on ? `calc(100% - ${size * 0.9}px - 2px)` : 2, width: size * 0.9, height: size * 0.9, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
  </div>
)

export const IcKey = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>
  </svg>
)
export const IcBell = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>
)
export const IcUser = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
export const IcCreditCard = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
)
export const IcCopy = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)
export const IcTrash = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
)
export const IcFilter = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
)
export const IcLogout = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)
export const IcSun = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)
export const IcMoon = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)
export const IcChat = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)
export const IcThumbsUp = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
  </svg>
)
export const IcThumbsDown = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"/>
  </svg>
)
export const IcSparkles = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4M3 5h4M19 17v4M17 19h4"/>
  </svg>
)
export const IcMic = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
    <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8"/>
  </svg>
)

// ─── Judge Agent Specialized Logos / Icons ─────────────────────────────────────

/** Accuracy Judge: Target & precision crosshair with verified ground-truth bullseye */
export const IcJudgeAccuracy = (p: IconProps) => (
  <svg width={p.size ?? 20} height={p.size ?? 20} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={p.className} style={{ ...(p.color ? { color: p.color } : {}), ...p.style }}>
    <circle cx="12" cy="12" r="9" strokeWidth="1.5" strokeDasharray="4 2" />
    <circle cx="12" cy="12" r="5" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="1.5" fill={p.color ?? 'currentColor'} stroke="none" />
    <line x1="12" y1="1" x2="12" y2="4" strokeWidth="1.8" />
    <line x1="12" y1="20" x2="12" y2="23" strokeWidth="1.8" />
    <line x1="1" y1="12" x2="4" y2="12" strokeWidth="1.8" />
    <line x1="20" y1="12" x2="23" y2="12" strokeWidth="1.8" />
  </svg>
)

/** Relevance Judge: Direct query-intent alignment beam connecting query & response nodes */
export const IcJudgeRelevance = (p: IconProps) => (
  <svg width={p.size ?? 20} height={p.size ?? 20} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={p.className} style={{ ...(p.color ? { color: p.color } : {}), ...p.style }}>
    <circle cx="5" cy="12" r="3" strokeWidth="1.6" />
    <circle cx="19" cy="12" r="3" strokeWidth="1.6" />
    <line x1="8" y1="12" x2="16" y2="12" strokeWidth="2" />
    <polyline points="12 8 16 12 12 16" strokeWidth="1.8" />
    <path d="M12 4.5C8.5 4.5 5 7.5 5 12" strokeWidth="1.4" strokeDasharray="2 2" />
    <path d="M12 19.5C15.5 19.5 19 16.5 19 12" strokeWidth="1.4" strokeDasharray="2 2" />
  </svg>
)

/** Reasoning Judge: Structured neural logic graph and step-by-step cognitive deduction */
export const IcJudgeReasoning = (p: IconProps) => (
  <svg width={p.size ?? 20} height={p.size ?? 20} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={p.className} style={{ ...(p.color ? { color: p.color } : {}), ...p.style }}>
    <path d="M9.5 3A3 3 0 0 0 6 6c0 .4.1.8.2 1.2A3.5 3.5 0 0 0 4 10.5c0 1.2.6 2.3 1.5 2.9A3.5 3.5 0 0 0 7 19.5c.8 0 1.6-.3 2.2-.8" strokeWidth="1.5" />
    <path d="M14.5 3A3 3 0 0 1 18 6c0 .4-.1.8-.2 1.2A3.5 3.5 0 0 1 20 10.5c0 1.2-.6 2.3-1.5 2.9A3.5 3.5 0 0 1 17 19.5c-.8 0-1.6-.3-2.2-.8" strokeWidth="1.5" />
    <line x1="12" y1="4" x2="12" y2="20" strokeWidth="1.5" strokeDasharray="2 2" />
    <circle cx="12" cy="7" r="1.5" fill={p.color ?? 'currentColor'} stroke="none" />
    <circle cx="8.5" cy="12" r="1.5" fill={p.color ?? 'currentColor'} stroke="none" />
    <circle cx="15.5" cy="12" r="1.5" fill={p.color ?? 'currentColor'} stroke="none" />
    <circle cx="12" cy="17" r="1.5" fill={p.color ?? 'currentColor'} stroke="none" />
    <path d="M8.5 12L12 7l3.5 5-3.5 5Z" strokeWidth="1.2" opacity="0.6" />
  </svg>
)

/** Hallucination Judge: Reality scanner eye detecting & filtering phantom mirages and distortions */
export const IcJudgeHallucination = (p: IconProps) => (
  <svg width={p.size ?? 20} height={p.size ?? 20} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={p.className} style={{ ...(p.color ? { color: p.color } : {}), ...p.style }}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="3.5" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="1.5" fill={p.color ?? 'currentColor'} stroke="none" />
    <path d="M9.5 8.5C10.2 8 11.1 7.8 12 7.8c2.3 0 4.2 1.9 4.2 4.2" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="3" y1="3" x2="21" y2="21" strokeWidth="1.8" />
  </svg>
)

/** Safety Judge: Reinforced security shield with inner protection check & guardrail */
export const IcJudgeSafety = (p: IconProps) => (
  <svg width={p.size ?? 20} height={p.size ?? 20} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={p.className} style={{ ...(p.color ? { color: p.color } : {}), ...p.style }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="1.8" />
    <path d="M9 12l2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/** Style Judge: Fountain quill pen & typography flourish with aesthetic sparkle polish */
export const IcJudgeStyle = (p: IconProps) => (
  <svg width={p.size ?? 20} height={p.size ?? 20} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={p.className} style={{ ...(p.color ? { color: p.color } : {}), ...p.style }}>
    <path d="M12 19l7-7 3 3-7 7-3-3z" strokeWidth="1.6" />
    <path d="M18 13L16.5 5.5 2 2l3.5 14.5L13 18z" strokeWidth="1.6" />
    <path d="M2 2l7.586 7.586" strokeWidth="1.6" />
    <circle cx="11" cy="11" r="1.5" fill={p.color ?? 'currentColor'} stroke="none" />
    <path d="M19 3v3m-1.5-1.5h3" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)


