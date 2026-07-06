import React from 'react'
import * as THREE from 'three'
import type { RapierRigidBody, RapierCollider } from '@react-three/rapier'
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
  colliderRef: React.RefObject<RapierCollider | null>
  controller: any // KinematicCharacterController
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

  // Jumping & Physics (manual gravity for kinematic body)
  verticalVelocity = 0
  isOnGround = true
  gravity = GameConfig.GRAVITY
  jumpVelocity = GameConfig.JUMP_VELOCITY
  private controllerConfigured = false
  private coyoteTimer = 0 // time (seconds) remaining for ground grace period
  private readonly COYOTE_DURATION = 0.15 // 150ms grace period after losing contact

  // Fixed isometric camera
  cameraDistance = GameConfig.CAMERA_DISTANCE
  cameraHeight = GameConfig.CAMERA_HEIGHT
  cameraAngle = GameConfig.CAMERA_ANGLE

  constructor(
    model: THREE.Mesh | THREE.Group,
    rigidBodyRef: React.RefObject<RapierRigidBody | null>,
    colliderRef: React.RefObject<RapierCollider | null>,
    camera: THREE.Camera,
    animations?: Record<string, THREE.AnimationAction | null>
  ) {
    this.model = model
    this.rigidBodyRef = rigidBodyRef
    this.colliderRef = colliderRef
    this.camera = camera
    if (animations) {
      this.animations = animations
    }

    this.updateCameraPosition()
    this.playAction(this.findAction(['idle']), THREE.LoopRepeat, false)
    this.playStateAnimation('idle')
  }

  public setController(controller: any) {
    this.controller = controller
    this.controllerConfigured = false
  }

  private ensureControllerConfigured() {
    if (this.controllerConfigured || !this.controller) return
    try {
      this.controller.setSlideEnabled(true)
      this.controller.setMaxSlopeClimbAngle(GameConfig.MAX_SLOPE_CLIMB_ANGLE)
      this.controller.setMinSlopeSlideAngle(GameConfig.MIN_SLOPE_SLIDE_ANGLE)
      this.controller.setApplyImpulsesToDynamicBodies(true)
      this.controllerConfigured = true
    } catch (e) {
      // Controller not ready yet, will retry next frame
    }
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
    if (this.isOnGround) {
      this.verticalVelocity = this.jumpVelocity
      this.isOnGround = false
      this.coyoteTimer = 0 // Immediately enter airborne state
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

  public update(delta: number, keysPressed: Record<string, boolean>) {
    const rb = this.rigidBodyRef.current
    const collider = this.colliderRef.current
    if (!rb || !collider || !this.controller) return

    // Lazy-configure the controller (WASM may not be ready at construction time)
    this.ensureControllerConfigured()
    if (!this.controllerConfigured) return

    // --- Ground check with coyote time (prevents flickering on slopes) ---
    const rawGrounded = this.controller.computedGrounded()
    if (rawGrounded) {
      this.coyoteTimer = this.COYOTE_DURATION
      this.isOnGround = true
    } else {
      this.coyoteTimer -= delta
      this.isOnGround = this.coyoteTimer > 0
    }

    // --- Apply gravity ---
    if (this.isOnGround && this.verticalVelocity <= 0) {
      // Strong snap-down to keep capsule pressed against slopes
      this.verticalVelocity = -3
    } else {
      this.verticalVelocity -= this.gravity * delta
    }

    // --- Compute horizontal movement from input ---
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

    let speed = 0
    if (this.walkDirection.length() > 0) {
      this.walkDirection.normalize()

      const angle = Math.atan2(this.walkDirection.x, this.walkDirection.z)
      this.rotateQuaternion.setFromAxisAngle(this.rotateAngle, angle)
      this.model.quaternion.rotateTowards(this.rotateQuaternion, 0.15)

      // Save current rotation AFTER rotateTowards
      const euler = new THREE.Euler().setFromQuaternion(this.model.quaternion, 'YXZ')
      this.currentRotationY = euler.y

      speed = directionPressed ? (keysPressed[SHIFT] ? this.runVelocity : this.walkVelocity) : 0
      this.isSitting = false
    }

    // --- Build desired movement vector ---
    const desiredMovement = {
      x: this.walkDirection.x * speed * delta,
      y: this.verticalVelocity * delta,
      z: this.walkDirection.z * speed * delta,
    }

    // --- Let Rapier's KCC compute safe movement (slide along walls/slopes) ---
    this.controller.computeColliderMovement(collider, desiredMovement)

    // --- Apply the corrected movement ---
    const correctedMovement = this.controller.computedMovement()
    const currentPos = rb.translation()
    rb.setNextKinematicTranslation({
      x: currentPos.x + correctedMovement.x,
      y: currentPos.y + correctedMovement.y,
      z: currentPos.z + correctedMovement.z,
    })

    // --- Sit logic ---
    if (keysPressed[C]) {
      if (this.isOnGround && !directionPressed) {
        this.isSitting = true
      }
    }

    // --- Animation state ---
    let nextAnim: string
    if (!this.isOnGround) {
      nextAnim = 'jump'
    } else if (this.walkDirection.length() > 0) {
      nextAnim = keysPressed[SHIFT] ? 'run' : 'walk'
    } else if (this.isSitting) {
      nextAnim = 'sit'
    } else {
      nextAnim = 'idle'
    }

    // Debug: log state transitions and ground detection
    // if (nextAnim !== this.currentState) {
    //   console.log(`🎮 [ANIM] ${this.currentState} → ${nextAnim} | grounded=${this.isOnGround} raw=${rawGrounded} coyote=${this.coyoteTimer.toFixed(3)} vVel=${this.verticalVelocity.toFixed(2)} pos.y=${currentPos.y.toFixed(2)}`)
    // }

    this.playStateAnimation(nextAnim as any)
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
