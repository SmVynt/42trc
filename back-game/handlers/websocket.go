package handlers

import (
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"

	"github.com/SmVynt/42trc/back-game/models"
	"github.com/SmVynt/42trc/back-game/services"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan interface{}
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex

	roomManager  *services.RoomManager
	playerSvc    *services.PlayerService
	playerConns  map[string]*Client
	playerConnMu sync.RWMutex
}

type Client struct {
	playerID string
	conn     *websocket.Conn
	send     chan interface{}
	hub      *Hub
	roomID   int
}

func NewHub(roomManager *services.RoomManager, playerSvc *services.PlayerService) *Hub {
	return &Hub{
		clients:     make(map[*Client]bool),
		broadcast:   make(chan interface{}, 256),
		register:    make(chan *Client),
		unregister:  make(chan *Client),
		roomManager: roomManager,
		playerSvc:   playerSvc,
		playerConns: make(map[string]*Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			log.Printf("✅ Client registered: %s", client.playerID)

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			h.mu.Unlock()

			h.playerConnMu.Lock()
			delete(h.playerConns, client.playerID)
			h.playerConnMu.Unlock()

			if client.roomID > 0 {
				h.BroadcastToRoom(client.roomID, map[string]interface{}{
					"event":    "player:left",
					"playerId": client.playerID,
				}, client)
			}

			h.roomManager.RemovePlayer(client.playerID)
			log.Printf("❌ Client unregistered: %s", client.playerID)

		case msg := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.send <- msg:
				default:
					log.Printf("⚠️ Client send channel full: %s", client.playerID)
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("❌ WebSocket upgrade error: %v", err)
		return
	}

	client := &Client{
		playerID: conn.RemoteAddr().String(),
		conn:     conn,
		send:     make(chan interface{}, 256),
		hub:      h,
	}

	h.register <- client

	go client.readPump()
	go client.writePump()
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("❌ WebSocket error: %v", err)
			}
			break
		}

		decodedMessage, err := decodeGameMessage(message)
		if err != nil {
			log.Printf("❌ JSON unmarshal error: %v", err)
			continue
		}

		c.handleMessage(decodedMessage)
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			writer, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}

			data, err := encodeGameMessage(message)
			if err != nil {
				_ = writer.Close()
				return
			}

			if _, err := writer.Write(data); err != nil {
				return
			}

			if err := writer.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Client) handleMessage(msg map[string]interface{}) {
	event, _ := msg["event"].(string)

	switch event {
	case "player:join":
		c.handlePlayerJoin(msg)
	case "player:move":
		c.handlePlayerMove(msg)
	case "player:action":
		c.handlePlayerAction(msg)
	case "room:getState":
		c.handleGetRoomState(msg)
	case "room:chat":
		c.handleChat(msg)
	case "ping":
		c.send <- map[string]interface{}{
			"event":     "pong",
			"timestamp": time.Now().UnixMilli(),
		}
	default:
		log.Printf("⚠️ Unknown event: %s", event)
	}
}

func (c *Client) handlePlayerJoin(msg map[string]interface{}) {
	roomID := asInt(msg["roomId"])
	username := asString(msg["username"])
	playerID := asString(msg["playerId"])
	if playerID == "" {
		playerID = c.playerID
	}

	log.Printf("[Handler] Player joining room %d as %s", roomID, username)

	if err := c.hub.playerSvc.GetRoom(roomID); err != nil {
		c.hub.playerSvc.CreateRoom(roomID, "Room "+string(rune(roomID)), 4)
	}

	c.hub.playerSvc.CreatePlayer(playerID, username, roomID)

	c.playerID = playerID
	c.roomID = roomID

	c.hub.playerConnMu.Lock()
	c.hub.playerConns[playerID] = c
	c.hub.playerConnMu.Unlock()

	player := &models.Player{
		ID:       playerID,
		Username: username,
		RoomID:   roomID,
		Position: models.Position{X: 0, Y: 0, Z: 0},
		Rotation: models.Rotation{Y: 0},
		State:    "idle",
		JoinedAt: time.Now(),
	}

	c.hub.roomManager.AddPlayerToRoom(roomID, roomID, player)
	playersInRoom := c.hub.roomManager.GetRoomPlayers(roomID)

	c.hub.BroadcastToRoom(roomID, map[string]interface{}{
		"event":         "player:joined",
		"playerId":      playerID,
		"username":      username,
		"playersInRoom": playersInRoom,
	}, nil)

	c.send <- map[string]interface{}{
		"event":   "room:players",
		"players": playersInRoom,
	}

	log.Printf("[Handler] Player %s joined room %d. Total players: %d", playerID, roomID, len(playersInRoom))
}

func (c *Client) handlePlayerMove(msg map[string]interface{}) {
	if c.roomID == 0 {
		return
	}

	positionData, _ := msg["position"].(map[string]interface{})
	rotationData, _ := msg["rotation"].(map[string]interface{})
	state := asString(msg["state"])

	position := models.Position{
		X: float32(asFloat32(positionData["x"])),
		Y: float32(asFloat32(positionData["y"])),
		Z: float32(asFloat32(positionData["z"])),
	}
	rotation := models.Rotation{Y: float32(asFloat32(rotationData["y"]))}

	c.hub.roomManager.UpdatePlayerPosition(c.playerID, position)
	c.hub.roomManager.UpdatePlayerRotation(c.playerID, rotation)
	if state != "" {
		c.hub.roomManager.UpdatePlayerState(c.playerID, state)
	}

	go func() {
		c.hub.playerSvc.UpdatePlayerPosition(c.playerID, position.X, position.Y, position.Z)
		c.hub.playerSvc.UpdatePlayerRotation(c.playerID, rotation.Y)
	}()

	c.hub.BroadcastToRoom(c.roomID, map[string]interface{}{
		"event":    "player:moved",
		"playerId": c.playerID,
		"position": position,
		"rotation": rotation,
		"state":    state,
	}, c)
}

func (c *Client) handlePlayerAction(msg map[string]interface{}) {
	if c.roomID == 0 {
		return
	}

	action := asString(msg["action"])
	payload := msg["payload"]

	log.Printf("[Handler] Player action: %s from %s", action, c.playerID)

	go c.hub.playerSvc.LogPlayerEvent(c.playerID, c.roomID, "action:"+action, payload)

	c.hub.BroadcastToRoom(c.roomID, map[string]interface{}{
		"event":    "player:action",
		"playerId": c.playerID,
		"action":   action,
		"payload":  payload,
	}, nil)
}

func (c *Client) handleGetRoomState(msg map[string]interface{}) {
	roomID := asInt(msg["roomId"])
	players := c.hub.roomManager.GetRoomPlayers(roomID)

	c.send <- map[string]interface{}{
		"event":     "room:state",
		"roomId":    roomID,
		"players":   players,
		"timestamp": time.Now().UnixMilli(),
	}
}

func (c *Client) handleChat(msg map[string]interface{}) {
	if c.roomID == 0 {
		return
	}

	message := asString(msg["message"])

	c.hub.BroadcastToRoom(c.roomID, map[string]interface{}{
		"event":     "room:message",
		"playerId":  c.playerID,
		"message":   message,
		"timestamp": time.Now().UnixMilli(),
	}, nil)
}

func (h *Hub) BroadcastToRoom(roomID int, message interface{}, excludeClient *Client) {
	players := h.roomManager.GetRoomPlayers(roomID)

	h.playerConnMu.RLock()
	defer h.playerConnMu.RUnlock()

	for _, player := range players {
		if client, ok := h.playerConns[player.ID]; ok {
			if excludeClient != nil && client == excludeClient {
				continue
			}
			select {
			case client.send <- message:
			default:
				log.Printf("⚠️ Client channel full: %s", player.ID)
			}
		}
	}
}
