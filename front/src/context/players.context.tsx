import React, { createContext, useContext, useState, useCallback } from 'react'

export interface OtherPlayer {
  id: string
  username: string
  position: { x: number; y: number; z: number }
  rotation: { y: number }
}

interface PlayersContextType {
  otherPlayers: Map<string, OtherPlayer>
  addPlayer: (player: OtherPlayer) => void
  updatePlayerPosition: (playerId: string, position: { x: number; y: number; z: number }, rotation: { y: number }) => void
  removePlayer: (playerId: string) => void
  setPlayersInRoom: (players: OtherPlayer[]) => void
}

const PlayersContext = createContext<PlayersContextType | null>(null)

export function PlayersProvider({ children }: { children: React.ReactNode }) {
  const [otherPlayers, setOtherPlayers] = useState<Map<string, OtherPlayer>>(new Map())

  const addPlayer = useCallback((player: OtherPlayer) => {
    setOtherPlayers((prev) => new Map(prev).set(player.id, player))
  }, [])

  const updatePlayerPosition = useCallback(
    (playerId: string, position: { x: number; y: number; z: number }, rotation: { y: number }) => {
      setOtherPlayers((prev) => {
        const updated = new Map(prev)
        const player = updated.get(playerId)
        if (player) {
          updated.set(playerId, { ...player, position, rotation })
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

  const setPlayersInRoom = useCallback((players: OtherPlayer[]) => {
    setOtherPlayers(new Map(players.map((p) => [p.id, p])))
  }, [])

  return (
    <PlayersContext.Provider value={{ otherPlayers, addPlayer, updatePlayerPosition, removePlayer, setPlayersInRoom }}>
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
