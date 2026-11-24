export const PICNIC_TABLE_POSITION: [number, number, number] = [40, 0.48, 28]
export const PICNIC_TABLE_RADIUS = 3

export const ticTacToeColors = {
  frame: '#634038',
  lightTile: '#fff5df',
  sandTile: '#edc480',
  X: '#b34737',
  O: '#235c9f',
}

export function isInsidePicnicTableRadius({ x, z }: { x: number; z: number }) {
  return Math.hypot(x - PICNIC_TABLE_POSITION[0], z - PICNIC_TABLE_POSITION[2]) <= PICNIC_TABLE_RADIUS
}
