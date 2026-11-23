package handlers

func (c *Client) handleTicTacToeMove(payload interface{}) {
	fields, _ := payload.(map[string]interface{})
	matchID := asString(fields["matchId"])
	cell, hasCell := fields["cell"].(float64)
	version, hasVersion := fields["version"].(float64)

	h := c.hub
	h.playerConnMu.Lock()
	defer h.playerConnMu.Unlock()

	if h.playerConns[c.playerID] != c {
		return
	}
	match, exists := h.matches[matchID]
	if !exists || h.matchByPlayer[c.playerID] != matchID {
		c.sendMatchmakingUpdate("tictactoe:error", "match is unavailable")
		return
	}
	if !hasCell || cell < 0 || cell >= float64(len(match.Board)) || cell != float64(int(cell)) || !hasVersion {
		c.sendMatchmakingUpdate("tictactoe:error", "invalid move payload")
		return
	}
	if version != float64(match.Version) {
		c.sendMatchmakingUpdate("tictactoe:state", match)
		return
	}
	if err := match.ApplyMove(c.playerID, int(cell)); err != nil {
		c.sendMatchmakingUpdate("tictactoe:error", err.Error())
		return
	}

	if match.Result == "" {
		h.matches[matchID] = match
	} else {
		delete(h.matches, matchID)
		delete(h.matchByPlayer, match.XPlayerID)
		delete(h.matchByPlayer, match.OPlayerID)
	}
	for _, playerID := range [2]string{match.XPlayerID, match.OPlayerID} {
		if player := h.playerConns[playerID]; player != nil {
			player.sendMatchmakingUpdate("tictactoe:state", match)
		}
	}
}
