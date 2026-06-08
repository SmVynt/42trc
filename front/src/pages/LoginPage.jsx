import { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState({ type: 'idle', message: '' })
  const [confirmationLink, setConfirmationLink] = useState('')
  const [confirmedUser, setConfirmedUser] = useState(null)

  const pendingToken = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get('token') || ''
  }, [])

  useEffect(() => {
    if (!pendingToken) return

    const confirmToken = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/auth/login/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: pendingToken }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.message || 'Could not confirm the email link.')
        }

        setConfirmedUser(data.user)
        setStatus({
          type: 'success',
          message: `Confirmed ${data.user?.email || 'your email'}. You are ready to continue.`,
        })
        window.history.replaceState({}, document.title, window.location.pathname)
      } catch (error) {
        setStatus({ type: 'error', message: error.message })
      }
    }

    confirmToken()
  }, [pendingToken])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus({ type: 'idle', message: '' })
    setConfirmationLink('')

    try {
      const response = await fetch(`${API_BASE}/api/auth/login/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'Could not request the confirmation email.')
      }

      setStatus({
        type: 'success',
        message: `We sent a confirmation message to ${data.email}. Check your inbox and spam folder.`,
      })
      if (data.confirmationUrl) {
        setConfirmationLink(data.confirmationUrl)
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main style={{ display: 'grid', placeItems: 'center', padding: '48px 20px' }}>
      <section
        style={{
          width: 'min(560px, 100%)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '20px',
          background: 'rgba(15, 23, 42, 0.78)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.24)',
          padding: '28px',
        }}
      >
        <p style={{ margin: '0 0 8px', fontSize: '0.8rem', letterSpacing: '0.24em', textTransform: 'uppercase', color: '#7dd3fc' }}>
          Login
        </p>

        <h1 style={{ margin: 0, fontSize: '2rem', lineHeight: 1.1, color: '#f8fafc' }}>
          Login with your school email.
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px', marginTop: '20px' }}>
          <label htmlFor="email" style={{ fontSize: '0.95rem', color: '#cbd5e1' }}>
            School email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@school-domain.example"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            style={{
              width: '100%',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(2, 6, 23, 0.92)',
              color: '#f8fafc',
              padding: '14px 16px',
            }}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.14)',
              background: '#f8fafc',
              color: '#0f172a',
              padding: '14px 16px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {isSubmitting ? 'Sending link...' : 'Send confirmation link'}
          </button>
        </form>

        <p style={{ margin: '16px 0 0', color: '#cbd5e1' }} aria-live="polite">
          {status.message || 'Ready when you are.'}
        </p>

        {confirmedUser ? <p style={{ margin: '12px 0 0', color: '#e2e8f0' }}>Signed in as {confirmedUser.email}</p> : null}

        {confirmationLink ? (
          <p style={{ margin: '12px 0 0', color: '#e2e8f0', wordBreak: 'break-word' }}>
            Dev confirmation link: <a href={confirmationLink} style={{ color: '#7dd3fc' }}>{confirmationLink}</a>
          </p>
        ) : null}
      </section>
    </main>
  )
}

export default LoginPage
