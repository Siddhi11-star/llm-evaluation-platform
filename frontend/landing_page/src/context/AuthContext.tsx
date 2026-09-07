import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export interface UserProfile {
  id: string
  name: string
  email: string
  email_verified: boolean
  onboarding_completed: boolean
  plan?: string
  role?: string | null
  created_at?: string
  last_login_at?: string
}

interface AuthContextType {
  user: UserProfile | null
  token: string | null
  isAuthenticated: boolean
  isEmailVerified: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<{ success: boolean; requiresVerification?: boolean; email?: string; error?: string }>
  loginWithToken: (token: string) => Promise<{ success: boolean; user?: UserProfile; error?: string }>
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; requiresVerification?: boolean; email?: string; error?: string }>
  verifyEmail: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>
  resendVerification: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; message?: string; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  updateOnboarding: (data: {
    plan?: string
    role?: string
    use_cases?: string[]
    models?: string[]
    priorities?: string[]
  }) => Promise<{ success: boolean; error?: string }>
  updateUserProfile: (name: string) => Promise<{ success: boolean; user?: UserProfile; error?: string }>
  changePassword: (newPassword: string, currentPassword?: string) => Promise<{ success: boolean; message?: string; error?: string }>
  getSecurityStatus: () => Promise<{ success: boolean; data?: any; error?: string }>
  requestEmailChange: (newEmail: string) => Promise<{ success: boolean; message?: string; error?: string }>
  verifyEmailChange: (newEmail: string, otp: string) => Promise<{ success: boolean; user?: UserProfile; error?: string }>
  listSessions: () => Promise<{ success: boolean; sessions?: any[]; error?: string }>
  revokeSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>
  revokeAllSessions: () => Promise<{ success: boolean; error?: string }>
  deleteAccount: (confirmation: string, password?: string) => Promise<{ success: boolean; error?: string }>
  clearError: () => void
}

const AUTH_API_URL = (import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8004').replace(/\/auth\/?$/, '').replace(/\/+$/, '')
const TOKEN_STORAGE_KEY = 'judgeai_access_token'


const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY))
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const clearError = () => setError(null)

  // Fetch current authenticated user profile
  const fetchCurrentUser = useCallback(async (authToken?: string | null): Promise<UserProfile | null> => {
    try {
      const headers: Record<string, string> = {}
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }
      const res = await fetch(`${AUTH_API_URL}/auth/me`, {
        headers,
        credentials: 'include',
      })

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem(TOKEN_STORAGE_KEY)
          setToken(null)
          setUser(null)
        }
        return null
      }

      const userData: UserProfile = await res.json()
      setUser(userData)
      return userData
    } catch (err) {
      console.warn('Could not fetch user profile from Auth service:', err)
      return null
    }
  }, [])

  // Silent session refresh using HTTP-only cookie or payload
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${AUTH_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.access_token) {
          localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token)
          setToken(data.access_token)
        }
        if (data.user) {
          setUser(data.user)
        }
        return true
      }
      return false
    } catch {
      return false
    }
  }, [])

  // Initialize and verify authentication on app load
  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
      let profile = await fetchCurrentUser(storedToken)
      if (!profile) {
        const refreshed = await refreshSession()
        if (refreshed) {
          profile = await fetchCurrentUser()
        }
      }
      if (mounted && profile) {
        setUser(profile)
      }
      if (mounted) {
        setIsLoading(false)
      }
    }

    initAuth()
    return () => {
      mounted = false
    }
  }, [fetchCurrentUser, refreshSession])

  // Login handler
  const login = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${AUTH_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        const errorMsg = data.detail || 'Invalid email or password.'
        setError(errorMsg)
        setIsLoading(false)

        if (res.status === 403 && errorMsg.toLowerCase().includes('verify')) {
          return { success: false, requiresVerification: true, email, error: errorMsg }
        }
        return { success: false, error: errorMsg }
      }

      const accessToken = data.access_token
      const userProfile: UserProfile = data.user

      localStorage.setItem(TOKEN_STORAGE_KEY, accessToken)
      setToken(accessToken)
      setUser(userProfile)
      setIsLoading(false)
      return { success: true }
    } catch (err: any) {
      const errorMsg = err.message || 'Unable to connect to authentication server.'
      setError(errorMsg)
      setIsLoading(false)
      return { success: false, error: errorMsg }
    }
  }

  // OAuth token login handler (Phase 3)
  const loginWithToken = async (authToken: string) => {
    setIsLoading(true)
    setError(null)
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, authToken)
      setToken(authToken)
      const userProfile = await fetchCurrentUser(authToken)
      setIsLoading(false)
      if (userProfile) {
        return { success: true, user: userProfile }
      } else {
        setError('Failed to authenticate OAuth user session.')
        return { success: false, error: 'Failed to authenticate OAuth user session.' }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'OAuth authentication error.'
      setError(errorMsg)
      setIsLoading(false)
      return { success: false, error: errorMsg }
    }
  }

  // Signup handler (Phase 2: sends OTP and redirects to /verify-email)

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${AUTH_API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        const errorMsg = data.detail || 'Registration failed. Please check your details.'
        setError(errorMsg)
        setIsLoading(false)
        return { success: false, error: errorMsg }
      }

      const accessToken = data.access_token
      const userProfile: UserProfile = data.user

      localStorage.setItem(TOKEN_STORAGE_KEY, accessToken)
      setToken(accessToken)
      setUser(userProfile)
      setIsLoading(false)
      return { success: true, requiresVerification: true, email: userProfile.email }
    } catch (err: any) {
      const errorMsg = err.message || 'Unable to connect to authentication server.'
      setError(errorMsg)
      setIsLoading(false)
      return { success: false, error: errorMsg }
    }
  }

  // Verify Email OTP handler
  const verifyEmail = async (email: string, otp: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${AUTH_API_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp }),
      })

      const data = await res.json()
      if (!res.ok) {
        const errorMsg = data.detail || 'Verification failed. Please check the code.'
        setError(errorMsg)
        setIsLoading(false)
        return { success: false, error: errorMsg }
      }

      const accessToken = data.access_token
      const userProfile: UserProfile = data.user

      localStorage.setItem(TOKEN_STORAGE_KEY, accessToken)
      setToken(accessToken)
      setUser(userProfile)
      setIsLoading(false)
      return { success: true }
    } catch (err: any) {
      const errorMsg = err.message || 'Unable to complete verification.'
      setError(errorMsg)
      setIsLoading(false)
      return { success: false, error: errorMsg }
    }
  }

  // Resend OTP handler
  const resendVerification = async (email: string) => {
    setError(null)
    try {
      const res = await fetch(`${AUTH_API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      if (!res.ok) {
        const errorMsg = data.detail || 'Failed to resend verification code.'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }

      return { success: true, message: data.message }
    } catch (err: any) {
      const errorMsg = err.message || 'Network error resending code.'
      return { success: false, error: errorMsg }
    }
  }

  // Forgot Password handler
  const forgotPassword = async (email: string) => {
    setError(null)
    try {
      const res = await fetch(`${AUTH_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      if (!res.ok) {
        const errorMsg = data.detail || 'Failed to send reset link.'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }

      return { success: true, message: data.message }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' }
    }
  }

  // Reset Password handler
  const resetPassword = async (token: string, password: string) => {
    setError(null)
    try {
      const res = await fetch(`${AUTH_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        const errorMsg = data.detail || 'Password reset failed.'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }

      return { success: true, message: data.message }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' }
    }
  }

  // Logout handler
  const logout = async () => {
    const currentToken = token || localStorage.getItem(TOKEN_STORAGE_KEY)
    try {
      const headers: Record<string, string> = {}
      if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`
      }
      await fetch(`${AUTH_API_URL}/auth/logout`, {
        method: 'POST',
        headers,
        credentials: 'include',
      })
    } catch (err) {
      // Continue client cleanup
    }

    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken(null)
    setUser(null)
    setError(null)
  }

  // Refresh user data
  const refreshUser = async () => {
    const currentToken = token || localStorage.getItem(TOKEN_STORAGE_KEY)
    if (currentToken) {
      await fetchCurrentUser(currentToken)
    }
  }

  // Update onboarding
  const updateOnboarding = async (data: {
    plan?: string
    role?: string
    use_cases?: string[]
    models?: string[]
    priorities?: string[]
  }) => {
    const currentToken = token || localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!currentToken) {
      return { success: false, error: 'User is not authenticated' }
    }

    try {
      const res = await fetch(`${AUTH_API_URL}/auth/onboarding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      const resData = await res.json()
      if (!res.ok) {
        return { success: false, error: resData.detail || 'Failed to update onboarding profile' }
      }

      setUser(resData)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' }
    }
  }

  // ─── Phase 5: Account Management Methods ──────────────────────────────────────

  const updateUserProfile = async (name: string) => {
    const currentToken = token || localStorage.getItem(TOKEN_STORAGE_KEY)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

      const res = await fetch(`${AUTH_API_URL}/auth/profile`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.detail || 'Failed to update profile name' }
      }
      setUser(data)
      return { success: true, user: data }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error updating profile' }
    }
  }

  const changePassword = async (newPassword: string, currentPassword?: string) => {
    const currentToken = token || localStorage.getItem(TOKEN_STORAGE_KEY)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

      const res = await fetch(`${AUTH_API_URL}/auth/change-password`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ current_password: currentPassword || null, new_password: newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.detail || 'Failed to change password' }
      }
      return { success: true, message: data.message }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error changing password' }
    }
  }

  const getSecurityStatus = async () => {
    const currentToken = token || localStorage.getItem(TOKEN_STORAGE_KEY)
    try {
      const headers: Record<string, string> = {}
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

      const res = await fetch(`${AUTH_API_URL}/auth/security-status`, {
        headers,
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.detail || 'Failed to fetch security status' }
      }
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error fetching security status' }
    }
  }

  const requestEmailChange = async (newEmail: string) => {
    const currentToken = token || localStorage.getItem(TOKEN_STORAGE_KEY)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

      const res = await fetch(`${AUTH_API_URL}/auth/change-email/request`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ new_email: newEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.detail || 'Failed to request email change' }
      }
      return { success: true, message: data.message }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error requesting email change' }
    }
  }

  const verifyEmailChange = async (newEmail: string, otp: string) => {
    const currentToken = token || localStorage.getItem(TOKEN_STORAGE_KEY)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

      const res = await fetch(`${AUTH_API_URL}/auth/change-email/verify`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ new_email: newEmail, otp }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.detail || 'Verification code invalid or expired' }
      }
      if (data.access_token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token)
        setToken(data.access_token)
      }
      if (data.user) {
        setUser(data.user)
      }
      return { success: true, user: data.user }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error verifying email change' }
    }
  }

  const listSessions = async () => {
    const currentToken = token || localStorage.getItem(TOKEN_STORAGE_KEY)
    try {
      const headers: Record<string, string> = {}
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

      const res = await fetch(`${AUTH_API_URL}/auth/sessions`, {
        headers,
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.detail || 'Failed to list active sessions' }
      }
      return { success: true, sessions: data }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error listing sessions' }
    }
  }

  const revokeSession = async (sessionId: string) => {
    const currentToken = token || localStorage.getItem(TOKEN_STORAGE_KEY)
    try {
      const headers: Record<string, string> = {}
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

      const res = await fetch(`${AUTH_API_URL}/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.detail || 'Failed to revoke session' }
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error revoking session' }
    }
  }

  const revokeAllSessions = async () => {
    const currentToken = token || localStorage.getItem(TOKEN_STORAGE_KEY)
    try {
      const headers: Record<string, string> = {}
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

      const res = await fetch(`${AUTH_API_URL}/auth/sessions/revoke-all`, {
        method: 'POST',
        headers,
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.detail || 'Failed to revoke sessions' }
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error revoking all sessions' }
    }
  }

  const deleteAccount = async (confirmation: string, password?: string) => {
    const currentToken = token || localStorage.getItem(TOKEN_STORAGE_KEY)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

      const res = await fetch(`${AUTH_API_URL}/auth/account`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
        body: JSON.stringify({ confirmation, password: password || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.detail || 'Failed to delete account' }
      }
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      setToken(null)
      setUser(null)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error deleting account' }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isEmailVerified: !!user?.email_verified,
        isLoading,
        error,
        login,
        loginWithToken,
        signup,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        logout,
        refreshUser,
        updateOnboarding,
        updateUserProfile,
        changePassword,
        getSecurityStatus,
        requestEmailChange,
        verifyEmailChange,
        listSessions,
        revokeSession,
        revokeAllSessions,
        deleteAccount,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
