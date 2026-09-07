import React from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext'

interface ProtectedRouteProps {
  children?: React.ReactNode
  requireVerified?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireVerified = true,
}) => {
  const { isAuthenticated, isEmailVerified, user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-background)',
          color: 'var(--color-foreground)',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            border: '3px solid rgba(124, 58, 237, 0.2)',
            borderTopColor: 'var(--color-accent-violet)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p style={{ fontSize: 13, color: 'var(--color-muted)', fontWeight: 500 }}>
          Verifying authentication session...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (!isAuthenticated) {
    const redirectTarget = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirectTarget}`} replace />
  }

  // If email verification is required and account is unverified, redirect to /verify-email
  if (requireVerified && !isEmailVerified) {
    const emailParam = encodeURIComponent(user?.email || '')
    return <Navigate to={`/verify-email?email=${emailParam}`} replace />
  }

  return children ? <>{children}</> : null
}
