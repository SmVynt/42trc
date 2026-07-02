import * as THREE from 'three'
import { GameConfig } from './gameConfig'
import type { GamePlayerState } from './gameCodec'

const W = 'KeyW'
const A = 'KeyA'
const S = 'KeyS'
const D = 'KeyD'
const SHIFT = 'ShiftLeft'
const SPACE = 'Space'
const DIRECTIONS = [W, A, S, D]

export class CharacterControls {
  model: THREE.Mesh | THREE.Group
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
  toggleRun: boolean = true
  walkVelocity = GameConfig.WALK_VELOCITY
  runVelocity = GameConfig.RUN_VELOCITY

  // Jumping & Physics
  verticalVelocity = 0
  isOnGround = true
  gravity = GameConfig.GRAVITY
  jumpHeight = GameConfig.JUMP_HEIGHT
  jumpVelocity = 0

  // Fixed isometric camera
  cameraDistance = GameConfig.CAMERA_DISTANCE
  cameraHeight = GameConfig.CAMERA_HEIGHT
  cameraAngle = GameConfig.CAMERA_ANGLE

	constructor(model: THREE.Mesh | THREE.Group, camera: THREE.Camera, animations?: Record<string, THREE.AnimationAction | null>) {
	this.model = model
	this.camera = camera
	if (animations) {
	  this.animations = animations
	}
	this.jumpVelocity = Math.sqrt(2 * this.gravity * this.jumpHeight)
	this.updateCameraPosition()
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

  public switchRunToggle() {
	this.toggleRun = !this.toggleRun
  }

  public jump() {
	if (this.isOnGround) {
	  this.verticalVelocity = this.jumpVelocity
	  this.isOnGround = false
	  this.playStateAnimation('jump')
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
	const modelPos = this.model.position

	const cameraX = modelPos.x - Math.sin(this.cameraAngle) * this.cameraDistance
	const cameraY = modelPos.y + this.cameraHeight
	const cameraZ = modelPos.z - Math.cos(this.cameraAngle) * this.cameraDistance

	this.camera.position.set(cameraX, cameraY, cameraZ)
	this.camera.lookAt(modelPos.x, modelPos.y + 0.8, modelPos.z)
	this.camera.up.set(0, 1, 0)
  }

  public update(delta: number, keysPressed: Record<string, boolean>) {
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

	if (this.walkDirection.length() > 0) {
	  this.walkDirection.normalize()

	  const angle = Math.atan2(this.walkDirection.x, this.walkDirection.z)
	  this.rotateQuaternion.setFromAxisAngle(this.rotateAngle, angle)
	  this.model.quaternion.rotateTowards(this.rotateQuaternion, 0.15)

	  // Save current rotation AFTER rotateTowards (not target rotation!)
	  const euler = new THREE.Euler().setFromQuaternion(this.model.quaternion, 'YXZ')
	  this.currentRotationY = euler.y

	  const velocity = keysPressed[SHIFT] ? this.runVelocity * 1.5 :
					   directionPressed && this.toggleRun ? this.runVelocity : this.walkVelocity

	  const moveX = this.walkDirection.x * velocity * delta
	  const moveZ = this.walkDirection.z * velocity * delta
	  this.model.position.x += moveX
	  this.model.position.z += moveZ
	}

	// Apply gravity
	this.verticalVelocity -= this.gravity * delta
	this.model.position.y += this.verticalVelocity * delta

	// Check if on ground
	if (this.model.position.y <= 0) {
	  this.model.position.y = 0
	  this.verticalVelocity = 0
	  this.isOnGround = true
	}

	if (!this.isOnGround) {
	  this.playStateAnimation('jump')
	} else if (this.walkDirection.length() > 0) {
	  const isRunning = keysPressed[SHIFT] ? true : this.toggleRun
	  this.playStateAnimation(isRunning ? 'run' : 'walk')
	} else {
	  this.playStateAnimation('idle')
	}

	this.updateCameraPosition()
  }

  public getPosition(): THREE.Vector3 {
	return this.model.position.clone()
  }
}
