import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { PICNIC_TABLE_POSITION, ticTacToeColors } from './utils/picnicTable'

type Vector = [number, number, number]

function Box({ position, size, color, angle = 0 }: {
  position: Vector
  size: Vector
  color: string
  angle?: number
}) {
  return (
    <mesh position={position} rotation={[angle, 0, 0]}>
      <boxGeometry args={size} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

const plankColors = ['#b87343', '#cf8951', '#c17c48', '#d19259']
const darkWood = '#805038'
const tableTop = 1.08
const cellSize = 0.285

function TicTacToeBoard() {
  return (
    <group position={[0, tableTop, 0]}>
      <Box position={[0, 0.045, 0]} size={[1.02, 0.09, 1.02]} color={ticTacToeColors.frame} />
      {[-1, 0, 1].flatMap((row) => [-1, 0, 1].map((column) => (
        <Box
          key={`${row},${column}`}
          position={[column * cellSize, 0.092, row * cellSize]}
          size={[0.264, 0.014, 0.264]}
          color={(row + column) % 2 === 0 ? ticTacToeColors.lightTile : ticTacToeColors.sandTile}
        />
      )))}
      {[-0.29, 0, 0.29].map((z, index) => (
        <group key={z}>
          <group position={[-0.79, 0.04, z]} rotation={[0, index * 0.18, 0]}>
            {[-Math.PI / 4, Math.PI / 4].map((angle) => (
              <group key={angle} rotation={[0, angle, 0]}>
                <Box position={[0, 0, 0]} size={[0.235, 0.08, 0.066]} color={ticTacToeColors.X} />
              </group>
            ))}
          </group>
          <mesh position={[0.79, 0.04, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.082, 0.032, 8, 16]} />
            <meshBasicMaterial color={ticTacToeColors.O} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export default function PicnicTable3D() {
  return (
    <RigidBody type="fixed" colliders={false} position={PICNIC_TABLE_POSITION}>
      <CuboidCollider position={[0, 1.02, 0]} args={[1.39, 0.06, 0.63]} />
      {[-1, 1].map((side) => (
        <CuboidCollider key={side} position={[0, 0.51, side * 0.91]} args={[1.39, 0.06, 0.19]} />
      ))}
      {plankColors.map((color, index) => (
        <Box key={color} position={[0, 1.02, (index - 1.5) * 0.316]} size={[2.78, 0.12, 0.305]} color={color} />
      ))}
      {[-0.95, 0.95].map((x) => (
        <group key={x}>
          <Box position={[x, 0.91, 0]} size={[0.19, 0.12, 1.18]} color={darkWood} />
          <Box position={[x, 0.395, 0]} size={[0.19, 0.13, 2.19]} color={darkWood} />
          {[-1, 1].map((side) => (
            <Box
              key={side}
              position={[x, 0.47, side * 0.57]}
              size={[0.18, 1.08, 0.16]}
              color={darkWood}
              angle={-side * 0.48}
            />
          ))}
        </group>
      ))}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box position={[0, 0.51, side * 0.815]} size={[2.78, 0.12, 0.18]} color={plankColors[0]} />
          <Box position={[0, 0.51, side * 1.005]} size={[2.78, 0.12, 0.18]} color={plankColors[1]} />
        </group>
      ))}
      <TicTacToeBoard />
    </RigidBody>
  )
}
