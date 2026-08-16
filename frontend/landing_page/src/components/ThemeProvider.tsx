import { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'
export type Density = 'compact' | 'comfortable' | 'spacious'
export type FontSize = 'small' | 'medium' | 'large'

export interface UserProfile {
  name: string
  email: string
  org: string
  bio: string
  avatarColor: string
  avatarInitials: string
}

export interface ChatSettings {
  autoSend: boolean
  showTimestamps: boolean
  markdownRender: boolean
  codeHighlight: boolean
  chatHistory: number
  defaultModel: string
}

export interface EvalSettings {
  defaultJudges: number
  autoRun: boolean
  parallelEvals: boolean
  saveArtifacts: boolean
  confidenceThreshold: number
  defaultDataset: string
}

export interface NotifSettings {
  flagged: boolean
  weekly: boolean
  api: boolean
  product: boolean
  swarm: boolean
  advisor: boolean
}

export interface ApiKeyItem {
  id: string
  name: string
  prefix: string
  fullKey?: string
  created: string
  lastUsed: string
  permissions: 'Full access' | 'Read-only'
}

export interface PlanSettings {
  name: string
  price: string
  cycle: string
  renewalDate: string
  includedEvals: number
  usedEvals: number
  cardLast4: string
  cardBrand: string
}

export interface SettingsContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  density: Density
  setDensity: (d: Density) => void
  fontSize: FontSize
  setFontSize: (f: FontSize) => void
  animations: boolean
  setAnimations: (a: boolean) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (c: boolean) => void
  profile: UserProfile
  updateProfile: (p: Partial<UserProfile>) => void
  chatSettings: ChatSettings
  updateChatSettings: (c: Partial<ChatSettings>) => void
  evalSettings: EvalSettings
  updateEvalSettings: (e: Partial<EvalSettings>) => void
  notifSettings: NotifSettings
  updateNotifSettings: (n: Partial<NotifSettings>) => void
  apiKeys: ApiKeyItem[]
  addApiKey: (name: string, permissions: 'Full access' | 'Read-only') => ApiKeyItem
  revokeApiKey: (id: string) => void
  plan: PlanSettings
  updatePlan: (p: Partial<PlanSettings>) => void
  resetToDefaults: () => void
  exportAllData: () => void
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Sarah Lin',
  email: 'sarah@judgeai.dev',
  org: 'Acme AI Labs',
  bio: 'Lead ML Engineer focused on LLM multi-agent evaluation, alignment and safety guardrails.',
  avatarColor: 'linear-gradient(135deg, #7C3AED, #38BDF8)',
  avatarInitials: 'SL',
}

const DEFAULT_CHAT: ChatSettings = {
  autoSend: false,
  showTimestamps: true,
  markdownRender: true,
  codeHighlight: true,
  chatHistory: 30,
  defaultModel: 'claude-3.5-sonnet',
}

const DEFAULT_EVAL: EvalSettings = {
  defaultJudges: 6,
  autoRun: true,
  parallelEvals: true,
  saveArtifacts: true,
  confidenceThreshold: 85,
  defaultDataset: 'general-v2',
}

const DEFAULT_NOTIF: NotifSettings = {
  flagged: true,
  weekly: true,
  api: false,
  product: true,
  swarm: true,
  advisor: true,
}

const DEFAULT_API_KEYS: ApiKeyItem[] = [
  { id: 'k1', name: 'Production Fleet', prefix: 'jai_live_••••••••8f2a', fullKey: 'jai_live_998a412f7b8c3d1e0a8f2a', created: 'Jun 12, 2026', lastUsed: '3 min ago', permissions: 'Full access' },
  { id: 'k2', name: 'Staging Evaluation Runner', prefix: 'jai_test_••••••••c091', fullKey: 'jai_test_418b773d2a1f9e4c0c091', created: 'Jul 2, 2026', lastUsed: '2 days ago', permissions: 'Read-only' },
  { id: 'k3', name: 'CI/CD Regression Pipeline', prefix: 'jai_live_••••••••4d17', fullKey: 'jai_live_771f280e4b9a1c8d4d17', created: 'Jul 20, 2026', lastUsed: '14 min ago', permissions: 'Full access' },
]

const DEFAULT_PLAN: PlanSettings = {
  name: 'Pro',
  price: '$199/month',
  cycle: 'Monthly',
  renewalDate: 'Sep 9, 2026',
  includedEvals: 100000,
  usedEvals: 67400,
  cardLast4: '4242',
  cardBrand: 'VISA',
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function useTheme() {
  const ctx = useContext(SettingsContext)
  if (!ctx) {
    return {
      theme: 'dark' as Theme,
      toggleTheme: () => {},
      setTheme: () => {},
    }
  }
  return {
    theme: ctx.theme,
    toggleTheme: ctx.toggleTheme,
    setTheme: ctx.setTheme,
  }
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) {
    throw new Error('useSettings must be used within a ThemeProvider / SettingsProvider')
  }
  return ctx
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Theme
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark'
    const saved = localStorage.getItem('theme') as Theme | null
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  })

  // Density
  const [density, setDensityState] = useState<Density>(() => {
    if (typeof window === 'undefined') return 'comfortable'
    return (localStorage.getItem('judgeai_density') as Density) || 'comfortable'
  })

  // Font Size
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    if (typeof window === 'undefined') return 'medium'
    return (localStorage.getItem('judgeai_font_size') as FontSize) || 'medium'
  })

  // Animations
  const [animations, setAnimationsState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    const saved = localStorage.getItem('judgeai_animations')
    return saved !== null ? saved === 'true' : true
  })

  // Sidebar Collapsed
  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('judgeai_sidebar_collapsed') === 'true'
  })

  // Profile
  const [profile, setProfileState] = useState<UserProfile>(() => {
    if (typeof window === 'undefined') return DEFAULT_PROFILE
    try {
      const saved = localStorage.getItem('judgeai_profile')
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE
    } catch {
      return DEFAULT_PROFILE
    }
  })

  // Chat
  const [chatSettings, setChatSettingsState] = useState<ChatSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_CHAT
    try {
      const saved = localStorage.getItem('judgeai_chat')
      return saved ? JSON.parse(saved) : DEFAULT_CHAT
    } catch {
      return DEFAULT_CHAT
    }
  })

  // Evaluation
  const [evalSettings, setEvalSettingsState] = useState<EvalSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_EVAL
    try {
      const saved = localStorage.getItem('judgeai_eval')
      return saved ? JSON.parse(saved) : DEFAULT_EVAL
    } catch {
      return DEFAULT_EVAL
    }
  })

  // Notifications
  const [notifSettings, setNotifSettingsState] = useState<NotifSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_NOTIF
    try {
      const saved = localStorage.getItem('judgeai_notif')
      return saved ? JSON.parse(saved) : DEFAULT_NOTIF
    } catch {
      return DEFAULT_NOTIF
    }
  })

  // API Keys
  const [apiKeys, setApiKeysState] = useState<ApiKeyItem[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_API_KEYS
    try {
      const saved = localStorage.getItem('judgeai_apikeys')
      return saved ? JSON.parse(saved) : DEFAULT_API_KEYS
    } catch {
      return DEFAULT_API_KEYS
    }
  })

  // Plan & Usage
  const [plan, setPlanState] = useState<PlanSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_PLAN
    try {
      const saved = localStorage.getItem('judgeai_plan')
      return saved ? JSON.parse(saved) : DEFAULT_PLAN
    } catch {
      return DEFAULT_PLAN
    }
  })

  // DOM Side Effects
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-density', density)
    localStorage.setItem('judgeai_density', density)
  }, [density])

  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize)
    localStorage.setItem('judgeai_font_size', fontSize)
  }, [fontSize])

  useEffect(() => {
    document.documentElement.setAttribute('data-animations', animations ? 'true' : 'false')
    localStorage.setItem('judgeai_animations', String(animations))
  }, [animations])

  useEffect(() => {
    localStorage.setItem('judgeai_sidebar_collapsed', String(sidebarCollapsed))
  }, [sidebarCollapsed])

  // Context Setters with Storage Sync
  const toggleTheme = () => setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'))
  const setTheme = (t: Theme) => setThemeState(t)

  const setDensity = (d: Density) => setDensityState(d)
  const setFontSize = (f: FontSize) => setFontSizeState(f)
  const setAnimations = (a: boolean) => setAnimationsState(a)
  const setSidebarCollapsed = (c: boolean) => setSidebarCollapsedState(c)

  const updateProfile = (p: Partial<UserProfile>) => {
    setProfileState(prev => {
      const initials = (p.name || prev.name)
        .split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
      const updated = { ...prev, ...p, avatarInitials: initials || prev.avatarInitials }
      localStorage.setItem('judgeai_profile', JSON.stringify(updated))
      return updated
    })
  }

  const updateChatSettings = (c: Partial<ChatSettings>) => {
    setChatSettingsState(prev => {
      const updated = { ...prev, ...c }
      localStorage.setItem('judgeai_chat', JSON.stringify(updated))
      return updated
    })
  }

  const updateEvalSettings = (e: Partial<EvalSettings>) => {
    setEvalSettingsState(prev => {
      const updated = { ...prev, ...e }
      localStorage.setItem('judgeai_eval', JSON.stringify(updated))
      return updated
    })
  }

  const updateNotifSettings = (n: Partial<NotifSettings>) => {
    setNotifSettingsState(prev => {
      const updated = { ...prev, ...n }
      localStorage.setItem('judgeai_notif', JSON.stringify(updated))
      return updated
    })
  }

  const addApiKey = (name: string, permissions: 'Full access' | 'Read-only') => {
    const rawSecret = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)
    const suffix = rawSecret.slice(-4)
    const fullKey = `jai_live_${rawSecret}`
    const newKey: ApiKeyItem = {
      id: `k_${Date.now()}`,
      name: name || 'New API Key',
      prefix: `jai_live_••••••••${suffix}`,
      fullKey,
      created: 'Just now',
      lastUsed: 'Never',
      permissions,
    }
    setApiKeysState(prev => {
      const updated = [newKey, ...prev]
      localStorage.setItem('judgeai_apikeys', JSON.stringify(updated))
      return updated
    })
    return newKey
  }

  const revokeApiKey = (id: string) => {
    setApiKeysState(prev => {
      const updated = prev.filter(k => k.id !== id)
      localStorage.setItem('judgeai_apikeys', JSON.stringify(updated))
      return updated
    })
  }

  const updatePlan = (p: Partial<PlanSettings>) => {
    setPlanState(prev => {
      const updated = { ...prev, ...p }
      localStorage.setItem('judgeai_plan', JSON.stringify(updated))
      return updated
    })
  }

  const resetToDefaults = () => {
    setThemeState('dark')
    setDensityState('comfortable')
    setFontSizeState('medium')
    setAnimationsState(true)
    setSidebarCollapsedState(false)
    setProfileState(DEFAULT_PROFILE)
    setChatSettingsState(DEFAULT_CHAT)
    setEvalSettingsState(DEFAULT_EVAL)
    setNotifSettingsState(DEFAULT_NOTIF)
    setApiKeysState(DEFAULT_API_KEYS)
    setPlanState(DEFAULT_PLAN)

    localStorage.removeItem('theme')
    localStorage.removeItem('judgeai_density')
    localStorage.removeItem('judgeai_font_size')
    localStorage.removeItem('judgeai_animations')
    localStorage.removeItem('judgeai_sidebar_collapsed')
    localStorage.removeItem('judgeai_profile')
    localStorage.removeItem('judgeai_chat')
    localStorage.removeItem('judgeai_eval')
    localStorage.removeItem('judgeai_notif')
    localStorage.removeItem('judgeai_apikeys')
    localStorage.removeItem('judgeai_plan')
  }

  const exportAllData = () => {
    const dump = {
      exportTimestamp: new Date().toISOString(),
      platform: 'JudgeAI Evaluation System',
      profile,
      appearance: { theme, density, fontSize, animations, sidebarCollapsed },
      chatSettings,
      evalSettings,
      notifSettings,
      apiKeys: apiKeys.map(k => ({ id: k.id, name: k.name, prefix: k.prefix, permissions: k.permissions, created: k.created })),
      plan,
    }
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `judgeai-settings-export-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <SettingsContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        density,
        setDensity,
        fontSize,
        setFontSize,
        animations,
        setAnimations,
        sidebarCollapsed,
        setSidebarCollapsed,
        profile,
        updateProfile,
        chatSettings,
        updateChatSettings,
        evalSettings,
        updateEvalSettings,
        notifSettings,
        updateNotifSettings,
        apiKeys,
        addApiKey,
        revokeApiKey,
        plan,
        updatePlan,
        resetToDefaults,
        exportAllData,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}
