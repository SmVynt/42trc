package models

import "time"

type PlayerState uint8

const (
	PlayerStateIdle PlayerState = iota
	PlayerStateWalking
	PlayerStateRunning
	PlayerStateJumping
	PlayerStateSitting
)

// Position represents 3D coordinates
type Position struct {
	X float32 `json:"x"`
	Y float32 `json:"y"`
	Z float32 `json:"z"`
}

// Rotation represents player rotation
type Rotation struct {
	Y float32 `json:"y"`
}

// Player represents a game player
type Player struct {
	ID        string    `json:"id"`
	Username  string    `json:"username"`
	Position  Position  `json:"position"`
	Rotation  Rotation  `json:"rotation"`
	State     string    `json:"state"`
	JoinedAt  time.Time `json:"joinedAt"`
	RoomID    int       `json:"roomId"`
}

// Room represents a game room
type Room struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Players   map[string]*Player
	CreatedAt time.Time `json:"createdAt"`
	MaxPlayers int      `json:"maxPlayers"`
}

// WebSocket Messages
type JoinRoomData struct {
	RoomID   int    `json:"roomId"`
	Username string `json:"username"`
}

type MoveData struct {
	Position Position `json:"position"`
	Rotation Rotation `json:"rotation"`
}

type ActionData struct {
	Action  string      `json:"action"`
	Payload interface{} `json:"payload"`
}

type RoomStateData struct {
	RoomID int `json:"roomId"`
}

type ChatData struct {
	Message string `json:"message"`
}

// Response types
type PlayerJoinedEvent struct {
	PlayerId     string    `json:"playerId"`
	Username     string    `json:"username"`
	PlayersInRoom []*Player `json:"playersInRoom"`
}

type RoomPlayersEvent struct {
	Players []*Player `json:"players"`
}

type PlayerMovedEvent struct {
	PlayerId string   `json:"playerId"`
	Position Position `json:"position"`
	Rotation Rotation `json:"rotation"`
}

type RoomStateEvent struct {
	RoomID    int       `json:"roomId"`
	Players   []*Player `json:"players"`
	Timestamp int64     `json:"timestamp"`
}

type ChatMessageEvent struct {
	PlayerId  string `json:"playerId"`
	Message   string `json:"message"`
	Timestamp int64  `json:"timestamp"`
}

type ErrorEvent struct {
	Message string `json:"message"`
}

type PongEvent struct {
	Timestamp int64 `json:"timestamp"`
}
