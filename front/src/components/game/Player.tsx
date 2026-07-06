import React, { useEffect, useRef, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAnimations, useGLTF } from '@react-three/drei'
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { RigidBody, CapsuleCollider, useRapier, RapierRigidBody } from '@react-three/rapier'
import { CharacterControls } from './utils/characterControls'
import { attachAccessoriesToBone, cloneAccessories, createRandomPlayerAppearanceSelection, HEAD_BONE_NAME } from './utils/playerAppearance'
import { gameSocket } from '../../services/gameSocket'
import { usePlayers } from '../../context/players.context'
import bodyModelUrl from '../../assets/models/hero/blob_anim.glb?url'
import { GameConfig } from './utils/gameConfig'
import { convertToUnlit } from './utils/unlitMaterial'

interface PlayerModelProps {
  controlsRef: React.MutableRefObject<CharacterControls | null>
}

const PlayerModel = ({ controlsRef }: PlayerModelProps) => {
  const groupRef = useRef<THREE.Group>(null)
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const cosmeticSelection = useMemo(() => createRandomPlayerAppearanceSelection(), [])

  const { scene, animations } = useGLTF(bodyModelUrl)
  const { scene: hatScene } = useGLTF(cosmeticSelection.hatUrl)
  const { scene: glassesScene } = useGLTF(cosmeticSelection.glassesUrl)
  const { scene: faceScene } = useGLTF(cosmeticSelection.faceUrl)
  const { camera } = useThree()
  const { actions } = useAnimations(animations, groupRef)

  // Initialize CharacterControls with the group and rigid body ref
  useEffect(() => {
    if (!groupRef.current) {
      return
    }

    const shouldReinitialize = !controlsRef.current || controlsRef.current.model !== groupRef.current
    if (shouldReinitialize) {
      controlsRef.current = new CharacterControls(groupRef.current, rigidBodyRef, camera, actions)
      console.log('✅ CharacterControls initialized')
    }
  }, [actions, camera, controlsRef])

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.setAnimations(actions)
    }
  }, [actions, controlsRef])

  // Clone the scene for rendering
  const clonedScene = useMemo(() => {
    return skeletonClone(scene)
  }, [scene])

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

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders={false}
      enabledRotations={[false, false, false]}
      position={[0, 0.05, 0]}
      type="dynamic"
      linearDamping={0.5}
      angularDamping={0.5}
      gravityScale={GameConfig.GRAVITY_SCALE}
    >
      <CapsuleCollider args={[0.6, 0.6]} position={[0, 1.2, 0]} />
      <group ref={groupRef}>
        <primitive object={clonedScene} />
      </group>
    </RigidBody>
  )
}

const Player = () => {
  const keysPressed = useRef<Record<string, boolean>>({})
  const lastMovementSendTime = useRef<number>(0)
  const movementUpdateInterval = 50 // ms (20 updates per second)
  const controlsRef = useRef<CharacterControls | null>(null)
  const { world } = useRapier()

  useEffect(() => {
    return () => {
      controlsRef.current = null
    }
  }, [])

  // Send heartbeat every 1 second to prevent being marked as inactive
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      if (controlsRef.current && gameSocket.playerId) {
        const pos = controlsRef.current.getPosition()
        gameSocket.sendMovement(
          { x: pos.x, y: pos.y, z: pos.z },
          { y: controlsRef.current.currentRotationY },
          controlsRef.current.getState()
        )
        console.log('Heartbeat sent')
      }
    }, 1000) // Send every second

    return () => clearInterval(heartbeatInterval)
  }, [])

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code

      // Prevent default for game keys
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'KeyC'].includes(code)) {
        e.preventDefault()
      }

      if (!keysPressed.current[code]) {
        keysPressed.current[code] = true

        // Jump on space key press
        if (code === 'Space' && controlsRef.current) {
          controlsRef.current.jump()
        }

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

  const joinedRef = useRef(false)
  const { addPlayer, updatePlayerPosition, setPlayersInRoom, removePlayer, cleanupInactivePlayers } = usePlayers()

  // Initialize socket connection
  useEffect(() => {
    const initSocket = async () => {
      try {
        await gameSocket.connect()
        // Join room 1 with username (only once, prevent StrictMode double-call)
        if (!joinedRef.current) {
          joinedRef.current = true
          // CHANGE TO INTRA LATER
          gameSocket.joinRoom(1, `player_${gameSocket.playerId?.slice(0, 8)}`)
        }
      } catch (error) {
        console.error('Failed to connect to game server:', error)
      }
    }

    initSocket()

    return () => {
      // Don't disconnect on unmount, keep connection alive
    }
  }, [])

  // Listen for other players
  useEffect(() => {
    // When room players list is received
    gameSocket.on('room:players', (data) => {
      console.log('Room players:', data)
      // Extract players array from message
      const playersArray = Array.isArray(data) ? data : data.players || []
      // Filter out self and add others
      const otherPlayers = playersArray.filter((p: any) => p.id !== gameSocket.playerId)
      setPlayersInRoom(otherPlayers)
    })

    // When a new player joins
    gameSocket.on('player:joined', (data) => {
      console.log('Player joined:', data.playerId, data.username)
      if (data.playerId !== gameSocket.playerId) {
        addPlayer({
          id: data.playerId,
          username: data.username,
          position: { x: 0, y: 0, z: 0 },
          rotation: { y: 0 },
          state: 'idle',
          lastUpdateTime: Date.now()
        })
      }
    })

    // When a player moves
    gameSocket.on('player:moved', (data) => {
      if (data.playerId !== gameSocket.playerId) {
        // console.log('Player moved:', data.playerId, data.position, data.rotation, data.state)
        updatePlayerPosition(data.playerId, data.position, data.rotation, data.state)
      }
    })

    // When a player leaves
    gameSocket.on('player:left', (data) => {
      console.log('Player left:', data.playerId)
      removePlayer(data.playerId)
    })
  }, [])

  // Cleanup inactive players every second (timeout: 3 seconds)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      cleanupInactivePlayers(3000)
    }, 1000)

    return () => clearInterval(cleanupInterval)
  }, [cleanupInactivePlayers])

  // Game loop - send updates to server
  useFrame((state, delta) => {
    if (controlsRef.current) {
      controlsRef.current.update(delta, keysPressed.current, world)

      // Send movement/heartbeat 20 times per second (every 50ms) or whenever position changes
      // This also serves as heartbeat to prevent players from being removed as inactive
      const now = Date.now()
      if (now - lastMovementSendTime.current >= movementUpdateInterval) {
        lastMovementSendTime.current = now

        const pos = controlsRef.current.getPosition()
        gameSocket.sendMovement(
          { x: pos.x, y: pos.y, z: pos.z },
          { y: controlsRef.current.currentRotationY },
          controlsRef.current.getState()
        )
      }
    }
  })

  // Late game loop - camera updates (priority -1 runs after physics simulation step)
  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.updateCamera()
    }
  }, -1)

  return <PlayerModel controlsRef={controlsRef} />
}

export default Player
