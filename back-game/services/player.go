package services

import (
	"context"
	"fmt"
	"log"

	"github.com/SmVynt/42trc/back-game/models"
)

type PlayerService struct {
	db *DatabaseService
}

func NewPlayerService(db *DatabaseService) *PlayerService {
	return &PlayerService{db: db}
}

func (ps *PlayerService) CreatePlayer(playerID, username string, roomID int) error {
	ctx := context.Background()

	query := `
		INSERT INTO players (id, room_id, username, x, y, z, rotation_y)
		VALUES ($1, $2, $3, 0, 0, 0, 0)
		ON CONFLICT (id) DO UPDATE SET room_id = $2, username = $3
	`

	if err := ps.db.Exec(ctx, query, playerID, roomID, username); err != nil {
		log.Printf("❌ Error creating player: %v", err)
		return err
	}

	log.Printf("✅ Player created: %s in room %d", playerID, roomID)
	return nil
}

func (ps *PlayerService) UpdatePlayerPosition(playerID string, x, y, z float32) {
	ctx := context.Background()

	query := `
		UPDATE players
		SET x = $2, y = $3, z = $4, last_update = CURRENT_TIMESTAMP
		WHERE id = $1
	`

	if err := ps.db.Exec(ctx, query, playerID, x, y, z); err != nil {
		log.Printf("Error updating player position: %v", err)
	}
}

func (ps *PlayerService) UpdatePlayerRotation(playerID string, rotationY float32) {
	ctx := context.Background()

	query := `
		UPDATE players
		SET rotation_y = $2, last_update = CURRENT_TIMESTAMP
		WHERE id = $1
	`

	if err := ps.db.Exec(ctx, query, playerID, rotationY); err != nil {
		log.Printf("Error updating player rotation: %v", err)
	}
}

func (ps *PlayerService) GetPlayer(playerID string) (*models.Player, error) {
	ctx := context.Background()

	var player models.Player
	query := `
		SELECT id, room_id, username, x, y, z, rotation_y
		FROM players
		WHERE id = $1
	`

	row := ps.db.QueryRow(ctx, query, playerID)
	if err := row.Scan(&player.ID, &player.RoomID, &player.Username,
		&player.Position.X, &player.Position.Y, &player.Position.Z,
		&player.Rotation.Y); err != nil {
		return nil, err
	}

	return &player, nil
}

func (ps *PlayerService) GetRoomPlayers(roomID int) ([]*models.Player, error) {
	ctx := context.Background()

	query := `
		SELECT id, room_id, username, x, y, z, rotation_y
		FROM players
		WHERE room_id = $1
	`

	rows, err := ps.db.Query(ctx, query, roomID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var players []*models.Player
	for rows.Next() {
		var player models.Player
		if err := rows.Scan(&player.ID, &player.RoomID, &player.Username,
			&player.Position.X, &player.Position.Y, &player.Position.Z,
			&player.Rotation.Y); err != nil {
			log.Printf("Error scanning player: %v", err)
			continue
		}
		players = append(players, &player)
	}

	return players, nil
}

func (ps *PlayerService) DeletePlayer(playerID string) error {
	ctx := context.Background()
	query := `DELETE FROM players WHERE id = $1`
	return ps.db.Exec(ctx, query, playerID)
}

func (ps *PlayerService) LogPlayerEvent(playerID string, roomID int, eventType string, eventData interface{}) error {
	ctx := context.Background()

	query := `
		INSERT INTO game_events (player_id, room_id, event_type, event_data)
		VALUES ($1, $2, $3, $4)
	`

	return ps.db.Exec(ctx, query, playerID, roomID, eventType, fmt.Sprintf("%v", eventData))
}

func (ps *PlayerService) CreateRoom(roomID int, name string, maxPlayers int) error {
	ctx := context.Background()

	query := `
		INSERT INTO rooms (id, name, max_players)
		VALUES ($1, $2, $3)
		ON CONFLICT (id) DO NOTHING
	`

	return ps.db.Exec(ctx, query, roomID, name, maxPlayers)
}

func (ps *PlayerService) GetRoom(roomID int) error {
	ctx := context.Background()

	query := `SELECT id FROM rooms WHERE id = $1`
	row := ps.db.QueryRow(ctx, query, roomID)

	var id int
	return row.Scan(&id)
}
