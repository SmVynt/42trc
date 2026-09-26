import { useEffect, useState } from 'react'
import { inventoryActive } from './fishing/FishingState'
import { authService } from '../../services/auth/auth.service'
import { tokenService } from '../../storage/token.service'

interface Rod {
  id: number
  name: string
  barHeight: number
  control: number
  catchRate: number
}

interface InventoryOverlayProps {
  equippedRodId: number | null
  onEquip: (id: number) => void
  onClose: () => void
}

const InventoryOverlay = ({ equippedRodId, onEquip, onClose }: InventoryOverlayProps) => {
  const [rods, setRods] = useState<Rod[]>([])

  // Block game input while the inventory is open
  useEffect(() => {
    inventoryActive.current = true
    return () => { inventoryActive.current = false }
  }, [])

  // Load the rod catalog
  useEffect(() => {
    let cancelled = false
    fetch('/api/fishing/rods')
      .then((r) => r.json())
      .then((data: Rod[]) => { if (!cancelled) setRods(data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const equip = async (rodId: number) => {
    const token = tokenService.get()
    if (!token) return
    try {
      await authService.equipRod(token, rodId)
      onEquip(rodId)
    } catch (e) {
      console.error('equip failed:', e)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, display: 'flex',
        alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)',
      }}
    >
	<div
	onClick={(e) => e.stopPropagation()}
	style={{
		width: 380, height: 360, padding: 24, borderRadius: 12,
		background: '#0f2233', color: '#e6f0f6', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
		display: 'flex', flexDirection: 'column',
		boxSizing: 'border-box',
	}}
	>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Inventory — Rods</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9db6c6', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rods.map((rod) => {
            const equipped = rod.id === equippedRodId
            return (
              <div
                key={rod.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 8, background: '#0a2e44',
                  border: equipped ? '1px solid #4cd17a' : '1px solid #2b7fb8',
                }}
              >
                <div>
                  <b>{rod.name}</b>
                  <span style={{ opacity: 0.6, fontSize: 12, marginLeft: 8 }}>
                    zone {rod.barHeight} · ctrl {rod.control}
                  </span>
                </div>
                <button
                  onClick={(e) => { e.currentTarget.blur(); equip(rod.id) }}
                  disabled={equipped}
                  style={{
                    padding: '6px 12px', borderRadius: 6, border: 'none', fontSize: 13,
                    cursor: equipped ? 'default' : 'pointer',
                    background: equipped ? '#4cd17a' : '#2b7fb8',
                    color: equipped ? '#06301a' : 'white',
                  }}
                >
                  {equipped ? 'Equipped' : 'Equip'}
                </button>
              </div>
            )
          })}
          {rods.length === 0 && <p style={{ opacity: 0.6, textAlign: 'center' }}>Loading…</p>}
        </div>
      </div>
    </div>
  )
}

export default InventoryOverlay