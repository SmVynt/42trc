import { CuboidCollider, RigidBody } from '@react-three/rapier'

export const SLOT_MACHINE_POSITION: [number, number, number] = [30, 0.5, 35]
export const SLOT_MACHINE_INTERACTION_RADIUS = 3

const SlotMachine3D = () => (
  <RigidBody type="fixed" colliders={false} position={SLOT_MACHINE_POSITION} rotation={[0, Math.PI / 2, 0]}>
    <CuboidCollider args={[0.55, 0.95, 0.45]} position={[0, 0.95, 0]} />
    <group>
      {/* Cabinet */}
      <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.05, 1.8, 0.78]} />
        <meshBasicMaterial color="#b45309" />
      </mesh>
      {/* Gold trim and top sign */}
      <mesh position={[0, 2.02, 0]}>
        <boxGeometry args={[1.18, 0.22, 0.88]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[0, 1.45, 0.405]}>
        <boxGeometry args={[0.82, 0.62, 0.045]} />
        <meshBasicMaterial color="#07111d" />
      </mesh>
      {/* Reels */}
      {[-0.25, 0, 0.25].map((x, index) => (
        <mesh key={x} position={[x, 1.46, 0.44]}>
          <circleGeometry args={[0.105, 20]} />
          <meshBasicMaterial color={['#34d399', '#fbbf24', '#f472b6'][index]} />
        </mesh>
      ))}
      <mesh position={[0, 0.82, 0.41]}>
        <boxGeometry args={[0.4, 0.12, 0.08]} />
        <meshBasicMaterial color="#fde68a" />
      </mesh>
      <mesh position={[0.37, 1.55, 0.25]} rotation={[0, 0, -0.18]}>
        <cylinderGeometry args={[0.055, 0.055, 0.52, 12]} />
        <meshBasicMaterial color="#e2e8f0" />
      </mesh>
      <mesh position={[0.42, 1.81, 0.25]}>
        <sphereGeometry args={[0.11, 16, 12]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
  </RigidBody>
)

export default SlotMachine3D
