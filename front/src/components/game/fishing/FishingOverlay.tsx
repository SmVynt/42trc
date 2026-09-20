import { useEffect, useRef, useState } from 'react'

interface FishingOverlayProps {
  onClose: () => void
}

// Tuning — adjust for difficulty
const BAR_HEIGHT = 20        // height of the green bar (% of track)
const GRAVITY = 0.00012       // how fast the bar falls
const LIFT = 0.0002          // how fast the bar rises while holding
const FISH_SPEED = 0.4       // how quickly the fish moves toward its target
const CATCH_RATE = 0.35      // progress gained per second while in zone
const ESCAPE_RATE = 0.45     // progress lost per second while out of zone

const FishingOverlay = ({ onClose }: FishingOverlayProps) => {
  const [status, setStatus] = useState<'playing' | 'caught' | 'lost'>('playing')

  // Game state lives in refs (changes every frame, no re-render needed)
  const barPos = useRef(0.5)       // bottom of the bar, 0..1 from bottom to top
  const barVel = useRef(0)
  const fishPos = useRef(0.5)      // fish position, 0..1
  const fishTarget = useRef(0.5)
  const progress = useRef(0.4)     // catch progress, 0..1
  const holding = useRef(false)
  const raf = useRef<number>(0)

  // Values used for rendering (updated less often than we compute)
  const [render, setRender] = useState({ bar: 0.5, fish: 0.5, prog: 0.4 })

  // Hold input: space or mouse
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); holding.current = true } }
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') holding.current = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // Game loop
  useEffect(() => {
    let last = performance.now()
    let fishTimer = 0

    const loop = (now: number) => {
      const dt = now - last
      last = now

      // 1. Bar: gravity pulls down, holding pushes up
      barVel.current += holding.current ? LIFT * dt : -GRAVITY * dt
      barVel.current *= 0.92 // friction
      barPos.current += barVel.current
      if (barPos.current < 0) { barPos.current = 0; barVel.current = 0 }
      if (barPos.current > 1 - BAR_HEIGHT / 100) { barPos.current = 1 - BAR_HEIGHT / 100; barVel.current = 0 }

      // 2. Fish: every ~1.2s pick a new random target and swim toward it
      fishTimer -= dt
      if (fishTimer <= 0) { fishTarget.current = Math.random(); fishTimer = 800 + Math.random() * 1200 }
      fishPos.current += (fishTarget.current - fishPos.current) * FISH_SPEED * (dt / 1000)

      // 3. Is the fish inside the bar's zone?
      const barTop = barPos.current + BAR_HEIGHT / 100
      const inZone = fishPos.current >= barPos.current && fishPos.current <= barTop

      // 4. Progress
      progress.current += (inZone ? CATCH_RATE : -ESCAPE_RATE) * (dt / 1000)
      if (progress.current >= 1) { setStatus('caught'); return }
      if (progress.current <= 0) { setStatus('lost'); return }

      setRender({ bar: barPos.current, fish: fishPos.current, prog: progress.current })
      raf.current = requestAnimationFrame(loop)
    }

    raf.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf.current)
  }, [])

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

        {status === 'playing' && (
          <>
            <div style={{ display: 'flex', gap: 12, height: 280 }}>
              {/* Track with the bar and the fish */}
              <div
                onMouseDown={() => (holding.current = true)}
                onMouseUp={() => (holding.current = false)}
                onMouseLeave={() => (holding.current = false)}
                style={{
                  position: 'relative', width: 56, height: '100%',
                  background: '#0a2e44', borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                }}
              >
                {/* green bar */}
                <div style={{
                  position: 'absolute', left: 0, right: 0,
                  bottom: `${render.bar * 100}%`, height: `${BAR_HEIGHT}%`,
                  background: 'rgba(76, 209, 122, 0.35)', borderRadius: 6,
                  border: '2px solid #4cd17a',
                }} />
                {/* fish */}
                <div style={{
                  position: 'absolute', left: '50%', transform: 'translate(-50%, 50%)',
                  bottom: `${render.fish * 100}%`, fontSize: 24, lineHeight: 1,
                }}>🐟</div>
              </div>

              {/* catch progress bar */}
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
            <p style={{ fontSize: 18, margin: '12px 0 0' }}>Caught it!</p>
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