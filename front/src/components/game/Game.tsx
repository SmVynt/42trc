import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import Player from './Player'

const World = () => {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 10]} intensity={1} castShadow />

      {/* Ground */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[100, 100, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial color="#2d5016" />
      </mesh>

      {/* Some obstacles for testing */}
      <mesh position={[5, 1, 5]} scale={[2, 2, 2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" />
      </mesh>
      <mesh position={[-8, 1, 3]} scale={[3, 2, 1]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="gray" />
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
