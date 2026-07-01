import { Canvas } from '@react-three/fiber'
import { Center, Float, useGLTF } from '@react-three/drei'
import { Suspense } from 'react'
import { Player } from './Player'


const Game = (): JSX.Element => {
  return (
    <Canvas>
	  <Suspense fallback={null}>
		<Player />
		<World />
		<OtherPlayers />
	  </Suspense>
	</Canvas>
  )
}
	</Canvas>
  )
}

export default Game
