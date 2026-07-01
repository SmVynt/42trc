import { io } from 'socket.io-client'

const GAME_SERVER_URL = import.meta.env.VITE_GAME_SERVER_URL || 'http://localhost:5001'

class GameSocket {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.roomId = null
    this.playerId = null
    this.listeners = {}
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(GAME_SERVER_URL, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5
        })

        this.socket.on('connect', () => {
          console.log('✅ Connected to game server:', this.socket.id)
          this.isConnected = true
          this.playerId = this.socket.id
          resolve()
        })

        this.socket.on('disconnect', () => {
          console.log('❌ Disconnected from game server')
          this.isConnected = false
        })

        this.socket.on('error', (error) => {
          console.error('Socket error:', error)
          reject(error)
        })

        // Forward all events to listeners
        this.socket.onAny((eventName, ...args) => {
          if (this.listeners[eventName]) {
            this.listeners[eventName].forEach(callback => callback(...args))
          }
        })
      } catch (error) {
        console.error('Connection error:', error)
        reject(error)
      }
    })
  }

  joinRoom(roomId, username) {
    if (!this.isConnected) {
      console.error('Not connected to game server')
      return
    }

    this.roomId = roomId
    console.log(`Joining room ${roomId} as ${username}`)
    this.socket.emit('player:join', { roomId, username })
  }

  sendMovement(position, rotation) {
    if (!this.isConnected) return

    this.socket.emit('player:move', {
      position,
      rotation
    })
  }

  sendAction(action, payload = {}) {
    if (!this.isConnected) return

    this.socket.emit('player:action', {
      action,
      payload
    })
  }

  sendChat(message) {
    if (!this.isConnected) return

    this.socket.emit('room:chat', { message })
  }

  getRoomState() {
    if (!this.isConnected) return

    this.socket.emit('room:getState', { roomId: this.roomId })
  }

  on(eventName, callback) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = []
    }
    this.listeners[eventName].push(callback)
  }

  off(eventName, callback) {
    if (this.listeners[eventName]) {
      this.listeners[eventName] = this.listeners[eventName].filter(cb => cb !== callback)
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.isConnected = false
    }
  }
}

export const gameSocket = new GameSocket()
