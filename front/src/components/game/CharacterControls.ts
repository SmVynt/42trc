import * as THREE from 'three'

// const SHIFT = 'shift'
// const DIRECTIONS = [W, A, S, D]

export class CharacterControls {

	playerModel:			THREE.Group
	playerAnimation:		THREE.AnimationMixer
	playerAnimationsMap:	Map<string, THREE.AnimationAction> = new Map() // Walk, Run, Idle
	// orbitControl: OrbitControls
	playerCamera:			THREE.Camera

	// states
	isRunning:		boolean = false
	isJumping:		boolean = false
	action:			string

	// Player settings
	// playerDirection = new THREE.Vector3()
	playerDirection = new THREE.Vector3(0, 1, 0)
	playerAim = new THREE.Vector3(0, 1, 0)
	// playerRotation = new THREE.Vector3(0, 1, 0)
	// playerRotation = new THREE.Vector2(0, 1)
	rotateQuarternion: THREE.Quaternion = new THREE.Quaternion()
	// cameraTarget = new THREE.Vector3()

	// const
	readonly fadeDuration: number = 0.2
	readonly speedRun = 5
	readonly speedWalk = 2
	readonly DIRECTIONS = [W, A, S, D]
	readonly JUMP = 'space'
	readonly rotationSpeed = 5

	constructor(model: THREE.Group,
				mixer: THREE.AnimationMixer,
				animationsMap: Map<string, THREE.AnimationAction>,
				// orbitControl: OrbitControls, camera: THREE.Camera,
				currentAction: string,
				camera: THREE.Camera) {
		this.playerModel = model
		this.playerAnimation = mixer
		this.playerAnimationsMap = animationsMap
		this.action = currentAction
		// set the current action
		this.playerAnimationsMap.forEach((value, key) => {
			if (key == currentAction) {
				value.play()
			}
		})
		// this.orbitControl = orbitControl
		this.playerCamera = camera
		this.updateCameraTarget(0,0)
	}

	public switchRunToggle() {
		this.isRunning = !this.isRunning
	}

	public update(dt: number, keysPressed: any) {
		const directionPressed = this.DIRECTIONS.some(key => keysPressed[key] == true)
		const jumpPressed = keysPressed[this.JUMP] == true

		var play = 'Idle';
		// deal with states
		if (!this.isJumping) {
			if (jumpPressed) {
				this.isJumping = true
				play = 'Jump'
			}
		} else {
			if (directionPressed && this.isRunning) {
				play = 'Run'
			} else if (directionPressed) {
				play = 'Walk'
			}
		}

		// deal with the Animation
		if (this.action != play) {
			const toPlay = this.playerAnimationsMap.get(play)
			const current = this.playerAnimationsMap.get(this.action)

			current.fadeOut(this.fadeDuration)
			toPlay.reset().fadeIn(this.fadeDuration).play();

			this.action = play
		}

		this.playerAnimation.update(dt)

		if () {
			// calculate towards camera direction
			// var angleYCameraDirection = Math.atan2(
			// 		(this.playerCamera.position.x - this.playerModel.position.x),
			// 		(this.playerCamera.position.z - this.playerModel.position.z))
			// diagonal movement angle offset
			this.playerAim = this.newAim(keysPressed)


			// rotate model
			// this.rotateQuarternion.setFromAxisAngle(this.playerDirection, directionOffset)
			this.rotateQuarternion.setFromAxisAngle(this.playerAim, 0)
			this.playerModel.quaternion.rotateTowards(this.rotateQuarternion, this.rotationSpeed * dt)
			this.playerDirection.applyQuaternion(this.playerModel.quaternion)

			// calculate direction
			// this.playerCamera.getWorldDirection(this.playerDirection)
			// this.playerDirection.y = 0
			// this.playerDirection.normalize()
			// this.playerDirection.applyAxisAngle(this.playerRotation, directionOffset)

			// run/walk velocity
			const velocity = this.isRunning ? this.speedRun : this.speedWalk

			// move model & camera
			const moveX = this.playerDirection.x * velocity * dt
			const moveZ = this.playerDirection.z * velocity * dt
			this.playerModel.position.x += moveX
			this.playerModel.position.z += moveZ
			// this.updateCameraTarget(moveX, moveZ)
		}
	}

	// private updateCameraTarget(moveX: number, moveZ: number) {
	// 	// move camera
	// 	this.playerCamera.position.x += moveX
	// 	this.playerCamera.position.z += moveZ

	// 	// update camera target
	// 	this.cameraTarget.x = this.playerModel.position.x
	// 	this.cameraTarget.y = this.playerModel.position.y + 1
	// 	this.cameraTarget.z = this.playerModel.position.z
	// 	// this.orbitControl.target = this.cameraTarget
	// }

	private newAim(keysPressed: any): THREE.Vector3 {
		var newAim = new THREE.Vector3(0, 0, 0)
		// newAim = this.playerAim

		if (keysPressed[W]) {
			newAim.y = 1
		}
		if (keysPressed[S]) {
			newAim.y = -1
		}
		if (keysPressed[A]) {
			newAim.x = -1
		}
		if (keysPressed[D]) {
			newAim.x = 1
		}
		else {
			newAim = this.playerAim
		}

		// if nothing is pressed, keep the previous aim
		return newAim
	}
}
