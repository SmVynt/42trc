import treeSpawns from './spawns/trees.json'
import type { PlayerPosition } from './Player'
import { SLOT_MACHINE_POSITION } from './SlotMachine3D'

const MIN_X = -25
const MAX_X = 60
const MIN_Z = -25
const MAX_Z = 50
const MAP_LEFT = 54
const MAP_TOP = 30
const MAP_WIDTH = 425
const MAP_HEIGHT = 375
const VIEW_WIDTH = 520
const VIEW_HEIGHT = 445

const toMapX = (x: number) => MAP_LEFT + ((x - MIN_X) / (MAX_X - MIN_X)) * MAP_WIDTH
const toMapY = (z: number) => MAP_TOP + ((MAX_Z - z) / (MAX_Z - MIN_Z)) * MAP_HEIGHT

const DebugMap = ({ position, onClose }: { position: PlayerPosition; onClose: () => void }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      zIndex: 20,
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'flex-start',
      padding: 18,
      pointerEvents: 'none',
    }}
  >
    <section
      aria-label="World coordinate debug map"
      style={{
        width: 'min(540px, calc(100vw - 36px))',
        maxHeight: 'calc(100vh - 36px)',
        overflow: 'auto',
        padding: 14,
        borderRadius: 12,
        border: '1px solid rgba(148, 163, 184, 0.45)',
        background: 'rgba(2, 6, 23, 0.94)',
        color: '#e2e8f0',
        boxShadow: '0 16px 48px rgba(0,0,0,.4)',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        pointerEvents: 'auto',
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>World coordinates</div>
          <div style={{ color: '#94a3b8', fontSize: 11 }}>Top-down view · X/Z in world units</div>
        </div>
        <button onClick={onClose} style={{ border: 0, borderRadius: 6, padding: '6px 10px', background: '#334155', color: 'white', cursor: 'pointer' }}>
          Close (M)
        </button>
      </header>

      <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} role="img" aria-label="Coordinate grid showing trees, slot machine, and player" style={{ width: '100%', display: 'block' }}>
        <rect x={MAP_LEFT} y={MAP_TOP} width={MAP_WIDTH} height={MAP_HEIGHT} fill="#0f172a" stroke="#64748b" />
        {Array.from({ length: 9 }, (_, index) => MIN_X + index * 10)
          .filter((x) => x <= MAX_X)
          .map((x) => (
            <g key={`x-${x}`}>
              <line x1={toMapX(x)} y1={MAP_TOP} x2={toMapX(x)} y2={MAP_TOP + MAP_HEIGHT} stroke="#334155" strokeWidth="1" />
              <text x={toMapX(x)} y={MAP_TOP + MAP_HEIGHT + 17} fill="#94a3b8" fontSize="10" textAnchor="middle">{x}</text>
            </g>
          ))}
        {Array.from({ length: 8 }, (_, index) => MIN_Z + index * 10)
          .filter((z) => z <= MAX_Z)
          .map((z) => (
            <g key={`z-${z}`}>
              <line x1={MAP_LEFT} y1={toMapY(z)} x2={MAP_LEFT + MAP_WIDTH} y2={toMapY(z)} stroke="#334155" strokeWidth="1" />
              <text x={MAP_LEFT - 9} y={toMapY(z) + 3} fill="#94a3b8" fontSize="10" textAnchor="end">{z}</text>
            </g>
          ))}
        <text x={MAP_LEFT + MAP_WIDTH / 2} y={VIEW_HEIGHT - 5} fill="#cbd5e1" fontSize="11" textAnchor="middle">X</text>
        <text x="12" y={MAP_TOP + MAP_HEIGHT / 2} fill="#cbd5e1" fontSize="11" textAnchor="middle" transform={`rotate(-90 12 ${MAP_TOP + MAP_HEIGHT / 2})`}>Z</text>

        {treeSpawns.map((tree, index) => {
          const x = tree.p[0]
          const z = -tree.p[1]
          return <circle key={index} cx={toMapX(x)} cy={toMapY(z)} r="3.2" fill="#22c55e" stroke="#052e16" strokeWidth="1" />
        })}
        <rect x={toMapX(SLOT_MACHINE_POSITION[0]) - 5} y={toMapY(SLOT_MACHINE_POSITION[2]) - 5} width="10" height="10" fill="#f59e0b" stroke="#451a03" />
        <circle cx={toMapX(position.x)} cy={toMapY(position.z)} r="6" fill="#38bdf8" stroke="white" strokeWidth="2" />
      </svg>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', color: '#cbd5e1', fontSize: 11, margin: '6px 0 10px' }}>
        <span><i style={{ color: '#22c55e' }}>●</i> Trees ({treeSpawns.length})</span>
        <span><i style={{ color: '#f59e0b' }}>■</i> Slot machine</span>
        <span><i style={{ color: '#38bdf8' }}>●</i> You</span>
      </div>
      <div style={{ borderTop: '1px solid #334155', paddingTop: 9, fontSize: 12, color: '#f8fafc' }}>
        Player: X {position.x.toFixed(2)} · Y {position.y.toFixed(2)} · Z {position.z.toFixed(2)}
      </div>
      <div style={{ color: '#94a3b8', fontSize: 10, marginTop: 5 }}>Grid: 10 units · Click M or Close to hide</div>
    </section>
  </div>
)

export default DebugMap
