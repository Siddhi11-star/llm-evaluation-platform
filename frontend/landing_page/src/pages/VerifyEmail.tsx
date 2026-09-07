import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Logo } from '../components/Logo'
import { IcSun, IcMoon, IcCheck } from '../components/icons'
import { useTheme } from '../components/ThemeProvider'
import { useAuth } from '../context/AuthContext'

export default function VerifyEmail() {
  const { theme, toggleTheme } = useTheme()
  const { user, verifyEmail, resendVerification, isLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const emailParam = searchParams.get('email') || user?.email || ''
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(60)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Decrement countdown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown(c => (c > 0 ? c - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  // Focus first input box on load
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleDigitChange = (index: number, value: string) => {
    setError(null)
    const char = value.slice(-1)

    if (char && !char.match(/[0-9]/)) {
      return
    }

    const newOtp = [...otp]
    newOtp[index] = char
    setOtp(newOtp)

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').trim()
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('')
      setOtp(digits)
      inputRefs.current[5]?.focus()
    }
  }

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)
    setSuccess(null)

    const fullOtp = otp.join('')
    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.')
      return
    }

    if (!emailParam) {
      setError('Email address is missing. Please return to login.')
      return
    }

    setSubmitting(true)
    const result = await verifyEmail(emailParam, fullOtp)
    setSubmitting(false)

    if (result.success) {
      setSuccess('Email verified successfully! Redirecting...')
      setTimeout(() => {
        if (user && !user.onboarding_completed) {
          navigate('/onboarding/plan')
        } else {
          navigate('/dashboard')
        }
      }, 1200)
    } else {
      setError(result.error || 'Verification failed. Please check the code.')
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || resending) return
    setError(null)
    setSuccess(null)

    if (!emailParam) {
      setError('Email address is missing.')
      return
    }

    setResending(true)
    const result = await resendVerification(emailParam)
    setResending(false)

    if (result.success) {
      setCooldown(60)
      setSuccess('A new 6-digit code has been sent to your email.')
    } else {
      setError(result.error || 'Failed to resend verification code.')
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

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
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
            Verify your email
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
            We've sent a 6-digit verification code to{' '}
            <strong style={{ color: 'var(--color-foreground)' }}>{emailParam || 'your email'}</strong>.
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
                padding: '10px 14px',
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

          {/* OTP Input Boxes */}
          <form onSubmit={handleVerify}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 24,
              }}
              onPaste={handlePaste}
            >
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => {
                    inputRefs.current[idx] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleDigitChange(idx, e.target.value)}
                  onKeyDown={e => handleKeyDown(idx, e)}
                  style={{
                    width: 48,
                    height: 54,
                    fontSize: 20,
                    fontWeight: 700,
                    textAlign: 'center',
                    background: 'var(--color-input-bg)',
                    border: `1px solid ${digit ? 'var(--color-accent-violet)' : 'var(--color-border)'}`,
                    borderRadius: 10,
                    color: 'var(--color-foreground)',
                    outline: 'none',
                    fontFamily: 'monospace',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxShadow: digit ? '0 0 12px rgba(124, 58, 237, 0.2)' : 'none',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--color-accent-violet)')}
                  onBlur={e => {
                    if (!digit) e.target.style.borderColor = 'var(--color-border)'
                  }}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={submitting || isLoading || otp.join('').length !== 6}
              className="pill-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '12px 0',
                fontSize: 15,
                borderRadius: 12,
                opacity: submitting || isLoading || otp.join('').length !== 6 ? 0.6 : 1,
                cursor: submitting || isLoading || otp.join('').length !== 6 ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          {/* Resend OTP info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 24,
              fontSize: 13,
              color: 'var(--color-muted)',
            }}
          >
            <span>Didn't receive the code?</span>
            {cooldown > 0 ? (
              <span style={{ color: 'var(--color-muted-strong)', fontWeight: 500 }}>
                Resend in {cooldown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-accent-violet)',
                  fontWeight: 600,
                  cursor: resending ? 'not-allowed' : 'pointer',
                  padding: 0,
                  fontSize: 13,
                }}
              >
                {resending ? 'Sending...' : 'Resend OTP'}
              </button>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
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
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
