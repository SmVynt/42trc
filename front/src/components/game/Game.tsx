import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
// import { EffectComposer, SMAA } from '@react-three/postprocessing'
import { Suspense, useState, useEffect } from 'react'
import Player from './Player'
import { OtherPlayers } from './OtherPlayers'
import { GameConfig } from './utils/gameConfig'
import World from './Environment'
import { useAuth } from '../../hooks/useAuth'
import FishingOverlay from './fishing/FishingOverlay'

const Game = () => {
  const { user } = useAuth()
  const [fishingOpen, setFishingOpen] = useState(false)

  useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.code === 'KeyF') setFishingOpen((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
    <Canvas
      gl={{ antialias: false, alpha: false }}
      shadows={false}
      camera={{ position: [0, 2, 5], fov: GameConfig.CAMERA_FOV }}
    >
      <Suspense fallback={null}>
        {/* <Lighting /> */}
        {/* <Physics debug> */}
        <Physics>
          <Player user={user} />
          <World />
        </Physics>
        <OtherPlayers />

        {/* <EffectComposer>
          <SMAA />
        </EffectComposer> */}
      </Suspense>
    </Canvas>
  
    <button
      onClick={() => setFishingOpen(!fishingOpen)}
      style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 900, padding: '10px 18px', borderRadius: 8, border: 'none',
        background: '#2b7fb8', color: 'white', fontSize: 15, cursor: 'pointer',
      }}
    >
      Fish
    </button>
    
    {fishingOpen && <FishingOverlay onClose={() => setFishingOpen(false)} />}
    </>
  )
}

export default Game
