import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Game from '../components/game/Game'
import StoreOverlay from '../components/game/StoreOverlay'
import { PlayersProvider } from '../context/players.context'
import { useAuth } from '../hooks/useAuth'

const GamePage = () => {
  const { user, loading } = useAuth()
  const [isStoreOpen, setIsStoreOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'KeyB' && !event.repeat) {
        event.preventDefault()
        setIsStoreOpen((open) => !open)
      }

      if (event.code === 'Escape') {
        setIsStoreOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    document.body.style.overflow = isStoreOpen ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [isStoreOpen])

  if (loading) {
    return <main style={{ padding: 24, color: '#f8fafc' }}>Loading game session...</main>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <PlayersProvider>
      <main>
        <section style={{ position: 'relative', width: '100%', height: '100vh', display: 'grid', placeItems: 'center' }}>
          <Game isStoreOpen={isStoreOpen} />
          {!isStoreOpen && (
            <div
              aria-keyshortcuts='B'
              style={{
                position: 'absolute',
                left: 20,
                bottom: 20,
                zIndex: 5,
                padding: '8px 12px',
                borderRadius: 10,
                background: 'rgba(2, 6, 23, 0.72)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                color: '#e2e8f0',
                fontSize: 13,
                pointerEvents: 'none',
              }}
            >
              Press <strong style={{ color: '#fbbf24' }}>B</strong> to open Store
            </div>
          )}
          {isStoreOpen && <StoreOverlay onClose={() => setIsStoreOpen(false)} />}
        </section>
      </main>
    </PlayersProvider>
  )
}

export default GamePage
