import { useThree, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { CharacterControls } from '../../utils/characterControls'

interface PlayerModelProps {
  controlsRef: React.MutableRefObject<CharacterControls | null>
}

const PlayerModel = ({ controlsRef }: PlayerModelProps) => {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF('/assets/models/hero/_body.glb')
  const { camera } = useThree()

  // Initialize CharacterControls with the group
  useEffect(() => {
    if (groupRef.current && !controlsRef.current) {
      controlsRef.current = new CharacterControls(groupRef.current, camera)
      console.log('✅ CharacterControls initialized')
    }
  }, [camera, controlsRef])

  // Clone the scene for rendering
  const clonedScene = useMemo(() => {
    return scene.clone(true)
  }, [scene])

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={clonedScene} />
    </group>
  )
}

const Player = () => {
  const keysPressed = useRef<Record<string, boolean>>({})
  const controlsRef = useRef<CharacterControls | null>(null)

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code
      
      // Prevent default for game keys
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft'].includes(code)) {
        e.preventDefault()
      }
      
      if (!keysPressed.current[code]) {
        keysPressed.current[code] = true
        console.log('🔴 Key DOWN:', code)
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code
      if (keysPressed.current[code]) {
        keysPressed.current[code] = false
        console.log('🟢 Key UP:', code)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Game loop
  useFrame((state, delta) => {
    if (controlsRef.current) {
      controlsRef.current.update(delta, keysPressed.current)
    }
  })

  return <PlayerModel controlsRef={controlsRef} />
}

export default Player
