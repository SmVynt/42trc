package services

import (
	"sync"
)

type MatchPair struct {
	FirstPlayerID  string
	SecondPlayerID string
}

type Matchmaking struct {
	mu              sync.Mutex
	waitingPlayerID string
}

func (q *Matchmaking) JoinQueue(playerID string) *MatchPair {
	if playerID == "" {
		return nil
	}

	q.mu.Lock()
	defer q.mu.Unlock()

	if q.waitingPlayerID == playerID {
		return nil
	}
	if q.waitingPlayerID == "" {
		q.waitingPlayerID = playerID
		return nil
	}

	pair := &MatchPair{
		FirstPlayerID:  q.waitingPlayerID,
		SecondPlayerID: playerID,
	}
	q.waitingPlayerID = ""
	return pair
}

func (q *Matchmaking) LeaveQueue(playerID string) bool {
	q.mu.Lock()
	defer q.mu.Unlock()

	if playerID == "" || q.waitingPlayerID != playerID {
		return false
	}

	q.waitingPlayerID = ""
	return true
}
