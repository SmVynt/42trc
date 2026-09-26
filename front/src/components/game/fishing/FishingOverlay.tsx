import { useEffect, useRef, useState } from 'react'
import { fishingActive } from './FishingState'

interface FishingOverlayProps {
  equippedRodId: number | null
  onClose: () => void
}

interface CaughtFish {
  id: number
  name: string
  speed: number
  escapeRate: number
  rarity: number
}

interface Rod {
  id: number
  name: string
  barHeight: number
  control: number
  catchRate: number
}

// Base handling — rod.control scales lift/gravity
const BASE_GRAVITY = 0.00012
const BASE_LIFT = 0.0002

type Status = 'loading' | 'no-rod' | 'playing' | 'caught' | 'lost'

const FishingOverlay = ({ equippedRodId, onClose }: FishingOverlayProps) => {
  const [status, setStatus] = useState<Status>('loading')
  const [fish, setFish] = useState<CaughtFish | null>(null)

  // Game state (refs — change every frame, no re-render)
  const barPos = useRef(0.5)
  const barVel = useRef(0)
  const fishPos = useRef(0.5)
  const fishTarget = useRef(0.5)
  const progress = useRef(0.4)
  const holding = useRef(false)
  const raf = useRef<number>(0)

  // Values pulled from the chosen rod + cast fish
  const fishSpeed = useRef(0.4)
  const escapeRate = useRef(0.45)
  const barHeight = useRef(20)
  const gravity = useRef(BASE_GRAVITY)
  const lift = useRef(BASE_LIFT)
  const catchRate = useRef(0.35)

  const [render, setRender] = useState({ bar: 0.5, fish: 0.5, prog: 0.4 })

  useEffect(() => {
    fishingActive.current = true
    return () => { fishingActive.current = false }
  }, [])

  // On open: no rod -> stop; otherwise load rods, apply the equipped one, then cast
  useEffect(() => {
    if (equippedRodId == null) { setStatus('no-rod'); return }
 
    let cancelled = false
    fetch('/api/fishing/rods')
      .then((r) => r.json())
      .then((rods: Rod[]) => {
        if (cancelled) return
        const rod = rods.find((r) => r.id === equippedRodId)
        if (!rod) { setStatus('no-rod'); return }
 
        barHeight.current = rod.barHeight
        catchRate.current = rod.catchRate
        lift.current = BASE_LIFT * rod.control
        gravity.current = BASE_GRAVITY / rod.control
 
        return fetch('/api/fishing/cast', { method: 'POST' })
          .then((r) => r.json())
          .then((data: CaughtFish) => {
            if (cancelled) return
            setFish(data)
            fishSpeed.current = data.speed
            escapeRate.current = data.escapeRate
            barPos.current = 0.5; barVel.current = 0
            fishPos.current = 0.5; progress.current = 0.4
            setStatus('playing')
          })
      })
      .catch((e) => { if (!cancelled) { console.error('fishing failed:', e); setStatus('lost') } })
    return () => { cancelled = true }
  }, [equippedRodId])

  // Hold input: space or mouse
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); holding.current = true } }
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') holding.current = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // Game loop — only while playing
  useEffect(() => {
    if (status !== 'playing') return

    let last = performance.now()
    let fishTimer = 0

    const loop = (now: number) => {
      const dt = now - last
      last = now

      // Bar: gravity down, holding up
      barVel.current += holding.current ? lift.current * dt : -gravity.current * dt
      barVel.current *= 0.92
      barPos.current += barVel.current
      if (barPos.current < 0) { barPos.current = 0; barVel.current = 0 }
      const maxPos = 1 - barHeight.current / 100
      if (barPos.current > maxPos) { barPos.current = maxPos; barVel.current = 0 }

      // Fish: new random target every ~1.2s
      fishTimer -= dt
      if (fishTimer <= 0) { fishTarget.current = Math.random(); fishTimer = 800 + Math.random() * 1200 }
      fishPos.current += (fishTarget.current - fishPos.current) * fishSpeed.current * (dt / 1000)

      // In zone?
      const barTop = barPos.current + barHeight.current / 100
      const inZone = fishPos.current >= barPos.current && fishPos.current <= barTop

      // Progress
      progress.current += (inZone ? catchRate.current : -escapeRate.current) * (dt / 1000)
      if (progress.current >= 1) { setStatus('caught'); return }
      if (progress.current <= 0) { setStatus('lost'); return }

      setRender({ bar: barPos.current, fish: fishPos.current, prog: progress.current })
      raf.current = requestAnimationFrame(loop)
    }

    raf.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf.current)
  }, [status])

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
          width: 320, padding: 24, borderRadius: 12,
          background: '#0f2233', color: '#e6f0f6', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>🎣 Fishing</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9db6c6', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        {status === 'loading' && (
          <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.7 }}>Loading…</div>
        )}

        {status === 'playing' && (
          <>
            <div style={{ display: 'flex', gap: 12, height: 280 }}>
              <div
                onMouseDown={() => (holding.current = true)}
                onMouseUp={() => (holding.current = false)}
                onMouseLeave={() => (holding.current = false)}
                style={{
                  position: 'relative', width: 56, height: '100%',
                  background: '#0a2e44', borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                }}
              >
                <div style={{
                  position: 'absolute', left: 0, right: 0,
                  bottom: `${render.bar * 100}%`, height: `${barHeight.current}%`,
                  background: 'rgba(76, 209, 122, 0.35)', borderRadius: 6,
                  border: '2px solid #4cd17a',
                }} />
                <div style={{
                  position: 'absolute', left: '50%', transform: 'translate(-50%, 50%)',
                  bottom: `${render.fish * 100}%`, fontSize: 24, lineHeight: 1,
                }}>🐟</div>
              </div>

              <div style={{ position: 'relative', width: 14, height: '100%', background: '#0a2e44', borderRadius: 7, overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', left: 0, right: 0, bottom: 0,
                  height: `${render.prog * 100}%`,
                  background: 'linear-gradient(to top, #f4c430, #4cd17a)',
                }} />
              </div>
            </div>
            <p style={{ marginTop: 14, fontSize: 13, opacity: 0.75, textAlign: 'center' }}>
              Hold <b>Space</b> (or the mouse) to keep the fish in the green zone
            </p>
          </>
        )}

        {status === 'caught' && (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div style={{ fontSize: 48 }}>🐟</div>
            <p style={{ fontSize: 18, margin: '12px 0 0' }}>Caught a {fish?.name}!</p>
          </div>
        )}
        {status === 'lost' && (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div style={{ fontSize: 48, opacity: 0.4 }}>🎣</div>
            <p style={{ fontSize: 18, margin: '12px 0 0' }}>Got away…</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default FishingOverlay