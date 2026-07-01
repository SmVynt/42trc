import { useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const Player = () => {
  const { camera } = useThree()
  const meshRef = useRef<THREE.Mesh>(null)
  const velocityRef = useRef({ x: 0, y: 0, z: 0 })
  const positionRef = useRef({ x: 0, y: 2, z: 0 })
  const keysPressed = useRef<Record<string, boolean>>({})

  // Camera offset from player
  const cameraOffset = new THREE.Vector3(0, 1.6, 0)
  const gravity = -9.8
  const moveSpeed = 0.15
  const jumpPower = 0.5
  const isGrounded = positionRef.current.y <= 2.01

  useEffect(() => {
    // Keyboard input
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
  useEffect(() => {
    const interval = setInterval(() => {
      // Movement
      if (keysPressed.current['w']) positionRef.current.z -= moveSpeed
      if (keysPressed.current['s']) positionRef.current.z += moveSpeed
      if (keysPressed.current['a']) positionRef.current.x -= moveSpeed
      if (keysPressed.current['d']) positionRef.current.x += moveSpeed

      // Jump
      if (keysPressed.current[' '] && isGrounded) {
        velocityRef.current.y = jumpPower
      }

      // Gravity
      velocityRef.current.y += gravity * 0.016

      // Apply velocity
      positionRef.current.y += velocityRef.current.y * 0.016

      // Ground collision
      if (positionRef.current.y <= 2) {
        positionRef.current.y = 2
        velocityRef.current.y = 0
      }

      // Update mesh
      if (meshRef.current) {
        meshRef.current.position.copy(positionRef.current)
      }

      // Update camera
      const cameraPos = {
        x: positionRef.current.x + cameraOffset.x,
        y: positionRef.current.y + cameraOffset.y,
        z: positionRef.current.z + cameraOffset.z,
      }
      camera.position.lerp(new THREE.Vector3(cameraPos.x, cameraPos.y, cameraPos.z), 0.1)
      camera.lookAt(positionRef.current.x, positionRef.current.y, positionRef.current.z)
    }, 16)

    return () => clearInterval(interval)
  }, [camera])

  return (
    <mesh ref={meshRef} position={[0, 2, 0]}>
      <capsuleGeometry args={[0.4, 1.6, 4, 8]} />
      <meshStandardMaterial color="blue" />
    </mesh>
  )
}

export default Player
