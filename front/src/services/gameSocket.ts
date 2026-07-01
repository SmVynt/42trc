// Native WebSocket implementation (no Socket.IO overhead)
const GAME_SERVER_BASE = import.meta.env.VITE_GAME_SERVER_URL || 'http://localhost:5001'

// Generate unique player ID
const generatePlayerId = () => {
  return 'player_' + Math.random().toString(36).substr(2, 9)
}

class GameSocket {
  private ws: WebSocket | null = null
  private isConnected = false
  private isConnecting = false
  private roomId = 0
  private playerId = ''
  private listeners: Record<string, Function[]> = {}
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private messageQueue: any[] = []

  constructor() {
    this.playerId = generatePlayerId()
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Prevent multiple simultaneous connection attempts
      if (this.isConnecting) {
        console.log('⏳ Already connecting...')
        return
      }

      if (this.isConnected) {
        console.log('✅ Already connected')
        resolve()
        return
      }

      this.isConnecting = true

      try {
        // Convert HTTP URL to WebSocket URL
        const wsUrl = GAME_SERVER_BASE.replace(/^http/, 'ws') + '/ws'
        console.log('🔌 Connecting to:', wsUrl)

        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log('✅ Connected to game server:', this.playerId)
          this.isConnected = true
          this.isConnecting = false
          this.reconnectAttempts = 0

          // Send queued messages
          while (this.messageQueue.length > 0) {
            const msg = this.messageQueue.shift()
            this.ws?.send(JSON.stringify(msg))
          }

          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            const eventName = message.event

            if (this.listeners[eventName]) {
              this.listeners[eventName].forEach(callback => callback(message))
            }
          } catch (error) {
            console.error('Failed to parse message:', error)
          }
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.isConnecting = false
          reject(error)
        }

        this.ws.onclose = () => {
          console.log('❌ Disconnected from game server')
          this.isConnected = false
          this.isConnecting = false

          // Attempt reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            console.log(`⏱️ Reconnecting in ${this.reconnectDelay}ms... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
            setTimeout(() => this.connect().catch(console.error), this.reconnectDelay)
          }
        }
      } catch (error) {
        console.error('Connection error:', error)
        this.isConnecting = false
        reject(error)
      }
    })
  }

  private send(message: any) {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify(message))
    } else {
      this.messageQueue.push(message)
    }
  }

  joinRoom(roomId: number, username: string) {
    this.roomId = roomId
    console.log(`Joining room ${roomId} as ${username}`)
    this.send({
      event: 'player:join',
      roomId,
      username
    })
  }

  sendMovement(position: any, rotation: any) {
    this.send({
      event: 'player:move',
      position,
      rotation
    })
  }

  sendAction(action: string, payload: any = {}) {
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

  on(eventName: string, callback: Function) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = []
    }
    this.listeners[eventName].push(callback)
  }

  off(eventName: string, callback: Function) {
    if (this.listeners[eventName]) {
      this.listeners[eventName] = this.listeners[eventName].filter(cb => cb !== callback)
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.isConnected = false
    }
  }
}

export const gameSocket = new GameSocket()
