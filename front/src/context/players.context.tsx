import React, { createContext, useContext, useState, useCallback } from 'react'

export interface OtherPlayer {
  id: string
  username: string
  position: { x: number; y: number; z: number }
  rotation: { y: number }
  lastUpdateTime: number // Track when player was last updated
  state: 'idle' | 'walking' | 'running' | 'jumping' | 'sitting'
}

interface PlayersContextType {
  otherPlayers: Map<string, OtherPlayer>
  addPlayer: (player: OtherPlayer) => void
  updatePlayerPosition: (playerId: string, position: { x: number; y: number; z: number }, rotation: { y: number }, state?: OtherPlayer['state']) => void
  removePlayer: (playerId: string) => void
  setPlayersInRoom: (players: OtherPlayer[]) => void
  cleanupInactivePlayers: (timeoutMs?: number) => void
}

const PlayersContext = createContext<PlayersContextType | null>(null)

export function PlayersProvider({ children }: { children: React.ReactNode }) {
  const [otherPlayers, setOtherPlayers] = useState<Map<string, OtherPlayer>>(new Map())

  const addPlayer = useCallback((player: OtherPlayer) => {
    setOtherPlayers((prev) => new Map(prev).set(player.id, { ...player, lastUpdateTime: Date.now() }))
  }, [])

  const updatePlayerPosition = useCallback(
    (playerId: string, position: { x: number; y: number; z: number }, rotation: { y: number }, state?: OtherPlayer['state']) => {
      setOtherPlayers((prev) => {
        const updated = new Map(prev)
        const player = updated.get(playerId)
        if (player) {
          updated.set(playerId, { ...player, position, rotation, state: state ?? player.state, lastUpdateTime: Date.now() })
        }
        return updated
      })
    },
    []
  )

  const removePlayer = useCallback((playerId: string) => {
    setOtherPlayers((prev) => {
      const updated = new Map(prev)
      updated.delete(playerId)
      return updated
    })
  }, [])

  const cleanupInactivePlayers = useCallback((timeoutMs: number = 3000) => {
    const now = Date.now()
    setOtherPlayers((prev) => {
      const updated = new Map(prev)
      for (const [playerId, player] of updated) {
        if (now - player.lastUpdateTime > timeoutMs) {
          console.log(`🗑️ Removing inactive player: ${playerId}`)
          updated.delete(playerId)
        }
      }
      return updated
    })
  }, [])

  const setPlayersInRoom = useCallback((players: OtherPlayer[]) => {
    const now = Date.now()
    setOtherPlayers(new Map(players.map((p) => [p.id, { ...p, lastUpdateTime: now }])))
  }, [])

  return (
    <PlayersContext.Provider value={{ otherPlayers, addPlayer, updatePlayerPosition, removePlayer, setPlayersInRoom, cleanupInactivePlayers }}>
      {children}
    </PlayersContext.Provider>
  )
}

export function usePlayers() {
  const context = useContext(PlayersContext)
  if (!context) {
    throw new Error('usePlayers must be used within PlayersProvider')
  }
  return context
}
