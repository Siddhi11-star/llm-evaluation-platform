import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Logo } from '../components/Logo'
import { IcEye, IcEyeOff, IcSun, IcMoon } from '../components/icons'
import { useTheme } from '../components/ThemeProvider'
import { useAuth } from '../context/AuthContext'

const AUTH_API_URL = (import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8004').replace(/\/auth\/?$/, '').replace(/\/+$/, '')

export default function Login({ mode = 'login' }: { mode?: 'login' | 'signup' }) {
  const { theme, toggleTheme } = useTheme()
  const { login, signup, loginWithToken, isLoading, error: authError, clearError } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectParam = searchParams.get('redirect')
  const tokenParam = searchParams.get('token')
  const isNewParam = searchParams.get('is_new')
  const errorParam = searchParams.get('error')

  const [isLogin, setIsLogin] = useState(mode === 'login')
  const [showPw, setShowPw] = useState(false)
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [name, setName] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Handle OAuth callback token or error from URL
  useEffect(() => {
    if (errorParam) {
      setLocalError(decodeURIComponent(errorParam))
    } else if (tokenParam) {
      setSubmitting(true)
      loginWithToken(tokenParam).then(result => {
        setSubmitting(false)
        if (result.success) {
          if (isNewParam === '1' || result.user?.onboarding_completed === false) {
            navigate('/onboarding')
          } else if (sessionStorage.getItem('guestPrompt')) {
            navigate('/dashboard/chat')
          } else if (redirectParam) {
            navigate(decodeURIComponent(redirectParam))
          } else {
            navigate('/dashboard')
          }
        } else {
          setLocalError(result.error || 'Failed to complete OAuth login.')
        }
      })
    }
  }, [tokenParam, errorParam, isNewParam, redirectParam, loginWithToken, navigate])

  const handleOAuthLogin = (provider: 'github' | 'google') => {
    setLocalError(null)
    clearError()
    window.location.href = `${AUTH_API_URL}/auth/${provider}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    clearError()

    if (!email.trim()) {
      setLocalError('Please enter your email address.')
      return
    }

    if (!pw) {
      setLocalError('Please enter your password.')
      return
    }

    if (!isLogin && pw.length < 8) {
      setLocalError('Password must be at least 8 characters long.')
      return
    }

    if (!isLogin && !name.trim()) {
      setLocalError('Please enter your full name.')
      return
    }

    setSubmitting(true)

    if (isLogin) {
      const result = await login(email.trim(), pw)
      setSubmitting(false)
      if (result.success) {
        // If guest prompt was stored, restore to chat
        if (sessionStorage.getItem('guestPrompt')) {
          navigate('/dashboard/chat')
        } else if (redirectParam) {
          navigate(decodeURIComponent(redirectParam))
        } else {
          navigate('/dashboard')
        }
      } else if (result.requiresVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`)
      } else {
        setLocalError(result.error || 'Invalid email or password.')
      }
    } else {
      const result = await signup(name.trim(), email.trim(), pw)
      setSubmitting(false)
      if (result.success) {
        navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`)
      } else {
        setLocalError(result.error || 'Signup failed. Please try again.')
      }
    }
  }

  const activeError = localError || authError

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-background)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Theme toggle in top right */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 8,
          padding: '8px',
          color: 'var(--color-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          transition: 'color 0.15s, background 0.15s, border-color 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = 'var(--color-foreground)'
          e.currentTarget.style.borderColor = 'var(--color-border-light)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = 'var(--color-muted)'
          e.currentTarget.style.borderColor = 'var(--color-border)'
        }}
      >
        {theme === 'dark' ? <IcSun size={18} /> : <IcMoon size={18} />}
      </button>

      {/* Background orb */}
      <div
        className="orb-gradient"
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 600,
          height: 400,
          pointerEvents: 'none',
        }}
      />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
          <Logo />
        </div>

        <div className="card-base" style={{ padding: 36, borderRadius: 20 }}>
          <h1
            style={{
              fontWeight: 800,
              fontSize: 22,
              letterSpacing: '-0.03em',
              marginBottom: 6,
              textAlign: 'center',
              color: 'var(--color-foreground)',
            }}
          >
            {isLogin ? 'Log in to JudgeAI' : 'Create your account'}
          </h1>
          <p
            style={{
              textAlign: 'center',
              fontSize: 13,
              color: 'var(--color-muted)',
              marginBottom: 24,
            }}
          >
            {isLogin ? 'Welcome back — continue building.' : 'Start evaluating LLMs in minutes.'}
          </p>

          {/* Error Banner */}
          {activeError && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#EF4444',
                fontSize: 13,
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>⚠️</span>
              <span>{activeError}</span>
            </div>
          )}

          {/* OAuth buttons (Phase 3 Active) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            <button
              type="button"
              onClick={() => handleOAuthLogin('github')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                width: '100%',
                padding: '11px 16px',
                borderRadius: 10,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-foreground)',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                transition: 'all 0.15s',
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--color-hover-strong)'
                e.currentTarget.style.borderColor = 'var(--color-border-light)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--color-surface)'
                e.currentTarget.style.borderColor = 'var(--color-border)'
              }}
            >
              <GHIcon /> Continue with GitHub
            </button>
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                width: '100%',
                padding: '11px 16px',
                borderRadius: 10,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-foreground)',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                transition: 'all 0.15s',
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--color-hover-strong)'
                e.currentTarget.style.borderColor = 'var(--color-border-light)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--color-surface)'
                e.currentTarget.style.borderColor = 'var(--color-border)'
              }}
            >
              <GGIcon /> Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          </div>

          {/* Form */}

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            {!isLogin && (
              <FieldInput label="Full name" value={name} onChange={setName} placeholder="Sarah Lin" type="text" />
            )}
            <FieldInput
              label="Email address"
              value={email}
              onChange={setEmail}
              placeholder="sarah@acme.ai"
              type="email"
            />
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-muted-strong)',
                  marginBottom: 6,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={pw}
                  onChange={e => setPw(e.target.value)}
                  placeholder={isLogin ? '••••••••' : 'Minimum 8 characters'}
                  style={{
                    width: '100%',
                    background: 'var(--color-input-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 10,
                    padding: '11px 44px 11px 14px',
                    fontSize: 14,
                    color: 'var(--color-foreground)',
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'border-color 0.15s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--color-accent-violet)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-muted)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPw ? <IcEyeOff size={16} /> : <IcEye size={16} />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Link
                  to="/forgot-password"
                  style={{
                    fontSize: 12,
                    color: 'var(--color-muted)',
                    textDecoration: 'none',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#A78BFA')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
                >
                  Forgot password?
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || isLoading}
              className="pill-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '12px 0',
                fontSize: 15,
                marginTop: 4,
                borderRadius: 12,
                opacity: submitting || isLoading ? 0.7 : 1,
                cursor: submitting || isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting || isLoading ? (
                <span>Processing...</span>
              ) : isLogin ? (
                'Log in'
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-muted)', marginTop: 22 }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => {
                setLocalError(null)
                clearError()
                setIsLogin(!isLogin)
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-accent-violet)',
                cursor: 'pointer',
                fontSize: 13,
                fontFamily: 'Inter, sans-serif',
                padding: 0,
                fontWeight: 600,
              }}
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
          {sessionStorage.getItem('guestPrompt') && (
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-muted)', marginTop: 8 }}>
              <Link
                to="/guest-chat"
                style={{
                  color: 'var(--color-muted)',
                  textDecoration: 'none',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-accent-violet)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
              >
                ← Back to guest chat
              </Link>
            </p>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-muted-faint)', marginTop: 20 }}>
          By continuing you agree to our{' '}
          <a href="#" style={{ color: 'var(--color-muted)', textDecoration: 'none' }}>
            Terms
          </a>{' '}
          and{' '}
          <a href="#" style={{ color: 'var(--color-muted)', textDecoration: 'none' }}>
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  )
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  type,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  type: string
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--color-muted-strong)',
          marginBottom: 6,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required
        style={{
          width: '100%',
          background: 'var(--color-input-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 10,
          padding: '11px 14px',
          fontSize: 14,
          color: 'var(--color-foreground)',
          outline: 'none',
          fontFamily: 'Inter, sans-serif',
          transition: 'border-color 0.15s',
          boxSizing: 'border-box',
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--color-accent-violet)')}
        onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
      />
    </div>
  )
}

function GHIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

function GGIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}
