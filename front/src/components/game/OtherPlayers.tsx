import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { usePlayers } from '../../context/players.context'
import {
  HEAD_BONE_NAME,
  attachAccessoriesToBone,
  cloneAccessories,
  getPlayerAppearanceFromIDs,
} from './utils/playerAppearance'
import bodyModelUrl from '../../assets/models/hero/blob_anim.glb?url'
import { convertToUnlit } from './utils/unlitMaterial'

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
  const [clothing, setClothing] = useState<{ hat?: string; glasses?: string; face?: string }>({})
  const API_BASE = import.meta.env.VITE_API_URL ?? ''

  useEffect(() => {
    let active = true
    const fetchClothing = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/${player.username}/clothing`)
        if (res.ok) {
          const data = await res.json()
          if (active) {
            setClothing({
              hat: data.equippedHat,
              glasses: data.equippedGlasses,
              face: data.equippedFace,
            })
          }
        }
      } catch (err) {
        // ignore errors for guest/unseeded usernames
      }
    }
    fetchClothing()
    return () => {
      active = false
    }
  }, [player.username, API_BASE])

  const cosmeticSelection = useMemo(() => {
    return getPlayerAppearanceFromIDs(clothing.hat, clothing.glasses, clothing.face)
  }, [clothing])

  // Start position (where we were)
  const startPos = useRef<THREE.Vector3>(new THREE.Vector3(player.position.x, player.position.y, player.position.z))
  // Target position (where we're going)
  const targetPos = useRef<THREE.Vector3>(new THREE.Vector3(player.position.x, player.position.y, player.position.z))

  // Rotation
  const startRotation = useRef<THREE.Quaternion>(new THREE.Quaternion())
  const targetRotation = useRef<THREE.Quaternion>(new THREE.Quaternion())
  const rotateAngle = useRef<THREE.Vector3>(new THREE.Vector3(0, 1, 0))

  // Time-based interpolation
  const lastUpdateTime = useRef<number>(Date.now())
  const interpolationDuration = useRef<number>(50) // ms - matches send interval (20 updates/sec)
  const startTime = useRef<number>(Date.now())

  // Load player model
  const { scene, animations } = useGLTF(bodyModelUrl)
  const { scene: hatScene } = useGLTF(cosmeticSelection.hatUrl)
  const { scene: glassesScene } = useGLTF(cosmeticSelection.glassesUrl)
  const { scene: faceScene } = useGLTF(cosmeticSelection.faceUrl)
  const { actions } = useAnimations(animations, meshRef)

  const clonedScene = useMemo(() => skeletonClone(scene), [scene])
  const accessories = useMemo(
    () =>
      cloneAccessories([
        { kind: 'hat', scene: hatScene },
        { kind: 'glasses', scene: glassesScene },
        { kind: 'face', scene: faceScene },
      ]),
    [faceScene, glassesScene, hatScene]
  )

  useEffect(() => {
    if (!clonedScene) {
      return
    }

    const detach = attachAccessoriesToBone(clonedScene, HEAD_BONE_NAME, accessories)
    convertToUnlit(clonedScene)
    return detach
  }, [accessories, clonedScene])

  useEffect(() => {
    const action = actions?.[player.state] ?? actions?.idle

    if (!action) {
      return
    }

	// console.log(player.state, action)

    const shouldLoopOnce = player.state === 'jump'

    action.reset()
    action.enabled = true
    action.clampWhenFinished = shouldLoopOnce
    action.setLoop(shouldLoopOnce ? THREE.LoopOnce : THREE.LoopRepeat, shouldLoopOnce ? 1 : Infinity)
    action.fadeIn(0.15).play()

    return () => {
      action.fadeOut(0.15)
    }
  }, [actions, player.state])

  // Update target position/rotation when player data changes
  useEffect(() => {
    // Remember where we were coming from
    startPos.current.copy(targetPos.current)
    startRotation.current.copy(targetRotation.current)

    // Set new target
    targetPos.current.set(player.position.x, player.position.y, player.position.z)

    // Set target rotation from Y angle
    const targetQuaternion = new THREE.Quaternion()
    targetQuaternion.setFromAxisAngle(rotateAngle.current, player.rotation.y)
    targetRotation.current.copy(targetQuaternion)

    // Reset interpolation timer (fixed 50ms - matches network update interval)
    lastUpdateTime.current = Date.now()
    startTime.current = Date.now()
  }, [player.position, player.rotation])

  // Smooth time-based interpolation each frame
  useFrame(() => {
    if (meshRef.current) {
      const now = Date.now()
      const elapsed = now - startTime.current

      // Calculate progress 0-1
      let t = Math.min(1, elapsed / interpolationDuration.current)

      // Lerp position
      const interpolatedPos = new THREE.Vector3()
      interpolatedPos.lerpVectors(startPos.current, targetPos.current, t)
      meshRef.current.position.copy(interpolatedPos)

      // Slerp rotation
      const interpolatedRotation = startRotation.current.clone()
      interpolatedRotation.slerp(targetRotation.current, t)
      meshRef.current.quaternion.copy(interpolatedRotation)
    }
  })

  return (
    <group ref={meshRef} position={[player.position.x, player.position.y, player.position.z]}>
      <primitive object={clonedScene} />
      {/* Username label - below player, always facing camera */}
      <Billboard position={[0, 2.5, 0]} scale={0.5}>
        <mesh>
          <planeGeometry args={[1.5, 0.4]} />
          <meshBasicMaterial map={createTextTexture(player.username)} transparent depthWrite={false} />
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
