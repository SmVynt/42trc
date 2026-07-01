package services

import (
	"log"
	"sync"
	"time"

	"github.com/SmVynt/42trc/back-game/models"
)

type RoomManager struct {
	rooms       map[int]*models.Room
	playerRooms map[string]int // playerId -> roomId
	mu          sync.RWMutex
}

func NewRoomManager() *RoomManager {
	return &RoomManager{
		rooms:       make(map[int]*models.Room),
		playerRooms: make(map[string]int),
	}
}

func (rm *RoomManager) CreateRoom(roomID int, name string, maxPlayers int) *models.Room {
	rm.mu.Lock()
	defer rm.mu.Unlock()

	if _, exists := rm.rooms[roomID]; !exists {
		rm.rooms[roomID] = &models.Room{
			ID:         roomID,
			Name:       name,
			Players:    make(map[string]*models.Player),
			CreatedAt:  time.Now(),
			MaxPlayers: maxPlayers,
		}
		log.Printf("[RoomManager] Created room: %d", roomID)
	}
	return rm.rooms[roomID]
}

func (rm *RoomManager) AddPlayerToRoom(playerID, roomID int, playerData *models.Player) *models.Room {
	rm.mu.Lock()
	defer rm.mu.Unlock()

	// Create room if doesn't exist
	room, exists := rm.rooms[roomID]
	if !exists {
		room = &models.Room{
			ID:         roomID,
			Name:       "Room " + string(rune(roomID)),
			Players:    make(map[string]*models.Player),
			CreatedAt:  time.Now(),
			MaxPlayers: 4,
		}
		rm.rooms[roomID] = room
	}

	// Add player to room
	room.Players[playerData.ID] = playerData
	rm.playerRooms[playerData.ID] = roomID

	log.Printf("[RoomManager] Added player %s to room %d. Total: %d",
		playerData.ID, roomID, len(room.Players))

	return room
}

func (rm *RoomManager) RemovePlayer(playerID string) {
	rm.mu.Lock()
	defer rm.mu.Unlock()

	roomID, exists := rm.playerRooms[playerID]
	if !exists {
		return
	}

	room, roomExists := rm.rooms[roomID]
	if roomExists {
		delete(room.Players, playerID)
		log.Printf("[RoomManager] Removed player %s from room %d. Remaining: %d",
			playerID, roomID, len(room.Players))

		// Delete empty room
		if len(room.Players) == 0 {
			delete(rm.rooms, roomID)
			log.Printf("[RoomManager] Deleted empty room %d", roomID)
		}
	}

	delete(rm.playerRooms, playerID)
}

func (rm *RoomManager) UpdatePlayerPosition(playerID string, position models.Position) {
	rm.mu.RLock()
	defer rm.mu.RUnlock()

	roomID, exists := rm.playerRooms[playerID]
	if !exists {
		return
	}

	room, roomExists := rm.rooms[roomID]
	if roomExists && room.Players[playerID] != nil {
		room.Players[playerID].Position = position
	}
}

func (rm *RoomManager) UpdatePlayerRotation(playerID string, rotation models.Rotation) {
	rm.mu.RLock()
	defer rm.mu.RUnlock()

	roomID, exists := rm.playerRooms[playerID]
	if !exists {
		return
	}

	room, roomExists := rm.rooms[roomID]
	if roomExists && room.Players[playerID] != nil {
		room.Players[playerID].Rotation = rotation
	}
}

func (rm *RoomManager) GetRoom(roomID int) *models.Room {
	rm.mu.RLock()
	defer rm.mu.RUnlock()
	return rm.rooms[roomID]
}

func (rm *RoomManager) GetRoomPlayers(roomID int) []*models.Player {
	rm.mu.RLock()
	defer rm.mu.RUnlock()

	room, exists := rm.rooms[roomID]
	if !exists {
		return []*models.Player{}
	}

	players := make([]*models.Player, 0, len(room.Players))
	for _, player := range room.Players {
		players = append(players, player)
	}
	return players
}

func (rm *RoomManager) GetPlayerRoom(playerID string) int {
	rm.mu.RLock()
	defer rm.mu.RUnlock()
	return rm.playerRooms[playerID]
}

func (rm *RoomManager) GetAllRooms() []map[string]interface{} {
	rm.mu.RLock()
	defer rm.mu.RUnlock()

	rooms := make([]map[string]interface{}, 0)
	for _, room := range rm.rooms {
		rooms = append(rooms, map[string]interface{}{
			"id":          room.ID,
			"playerCount": len(room.Players),
			"createdAt":   room.CreatedAt,
		})
	}
	return rooms
}
