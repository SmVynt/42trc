import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import Player from './Player'
import { OtherPlayers } from './OtherPlayers'
import { GameConfig } from './utils/gameConfig'
import { Physics, RigidBody } from '@react-three/rapier'
import { type } from 'os'

// const Lighting = () => {
//   return (
//     <>
//       <ambientLight intensity={0.6} />
//       <directionalLight position={[10, 15, 10]} intensity={1} castShadow />
//     </>
//   )
// }

const World = () => {
  return (
    <>

      {/* Ground */}
      <RigidBody type="fixed" colliders="hull"> // trimesh is better
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[100, 100, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color="#2d5016" />
        </mesh>
      </RigidBody>

      {/* Some obstacles for testing */}
      <RigidBody type="fixed">
        <mesh position={[5, 1, 5]} scale={[2, 2, 2]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="red" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed">
        <mesh position={[-8, 1, 3]} scale={[3, 2, 1]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="gray" />
        </mesh>
      </RigidBody>
    </>
  )
}

const Game = (): JSX.Element => {
  return (
    <Canvas camera={{ position: [0, 2, 5], fov: GameConfig.CAMERA_FOV }}>
      <Suspense fallback={null}>
        {/* <Lighting /> */}
        <Physics debug>
          <Player />
          <World />
        </Physics>
        <OtherPlayers />
      </Suspense>
    </Canvas>
  )
}

export default Game
