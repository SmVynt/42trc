import * as THREE from 'three'

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

  // Movement
  walkDirection = new THREE.Vector3()
  rotateAngle = new THREE.Vector3(0, 1, 0)
  rotateQuaternion: THREE.Quaternion = new THREE.Quaternion()

  // State
  toggleRun: boolean = true
  walkVelocity = 5
  runVelocity = 8

  // Jumping & Physics
  verticalVelocity = 0
  isOnGround = true
  gravity = 30 // m/s²
  jumpHeight = 2 // meters
  jumpVelocity = Math.sqrt(2 * 30 * 2) // sqrt(2 * gravity * jumpHeight)

  // Fixed isometric camera (Hades-style)
  cameraDistance = 10
  cameraHeight = 8
  cameraAngle = Math.PI / 4 // 45 degrees

  constructor(model: THREE.Mesh | THREE.Group, camera: THREE.Camera) {
    this.model = model
    this.camera = camera
    this.updateCameraPosition()
  }

  public switchRunToggle() {
    this.toggleRun = !this.toggleRun
  }

  public jump() {
    if (this.isOnGround) {
      this.verticalVelocity = this.jumpVelocity
      this.isOnGround = false
    }
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

    this.updateCameraPosition()
  }

  public getPosition(): THREE.Vector3 {
    return this.model.position.clone()
  }
}
