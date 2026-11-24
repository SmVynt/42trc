import { tokenService } from '../storage/token.service'
import { decodeGameMessage, encodeGameMessage, type GameMessage } from '../components/game/utils/gameCodec'

// Native WebSocket implementation (no Socket.IO overhead)
const resolveGameServerBase = () => {
  const configuredBase = import.meta.env.VITE_GAME_SERVER_URL?.trim()

  if (configuredBase) {
    if (
      configuredBase.startsWith('http://') ||
      configuredBase.startsWith('https://') ||
      configuredBase.startsWith('ws://') ||
      configuredBase.startsWith('wss://')
    ) {
      return configuredBase.replace(/\/$/, '')
    }
    // Resolve relative path to absolute URL based on the current origin
    return `${window.location.origin}${configuredBase.startsWith('/') ? '' : '/'}${configuredBase}`.replace(/\/$/, '')
  }

  return `${window.location.origin}/game`
}

const GAME_SERVER_BASE = resolveGameServerBase()

// Generate unique player ID
const generatePlayerId = () => {
  return 'player_' + Math.random().toString(36).substr(2, 9)
}

class GameSocket {
  private ws: WebSocket | null = null
  private isConnected = false
  private isConnecting = false
  private roomId = 0
  private username = ''
  private readonly guestPlayerId = generatePlayerId()
  playerId = ''
  private listeners: Record<string, Array<(message: GameMessage) => void>> = {}
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private messageQueue: Array<ReturnType<typeof encodeGameMessage>> = []

  constructor() {
    this.playerId = this.guestPlayerId
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Prevent multiple simultaneous connection attempts
      if (this.isConnecting) {
        console.log('Already connecting...')
        return
      }

      if (this.isConnected) {
        console.log('Already connected')
        resolve()
        return
      }

      this.isConnecting = true

      try {
        // Convert HTTP URL to WebSocket URL
        const wsUrl = GAME_SERVER_BASE.replace(/^http/, 'ws') + '/ws'
        console.log('Connecting to:', wsUrl)

        const socket = new WebSocket(wsUrl)
        this.ws = socket

        socket.onopen = () => {
          if (this.ws !== socket) return
          console.log('Connected to game server:', this.playerId)
          this.isConnected = true
          this.isConnecting = false
          this.reconnectAttempts = 0

          if (this.roomId) this.sendRoomJoin()

          // Send queued messages
          while (this.messageQueue.length > 0) {
            const msg = this.messageQueue.shift()
            this.ws?.send(JSON.stringify(msg))
          }

          resolve()
        }

        socket.onmessage = (event) => {
          if (this.ws !== socket) return
          try {
            const message = decodeGameMessage(JSON.parse(event.data))
            const eventName = message.event

            if (this.listeners[eventName]) {
              this.listeners[eventName].forEach(callback => callback(message))
            }
          } catch (error) {
            console.error('Failed to parse message:', error)
          }
        }

        socket.onerror = (error) => {
          if (this.ws !== socket) return
          console.error('WebSocket error:', error)
          this.isConnecting = false
          reject(error)
        }

        socket.onclose = () => {
          if (this.ws !== socket) return
          console.log('❌ Disconnected from game server')
          this.isConnected = false
          this.isConnecting = false

          // Attempt reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            console.log(`⏱️ Reconnecting in ${this.reconnectDelay}ms... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
            setTimeout(() => {
              if (this.ws === socket) this.connect().catch(console.error)
            }, this.reconnectDelay)
          }
        }
      } catch (error) {
        console.error('Connection error:', error)
        this.isConnecting = false
        reject(error)
      }
    })
  }

  private send(message: GameMessage) {
    const wireMessage = encodeGameMessage(message)

    if (this.isConnected && this.ws) {
    //   const messageStr = JSON.stringify(wireMessage)
	//   const bytes = new TextEncoder().encode(messageStr).length
	//   console.log(`📤 Sent bytes: ${bytes}`)
	//   this.ws.send(messageStr)
      this.ws.send(JSON.stringify(wireMessage))
    } else {
      this.messageQueue.push(wireMessage)
    }
  }

  async joinRoom(roomId: number, username: string, userId?: string | number) {
    const playerId = userId == null ? this.guestPlayerId : `user_${userId}`
    const changingPlayer = this.roomId !== 0 && this.playerId !== playerId
    if (changingPlayer) this.disconnect()

    this.roomId = roomId
    this.username = username
    this.playerId = playerId

    if (changingPlayer) {
      await this.connect()
      return
    }
    console.log(`Joining room ${roomId} as ${username}`)
    this.sendRoomJoin()
  }

  private sendRoomJoin() {
    this.send({
      event: 'player:join',
      roomId: this.roomId,
      username: this.username,
      playerId: this.playerId,
      token: tokenService.get() ?? undefined,
    })
  }

  sendMovement(position: { x: number; y: number; z: number }, rotation: { y: number }, state?: string) {
    this.send({
      event: 'player:move',
      position,
      rotation,
      state,
    })
  }

  sendAction(action: string, payload: unknown = {}) {
    this.send({
      event: 'player:action',
      action,
      payload
    })
  }

  sendChat(message: string) {
    this.send({
      event: 'room:chat',
      message
    })
  }

  getRoomState() {
    this.send({
      event: 'room:getState',
      roomId: this.roomId
    })
  }

  on(eventName: string, callback: (message: GameMessage) => void) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = []
    }
    this.listeners[eventName].push(callback)
  }

  off(eventName: string, callback: (message: GameMessage) => void) {
    if (this.listeners[eventName]) {
      this.listeners[eventName] = this.listeners[eventName].filter(cb => cb !== callback)
    }
  }

  disconnect() {
    const socket = this.ws
    this.ws = null
    this.isConnected = false
    this.isConnecting = false
    this.reconnectAttempts = 0
    this.messageQueue = []
    socket?.close()
  }
}

export const gameSocket = new GameSocket()
