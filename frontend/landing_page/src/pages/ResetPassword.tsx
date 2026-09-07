import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Logo } from '../components/Logo'
import { IcEye, IcEyeOff, IcSun, IcMoon, IcCheck } from '../components/icons'
import { useTheme } from '../components/ThemeProvider'
import { useAuth } from '../context/AuthContext'

export default function ResetPassword() {
  const { theme, toggleTheme } = useTheme()
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const tokenParam = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!tokenParam) {
      setError('Password reset token is missing or invalid. Please request a new link.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    const result = await resetPassword(tokenParam, password)
    setSubmitting(false)

    if (result.success) {
      setSuccess(result.message || 'Password reset successfully! Redirecting to login...')
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } else {
      setError(result.error || 'Password reset failed. Token may be expired or used.')
    }
  }

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

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <Logo />
        </div>

        <div className="card-base" style={{ padding: 36, borderRadius: 20 }}>
          <h1
            style={{
              fontWeight: 800,
              fontSize: 22,
              letterSpacing: '-0.03em',
              marginBottom: 8,
              textAlign: 'center',
              color: 'var(--color-foreground)',
            }}
          >
            Create new password
          </h1>
          <p
            style={{
              textAlign: 'center',
              fontSize: 13,
              color: 'var(--color-muted)',
              marginBottom: 24,
            }}
          >
            Choose a strong new password for your JudgeAI account.
          </p>

          {/* Error Banner */}
          {error && (
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
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div
              style={{
                background: 'rgba(52, 211, 153, 0.1)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                borderRadius: 10,
                padding: '12px 14px',
                color: '#34D399',
                fontSize: 13,
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <IcCheck size={16} />
              <span>{success}</span>
            </div>
          )}

          {!tokenParam ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 20 }}>
                This reset link is missing a security token.
              </p>
              <Link to="/forgot-password" className="pill-primary" style={{ textDecoration: 'none', display: 'inline-flex', padding: '10px 20px' }}>
                Request new link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    required
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
                  Confirm New Password
                </label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
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

              <button
                type="submit"
                disabled={submitting}
                className="pill-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '12px 0',
                  fontSize: 15,
                  borderRadius: 12,
                  opacity: submitting ? 0.7 : 1,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  marginTop: 4,
                }}
              >
                {submitting ? 'Resetting password...' : 'Update password'}
              </button>

              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <Link
                  to="/login"
                  style={{
                    fontSize: 13,
                    color: 'var(--color-muted)',
                    textDecoration: 'none',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-foreground)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
                >
                  ← Back to log in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
