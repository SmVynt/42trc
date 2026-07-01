import { useThree, useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { CharacterControls } from '../../utils/characterControls'

interface PlayerModelProps {
  controlsRef: React.MutableRefObject<CharacterControls | null>
}

const PlayerModel = ({ controlsRef }: PlayerModelProps) => {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF('/assets/models/hero/_body.glb')
  const clonedSceneRef = useRef<THREE.Group | null>(null)
  const { camera } = useThree()

  // Initialize model and CharacterControls
  useEffect(() => {
    console.log('PlayerModel useEffect - scene loaded:', scene, 'type:', scene.constructor.name)
    
    if (groupRef.current) {
      // Clone scene once
      if (!clonedSceneRef.current) {
        const cloned = scene.clone(true) as THREE.Group
        console.log('Adding cloned model to group, cloned:', cloned)
        groupRef.current.add(cloned)
        clonedSceneRef.current = cloned
      }

      // Initialize controls
      if (!controlsRef.current) {
        console.log('Initializing CharacterControls with groupRef:', groupRef.current)
        controlsRef.current = new CharacterControls(groupRef.current, camera)
      }
    }
  }, [scene, camera, controlsRef])

  return <group ref={groupRef} position={[0, 0, 0]} />
}

const Player = () => {
  const keysPressed = useRef<Record<string, boolean>>({})
  const controlsRef = useRef<CharacterControls | null>(null)

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false
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
      console.log('Frame update - position:', controlsRef.current.getPosition())
    }
  })

  return <PlayerModel controlsRef={controlsRef} />
}

export default Player
