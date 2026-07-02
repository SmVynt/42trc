package handlers

import (
	"encoding/json"

	"github.com/SmVynt/42trc/back-game/models"
)

type wirePlayer struct {
	I string    `json:"i"`
	U string    `json:"u"`
	P []float32 `json:"p,omitempty"`
	O []float32 `json:"o,omitempty"`
	S *uint8    `json:"s,omitempty"`
}

type wireMessage struct {
	T  int             `json:"t"`
	R  int             `json:"r,omitempty"`
	U  string          `json:"u,omitempty"`
	I  string          `json:"i,omitempty"`
	P  []float32       `json:"p,omitempty"`
	O  []float32       `json:"o,omitempty"`
	S  *uint8          `json:"s,omitempty"`
	A  string          `json:"a,omitempty"`
	D  json.RawMessage `json:"d,omitempty"`
	M  string          `json:"m,omitempty"`
	TS int64           `json:"ts,omitempty"`
	PS []wirePlayer    `json:"ps,omitempty"`
}

var eventToCode = map[string]int{
	"player:join":   0,
	"player:move":   1,
	"player:action": 2,
	"room:chat":     3,
	"room:getState": 4,
	"player:joined": 10,
	"room:players":  11,
	"player:moved":  12,
	"player:left":   13,
	"room:state":    14,
	"room:message":  15,
	"pong":          16,
	"error":         99,
}

var codeToEvent = map[int]string{
	0:  "player:join",
	1:  "player:move",
	2:  "player:action",
	3:  "room:chat",
	4:  "room:getState",
	10: "player:joined",
	11: "room:players",
	12: "player:moved",
	13: "player:left",
	14: "room:state",
	15: "room:message",
	16: "pong",
	99: "error",
}

var playerStateToCode = map[string]uint8{
	"idle": uint8(models.PlayerStateIdle),
	"walk": uint8(models.PlayerStateWalk),
	"run":  uint8(models.PlayerStateRun),
	"jump": uint8(models.PlayerStateJump),
	"sit":  uint8(models.PlayerStateSit),
}

var codeToPlayerState = map[uint8]string{
	uint8(models.PlayerStateIdle): "idle",
	uint8(models.PlayerStateWalk): "walk",
	uint8(models.PlayerStateRun):  "run",
	uint8(models.PlayerStateJump): "jump",
	uint8(models.PlayerStateSit):  "sit",
}

func encodeGameMessage(message interface{}) ([]byte, error) {
	if msg, ok := message.(map[string]interface{}); ok {
		return json.Marshal(encodeWireMessage(msg))
	}

	return json.Marshal(message)
}

func decodeGameMessage(message []byte) (map[string]interface{}, error) {
	var wire wireMessage
	if err := json.Unmarshal(message, &wire); err != nil {
		return nil, err
	}

	event := codeToEvent[wire.T]
	decoded := map[string]interface{}{"event": event}

	switch event {
	case "player:join":
		decoded["roomId"] = wire.R
		decoded["username"] = wire.U
		decoded["playerId"] = wire.I
	case "player:move":
		decoded["position"] = decodePosition(wire.P)
		decoded["rotation"] = decodeRotation(wire.O)
		if wire.S != nil {
			decoded["state"] = decodePlayerState(*wire.S)
		}
	case "player:action":
		decoded["action"] = wire.A
		decoded["payload"] = decodeJSONValue(wire.D)
	case "room:chat":
		decoded["message"] = wire.M
	case "room:getState":
		decoded["roomId"] = wire.R
	case "player:joined":
		decoded["playerId"] = wire.I
		decoded["username"] = wire.U
		decoded["playersInRoom"] = decodePlayers(wire.PS)
	case "room:players":
		decoded["players"] = decodePlayers(wire.PS)
	case "player:moved":
		decoded["playerId"] = wire.I
		decoded["position"] = decodePosition(wire.P)
		decoded["rotation"] = decodeRotation(wire.O)
		if wire.S != nil {
			decoded["state"] = decodePlayerState(*wire.S)
		}
	case "player:left":
		decoded["playerId"] = wire.I
	case "room:state":
		decoded["roomId"] = wire.R
		decoded["players"] = decodePlayers(wire.PS)
		decoded["timestamp"] = wire.TS
	case "room:message":
		decoded["playerId"] = wire.I
		decoded["message"] = wire.M
		decoded["timestamp"] = wire.TS
	case "pong":
		decoded["timestamp"] = wire.TS
	case "error":
		decoded["message"] = wire.M
	}

	return decoded, nil
}

func encodeWireMessage(message map[string]interface{}) wireMessage {
	event, _ := message["event"].(string)
	code := eventToCode[event]

	switch event {
	case "player:join":
		return wireMessage{T: code, R: asInt(message["roomId"]), U: asString(message["username"]), I: asString(message["playerId"])}
	case "player:move":
		return wireMessage{T: code, P: encodePosition(message["position"]), O: encodeRotation(message["rotation"]), S: encodePlayerStatePtr(asString(message["state"]))}
	case "player:action":
		payload, _ := json.Marshal(message["payload"])
		return wireMessage{T: code, A: asString(message["action"]), D: payload}
	case "room:chat":
		return wireMessage{T: code, M: asString(message["message"])}
	case "room:getState":
		return wireMessage{T: code, R: asInt(message["roomId"])}
	case "player:joined":
		return wireMessage{T: code, I: asString(message["playerId"]), U: asString(message["username"]), PS: encodePlayers(message["playersInRoom"])}
	case "room:players":
		return wireMessage{T: code, PS: encodePlayers(message["players"])}
	case "player:moved":
		return wireMessage{T: code, I: asString(message["playerId"]), P: encodePosition(message["position"]), O: encodeRotation(message["rotation"]), S: encodePlayerStatePtr(asString(message["state"]))}
	case "player:left":
		return wireMessage{T: code, I: asString(message["playerId"])}
	case "room:state":
		return wireMessage{T: code, R: asInt(message["roomId"]), PS: encodePlayers(message["players"]), TS: asInt64(message["timestamp"])}
	case "room:message":
		return wireMessage{T: code, I: asString(message["playerId"]), M: asString(message["message"]), TS: asInt64(message["timestamp"])}
	case "pong":
		return wireMessage{T: code, TS: asInt64(message["timestamp"])}
	case "error":
		return wireMessage{T: code, M: asString(message["message"])}
	default:
		return wireMessage{T: code}
	}
}

func encodePlayerStatePtr(state string) *uint8 {
	if state == "" {
		return nil
	}

	code, ok := playerStateToCode[state]
	if !ok {
		code = uint8(models.PlayerStateIdle)
	}

	return &code
}

func decodePlayerState(code uint8) string {
	if state, ok := codeToPlayerState[code]; ok {
		return state
	}

	return "idle"
}

func encodePosition(value interface{}) []float32 {
	switch position := value.(type) {
	case map[string]interface{}:
		return []float32{asFloat32(position["x"]), asFloat32(position["y"]), asFloat32(position["z"])}
	case models.Position:
		return []float32{position.X, position.Y, position.Z}
	case *models.Position:
		if position == nil {
			return nil
		}
		return []float32{position.X, position.Y, position.Z}
	default:
		return nil
	}
}

func decodePosition(value []float32) map[string]interface{} {
	if len(value) < 3 {
		return map[string]interface{}{"x": float32(0), "y": float32(0), "z": float32(0)}
	}

	return map[string]interface{}{"x": value[0], "y": value[1], "z": value[2]}
}

func encodeRotation(value interface{}) []float32 {
	switch rotation := value.(type) {
	case map[string]interface{}:
		return []float32{asFloat32(rotation["y"])}
	case models.Rotation:
		return []float32{rotation.Y}
	case *models.Rotation:
		if rotation == nil {
			return nil
		}
		return []float32{rotation.Y}
	default:
		return nil
	}
}

func decodeRotation(value []float32) map[string]interface{} {
	if len(value) < 1 {
		return map[string]interface{}{"y": float32(0)}
	}

	return map[string]interface{}{"y": value[0]}
}

func encodePlayers(value interface{}) []wirePlayer {
	switch players := value.(type) {
	case []*models.Player:
		encoded := make([]wirePlayer, 0, len(players))
		for _, player := range players {
			encoded = append(encoded, wirePlayer{I: player.ID, U: player.Username, P: []float32{player.Position.X, player.Position.Y, player.Position.Z}, O: []float32{player.Rotation.Y}, S: encodePlayerStatePtr(player.State)})
		}
		return encoded
	case []interface{}:
		encoded := make([]wirePlayer, 0, len(players))
		for _, item := range players {
			player, ok := item.(map[string]interface{})
			if !ok {
				continue
			}
			encoded = append(encoded, wirePlayer{I: asString(player["id"]), U: asString(player["username"]), P: encodePosition(player["position"]), O: encodeRotation(player["rotation"]), S: encodePlayerStatePtr(asString(player["state"]))})
		}
		return encoded
	default:
		return nil
	}
}

func decodePlayers(players []wirePlayer) []map[string]interface{} {
	decoded := make([]map[string]interface{}, 0, len(players))
	for _, player := range players {
		decodedPlayer := map[string]interface{}{
			"id":       player.I,
			"username": player.U,
			"position": decodePosition(player.P),
			"rotation": decodeRotation(player.O),
		}
		if player.S != nil {
			decodedPlayer["state"] = decodePlayerState(*player.S)
		}
		decoded = append(decoded, decodedPlayer)
	}
	return decoded
}

func decodeJSONValue(raw json.RawMessage) interface{} {
	if len(raw) == 0 {
		return nil
	}

	var value interface{}
	if err := json.Unmarshal(raw, &value); err != nil {
		return nil
	}

	return value
}

func asString(value interface{}) string {
	if value == nil {
		return ""
	}

	if str, ok := value.(string); ok {
		return str
	}

	return ""
}

func asInt(value interface{}) int {
	if value == nil {
		return 0
	}

	if number, ok := value.(float64); ok {
		return int(number)
	}

	if number, ok := value.(int); ok {
		return number
	}

	return 0
}

func asInt64(value interface{}) int64 {
	if value == nil {
		return 0
	}

	switch typed := value.(type) {
	case float64:
		return int64(typed)
	case int:
		return int64(typed)
	case int64:
		return typed
	default:
		return 0
	}
}

func asFloat32(value interface{}) float32 {
	if value == nil {
		return 0
	}

	if number, ok := value.(float64); ok {
		return float32(number)
	}

	if number, ok := value.(float32); ok {
		return number
	}

	return 0
}
