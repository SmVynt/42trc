package services

import (
	"context"
	"errors"
)

type TicTacToeMatch struct {
	ID        string    `json:"id"`
	XPlayerID string    `json:"xPlayerId"`
	OPlayerID string    `json:"oPlayerId"`
	XUserID   int64     `json:"-"`
	OUserID   int64     `json:"-"`
	Board     [9]string `json:"board"`
	Turn      string    `json:"turn"`
	Version   int       `json:"version"`
	Result    string    `json:"result,omitempty"`
}

var winningLines = [8][3]int{
	{0, 1, 2}, {3, 4, 5}, {6, 7, 8},
	{0, 3, 6}, {1, 4, 7}, {2, 5, 8},
	{0, 4, 8}, {2, 4, 6},
}

func (m *TicTacToeMatch) ApplyMove(playerID string, cell int) error {
	if m.Result != "" {
		return errors.New("match is finished")
	}
	currentPlayer, nextTurn := m.XPlayerID, "O"
	if m.Turn == "O" {
		currentPlayer, nextTurn = m.OPlayerID, "X"
	}
	if playerID != currentPlayer {
		return errors.New("it is not your turn")
	}
	if cell < 0 || cell >= len(m.Board) || m.Board[cell] != "" {
		return errors.New("cell is unavailable")
	}

	m.Board[cell] = m.Turn
	m.Version++
	for _, line := range winningLines {
		if m.Board[line[0]] == m.Turn && m.Board[line[1]] == m.Turn && m.Board[line[2]] == m.Turn {
			m.Result = m.Turn
			break
		}
	}
	if m.Result == "" && m.Version == len(m.Board)+1 {
		m.Result = "draw"
	}
	m.Turn = nextTurn
	if m.Result != "" {
		m.Turn = ""
	}
	return nil
}

func (ps *PlayerService) UpdateTicTacToeStats(ctx context.Context, match TicTacToeMatch) error {
	tx, err := ps.db.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var winnerID int64
	switch match.Result {
	case "X":
		winnerID = match.XUserID
	case "O":
		winnerID = match.OUserID
	case "draw":
	default:
		return errors.New("match has no result")
	}

	updated, err := tx.Exec(ctx, `
		UPDATE users
		SET games_played = games_played + 1,
		    wins = wins + CASE WHEN id = $3 THEN 1 ELSE 0 END,
		    updated_at = CURRENT_TIMESTAMP
		WHERE id IN ($1, $2)
	`, match.XUserID, match.OUserID, winnerID)
	if err != nil {
		return err
	}
	if updated.RowsAffected() != 2 {
		return errors.New("tic-tac-toe requires two existing user profiles")
	}
	return tx.Commit(ctx)
}
