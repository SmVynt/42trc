import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import Player from './Player'

const World = () => {
  return (
    <>
      {/* Environment and world objects */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      <mesh position={[0, -1, 0]} scale={[100, 1, 100]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="green" />
      </mesh>
    </>
  )
}

const OtherPlayers = () => {
  return (
    <>
      {/* Remote players will be rendered here */}
    </>
  )
}

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

export default Game
