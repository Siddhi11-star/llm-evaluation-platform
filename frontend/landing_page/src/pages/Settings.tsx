import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { TopBar, PageContent } from '../components/AppShell'
import { useAuth } from '../context/AuthContext'
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
  { key: 'security', label: 'Security & Sessions', icon: IcKey },
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

  const navigate = useNavigate()
  const {
    user,
    updateUserProfile,
    changePassword,
    getSecurityStatus,
    requestEmailChange,
    verifyEmailChange,
    listSessions,
    revokeSession,
    revokeAllSessions,
    deleteAccount,
  } = useAuth()

  const [tab, setTab] = useState('profile')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Local form states synced with context
  const [profileForm, setProfileForm] = useState<UserProfile>(() => ({
    ...profile,
    name: user?.name || profile.name,
    email: user?.email || profile.email,
  }))
  const [chatForm, setChatForm] = useState<ChatSettings>(chatSettings)
  const [evalForm, setEvalForm] = useState<EvalSettings>(evalSettings)

  // Phase 5 Account & Security States
  const [securityStatus, setSecurityStatus] = useState<any>(null)
  const [sessionsList, setSessionsList] = useState<any[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)

  // Change Password Form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Change Email Modal Form
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [emailStep, setEmailStep] = useState<1 | 2>(1)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailMsg, setEmailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)

  useEffect(() => {
    setProfileForm(prev => ({
      ...prev,
      ...profile,
      name: user?.name || prev.name || profile.name,
      email: user?.email || prev.email || profile.email,
    }))
  }, [profile, user])

  useEffect(() => {
    setChatForm(chatSettings)
  }, [chatSettings])

  useEffect(() => {
    setEvalForm(evalSettings)
  }, [evalSettings])

  // Load security status & sessions when switching to security tab
  useEffect(() => {
    if (tab === 'security') {
      loadSecurityData()
    }
  }, [tab])

  const loadSecurityData = async () => {
    setSessionsLoading(true)
    const [secRes, sessRes] = await Promise.all([
      getSecurityStatus(),
      listSessions()
    ])
    if (secRes.success && secRes.data) {
      setSecurityStatus(secRes.data)
    }
    if (sessRes.success && sessRes.sessions) {
      setSessionsList(sessRes.sessions)
    }
    setSessionsLoading(false)
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 2500)
  }

  // Profile Save
  const handleSaveProfile = async () => {
    updateProfile(profileForm)
    if (profileForm.name && profileForm.name !== user?.name) {
      const res = await updateUserProfile(profileForm.name)
      if (!res.success) {
        showToast(res.error || 'Failed to update profile name')
        return
      }
    }
    showToast('Profile updated successfully!')
  }

  // Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMsg(null)

    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters long.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' })
      return
    }

    setPasswordLoading(true)
    const res = await changePassword(newPassword, currentPassword)
    setPasswordLoading(false)

    if (res.success) {
      setPasswordMsg({ type: 'success', text: res.message || 'Password changed successfully!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      showToast('Password updated successfully!')
      loadSecurityData()
    } else {
      setPasswordMsg({ type: 'error', text: res.error || 'Failed to change password.' })
    }
  }

  // Email Change Request
  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailMsg(null)
    if (!newEmail || !newEmail.includes('@')) {
      setEmailMsg({ type: 'error', text: 'Please enter a valid email address.' })
      return
    }

    setEmailLoading(true)
    const res = await requestEmailChange(newEmail)
    setEmailLoading(false)

    if (res.success) {
      setEmailStep(2)
      setEmailMsg({ type: 'success', text: res.message || `Verification code sent to ${newEmail}` })
    } else {
      setEmailMsg({ type: 'error', text: res.error || 'Failed to request email change.' })
    }
  }

  // Email Change Verify
  const handleVerifyEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailMsg(null)
    if (emailOtp.length !== 6) {
      setEmailMsg({ type: 'error', text: 'Please enter the 6-digit verification code.' })
      return
    }

    setEmailLoading(true)
    const res = await verifyEmailChange(newEmail, emailOtp)
    setEmailLoading(false)

    if (res.success) {
      showToast('Email address updated successfully!')
      setShowEmailModal(false)
      setEmailStep(1)
      setNewEmail('')
      setEmailOtp('')
      setEmailMsg(null)
      loadSecurityData()
    } else {
      setEmailMsg({ type: 'error', text: res.error || 'Invalid or expired verification code.' })
    }
  }

  // Revoke Session
  const handleRevokeSession = async (sessionId: string) => {
    const res = await revokeSession(sessionId)
    if (res.success) {
      showToast('Session revoked successfully.')
      setSessionsList(prev => prev.filter(s => s.id !== sessionId))
    } else {
      showToast(res.error || 'Failed to revoke session.')
    }
  }

  // Revoke All Sessions
  const handleRevokeAllSessions = async () => {
    if (!window.confirm('Are you sure you want to log out of all other devices?')) return
    const res = await revokeAllSessions()
    if (res.success) {
      showToast('All other sessions revoked.')
      loadSecurityData()
    } else {
      showToast(res.error || 'Failed to revoke sessions.')
    }
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
  const handleDeleteAccount = async () => {
    if (confirmDeleteText !== 'DELETE') return
    setDeleteError(null)
    setDeleteLoading(true)
    const res = await deleteAccount('DELETE', deletePassword)
    setDeleteLoading(false)

    if (res.success) {
      resetToDefaults()
      setShowDeleteConfirm(false)
      setConfirmDeleteText('')
      setDeletePassword('')
      showToast('Your account has been permanently deleted.')
      navigate('/login')
    } else {
      setDeleteError(res.error || 'Failed to delete account. Please verify your password.')
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
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    style={{ ...inputStyle, opacity: 0.85, cursor: 'not-allowed' }}
                    value={user?.email || profileForm.email}
                    disabled
                    type="email"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailModal(true)
                      setEmailStep(1)
                      setNewEmail('')
                      setEmailOtp('')
                      setEmailMsg(null)
                    }}
                    className="pill-outline"
                    style={{ fontSize: 12, padding: '0 14px', whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    Change Email
                  </button>
                </div>
              </div>
            </div>

            {/* Email Change Modal */}
            {showEmailModal && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0,0,0,0.7)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999,
                  padding: 20,
                }}
              >
                <div
                  className="card-base"
                  style={{
                    maxWidth: 440,
                    width: '100%',
                    padding: 24,
                    borderRadius: 14,
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--color-foreground)' }}>
                    {emailStep === 1 ? 'Change Account Email' : 'Verify New Email'}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--color-muted)', marginBottom: 18, lineHeight: 1.5 }}>
                    {emailStep === 1
                      ? 'We will send a 6-digit confirmation code to your new email address.'
                      : `Enter the 6-digit verification code sent to ${newEmail}`}
                  </div>

                  {emailMsg && (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        marginBottom: 14,
                        fontSize: 12.5,
                        background: emailMsg.type === 'error' ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)',
                        border: `1px solid ${emailMsg.type === 'error' ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)'}`,
                        color: emailMsg.type === 'error' ? '#F87171' : '#34D399',
                      }}
                    >
                      {emailMsg.text}
                    </div>
                  )}

                  {emailStep === 1 ? (
                    <form onSubmit={handleRequestEmailChange}>
                      <Label>New Email Address</Label>
                      <input
                        style={{ ...inputStyle, marginBottom: 16 }}
                        type="email"
                        placeholder="new.email@example.com"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        required
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button
                          type="button"
                          onClick={() => setShowEmailModal(false)}
                          className="pill-outline"
                          style={{ fontSize: 12.5, padding: '7px 14px' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={emailLoading}
                          className="pill-primary"
                          style={{ fontSize: 12.5, padding: '7px 18px', fontWeight: 600 }}
                        >
                          {emailLoading ? 'Sending...' : 'Send Verification Code'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyEmailChange}>
                      <Label>6-Digit Confirmation Code</Label>
                      <input
                        style={{ ...inputStyle, marginBottom: 16, letterSpacing: 4, textAlign: 'center', fontSize: 18 }}
                        maxLength={6}
                        placeholder="123456"
                        value={emailOtp}
                        onChange={e => setEmailOtp(e.target.value)}
                        required
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setEmailStep(1)}
                          style={{ fontSize: 12, color: 'var(--color-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          Back
                        </button>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            type="button"
                            onClick={() => setShowEmailModal(false)}
                            className="pill-outline"
                            style={{ fontSize: 12.5, padding: '7px 14px' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={emailLoading || emailOtp.length !== 6}
                            className="pill-primary"
                            style={{ fontSize: 12.5, padding: '7px 18px', fontWeight: 600 }}
                          >
                            {emailLoading ? 'Verifying...' : 'Confirm & Update'}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

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
                Updates profile across JudgeAI platform
              </span>
            </div>
          </SectionCard>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SECURITY & SESSIONS TAB (Phase 5)
            ═══════════════════════════════════════════════════════════════ */}
        {tab === 'security' && (
          <div>
            {/* 1. Security Overview Banner */}
            <SectionCard style={{ padding: 22 }}>
              <SectionTitle>Account Security Status</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div style={{ padding: 14, borderRadius: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 4 }}>Email Verification</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: (user?.email_verified ?? securityStatus?.email_verified) ? '#34D399' : '#FBBF24' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: (user?.email_verified ?? securityStatus?.email_verified) ? '#34D399' : '#FBBF24' }} />
                    {(user?.email_verified ?? securityStatus?.email_verified) ? 'Verified' : 'Verification Required'}
                  </div>
                </div>

                <div style={{ padding: 14, borderRadius: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 4 }}>Authentication Providers</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-foreground)' }}>
                    {securityStatus?.providers?.length > 0
                      ? securityStatus.providers.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')
                      : (securityStatus?.has_password ? 'Email / Password' : 'Passwordless')}
                  </div>
                </div>

                <div style={{ padding: 14, borderRadius: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 4 }}>Active Sessions</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-accent-violet)' }}>
                    {sessionsList.length > 0 ? `${sessionsList.length} Active Device(s)` : '1 Active Session'}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* 2. Change Password Form */}
            <SectionCard style={{ padding: 22 }}>
              <SectionTitle>{securityStatus?.has_password === false ? 'Set Account Password' : 'Change Password'}</SectionTitle>
              <div style={{ fontSize: 12.5, color: 'var(--color-muted)', marginBottom: 18, lineHeight: 1.5 }}>
                {securityStatus?.has_password === false
                  ? 'Set a master password to log in directly without using third-party OAuth providers.'
                  : 'Ensure your account uses a strong, unique password with at least 8 characters.'}
              </div>

              {passwordMsg && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    marginBottom: 16,
                    fontSize: 12.5,
                    background: passwordMsg.type === 'error' ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)',
                    border: `1px solid ${passwordMsg.type === 'error' ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)'}`,
                    color: passwordMsg.type === 'error' ? '#F87171' : '#34D399',
                  }}
                >
                  {passwordMsg.text}
                </div>
              )}

              <form onSubmit={handleChangePassword}>
                {securityStatus?.has_password !== false && (
                  <div style={{ marginBottom: 14 }}>
                    <Label>Current Password</Label>
                    <input
                      style={inputStyle}
                      type="password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                  <div>
                    <Label>New Password</Label>
                    <input
                      style={inputStyle}
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      required
                    />
                  </div>
                  <div>
                    <Label>Confirm New Password</Label>
                    <input
                      style={inputStyle}
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="pill-primary"
                  style={{ fontSize: 13, padding: '9px 20px', fontWeight: 600 }}
                >
                  {passwordLoading ? 'Updating...' : (securityStatus?.has_password === false ? 'Set Password' : 'Update Password')}
                </button>
              </form>
            </SectionCard>

            {/* 3. Active Sessions / Device Management */}
            <SectionCard style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <SectionTitle style={{ marginBottom: 0 }}>Active Login Sessions</SectionTitle>
                <button
                  type="button"
                  onClick={handleRevokeAllSessions}
                  className="pill-outline"
                  style={{ fontSize: 12, padding: '6px 14px', color: '#F87171', borderColor: 'rgba(248,113,113,0.3)' }}
                >
                  Log out all other devices
                </button>
              </div>

              <div style={{ fontSize: 12.5, color: 'var(--color-muted)', marginBottom: 18 }}>
                Manage your active web browser and API sessions. Revoking a session will force a logout on that device.
              </div>

              {sessionsLoading ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
                  Loading active sessions...
                </div>
              ) : sessionsList.length === 0 ? (
                <div style={{ padding: 16, borderRadius: 8, background: 'var(--color-surface)', fontSize: 13, color: 'var(--color-muted)' }}>
                  1 Active Session (Current Browser)
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {sessionsList.map(sess => (
                    <div
                      key={sess.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: 10,
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600, color: 'var(--color-foreground)', marginBottom: 3 }}>
                          <span>Web Session ({sess.id.slice(0, 8)}...)</span>
                          {sess.is_current && (
                            <span
                              style={{
                                fontSize: 11,
                                padding: '2px 8px',
                                borderRadius: 999,
                                background: 'rgba(124,58,237,0.15)',
                                color: 'var(--color-accent-violet)',
                                border: '1px solid rgba(124,58,237,0.3)',
                                fontWeight: 700,
                              }}
                            >
                              Current Device
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>
                          Created: {sess.created_at ? new Date(sess.created_at).toLocaleString() : 'Active session'}
                        </div>
                      </div>

                      {!sess.is_current && (
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(sess.id)}
                          className="pill-outline"
                          style={{ fontSize: 11.5, padding: '5px 12px', color: '#F87171', borderColor: 'rgba(248,113,113,0.3)' }}
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
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
                  This action is permanent and cannot be undone. All your evaluation datasets, judge logs, and active sessions will be completely purged.
                </div>

                {deleteError && (
                  <div style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(248,113,113,0.2)', color: '#F87171', fontSize: 12, marginBottom: 12 }}>
                    {deleteError}
                  </div>
                )}

                {securityStatus?.has_password !== false && (
                  <div style={{ marginBottom: 10 }}>
                    <Label>Enter Your Password</Label>
                    <input
                      style={{ ...inputStyle, marginBottom: 6, borderColor: 'rgba(248,113,113,0.3)' }}
                      type="password"
                      value={deletePassword}
                      onChange={e => setDeletePassword(e.target.value)}
                      placeholder="Your account password"
                    />
                  </div>
                )}

                <div style={{ marginBottom: 12 }}>
                  <Label>Type DELETE to Confirm</Label>
                  <input
                    style={{ ...inputStyle, borderColor: 'rgba(248,113,113,0.3)' }}
                    value={confirmDeleteText}
                    onChange={e => setConfirmDeleteText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={confirmDeleteText !== 'DELETE' || deleteLoading}
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
                    {deleteLoading ? 'Purging Account...' : 'Permanently Delete'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setConfirmDeleteText('')
                      setDeletePassword('')
                      setDeleteError(null)
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
