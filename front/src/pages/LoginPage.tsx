import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { authService } from '../services/auth/auth.service'

const API_BASE = import.meta.env.VITE_API_URL ?? ''
const FORTY_TWO_AUTHORIZE_URL = 'https://api.intra.42.fr/oauth/authorize'
const FORTY_TWO_CLIENT_ID = import.meta.env.VITE_42_CLIENT_ID ?? ''
const FORTY_TWO_REDIRECT_URI =
  import.meta.env.VITE_42_REDIRECT_URI ??
  (typeof window !== 'undefined'
    ? `${window.location.origin}/login`
    : 'http://localhost:5173/login')

const FORTY_TWO_SCOPE = import.meta.env.VITE_42_SCOPE ?? 'public'

const OAUTH_STATE_STORAGE_KEY = '42-oauth-state'
const OAUTH_HANDLED_CODE_STORAGE_KEY = '42-oauth-handled-code'

type Status = {
  type: 'idle' | 'error' | 'success'
  message: string
}

type User = {
  email?: string
  [key: string]: unknown
}

type AuthResponse = {
  user: User
  token?: string
  message?: string
}

const createOAuthState = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const build42AuthorizeUrl = (state: string): string => {
  const params = new URLSearchParams({
    client_id: FORTY_TWO_CLIENT_ID,
    redirect_uri: FORTY_TWO_REDIRECT_URI,
    response_type: 'code',
    scope: FORTY_TWO_SCOPE,
    state,
  })

  return `${FORTY_TWO_AUTHORIZE_URL}?${params.toString()}`
}

const LoginPage = () => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [status, setStatus] = useState<Status>({
    type: 'idle',
    message: '',
  })
  const [confirmedUser, setConfirmedUser] = useState<User | null>(null)
  const [testUsername, setTestUsername] = useState<string>('')
  const { login: setSession } = useAuth()

  const navigate = useNavigate()

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const code = searchParams.get('code') || ''
    const state = searchParams.get('state') || ''
    const error = searchParams.get('error') || ''
    const errorDescription = searchParams.get('error_description') || ''

    if (error) {
      setStatus({
        type: 'error',
        message: errorDescription || error,
      })

      window.history.replaceState({}, document.title, window.location.pathname)
      return
    }

    if (!code) return

    const expectedState =
      sessionStorage.getItem(OAUTH_STATE_STORAGE_KEY) || ''

    if (!expectedState || expectedState !== state) {
      setStatus({
        type: 'error',
        message: 'The 42 authorization state did not match. Please try again.',
      })

      window.history.replaceState({}, document.title, window.location.pathname)
      return
    }

    const completeOAuthLogin = async () => {
      const handledCode =
        sessionStorage.getItem(OAUTH_HANDLED_CODE_STORAGE_KEY) || ''

      if (handledCode === code) return

      sessionStorage.setItem(OAUTH_HANDLED_CODE_STORAGE_KEY, code)

      setIsSubmitting(true)
      setStatus({
        type: 'idle',
        message: 'Completing 42 sign-in...',
      })

      try {
        const callbackUrl = `${API_BASE}/api/auth/oauth/42/callback`

        const response = await fetch(callbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state }),
        })

        const data: AuthResponse = await response.json()

        if (!response.ok) {
          throw new Error(data?.message || 'Could not complete the 42 sign-in.')
        }

        setConfirmedUser(data.user)

        if (data.token) {
          try {
            setSession(data.token, data.user)
          } catch {
            // ignore storage errors
          }
        }

        sessionStorage.removeItem(OAUTH_STATE_STORAGE_KEY)
        window.history.replaceState({}, document.title, window.location.pathname)

        setStatus({
          type: 'success',
          message: `Signed in as ${
            data.user?.email || 'your 42 account'
          }. Redirecting...`,
        })

        navigate('/user', { replace: true })
      } catch (requestError: unknown) {
        sessionStorage.removeItem(OAUTH_HANDLED_CODE_STORAGE_KEY)

        const message =
          requestError instanceof Error
            ? requestError.message
            : 'Unknown error'

        setStatus({
          type: 'error',
          message,
        })

        window.history.replaceState({}, document.title, window.location.pathname)
      } finally {
        setIsSubmitting(false)
      }
    }

    completeOAuthLogin()
  }, [navigate])

  const handle42Login = (): void => {
    if (!FORTY_TWO_CLIENT_ID) {
      setStatus({
        type: 'error',
        message: 'The 42 OAuth client id is not configured.',
      })
      return
    }

    const state = createOAuthState()

    sessionStorage.setItem(OAUTH_STATE_STORAGE_KEY, state)
    window.location.assign(build42AuthorizeUrl(state))
  }

  const handleTestLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!testUsername.trim()) {
      setStatus({
        type: 'error',
        message: 'Please enter a test username.',
      })
      return
    }

    setIsSubmitting(true)
    setStatus({
      type: 'idle',
      message: 'Signing in as test user...',
    })

    try {
      const data = await authService.testLogin(testUsername.trim())
      setConfirmedUser(data.user)

      if (data.token) {
        setSession(data.token, data.user)
      }

      setStatus({
        type: 'success',
        message: `Signed in as test user ${data.user.username}. Redirecting...`,
      })

      navigate('/user', { replace: true })
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error ? requestError.message : 'Unknown error'
      setStatus({
        type: 'error',
        message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main style={{ display: 'grid', placeItems: 'center', padding: '48px 20px' }}>
      <section
        style={{
          width: 'min(620px, 100%)',
          border: '1px solid rgba(125, 211, 252, 0.18)',
          borderRadius: '28px',
          background:
            'linear-gradient(180deg, rgba(15, 23, 42, 0.94) 0%, rgba(15, 23, 42, 0.78) 100%)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
          padding: '32px',
        }}
      >
        <p
          style={{
            margin: '0 0 10px',
            fontSize: '0.78rem',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: '#7dd3fc',
          }}
        >
          42 OAuth
        </p>

        <h1
          style={{
            margin: 0,
            fontSize: 'clamp(2rem, 4vw, 3.4rem)',
            lineHeight: 1.05,
            color: '#f8fafc',
          }}
        >
          Sign in to your account.
        </h1>

        <p
          style={{
            margin: '14px 0 0',
            maxWidth: '52ch',
            color: '#cbd5e1',
            fontSize: '1.02rem',
          }}
        >
          Sign in via 42 OAuth or use the test login below to proceed with a test profile.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '24px' }}>
          <button
            type="button"
            onClick={handle42Login}
            disabled={isSubmitting}
            style={{
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
              color: '#08111f',
              padding: '14px 22px',
              fontWeight: 800,
              cursor: isSubmitting ? 'wait' : 'pointer',
              boxShadow: '0 14px 30px rgba(14, 165, 233, 0.25)',
            }}
          >
            Continue with 42
          </button>
        </div>

        <div style={{ margin: '32px 0 24px', borderTop: '1px solid rgba(255,255,255,0.1)' }} />

        <form onSubmit={handleTestLogin} style={{ display: 'grid', gap: '12px' }}>
          <label style={{ color: '#7dd3fc', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Login as Test User (Intra Name)
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={testUsername}
              onChange={(e) => setTestUsername(e.target.value)}
              placeholder="Enter custom Intra name"
              disabled={isSubmitting}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '12px 18px',
                borderRadius: '999px',
                border: '1px solid rgba(125, 211, 252, 0.3)',
                background: 'rgba(15, 23, 42, 0.6)',
                color: '#f8fafc',
                fontSize: '1rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                padding: '12px 24px',
                fontWeight: 800,
                cursor: isSubmitting ? 'wait' : 'pointer',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)',
              }}
            >
              Sign In as Test
            </button>
          </div>
        </form>

        <p style={{ margin: '24px 0 0', color: '#cbd5e1' }} aria-live="polite">
          {status.message || 'Ready when you are.'}
        </p>

        {confirmedUser ? (
          <p style={{ margin: '12px 0 0', color: '#e2e8f0' }}>
            Signed in as {confirmedUser.email}
          </p>
        ) : null}

        <p style={{ margin: '12px 0 0', color: '#94a3b8', fontSize: '0.92rem' }}>
          Redirect URI: {FORTY_TWO_REDIRECT_URI}
        </p>
      </section>
    </main>
  )
}

export default LoginPage
