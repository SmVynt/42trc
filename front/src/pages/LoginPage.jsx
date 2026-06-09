import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL ?? ''
const FORTY_TWO_AUTHORIZE_URL = 'https://api.intra.42.fr/oauth/authorize'
const FORTY_TWO_CLIENT_ID = import.meta.env.VITE_42_CLIENT_ID ?? ''
const FORTY_TWO_REDIRECT_URI = import.meta.env.VITE_42_REDIRECT_URI ?? (typeof window !== 'undefined' ? `${window.location.origin}/login` : 'http://localhost:5173/login')
const FORTY_TWO_SCOPE = import.meta.env.VITE_42_SCOPE ?? 'public'
const OAUTH_STATE_STORAGE_KEY = '42-oauth-state'
const OAUTH_HANDLED_CODE_STORAGE_KEY = '42-oauth-handled-code'

const createOAuthState = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const build42AuthorizeUrl = (state) => {
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
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [status, setStatus] = useState({ type: 'idle', message: '' })
	const [confirmedUser, setConfirmedUser] = useState(null)
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

		if (!code) {
			return
		}

		const expectedState = sessionStorage.getItem(OAUTH_STATE_STORAGE_KEY) || ''
		if (!expectedState || expectedState !== state) {
			setStatus({ type: 'error', message: 'The 42 authorization state did not match. Please try again.' })
			window.history.replaceState({}, document.title, window.location.pathname)
			return
		}

		const completeOAuthLogin = async () => {
			const handledCode = sessionStorage.getItem(OAUTH_HANDLED_CODE_STORAGE_KEY) || ''
			if (handledCode === code) {
				return
			}

			sessionStorage.setItem(OAUTH_HANDLED_CODE_STORAGE_KEY, code)
			setIsSubmitting(true)
			console.log('WHat was received from 42:', { code, state, error, errorDescription })
			setStatus({ type: 'idle', message: 'Completing 42 sign-in...' })

			try {
				const callbackUrl = `${API_BASE}/api/auth/oauth/42/callback`
				console.log('42 OAuth callback URL:', callbackUrl)
				const response = await fetch(callbackUrl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ code, state }),
				})

				const data = await response.json()

				if (!response.ok) {
				throw new Error(data?.message || 'Could not complete the 42 sign-in.')
				}

				setConfirmedUser(data.user)
				if (data.token) {
					try {
						localStorage.setItem('authToken', data.token)
					} catch {
						// ignore storage errors
					}
				}

				sessionStorage.removeItem(OAUTH_STATE_STORAGE_KEY)
				window.history.replaceState({}, document.title, window.location.pathname)
				setStatus({
				type: 'success',
				message: `Signed in as ${data.user?.email || 'your 42 account'}. Redirecting...`,
				})
				navigate('/user', { replace: true })
			} catch (requestError) {
				sessionStorage.removeItem(OAUTH_HANDLED_CODE_STORAGE_KEY)
				setStatus({ type: 'error', message: requestError.message })
				window.history.replaceState({}, document.title, window.location.pathname)
			} finally {
				setIsSubmitting(false)
			}
		}

		completeOAuthLogin()
	}, [navigate])

	const handle42Login = () => {
		if (!FORTY_TWO_CLIENT_ID) {
		setStatus({ type: 'error', message: 'The 42 OAuth client id is not configured.' })
		return
		}

		const state = createOAuthState()
		sessionStorage.setItem(OAUTH_STATE_STORAGE_KEY, state)
		window.location.assign(build42AuthorizeUrl(state))
	}

	return (
		<main style={{ display: 'grid', placeItems: 'center', padding: '48px 20px' }}>
		<section
			style={{
			width: 'min(620px, 100%)',
			border: '1px solid rgba(125, 211, 252, 0.18)',
			borderRadius: '28px',
			background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.94) 0%, rgba(15, 23, 42, 0.78) 100%)',
			boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
			padding: '32px',
			}}
		>
			<p style={{ margin: '0 0 10px', fontSize: '0.78rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#7dd3fc' }}>
			42 OAuth
			</p>

			<h1 style={{ margin: 0, fontSize: 'clamp(2rem, 4vw, 3.4rem)', lineHeight: 1.05, color: '#f8fafc' }}>
			Sign in with your 42 account.
			</h1>

			<p style={{ margin: '14px 0 0', maxWidth: '52ch', color: '#cbd5e1', fontSize: '1.02rem' }}>
			The email-based workflow has been replaced. You’ll be redirected to the 42 authorization screen, then returned here with a session token.
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
						letterSpacing: '0.02em',
						cursor: isSubmitting ? 'wait' : 'pointer',
						boxShadow: '0 14px 30px rgba(14, 165, 233, 0.25)',
					}}
				>
				{isSubmitting ? 'Signing in...' : 'Continue with 42'}
			</button>

			</div>

			<p style={{ margin: '16px 0 0', color: '#cbd5e1' }} aria-live="polite">
			{status.message || 'Ready when you are.'}
			</p>

			{confirmedUser ? <p style={{ margin: '12px 0 0', color: '#e2e8f0' }}>Signed in as {confirmedUser.email}</p> : null}

			<p style={{ margin: '12px 0 0', color: '#94a3b8', fontSize: '0.92rem' }}>
			Redirect URI: {FORTY_TWO_REDIRECT_URI}
			</p>
		</section>
		</main>
	)
}

export default LoginPage
