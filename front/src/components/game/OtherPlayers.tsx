import React, { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { usePlayers } from '../../context/players.context'

export function OtherPlayers() {
  const { otherPlayers } = usePlayers()
  const groupRef = useRef<THREE.Group>(null)

  return (
    <group ref={groupRef}>
      {Array.from(otherPlayers.values()).map((player) => (
        <OtherPlayerModel key={player.id} player={player} />
      ))}
    </group>
  )
}

function OtherPlayerModel({ player }: { player: any }) {
  const meshRef = useRef<THREE.Group>(null)
  const modelRef = useRef<THREE.Group>(null)
  
  // Current position for interpolation
  const currentPos = useRef<THREE.Vector3>(new THREE.Vector3(player.position.x, player.position.y, player.position.z))
  const targetPos = useRef<THREE.Vector3>(new THREE.Vector3(player.position.x, player.position.y, player.position.z))
  
  // Current rotation for interpolation
  const currentRotation = useRef<THREE.Quaternion>(new THREE.Quaternion())
  const targetRotation = useRef<THREE.Quaternion>(new THREE.Quaternion())
  const rotateAngle = useRef<THREE.Vector3>(new THREE.Vector3(0, 1, 0))
  
  // Interpolation speed
  const lerpSpeed = 0.1 // 0-1, higher = faster interpolation

  // Load player model
  const { scene } = useGLTF('/assets/models/hero/_body.glb')
  const clonedScene = useMemo(() => scene.clone(), [scene])

  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.add(clonedScene)
    }
    return () => {
      if (modelRef.current) {
        modelRef.current.clear()
      }
    }
  }, [clonedScene])

  // Update target position/rotation when player data changes
  useEffect(() => {
    targetPos.current.set(player.position.x, player.position.y, player.position.z)
    
    // Set target rotation from Y angle
    const targetQuaternion = new THREE.Quaternion()
    targetQuaternion.setFromAxisAngle(rotateAngle.current, player.rotation.y)
    targetRotation.current.copy(targetQuaternion)
  }, [player.position, player.rotation])

  // Smooth interpolation each frame
  useFrame(() => {
    if (meshRef.current) {
      // Lerp position
      currentPos.current.lerp(targetPos.current, lerpSpeed)
      meshRef.current.position.copy(currentPos.current)

      // Slerp rotation
      currentRotation.current.slerp(targetRotation.current, lerpSpeed)
      meshRef.current.quaternion.copy(currentRotation.current)
    }
  })

  return (
    <group ref={meshRef} position={[player.position.x, player.position.y, player.position.z]}>
      <group ref={modelRef} />
      {/* Username label - below player, always facing camera */}
      <Billboard position={[0, -0.5, 0]} scale={0.5}>
        <mesh>
          <planeGeometry args={[1.5, 0.4]} />
          <meshBasicMaterial map={createTextTexture(player.username)} transparent />
        </mesh>
      </Billboard>
    </group>
  )
}

function createTextTexture(text: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const context = canvas.getContext('2d')!

  // Transparent background
  context.clearRect(0, 0, canvas.width, canvas.height)

  // White text with black outline
  context.strokeStyle = '#000000'
  context.lineWidth = 6
  context.font = 'Bold 80px Arial'
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  // Draw outline
  context.strokeText(text, canvas.width / 2, canvas.height / 2)

  // Draw white text
  context.fillStyle = '#ffffff'
  context.fillText(text, canvas.width / 2, canvas.height / 2)

  const texture = new THREE.CanvasTexture(canvas)
  return texture
}
