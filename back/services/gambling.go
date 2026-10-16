package services

import (
	cryptorand "crypto/rand"
	"encoding/json"
	"errors"
	"math"
	"math/big"

	"github.com/SmVynt/42trc/back/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type GamblingService struct {
	db *gorm.DB
}

func NewGamblingService(db *gorm.DB) *GamblingService {
	return &GamblingService{db: db}
}

func (s *GamblingService) PlayCoinFlip(userID uint, betAmount int, guess string) (*models.GamblingLog, error) {
	if betAmount <= 0 {
		return nil, errors.New("bet amount must be greater than zero")
	}
	if guess != "heads" && guess != "tails" {
		return nil, errors.New("you must choose either 'heads' or 'tails'")
	}

	var logEntry models.GamblingLog
	err := s.db.Transaction(func(tx *gorm.DB) error {
		user, err := lockGamblingUser(tx, userID, betAmount)
		if err != nil {
			return err
		}

		flipResult, err := randomIndex(2)
		if err != nil {
			return err
		}
		result := "heads"
		if flipResult == 1 {
			result = "tails"
		}

		winAmount := 0
		if guess == result {
			winAmount = betAmount * 2
		}
		if err := settleGamblingRound(tx, user, betAmount, winAmount); err != nil {
			return err
		}

		logEntry = models.GamblingLog{UserID: user.ID, GameType: "coin_flip", BetAmount: betAmount, WinAmount: winAmount, Result: result}
		return tx.Create(&logEntry).Error
	})
	if err != nil {
		return nil, err
	}
	return &logEntry, nil
}

type SlotOutcome struct {
	Symbols    [3]string `json:"symbols"`
	WinAmount  int       `json:"winAmount"`
	Multiplier int       `json:"multiplier"`
	Message    string    `json:"message"`
}

var slotSymbols = [...]string{"🌴", "🍍", "🐚", "🔔", "💎"}

// PlaySlotMachine resolves each reel and payout on the server, then persists
// the wallet change and round record in the same locked transaction.
func (s *GamblingService) PlaySlotMachine(userID uint, betAmount int) (*models.GamblingLog, SlotOutcome, error) {
	if betAmount <= 0 {
		return nil, SlotOutcome{}, errors.New("bet amount must be greater than zero")
	}

	var logEntry models.GamblingLog
	var outcome SlotOutcome
	err := s.db.Transaction(func(tx *gorm.DB) error {
		user, err := lockGamblingUser(tx, userID, betAmount)
		if err != nil {
			return err
		}

		for reel := range outcome.Symbols {
			index, err := randomIndex(len(slotSymbols))
			if err != nil {
				return err
			}
			outcome.Symbols[reel] = slotSymbols[index]
		}

		// Payout amounts are total returns, including the original bet.
		payouts := map[string]int{"🌴": 2, "🍍": 3, "🐚": 4, "🔔": 8, "💎": 20}
		if outcome.Symbols[0] == outcome.Symbols[1] && outcome.Symbols[1] == outcome.Symbols[2] {
			outcome.Multiplier = payouts[outcome.Symbols[0]]
			outcome.WinAmount = betAmount * outcome.Multiplier
			outcome.Message = "Three of a kind!"
		} else if outcome.Symbols[0] == outcome.Symbols[1] || outcome.Symbols[1] == outcome.Symbols[2] || outcome.Symbols[0] == outcome.Symbols[2] {
			outcome.Multiplier = 1
			outcome.WinAmount = betAmount
			outcome.Message = "A matching pair returns your bet."
		} else {
			outcome.Message = "No match this time."
		}

		if err := settleGamblingRound(tx, user, betAmount, outcome.WinAmount); err != nil {
			return err
		}
		encoded, err := json.Marshal(outcome)
		if err != nil {
			return err
		}
		logEntry = models.GamblingLog{
			UserID: user.ID, GameType: "slot_machine", BetAmount: betAmount,
			WinAmount: outcome.WinAmount, Result: string(encoded),
		}
		return tx.Create(&logEntry).Error
	})
	if err != nil {
		return nil, SlotOutcome{}, err
	}
	return &logEntry, outcome, nil
}

func lockGamblingUser(tx *gorm.DB, userID uint, betAmount int) (*models.User, error) {
	var user models.User
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	if user.Wallet < betAmount {
		return nil, errors.New("insufficient coins in wallet")
	}
	return &user, nil
}

func settleGamblingRound(tx *gorm.DB, user *models.User, betAmount, payout int) error {
	// User.wallet is a PostgreSQL integer, so reject rounds that cannot fit it.
	newBalance := int64(user.Wallet) - int64(betAmount) + int64(payout)
	if newBalance < 0 || newBalance > math.MaxInt32 {
		return errors.New("wallet balance limit would be exceeded")
	}
	user.Wallet = int(newBalance)
	return tx.Save(user).Error
}

func randomIndex(size int) (int, error) {
	value, err := cryptorand.Int(cryptorand.Reader, big.NewInt(int64(size)))
	if err != nil {
		return 0, err
	}
	return int(value.Int64()), nil
}
