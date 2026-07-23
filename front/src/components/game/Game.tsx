import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import Player from './Player'
import { OtherPlayers } from './OtherPlayers'
import { GameConfig } from './utils/gameConfig'
import { Physics } from '@react-three/rapier'
import World from './Environment'

const Game = () => {
  return (
    <Canvas camera={{ position: [0, 2, 5], fov: GameConfig.CAMERA_FOV }}>
      <Suspense fallback={null}>
        {/* <Lighting /> */}
        {/* <Physics debug> */}
        <Physics>
          <Player />
          <World />
        </Physics>
        <OtherPlayers />
      </Suspense>
    </Canvas>
  )
}

export default Game
