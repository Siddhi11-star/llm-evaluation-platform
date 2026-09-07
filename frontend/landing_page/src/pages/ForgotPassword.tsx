import { useState } from 'react'
import { Link } from 'react-router'
import { Logo } from '../components/Logo'
import { IcSun, IcMoon, IcCheck } from '../components/icons'
import { useTheme } from '../components/ThemeProvider'
import { useAuth } from '../context/AuthContext'

export default function ForgotPassword() {
  const { theme, toggleTheme } = useTheme()
  const { forgotPassword } = useAuth()

  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    setSubmitting(true)
    const result = await forgotPassword(email.trim())
    setSubmitting(false)

    if (result.success) {
      setSubmitted(true)
      setMessage(result.message || 'If an account exists for this email, a password reset link has been sent.')
    } else {
      setError(result.error || 'Failed to submit password reset request.')
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
            Reset your password
          </h1>
          <p
            style={{
              textAlign: 'center',
              fontSize: 13,
              color: 'var(--color-muted)',
              marginBottom: 24,
              lineHeight: 1.5,
            }}
          >
            Enter your registered email address and we'll send you instructions to reset your password.
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
          {submitted ? (
            <div>
              <div
                style={{
                  background: 'rgba(52, 211, 153, 0.1)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  borderRadius: 10,
                  padding: '14px 16px',
                  color: '#34D399',
                  fontSize: 13,
                  lineHeight: 1.5,
                  marginBottom: 24,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <IcCheck size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{message}</span>
              </div>
              <Link
                to="/login"
                className="pill-outline"
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '12px 0',
                  fontSize: 14,
                  textDecoration: 'none',
                  borderRadius: 12,
                }}
              >
                Return to log in
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
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.ai"
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
                {submitting ? 'Sending instructions...' : 'Send reset link'}
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
