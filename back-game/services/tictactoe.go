package services

import "errors"

type TicTacToeMatch struct {
	ID        string    `json:"id"`
	XPlayerID string    `json:"xPlayerId"`
	OPlayerID string    `json:"oPlayerId"`
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
