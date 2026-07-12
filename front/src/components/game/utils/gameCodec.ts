export type GamePlayerState = 'idle' | 'walk' | 'run' | 'jump' | 'sit'

export type GameVector3 = { x: number; y: number; z: number }
export type GameRotation = { y: number }

export type GameMessage = {
  event: string
  [key: string]: any
}

type WirePlayer = {
  i: string
  u: string
  p?: [number, number, number]
  o?: [number]
  s?: number
}

// WireMessage is the compact representation of GameMessage for network transmission
// t - event Type (number)
// r - RoomId (number)
// u - Username (string)
// i - playerId (string)
// p - Position ([x, y, z])
// o - rOtation ([y])
// s - State (number)
// a - Action (string)
// d - payloaD (unknown)
// m - Message (string)
// ts - Timestamp (number)
// ps - players in room (WirePlayer[])
type WireMessage = {
  t: number
  r?: number
  u?: string
  i?: string
  p?: [number, number, number]
  o?: [number]
  s?: number
  a?: string
  d?: unknown
  m?: string
  ts?: number
  ps?: WirePlayer[]
}

const PLAYER_STATE_TO_CODE: Record<GamePlayerState, number> = {
  idle: 0,
  walk: 1,
  run: 2,
  jump: 3,
  sit: 4,
}

const CODE_TO_PLAYER_STATE: Record<number, GamePlayerState> = {
  0: 'idle',
  1: 'walk',
  2: 'run',
  3: 'jump',
  4: 'sit',
}

const eventToCode: Record<string, number> = {
  'player:join': 0,
  'player:move': 1,
  'player:action': 2,
  'room:chat': 3,
  'room:getState': 4,
  'player:joined': 10,
  'room:players': 11,
  'player:moved': 12,
  'player:left': 13,
  'room:state': 14,
  'room:message': 15,
  pong: 16,
  error: 99,
}

const codeToEvent: Record<number, string> = Object.fromEntries(
  Object.entries(eventToCode).map(([event, code]) => [code, event])
)

const encodePlayerState = (state?: unknown): number | undefined => {
  if (typeof state !== 'string') {
    return undefined
  }

  return PLAYER_STATE_TO_CODE[state as GamePlayerState]
}

const decodePlayerState = (state?: number): GamePlayerState | undefined => {
  if (typeof state !== 'number') {
    return undefined
  }

  return CODE_TO_PLAYER_STATE[state]
}

const encodeVector3 = (value?: GameVector3): [number, number, number] | undefined => {
  if (!value) {
    return undefined
  }

  return [value.x, value.y, value.z]
}

const decodeVector3 = (value?: [number, number, number]): GameVector3 | undefined => {
  if (!value) {
    return undefined
  }

  return { x: value[0], y: value[1], z: value[2] }
}

const encodeRotation = (value?: GameRotation): [number] | undefined => {
  if (!value) {
    return undefined
  }

  return [value.y]
}

const decodeRotation = (value?: [number]): GameRotation | undefined => {
  if (!value) {
    return undefined
  }

  return { y: value[0] }
}

const encodePlayer = (player: Record<string, unknown>): WirePlayer => ({
  i: String(player.id ?? ''),
  u: String(player.username ?? ''),
  p: encodeVector3(player.position as GameVector3),
  o: encodeRotation(player.rotation as GameRotation),
  s: encodePlayerState(player.state),
})

const decodePlayer = (player: WirePlayer): Record<string, unknown> => ({
  id: player.i,
  username: player.u,
  position: decodeVector3(player.p) ?? { x: 0, y: 0, z: 0 },
  rotation: decodeRotation(player.o) ?? { y: 0 },
  state: decodePlayerState(player.s) ?? 'idle',
})

const encodePlayers = (players: unknown): WirePlayer[] | undefined => {
  if (!Array.isArray(players)) {
    return undefined
  }

  return players.map((player) => encodePlayer(player as Record<string, unknown>))
}

const decodePlayers = (players?: WirePlayer[]): Record<string, unknown>[] | undefined => {
  if (!players) {
    return undefined
  }

  return players.map((player) => decodePlayer(player))
}

export const encodeGameMessage = (message: GameMessage): WireMessage => {
  const eventCode = eventToCode[message.event]

  switch (message.event) {
    case 'player:join':
      return {
        t: eventCode,
        r: message.roomId as number,
        u: message.username as string,
        i: message.playerId as string,
      }
    case 'player:move':
      return {
        t: eventCode,
        p: encodeVector3(message.position as GameVector3),
        o: encodeRotation(message.rotation as GameRotation),
        s: encodePlayerState(message.state),
      }
    case 'player:action':
      return {
        t: eventCode,
        a: message.action as string,
        d: message.payload,
      }
    case 'room:chat':
      return {
        t: eventCode,
        m: message.message as string,
      }
    case 'room:getState':
      return {
        t: eventCode,
        r: message.roomId as number,
      }
    default:
      return message as unknown as WireMessage
  }
}

export const decodeGameMessage = (message: WireMessage | GameMessage): GameMessage => {
  if (typeof (message as WireMessage).t !== 'number') {
    return message as GameMessage
  }

  const wireMessage = message as WireMessage
  const event = codeToEvent[wireMessage.t] ?? 'error'

  switch (event) {
    case 'player:joined':
      return {
        event,
        playerId: wireMessage.i,
        username: wireMessage.u,
        playersInRoom: decodePlayers(wireMessage.ps) ?? [],
      }
    case 'room:players':
      return {
        event,
        players: decodePlayers(wireMessage.ps) ?? [],
      }
    case 'player:moved':
      return {
        event,
        playerId: wireMessage.i,
        position: decodeVector3(wireMessage.p) ?? { x: 0, y: 0, z: 0 },
        rotation: decodeRotation(wireMessage.o) ?? { y: 0 },
        ...(typeof wireMessage.s === 'number' ? { state: decodePlayerState(wireMessage.s) } : {}),
      }
    case 'player:left':
      return {
        event,
        playerId: wireMessage.i,
      }
    case 'room:state':
      return {
        event,
        roomId: wireMessage.r,
        players: decodePlayers(wireMessage.ps) ?? [],
        timestamp: wireMessage.ts,
      }
    case 'room:message':
      return {
        event,
        playerId: wireMessage.i,
        message: wireMessage.m,
        timestamp: wireMessage.ts,
      }
    case 'pong':
      return {
        event,
        timestamp: wireMessage.ts,
      }
    case 'error':
      return {
        event,
        message: wireMessage.m,
      }
    default:
      return {
        event,
      }
  }
}
