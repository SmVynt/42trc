import { useState } from 'react'
import { gamblingService } from '../../services/gambling/gambling.service'
import type { SlotMachineResponse } from '../../types/gambling'
import { useAuth } from '../../hooks/useAuth'

type SlotMachineOverlayProps = {
  onClose: () => void
}

const SlotMachineOverlay = ({ onClose }: SlotMachineOverlayProps) => {
  const { user, updateUser } = useAuth()
  const [betAmount, setBetAmount] = useState(10)
  const [round, setRound] = useState<SlotMachineResponse | null>(null)
  const [message, setMessage] = useState('Set your bet and spin the reels.')
  const [spinning, setSpinning] = useState(false)
  const wallet = user?.wallet ?? 0

  const play = async () => {
    if (!Number.isInteger(betAmount) || betAmount <= 0) {
      setMessage('Enter a whole number bet greater than zero.')
      return
    }
    if (betAmount > wallet) {
      setMessage('Your bet is higher than your wallet balance.')
      return
    }

    setSpinning(true)
    setMessage('The reels are spinning...')
    try {
      const response = await gamblingService.playSlotMachine(betAmount)
      setRound(response)
      if (user) updateUser({ ...user, wallet: response.wallet })
      setMessage(response.result)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The slot machine could not spin.')
    } finally {
      setSpinning(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Island slot machine"
      style={{
        position: 'fixed', inset: 0, zIndex: 30, display: 'grid', placeItems: 'center',
        padding: 20, background: 'rgba(3, 9, 18, 0.82)', backdropFilter: 'blur(9px)',
      }}
    >
      <section style={{
        width: 'min(520px, 100%)', padding: 26, borderRadius: 28, color: '#fff7ed',
        border: '1px solid rgba(251,191,36,.45)',
        background: 'radial-gradient(ellipse at top, #713f12 0%, #1e293b 58%, #0f172a 100%)',
        boxShadow: '0 28px 100px rgba(0,0,0,.6)', display: 'grid', gap: 20,
      }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: '.24em', color: '#fbbf24', textTransform: 'uppercase' }}>Island arcade</div>
            <h2 style={{ margin: '6px 0 0', fontSize: 30 }}>Lucky Reels</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close slot machine" style={closeButtonStyle}>×</button>
        </header>

        <div aria-live="polite" style={{
          display: 'flex', justifyContent: 'center', gap: 12, padding: '20px 12px',
          borderRadius: 20, border: '3px solid #fbbf24', background: '#020617',
          boxShadow: 'inset 0 0 25px rgba(251,191,36,.12)',
        }}>
          {(round?.symbols ?? ['🌴', '🍍', '💎']).map((symbol, index) => (
            <div key={`${index}-${symbol}`} style={{
              width: 82, height: 86, display: 'grid', placeItems: 'center', borderRadius: 14,
              background: 'linear-gradient(#fff7ed, #fed7aa)', color: '#0f172a', fontSize: 48,
              boxShadow: '0 5px 0 #9a3412',
            }}>{spinning ? '✨' : symbol}</div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
          <span>Wallet</span><strong style={{ color: '#fde68a' }}>{wallet} coins</strong>
        </div>

        <label style={{ display: 'grid', gap: 8 }}>
          <span style={{ fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: '#cbd5e1' }}>Bet per spin</span>
          <input
            type="number" min={1} max={wallet} step={1} value={betAmount}
            onChange={(event) => setBetAmount(Number(event.target.value))}
            style={{ width: '100%', boxSizing: 'border-box', padding: 13, borderRadius: 12, border: '1px solid #475569', background: '#0f172a', color: '#fff', fontSize: 17 }}
          />
        </label>

        <button type="button" onClick={play} disabled={spinning || wallet < 1} style={{
          border: 0, borderRadius: 14, padding: '15px 20px', color: '#451a03', fontWeight: 900,
          fontSize: 17, background: spinning ? '#94a3b8' : 'linear-gradient(135deg, #fde047, #f59e0b)',
          cursor: spinning || wallet < 1 ? 'wait' : 'pointer',
        }}>{spinning ? 'Spinning…' : `Spin for ${betAmount || 0} coins`}</button>

        <div aria-live="polite" style={{ minHeight: 24, textAlign: 'center', color: round?.winAmount ? '#86efac' : '#cbd5e1' }}>
          {message}{round ? ` · payout ${round.winAmount} coins${round.multiplier ? ` (${round.multiplier}×)` : ''}` : ''}
        </div>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: 12, lineHeight: 1.6, textAlign: 'center' }}>
          A pair returns your bet. Three of a kind: 🌴 2× · 🍍 3× · 🐚 4× · 🔔 8× · 💎 20×.
        </p>
      </section>
    </div>
  )
}

const closeButtonStyle: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 12, border: '1px solid rgba(255,255,255,.2)',
  background: 'rgba(15,23,42,.7)', color: '#fff', fontSize: 25, cursor: 'pointer',
}

export default SlotMachineOverlay
