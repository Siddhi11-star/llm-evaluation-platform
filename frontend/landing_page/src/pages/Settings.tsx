import { useState, useEffect } from 'react'
import { TopBar, PageContent } from '../components/AppShell'
import {
  useSettings,
  UserProfile,
  ChatSettings,
  EvalSettings,
  NotifSettings,
  Density,
  FontSize,
  Theme,
} from '../components/ThemeProvider'
import {
  IcUser,
  IcKey,
  IcBell,
  IcCreditCard,
  IcCopy,
  IcTrash,
  IcPlus,
  IcToggle,
  IcCheck,
  IcSparkles,
  IcSun,
  IcMoon,
  IcRotate,
  IcChevronRight,
} from '../components/icons'

const TABS = [
  { key: 'profile', label: 'Profile', icon: IcUser },
  { key: 'appearance', label: 'Appearance', icon: IcSun },
  { key: 'chat', label: 'Chat', icon: IcSparkles },
  { key: 'evaluation', label: 'Evaluation', icon: IcCheck },
  { key: 'notifications', label: 'Notifications', icon: IcBell },
  { key: 'api', label: 'API Keys', icon: IcKey },
  { key: 'plan', label: 'Plan & Usage', icon: IcCreditCard },
  { key: 'danger', label: 'Danger Zone', icon: IcTrash },
]

const AVATAR_PALETTES = [
  { label: 'Violet / Cyan', gradient: 'linear-gradient(135deg, #7C3AED, #38BDF8)' },
  { label: 'Magenta / Amber', gradient: 'linear-gradient(135deg, #EC4899, #FBBF24)' },
  { label: 'Emerald / Teal', gradient: 'linear-gradient(135deg, #10B981, #06B6D4)' },
  { label: 'Indigo / Purple', gradient: 'linear-gradient(135deg, #6366F1, #A855F7)' },
  { label: 'Rose / Orange', gradient: 'linear-gradient(135deg, #F43F5E, #FB923C)' },
]

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 6 }}>
      {children}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontSize: 13.5,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--color-border)',
  background: 'var(--color-input-bg)',
  color: 'var(--color-foreground)',
  outline: 'none',
  boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  fontSize: 13.5,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--color-border)',
  background: 'var(--color-input-bg)',
  color: 'var(--color-foreground)',
  outline: 'none',
  cursor: 'pointer',
  boxSizing: 'border-box',
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  fontSize: 13.5,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--color-border)',
  background: 'var(--color-input-bg)',
  color: 'var(--color-foreground)',
  outline: 'none',
  resize: 'vertical',
  minHeight: 80,
  boxSizing: 'border-box',
}

function ToggleRow({ title, desc, on, onToggle }: { title: string; desc: string; on: boolean; onToggle: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '14px 18px',
        cursor: 'pointer',
        userSelect: 'none',
        borderRadius: 8,
        background: hovered ? 'var(--color-hover)' : 'transparent',
        transition: 'background 0.15s ease',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 3, color: 'var(--color-foreground)' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.4 }}>{desc}</div>
      </div>
      <div>
        <IcToggle on={on} size={16} />
      </div>
    </div>
  )
}

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="card-base" style={{ padding: 22, marginBottom: 16, ...style }}>
      {children}
    </div>
  )
}

function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, letterSpacing: '-0.01em', color: 'var(--color-foreground)', ...style }}>
      {children}
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--color-border-faint)', margin: '18px 0' }} />
}

export default function Settings() {
  const {
    theme,
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
  } = useSettings()

  const [tab, setTab] = useState('profile')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Local form states synced with context
  const [profileForm, setProfileForm] = useState<UserProfile>(profile)
  const [chatForm, setChatForm] = useState<ChatSettings>(chatSettings)
  const [evalForm, setEvalForm] = useState<EvalSettings>(evalSettings)

  // Modal states
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [showNewKeyModal, setShowNewKeyModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyScope, setNewKeyScope] = useState<'Full access' | 'Read-only'>('Full access')
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [showCardModal, setShowCardModal] = useState(false)
  const [cardNumber, setCardNumber] = useState('4242')
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [confirmDeleteText, setConfirmDeleteText] = useState('')
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)

  useEffect(() => {
    setProfileForm(profile)
  }, [profile])

  useEffect(() => {
    setChatForm(chatSettings)
  }, [chatSettings])

  useEffect(() => {
    setEvalForm(evalSettings)
  }, [evalSettings])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 2500)
  }

  // Profile Save
  const handleSaveProfile = () => {
    updateProfile(profileForm)
    showToast('Profile updated successfully!')
  }

  // Chat Save
  const handleSaveChat = (updated?: Partial<ChatSettings>) => {
    const next = updated ? { ...chatForm, ...updated } : chatForm
    setChatForm(next)
    updateChatSettings(next)
    showToast('Chat preferences saved!')
  }

  // Eval Save
  const handleSaveEval = (updated?: Partial<EvalSettings>) => {
    const next = updated ? { ...evalForm, ...updated } : evalForm
    setEvalForm(next)
    updateEvalSettings(next)
    showToast('Evaluation settings saved!')
  }

  // Notification Toggle
  const handleToggleNotif = (key: keyof NotifSettings) => {
    const next = { ...notifSettings, [key]: !notifSettings[key] }
    updateNotifSettings(next)
    showToast(`Notification channel ${next[key] ? 'enabled' : 'disabled'}`)
  }

  // API Key creation
  const handleCreateApiKey = () => {
    if (!newKeyName.trim()) return
    const created = addApiKey(newKeyName.trim(), newKeyScope)
    setGeneratedKey(created.fullKey || null)
    setNewKeyName('')
    showToast(`Created API Key: ${created.name}`)
  }

  const handleCopyKey = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKeyId(id)
    showToast('API Key copied to clipboard!')
    setTimeout(() => setCopiedKeyId(null), 2000)
  }

  // Plan Selection
  const handleSelectPlan = (planName: string, price: string, included: number) => {
    updatePlan({ name: planName, price, includedEvals: included })
    setShowPlanModal(false)
    showToast(`Switched to ${planName} Plan!`)
  }

  // Card Update
  const handleSaveCard = () => {
    updatePlan({ cardLast4: cardNumber.slice(-4) || '4242' })
    setShowCardModal(false)
    showToast('Payment method updated!')
  }

  // Reset to defaults
  const handleReset = () => {
    if (window.confirm('Reset all settings to default values?')) {
      resetToDefaults()
      showToast('All settings restored to factory defaults.')
    }
  }

  // Delete Account
  const handleDeleteAccount = () => {
    if (confirmDeleteText === 'DELETE') {
      resetToDefaults()
      setShowDeleteConfirm(false)
      setConfirmDeleteText('')
      showToast('Account data purged and reset.')
    }
  }

  return (
    <>
      <TopBar title="Settings">
        {toastMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 600,
              padding: '6px 14px',
              borderRadius: 999,
              background: 'rgba(52,211,153,0.15)',
              border: '1px solid rgba(52,211,153,0.3)',
              color: '#34D399',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <IcCheck size={14} color="#34D399" />
            {toastMessage}
          </div>
        )}
      </TopBar>

      <PageContent style={{ maxWidth: 840, margin: '0 auto' }}>
        {/* ─── Navigation Tabs ─── */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            borderBottom: '1px solid var(--color-border)',
            marginBottom: 24,
            overflowX: 'auto',
            paddingBottom: 2,
          }}
        >
          {TABS.map(t => {
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '10px 14px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  color: active ? 'var(--color-accent-violet)' : 'var(--color-muted)',
                  borderBottom: `2px solid ${active ? 'var(--color-accent-violet)' : 'transparent'}`,
                  transition: 'all 0.15s ease',
                }}
              >
                <t.icon size={15} />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            1. PROFILE TAB
            ═══════════════════════════════════════════════════════════════ */}
        {tab === 'profile' && (
          <SectionCard style={{ padding: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: '50%',
                  background: profileForm.avatarColor || 'linear-gradient(135deg, #7C3AED, #38BDF8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#fff',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}
              >
                {profileForm.avatarInitials || 'SL'}
              </div>
              <div>
                <button
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="pill-outline"
                  style={{ fontSize: 12.5, padding: '7px 14px' }}
                >
                  {showAvatarPicker ? 'Close Palette' : 'Customize Avatar'}
                </button>
                <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 4 }}>
                  Personalize initials and profile accent aura
                </div>
              </div>
            </div>

            {/* Avatar Picker Palette Drawer */}
            {showAvatarPicker && (
              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  marginBottom: 20,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-foreground)', marginBottom: 8 }}>
                  Select Avatar Color Theme:
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {AVATAR_PALETTES.map((p, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setProfileForm({ ...profileForm, avatarColor: p.gradient })
                        updateProfile({ avatarColor: p.gradient })
                      }}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: p.gradient,
                        cursor: 'pointer',
                        border: profileForm.avatarColor === p.gradient ? '2px solid #fff' : '1px solid var(--color-border)',
                        transform: profileForm.avatarColor === p.gradient ? 'scale(1.15)' : 'none',
                        transition: 'transform 0.15s ease',
                      }}
                      title={p.label}
                    />
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <Label>Full Name</Label>
                <input
                  style={inputStyle}
                  value={profileForm.name}
                  onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Email Address</Label>
                <input
                  style={inputStyle}
                  value={profileForm.email}
                  onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                  type="email"
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Label>Organization</Label>
              <input
                style={inputStyle}
                value={profileForm.org}
                onChange={e => setProfileForm({ ...profileForm, org: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <Label>Bio / Research Focus</Label>
              <textarea
                style={textareaStyle}
                value={profileForm.bio}
                onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                rows={3}
              />
            </div>

            <Divider />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={handleSaveProfile}
                className="pill-primary"
                style={{ fontSize: 13, padding: '9px 20px', fontWeight: 600 }}
              >
                Save Profile
              </button>
              <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                Updates avatar across sidebar and header
              </span>
            </div>
          </SectionCard>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            2. APPEARANCE TAB
            ═══════════════════════════════════════════════════════════════ */}
        {tab === 'appearance' && (
          <>
            {/* Theme Selector */}
            <SectionCard>
              <SectionTitle>Theme</SectionTitle>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { key: 'dark', label: 'Dark Mode', preview: '#0A0A0A', border: '#222' },
                  { key: 'light', label: 'Light Mode', preview: '#F8F9FA', border: '#E2E8F0' },
                ].map(t => {
                  const active = theme === t.key
                  return (
                    <button
                      key={t.key}
                      onClick={() => setTheme(t.key as Theme)}
                      style={{
                        flex: 1,
                        padding: 16,
                        borderRadius: 10,
                        border: `2px solid ${active ? 'var(--color-accent-violet)' : 'var(--color-border)'}`,
                        background: 'var(--color-surface)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          width: 42,
                          height: 26,
                          borderRadius: 6,
                          background: t.preview,
                          border: `1px solid ${t.border}`,
                          marginBottom: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {t.key === 'dark' ? <IcMoon size={14} color="#aaa" /> : <IcSun size={14} color="#f59e0b" />}
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: active ? 'var(--color-accent-violet)' : 'var(--color-foreground)' }}>
                        {t.label}
                      </div>
                    </button>
                  )
                })}
              </div>
            </SectionCard>

            {/* Density Selector */}
            <SectionCard>
              <SectionTitle>Layout Density</SectionTitle>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { key: 'compact', label: 'Compact', desc: 'Tighter spacing, higher data density' },
                  { key: 'comfortable', label: 'Comfortable', desc: 'Balanced padding & spacing' },
                  { key: 'spacious', label: 'Spacious', desc: 'Generous breathing room' },
                ].map(d => {
                  const active = density === d.key
                  return (
                    <button
                      key={d.key}
                      onClick={() => {
                        setDensity(d.key as Density)
                        showToast(`Density set to ${d.label}`)
                      }}
                      style={{
                        flex: 1,
                        padding: 14,
                        borderRadius: 10,
                        border: `2px solid ${active ? 'var(--color-accent-violet)' : 'var(--color-border)'}`,
                        background: 'var(--color-surface)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--color-accent-violet)' : 'var(--color-foreground)', marginBottom: 4 }}>
                        {d.label}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{d.desc}</div>
                    </button>
                  )
                })}
              </div>
            </SectionCard>

            {/* Font Size Slider */}
            <SectionCard>
              <SectionTitle>Interface Font Scale</SectionTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)' }}>A (Small)</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={1}
                  value={fontSize === 'small' ? 1 : fontSize === 'medium' ? 2 : 3}
                  onChange={e => {
                    const val = Number(e.target.value)
                    const next: FontSize = val === 1 ? 'small' : val === 2 ? 'medium' : 'large'
                    setFontSize(next)
                    showToast(`Font scale set to ${next}`)
                  }}
                  style={{ flex: 1, accentColor: 'var(--color-accent-violet)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-muted)' }}>A (Large)</span>
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: 'var(--color-accent-violet)',
                    minWidth: 70,
                    textAlign: 'right',
                  }}
                >
                  {fontSize.charAt(0).toUpperCase() + fontSize.slice(1)}
                </span>
              </div>
            </SectionCard>

            {/* Toggles */}
            <SectionCard style={{ padding: 6 }}>
              <ToggleRow
                title="UI Animations & Transitions"
                desc="Enable smooth motion, gradient glow, and micro-interactions."
                on={animations}
                onToggle={() => {
                  setAnimations(!animations)
                  showToast(`Animations ${!animations ? 'enabled' : 'disabled'}`)
                }}
              />
              <div style={{ borderBottom: '1px solid var(--color-border-faint)' }} />
              <ToggleRow
                title="Collapsed Sidebar Mode"
                desc="Collapse the navigation sidebar into an icon bar to maximize screen width."
                on={sidebarCollapsed}
                onToggle={() => {
                  setSidebarCollapsed(!sidebarCollapsed)
                  showToast(`Sidebar ${!sidebarCollapsed ? 'collapsed' : 'expanded'}`)
                }}
              />
            </SectionCard>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            3. CHAT TAB
            ═══════════════════════════════════════════════════════════════ */}
        {tab === 'chat' && (
          <>
            <SectionCard style={{ padding: 6 }}>
              <ToggleRow
                title="Auto-send on Enter"
                desc="Press Enter to send prompts instantly; press Shift+Enter for new line breaks."
                on={chatForm.autoSend}
                onToggle={() => handleSaveChat({ autoSend: !chatForm.autoSend })}
              />
              <div style={{ borderBottom: '1px solid var(--color-border-faint)' }} />
              <ToggleRow
                title="Show Message Timestamps"
                desc="Render precision execution timestamps alongside chat turns."
                on={chatForm.showTimestamps}
                onToggle={() => handleSaveChat({ showTimestamps: !chatForm.showTimestamps })}
              />
              <div style={{ borderBottom: '1px solid var(--color-border-faint)' }} />
              <ToggleRow
                title="Markdown Rendering"
                desc="Format tables, lists, and LaTeX equations in response stream."
                on={chatForm.markdownRender}
                onToggle={() => handleSaveChat({ markdownRender: !chatForm.markdownRender })}
              />
              <div style={{ borderBottom: '1px solid var(--color-border-faint)' }} />
              <ToggleRow
                title="Code Syntax Highlighting"
                desc="Language-aware syntax token highlighting in code snippets."
                on={chatForm.codeHighlight}
                onToggle={() => handleSaveChat({ codeHighlight: !chatForm.codeHighlight })}
              />
            </SectionCard>

            <SectionCard>
              <SectionTitle>Chat History Retention</SectionTitle>
              <select
                style={selectStyle}
                value={chatForm.chatHistory}
                onChange={e => handleSaveChat({ chatHistory: Number(e.target.value) })}
              >
                <option value={7}>7 days retention</option>
                <option value={14}>14 days retention</option>
                <option value={30}>30 days retention (Recommended)</option>
                <option value={90}>90 days retention</option>
                <option value={365}>1 year retention</option>
                <option value={-1}>Keep indefinitely (Forever)</option>
              </select>
              <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 6 }}>
                Conversations older than this cutoff will be automatically archived.
              </div>
            </SectionCard>

            <SectionCard>
              <SectionTitle>Default Model for Playground</SectionTitle>
              <select
                style={selectStyle}
                value={chatForm.defaultModel}
                onChange={e => handleSaveChat({ defaultModel: e.target.value })}
              >
                <option value="claude-3.5-sonnet">Claude 3.5 Sonnet (Anthropic)</option>
                <option value="gpt-4o">GPT-4o (OpenAI)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Google)</option>
                <option value="llama-3.3-70b">Llama 3.3 70B (Meta)</option>
                <option value="deepseek-v3">DeepSeek V3 (DeepSeek)</option>
              </select>
            </SectionCard>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            4. EVALUATION TAB
            ═══════════════════════════════════════════════════════════════ */}
        {tab === 'evaluation' && (
          <>
            <SectionCard style={{ padding: 6 }}>
              <ToggleRow
                title="Auto-run on Dataset Upload"
                desc="Immediately spawn evaluation judge jobs when a JSONL or CSV dataset is uploaded."
                on={evalForm.autoRun}
                onToggle={() => handleSaveEval({ autoRun: !evalForm.autoRun })}
              />
              <div style={{ borderBottom: '1px solid var(--color-border-faint)' }} />
              <ToggleRow
                title="Parallel Judge Execution"
                desc="Run judge agents in asynchronous batches to reduce evaluation turnaround time."
                on={evalForm.parallelEvals}
                onToggle={() => handleSaveEval({ parallelEvals: !evalForm.parallelEvals })}
              />
              <div style={{ borderBottom: '1px solid var(--color-border-faint)' }} />
              <ToggleRow
                title="Persist Full Raw Artifacts"
                desc="Archive token traces, raw LLM payloads, and reasoning chain logs."
                on={evalForm.saveArtifacts}
                onToggle={() => handleSaveEval({ saveArtifacts: !evalForm.saveArtifacts })}
              />
            </SectionCard>

            <SectionCard>
              <SectionTitle>Evaluation Engine Defaults</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                <div>
                  <Label>Default Judge Panel Size</Label>
                  <select
                    style={selectStyle}
                    value={evalForm.defaultJudges}
                    onChange={e => handleSaveEval({ defaultJudges: Number(e.target.value) })}
                  >
                    <option value={3}>3 Judges (Fast check)</option>
                    <option value={5}>5 Judges (Standard)</option>
                    <option value={6}>6 Judges (Recommended)</option>
                    <option value={7}>7 Judges (High assurance)</option>
                    <option value={9}>9 Judges (Maximum rigor)</option>
                  </select>
                </div>
                <div>
                  <Label>Default Evaluation Benchmark</Label>
                  <select
                    style={selectStyle}
                    value={evalForm.defaultDataset}
                    onChange={e => handleSaveEval({ defaultDataset: e.target.value })}
                  >
                    <option value="general-v2">General Benchmark v2</option>
                    <option value="safety-v1">Safety & Guardrails v1</option>
                    <option value="coding-v3">Code Performance v3</option>
                    <option value="medical-v1">Medical QA v1</option>
                    <option value="legal-v2">Legal Liability v2</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Label>Pass Quality Threshold</Label>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-accent-violet)' }}>
                    {evalForm.confidenceThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={100}
                  value={evalForm.confidenceThreshold}
                  onChange={e => handleSaveEval({ confidenceThreshold: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--color-accent-violet)', cursor: 'pointer' }}
                />
                <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 4 }}>
                  Evaluations with composite score below {evalForm.confidenceThreshold}% will be automatically marked as flagged.
                </div>
              </div>
            </SectionCard>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            5. NOTIFICATIONS TAB
            ═══════════════════════════════════════════════════════════════ */}
        {tab === 'notifications' && (
          <SectionCard style={{ padding: 6 }}>
            {[
              { key: 'flagged', title: 'Flagged Evaluation Alerts', desc: 'Receive instant notification when a run fails rubric safety or accuracy thresholds.' },
              { key: 'weekly', title: 'Weekly Evaluation Digest', desc: 'Summary of benchmark volume, model leaderboard shifts, and anomaly flags.' },
              { key: 'api', title: 'API Rate Limits & Auth Failures', desc: 'Alerts when API keys experience throttling or token quota exhaustion.' },
              { key: 'product', title: 'Product & Judge Updates', desc: 'Announcements of newly integrated LLM judge models and rubric upgrades.' },
              { key: 'swarm', title: 'Agent Swarm Pipeline Alerts', desc: 'Notifications when multi-agent swarms complete large execution batches.' },
              { key: 'advisor', title: 'Advisor Agent Weekly Insights', desc: 'Automated AI model selection recommendations based on your workloads.' },
            ].map((item, idx, arr) => (
              <div key={item.key}>
                <ToggleRow
                  title={item.title}
                  desc={item.desc}
                  on={notifSettings[item.key as keyof NotifSettings]}
                  onToggle={() => handleToggleNotif(item.key as keyof NotifSettings)}
                />
                {idx < arr.length - 1 && <div style={{ borderBottom: '1px solid var(--color-border-faint)' }} />}
              </div>
            ))}
          </SectionCard>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            6. API KEYS TAB
            ═══════════════════════════════════════════════════════════════ */}
        {tab === 'api' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-foreground)' }}>Active API Keys</div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Authenticate requests to the Evaluation & Swarm APIs.</div>
              </div>
              <button
                onClick={() => setShowNewKeyModal(true)}
                className="pill-primary"
                style={{ fontSize: 12.5, padding: '8px 16px', gap: 6, display: 'flex', alignItems: 'center' }}
              >
                <IcPlus size={14} /> New API Key
              </button>
            </div>

            {/* Keys Table */}
            <div className="card-base" style={{ overflow: 'hidden' }}>
              {apiKeys.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: 'var(--color-muted)' }}>
                  No active API keys found. Create one above to get started.
                </div>
              ) : (
                apiKeys.map((k, idx) => (
                  <div
                    key={k.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '16px 20px',
                      borderBottom: idx < apiKeys.length - 1 ? '1px solid var(--color-border-faint)' : 'none',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-foreground)' }}>
                          {k.name}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: k.permissions === 'Full access' ? 'rgba(124,58,237,0.1)' : 'rgba(56,189,248,0.1)',
                            color: k.permissions === 'Full access' ? '#7C3AED' : '#38BDF8',
                            border: `1px solid ${k.permissions === 'Full access' ? 'rgba(124,58,237,0.25)' : 'rgba(56,189,248,0.25)'}`,
                          }}
                        >
                          {k.permissions}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {k.prefix}
                      </div>
                    </div>

                    <div style={{ fontSize: 11.5, color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                      Created {k.created}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={() => handleCopyKey(k.id, k.fullKey || k.prefix)}
                        title="Copy Key"
                        style={{
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 7,
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: copiedKeyId === k.id ? '#34D399' : 'var(--color-foreground)',
                          cursor: 'pointer',
                        }}
                      >
                        {copiedKeyId === k.id ? <IcCheck size={14} /> : <IcCopy size={14} />}
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Revoke API key "${k.name}"?`)) {
                            revokeApiKey(k.id)
                            showToast(`Revoked key: ${k.name}`)
                          }
                        }}
                        title="Revoke Key"
                        style={{
                          background: 'rgba(248,113,113,0.08)',
                          border: '1px solid rgba(248,113,113,0.2)',
                          borderRadius: 7,
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#F87171',
                          cursor: 'pointer',
                        }}
                      >
                        <IcTrash size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Create API Key Modal */}
            {showNewKeyModal && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(4px)',
                  zIndex: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 20,
                }}
                onClick={() => {
                  setShowNewKeyModal(false)
                  setGeneratedKey(null)
                }}
              >
                <div
                  className="card-base"
                  style={{
                    width: '100%',
                    maxWidth: 480,
                    padding: 24,
                    background: 'var(--color-background)',
                    border: '1.5px solid var(--color-accent-violet)',
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-foreground)', marginBottom: 6 }}>
                    Create API Key
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--color-muted)', marginBottom: 16 }}>
                    Generate a secure secret key to authenticate SDK and automated pipelines.
                  </p>

                  {generatedKey ? (
                    <div>
                      <div
                        style={{
                          padding: 12,
                          borderRadius: 8,
                          background: 'rgba(52,211,153,0.1)',
                          border: '1px solid rgba(52,211,153,0.3)',
                          marginBottom: 16,
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#34D399', marginBottom: 4 }}>
                          SECRET KEY GENERATED (Copy now; it won't be shown again)
                        </div>
                        <div style={{ fontSize: 12.5, fontFamily: 'JetBrains Mono, monospace', color: 'var(--color-foreground)', wordBreak: 'break-all' }}>
                          {generatedKey}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopyKey('modal', generatedKey)}
                        className="pill-primary"
                        style={{ width: '100%', padding: '9px', fontSize: 13, justifyContent: 'center' }}
                      >
                        <IcCopy size={14} /> Copy to Clipboard
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div>
                        <Label>Key Name</Label>
                        <input
                          style={inputStyle}
                          value={newKeyName}
                          onChange={e => setNewKeyName(e.target.value)}
                          placeholder="e.g. Production Cluster Runner"
                          autoFocus
                        />
                      </div>
                      <div>
                        <Label>Access Scope</Label>
                        <select
                          style={selectStyle}
                          value={newKeyScope}
                          onChange={e => setNewKeyScope(e.target.value as any)}
                        >
                          <option value="Full access">Full Access (Read & Execute Evals)</option>
                          <option value="Read-only">Read-Only (Telemetry & Results Only)</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                        <button
                          onClick={() => setShowNewKeyModal(false)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 6,
                            border: '1px solid var(--color-border)',
                            background: 'transparent',
                            color: 'var(--color-foreground)',
                            fontSize: 12.5,
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateApiKey}
                          className="pill-primary"
                          style={{ padding: '8px 16px', fontSize: 12.5, fontWeight: 600 }}
                        >
                          Generate Secret Key
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            7. PLAN & USAGE TAB
            ═══════════════════════════════════════════════════════════════ */}
        {tab === 'plan' && (
          <div>
            <SectionCard style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-accent-violet)', marginBottom: 4, letterSpacing: '0.06em' }}>
                  CURRENT ACTIVE TIER
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-foreground)' }}>
                  {plan.name} — {plan.price}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 4 }}>
                  Auto-renews on {plan.renewalDate} · {plan.includedEvals.toLocaleString()} evaluations included
                </div>
              </div>
              <button
                onClick={() => setShowPlanModal(true)}
                className="pill-outline"
                style={{ fontSize: 13, padding: '9px 18px' }}
              >
                Change Plan
              </button>
            </SectionCard>

            {/* Usage Progress */}
            <SectionCard>
              <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 12, color: 'var(--color-foreground)' }}>
                Billing Cycle Usage
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-muted)', marginBottom: 8 }}>
                <span>
                  {plan.usedEvals.toLocaleString()} / {plan.includedEvals.toLocaleString()} evaluations
                </span>
                <span style={{ fontWeight: 700, color: 'var(--color-foreground)' }}>
                  {Math.round((plan.usedEvals / plan.includedEvals) * 100)}%
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 9999, background: 'var(--color-border-faint)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, Math.round((plan.usedEvals / plan.includedEvals) * 100))}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #7C3AED, #38BDF8)',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>Completed Runs</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-foreground)' }}>
                    {plan.usedEvals.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>API Requests</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-foreground)' }}>142,800</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>Telemetry Storage</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-foreground)' }}>2.4 GB</div>
                </div>
              </div>
            </SectionCard>

            {/* Payment Method */}
            <SectionCard style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 30,
                    borderRadius: 6,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 800,
                    color: 'var(--color-foreground)',
                  }}
                >
                  {plan.cardBrand}
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-foreground)' }}>
                    •••• •••• •••• {plan.cardLast4}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>Expires 12/28</div>
                </div>
              </div>
              <button
                onClick={() => setShowCardModal(true)}
                className="pill-outline"
                style={{ fontSize: 12.5, padding: '7px 14px' }}
              >
                Update Card
              </button>
            </SectionCard>

            {/* Plan Modal */}
            {showPlanModal && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(4px)',
                  zIndex: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 20,
                }}
                onClick={() => setShowPlanModal(false)}
              >
                <div
                  className="card-base"
                  style={{
                    width: '100%',
                    maxWidth: 580,
                    padding: 24,
                    background: 'var(--color-background)',
                    border: '1.5px solid var(--color-accent-violet)',
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-foreground)', marginBottom: 14 }}>
                    Select Subscription Tier
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { name: 'Starter', price: '$0/month', included: 5000, desc: 'For individual developers testing judge models.' },
                      { name: 'Pro', price: '$199/month', included: 100000, desc: 'For fast-growing AI teams & automated regression runs.' },
                      { name: 'Enterprise', price: '$899/month', included: 1000000, desc: 'Dedicated VPC, SLA guarantees & custom judge fine-tuning.' },
                    ].map(p => (
                      <div
                        key={p.name}
                        onClick={() => handleSelectPlan(p.name, p.price, p.included)}
                        style={{
                          padding: 14,
                          borderRadius: 8,
                          border: `1.5px solid ${plan.name === p.name ? 'var(--color-accent-violet)' : 'var(--color-border)'}`,
                          background: plan.name === p.name ? 'var(--color-nav-active-bg)' : 'var(--color-surface)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-foreground)' }}>
                            {p.name} — {p.price}
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 2 }}>{p.desc}</div>
                        </div>
                        {plan.name === p.name && <span style={{ color: '#34D399', fontWeight: 700, fontSize: 12 }}>Current</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Card Modal */}
            {showCardModal && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(4px)',
                  zIndex: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 20,
                }}
                onClick={() => setShowCardModal(false)}
              >
                <div
                  className="card-base"
                  style={{
                    width: '100%',
                    maxWidth: 420,
                    padding: 24,
                    background: 'var(--color-background)',
                    border: '1.5px solid var(--color-border)',
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-foreground)', marginBottom: 12 }}>
                    Update Card Information
                  </div>
                  <Label>Card Number</Label>
                  <input
                    style={{ ...inputStyle, marginBottom: 12 }}
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button
                      onClick={() => setShowCardModal(false)}
                      style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-foreground)', fontSize: 12, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveCard}
                      className="pill-primary"
                      style={{ padding: '8px 16px', fontSize: 12.5, fontWeight: 600 }}
                    >
                      Save Card
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            8. DANGER ZONE TAB
            ═══════════════════════════════════════════════════════════════ */}
        {tab === 'danger' && (
          <SectionCard style={{ border: '1px solid rgba(248,113,113,0.3)', padding: 24 }}>
            <SectionTitle style={{ color: '#F87171' }}>Danger Zone</SectionTitle>
            <div style={{ fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.5, marginBottom: 20 }}>
              Irreversible destructive actions and data backup commands.
            </div>

            {/* Export */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--color-border-faint)' }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-foreground)', marginBottom: 3 }}>
                  Export All Platform Data
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                  Download a complete JSON backup of evaluation profiles, API keys, and settings.
                </div>
              </div>
              <button
                onClick={() => {
                  exportAllData()
                  showToast('Downloaded platform JSON backup!')
                }}
                className="pill-outline"
                style={{ fontSize: 12.5, padding: '7px 14px' }}
              >
                Export JSON
              </button>
            </div>

            {/* Reset */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--color-border-faint)' }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-foreground)', marginBottom: 3 }}>
                  Reset Settings to Default
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                  Revert all custom themes, density scales, and judge defaults back to system factory states.
                </div>
              </div>
              <button
                onClick={handleReset}
                className="pill-outline"
                style={{ fontSize: 12.5, padding: '7px 14px' }}
              >
                Reset Defaults
              </button>
            </div>

            {/* Delete Account */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0 0' }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#F87171', marginBottom: 3 }}>
                  Purge & Delete Account
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                  Permanently eradicate all telemetry logs, test suites, and API access credentials.
                </div>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="pill-outline"
                style={{ fontSize: 12.5, padding: '7px 14px', color: '#F87171', borderColor: 'rgba(248,113,113,0.3)' }}
              >
                Delete Account
              </button>
            </div>

            {/* Confirm Delete Subpanel */}
            {showDeleteConfirm && (
              <div
                style={{
                  marginTop: 20,
                  padding: 16,
                  borderRadius: 10,
                  background: 'rgba(248,113,113,0.06)',
                  border: '1px solid rgba(248,113,113,0.25)',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: '#F87171', marginBottom: 6 }}>
                  Confirm Permanent Account Deletion
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 10 }}>
                  Please type <strong style={{ color: 'var(--color-foreground)' }}>DELETE</strong> to confirm deletion:
                </div>
                <input
                  style={{ ...inputStyle, marginBottom: 12, borderColor: 'rgba(248,113,113,0.3)' }}
                  value={confirmDeleteText}
                  onChange={e => setConfirmDeleteText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={confirmDeleteText !== 'DELETE'}
                    style={{
                      fontSize: 12.5,
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: 'none',
                      background: confirmDeleteText === 'DELETE' ? '#F87171' : 'rgba(248,113,113,0.2)',
                      color: '#fff',
                      cursor: confirmDeleteText === 'DELETE' ? 'pointer' : 'not-allowed',
                      fontWeight: 600,
                    }}
                  >
                    Permanently Delete
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setConfirmDeleteText('')
                    }}
                    style={{
                      fontSize: 12.5,
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: '1px solid var(--color-border)',
                      background: 'transparent',
                      color: 'var(--color-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </SectionCard>
        )}
      </PageContent>
    </>
  )
}
