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
  static readonly WALK_VELOCITY = 6
  static readonly RUN_VELOCITY = 10
  // static readonly GRAVITY = 30 // m/s²
  static readonly JUMP_HEIGHT = 2 // meters
  static readonly JUMP_VELOCITY = 10
  static readonly GRAVITY_SCALE = 3

  //
}
