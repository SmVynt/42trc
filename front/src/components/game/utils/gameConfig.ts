export class GameConfig {

  // Starting location
  static readonly START_X = 0
  static readonly START_Y = 1.05
  static readonly START_Z = 0

  // Fixed isometric camera
  static readonly CAMERA_DISTANCE = 14
  static readonly CAMERA_HEIGHT = 7
  static readonly CAMERA_ANGLE = Math.PI * 5 / 4 // 45 degrees
  static readonly CAMERA_FOV = 30 // degrees

  // Player movement
  static readonly WALK_VELOCITY = 8
  static readonly RUN_VELOCITY = 14
  static readonly GRAVITY = 30 // m/s²
  static readonly JUMP_HEIGHT = 2 // meters
  static readonly JUMP_VELOCITY = 10

  // KinematicCharacterController
  static readonly CHARACTER_OFFSET = 0.01 // skin width
  static readonly MAX_SLOPE_CLIMB_ANGLE = 45 * (Math.PI / 180) // radians
  static readonly MIN_SLOPE_SLIDE_ANGLE = 30 * (Math.PI / 180) // radians
}
