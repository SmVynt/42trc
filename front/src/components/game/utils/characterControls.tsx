import React from 'react'
import * as THREE from 'three'
import * as RAPIER from '@dimforge/rapier3d-compat'
import type { RapierRigidBody } from '@react-three/rapier'
import { GameConfig } from './gameConfig'
import type { GamePlayerState } from './gameCodec'

const W = 'KeyW'
const A = 'KeyA'
const S = 'KeyS'
const D = 'KeyD'
const C = 'KeyC'
const SHIFT = 'ShiftLeft'
const DIRECTIONS = [W, A, S, D]

export class CharacterControls {
  model: THREE.Mesh | THREE.Group
  rigidBodyRef: React.RefObject<RapierRigidBody | null>
  camera: THREE.Camera
  animations: Record<string, THREE.AnimationAction | null> = {}
  private currentAction: THREE.AnimationAction | null = null
  private currentState: GamePlayerState = 'idle'

  // Movement
  walkDirection = new THREE.Vector3()
  rotateAngle = new THREE.Vector3(0, 1, 0)
  rotateQuaternion: THREE.Quaternion = new THREE.Quaternion()
  currentRotationY: number = 0 // Track Y-axis rotation angle

  // State
  walkVelocity = GameConfig.WALK_VELOCITY
  runVelocity = GameConfig.RUN_VELOCITY

  isSitting: boolean = false

  // Jumping & Physics
  isOnGround = true
  // gravity = GameConfig.GRAVITY
  // jumpHeight = GameConfig.JUMP_HEIGHT
  jumpVelocity = GameConfig.JUMP_VELOCITY

  // Fixed isometric camera
  cameraDistance = GameConfig.CAMERA_DISTANCE
  cameraHeight = GameConfig.CAMERA_HEIGHT
  cameraAngle = GameConfig.CAMERA_ANGLE

  constructor(
    model: THREE.Mesh | THREE.Group,
    rigidBodyRef: React.RefObject<RapierRigidBody | null>,
    camera: THREE.Camera,
    animations?: Record<string, THREE.AnimationAction | null>
  ) {
    this.model = model
    this.rigidBodyRef = rigidBodyRef
    this.camera = camera
    if (animations) {
      this.animations = animations
    }
    // this.jumpVelocity = Math.sqrt(2 * RAPIER.gravity.y * this.jumpHeight)
    this.updateCameraPosition()
    this.playAction(this.findAction(['idle']), THREE.LoopRepeat, false)
    this.playStateAnimation('idle')
  }

  public setAnimations(animations: Record<string, THREE.AnimationAction | null>) {
    this.animations = animations
    this.currentAction = null
    this.playStateAnimation(this.currentState)
  }

  public getState(): GamePlayerState {
    return this.currentState
  }

  public jump() {
    const rb = this.rigidBodyRef.current
    if (rb && this.isOnGround) {
      const currentLinvel = rb.linvel()
      rb.setLinvel({ x: currentLinvel.x, y: this.jumpVelocity, z: currentLinvel.z }, true)
      this.isOnGround = false
      this.playStateAnimation('jump')
      this.isSitting = false
    }
  }

  private findAction(candidates: string[]) {
    const directKeys = candidates
      .map((candidate) => candidate.toLowerCase())
      .filter((candidate, index, array) => array.indexOf(candidate) === index)

    const entries = Object.entries(this.animations).filter(([, action]) => action !== null) as Array<[string, THREE.AnimationAction]>
    if (entries.length === 0) {
      return null
    }

    for (const candidate of directKeys) {
      const direct = this.animations[candidate]
      if (direct) {
        return direct
      }
    }

    const normalizedCandidates = directKeys

    const byKey = entries.find(([key]) => normalizedCandidates.some((candidate) => key.toLowerCase().includes(candidate)))
    if (byKey) {
      return byKey[1]
    }

    const byClipName = entries.find(([, action]) => {
      const clipName = action.getClip().name.toLowerCase()
      return normalizedCandidates.some((candidate) => clipName.includes(candidate))
    })

    return byClipName?.[1] ?? entries[0][1]
  }

  private playAction(action: THREE.AnimationAction | null, loop: THREE.AnimationActionLoopStyles = THREE.LoopRepeat, clampWhenFinished = false) {
    if (!action || this.currentAction === action) {
      return
    }

    if (this.currentAction) {
      this.currentAction.fadeOut(0.15)
    }

    action.reset()
    action.enabled = true
    action.clampWhenFinished = clampWhenFinished
    action.setLoop(loop, loop === THREE.LoopOnce ? 1 : Infinity)
    action.fadeIn(0.15).play()
    this.currentAction = action
  }

  private playStateAnimation(state: GamePlayerState) {
    const nextState = state
    let nextAction: THREE.AnimationAction | null = null
    let loop: THREE.AnimationActionLoopStyles = THREE.LoopRepeat
    let clampWhenFinished = false

    switch (nextState) {
      case 'jump':
        nextAction = this.findAction(['jump'])
        loop = THREE.LoopOnce
        clampWhenFinished = true
        break
      case 'run':
        nextAction = this.findAction(['run'])
        break
      case 'walk':
        nextAction = this.findAction(['walk'])
        break
      case 'sit':
        nextAction = this.findAction(['sit'])
        break
      case 'idle':
      default:
        nextAction = this.findAction(['idle'])
        break
    }

    this.currentState = nextState
    this.playAction(nextAction, loop, clampWhenFinished)
  }

  private updateCameraPosition() {
    const rb = this.rigidBodyRef.current
    if (!rb) return

    let posX = 0
    let posY = 0
    let posZ = 0

    if (this.model.parent) {
      const worldPos = new THREE.Vector3()
      this.model.parent.getWorldPosition(worldPos)
      posX = worldPos.x
      posY = worldPos.y
      posZ = worldPos.z
    } else {
      const pos = rb.translation()
      posX = pos.x
      posY = pos.y
      posZ = pos.z
    }

    const cameraX = posX - Math.sin(this.cameraAngle) * this.cameraDistance
    const cameraY = posY + this.cameraHeight
    const cameraZ = posZ - Math.cos(this.cameraAngle) * this.cameraDistance

    this.camera.position.set(cameraX, cameraY, cameraZ)
    this.camera.lookAt(posX, posY + 0.8, posZ)
    this.camera.up.set(0, 1, 0)
  }

  public update(delta: number, keysPressed: Record<string, boolean>, world?: any) {
    const rb = this.rigidBodyRef.current
    if (!rb) return

    // Ground check via downward raycast
    if (world) {
      const translation = rb.translation()
      // Bottom of capsule is at translation.y, cast from Y + 0.1 downwards
      const rayOrigin = { x: translation.x, y: translation.y + 0.1, z: translation.z }
      const rayDirection = { x: 0, y: -1, z: 0 }
      const ray = new RAPIER.Ray(rayOrigin, rayDirection)

      const hit = world.castRay(
        ray,
        0.15, // maxToi (distance)
        true, // solid
        undefined,
        undefined,
        undefined,
        rb as any // filter rigid body (ignore self)
      )
      this.isOnGround = hit !== null
    }

    const directionPressed = DIRECTIONS.some((key) => keysPressed[key] == true)

    this.walkDirection.set(0, 0, 0)

    if (keysPressed[W]) {
      this.walkDirection.x += Math.sin(this.cameraAngle)
      this.walkDirection.z += Math.cos(this.cameraAngle)
    }
    if (keysPressed[S]) {
      this.walkDirection.x -= Math.sin(this.cameraAngle)
      this.walkDirection.z -= Math.cos(this.cameraAngle)
    }
    if (keysPressed[D]) {
      this.walkDirection.x -= Math.cos(this.cameraAngle)
      this.walkDirection.z += Math.sin(this.cameraAngle)
    }
    if (keysPressed[A]) {
      this.walkDirection.x += Math.cos(this.cameraAngle)
      this.walkDirection.z -= Math.sin(this.cameraAngle)
    }

    let velocity = 0
    if (this.walkDirection.length() > 0) {
      this.walkDirection.normalize()

      const angle = Math.atan2(this.walkDirection.x, this.walkDirection.z)
      this.rotateQuaternion.setFromAxisAngle(this.rotateAngle, angle)
      this.model.quaternion.rotateTowards(this.rotateQuaternion, 0.15)

      // Save current rotation AFTER rotateTowards
      const euler = new THREE.Euler().setFromQuaternion(this.model.quaternion, 'YXZ')
      this.currentRotationY = euler.y

      velocity = directionPressed ? (keysPressed[SHIFT] ? this.runVelocity : this.walkVelocity) : 0
      this.isSitting = false
    }

    // Set velocity on RigidBody, retaining existing vertical velocity
    const currentLinvel = rb.linvel()
    const targetVx = this.walkDirection.x * velocity
    const targetVz = this.walkDirection.z * velocity
    rb.setLinvel({ x: targetVx, y: currentLinvel.y, z: targetVz }, true)

    if (keysPressed[C]) {
      if (this.isOnGround && !directionPressed) {
        this.isSitting = true
      }
    }

    if (!this.isOnGround) {
      this.playStateAnimation('jump')
    } else if (this.walkDirection.length() > 0) {
      this.playStateAnimation(keysPressed[SHIFT] ? 'run' : 'walk')
    } else if (this.isSitting) {
      this.playStateAnimation('sit')
    } else {
      this.playStateAnimation('idle')
    }
  }

  public updateCamera() {
    this.updateCameraPosition()
  }

  public getPosition(): THREE.Vector3 {
    if (this.model.parent) {
      const worldPos = new THREE.Vector3()
      this.model.parent.getWorldPosition(worldPos)
      return worldPos
    }
    if (this.rigidBodyRef.current) {
      const translation = this.rigidBodyRef.current.translation()
      return new THREE.Vector3(translation.x, translation.y, translation.z)
    }
    return new THREE.Vector3()
  }
}

