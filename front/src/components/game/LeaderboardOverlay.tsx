import { useEffect, useState } from 'react'
import { http } from '../../api/http'

interface LeaderboardOverlayProps {
  onClose: () => void
}

type Tab = 'count' | 'biggest'

interface CountRow {
  username: string
  catches: number
}

interface BiggestRow {
  username: string
  fish: string
  weight: number
}

const LeaderboardOverlay = ({ onClose }: LeaderboardOverlayProps) => {
  const [tab, setTab] = useState<Tab>('count')
  const [rows, setRows] = useState<(CountRow | BiggestRow)[]>([])
  const [loading, setLoading] = useState(true)

  // Reload whenever the tab changes
  useEffect(() => {
    let cancelled = false
    setRows([])
    setLoading(true)
    http<{ leaderboard: (CountRow | BiggestRow)[] | null }>(`/api/fishing/leaderboard?type=${tab}`)
      .then((data) => { if (!cancelled) setRows(data.leaderboard ?? []) })
      .catch((e) => console.error('leaderboard failed:', e))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [tab])

  const tabButton = (value: Tab, label: string) => (
    <button
		onClick={() => {
        if (value === tab) return
		setRows([])
		setLoading(true)
		setTab(value)
	}}
      style={{
        flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700,
        background: tab === value ? '#2b7fb8' : '#0a2e44',
        color: tab === value ? 'white' : '#9db6c6',
      }}
    >
      {label}
    </button>
  )

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
          width: 360, padding: 24, borderRadius: 12,
          background: '#0f2233', color: '#e6f0f6', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>🏆 Leaderboard</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9db6c6', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {tabButton('count', 'Most caught')}
          {tabButton('biggest', 'Biggest fish')}
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '30px 0', opacity: 0.7 }}>Loading…</div>}

        {!loading && rows.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px 0', opacity: 0.7 }}>No catches yet.</div>
        )}

        {!loading && rows.map((row, i) => (
          <div
            key={row.username}
            style={{
              display: 'flex', gap: 12, padding: '8px 12px', marginBottom: 6,
              borderRadius: 8, background: '#0a2e44',
            }}
          >
            <span style={{ width: 24, fontWeight: 700 }}>{i + 1}</span>
            <span style={{ flex: 1 }}>{row.username}</span>
            {tab === 'count' ? (
              <span style={{ fontWeight: 700 }}>{(row as CountRow).catches} 🐟</span>
            ) : (
              <span style={{ fontWeight: 700 }}>
                {(row as BiggestRow).fish} · {(row as BiggestRow).weight.toFixed(2)} kg
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default LeaderboardOverlay