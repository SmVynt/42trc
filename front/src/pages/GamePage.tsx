import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Game from '../components/game/Game'
import InventoryOverlay from '../components/game/InventoryOverlay'
import StoreOverlay from '../components/game/StoreOverlay'
import { PlayersProvider } from '../context/players.context'
import { useAuth } from '../hooks/useAuth'

const GamePage = () => {
  const { user, loading } = useAuth()
  const [activeOverlay, setActiveOverlay] = useState<'store' | 'inventory' | null>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'KeyB' && !event.repeat) {
        event.preventDefault()
        setActiveOverlay((overlay) => overlay === 'store' ? null : 'store')
      }

      if (event.code === 'KeyI' && !event.repeat) {
        event.preventDefault()
        setActiveOverlay((overlay) => overlay === 'inventory' ? null : 'inventory')
      }

      if (event.code === 'Escape') {
        setActiveOverlay(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    document.body.style.overflow = activeOverlay ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [activeOverlay])

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
          <Game isOverlayOpen={activeOverlay !== null} />
          {!activeOverlay && (
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
              Press <strong style={{ color: '#fbbf24' }}>B</strong> Store · <strong style={{ color: '#fbbf24' }}>I</strong> Inventory
            </div>
          )}
          {activeOverlay === 'store' && <StoreOverlay onClose={() => setActiveOverlay(null)} />}
          {activeOverlay === 'inventory' && <InventoryOverlay onClose={() => setActiveOverlay(null)} />}
        </section>
      </main>
    </PlayersProvider>
  )
}

export default GamePage
