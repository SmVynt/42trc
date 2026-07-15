import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
// import { EffectComposer, SMAA } from '@react-three/postprocessing'
import { Suspense } from 'react'
import Player from './Player'
import { OtherPlayers } from './OtherPlayers'
import { GameConfig } from './utils/gameConfig'
import World from './Environment'
import { useAuth } from '../../hooks/useAuth'


const Game = () => {
  const { user } = useAuth()

  return (
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
  )
}

export default Game
