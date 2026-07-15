package services

import (
	"errors"
	"math/rand"
	"time"
	"github.com/SmVynt/42trc/back/models"
	"gorm.io/gorm"
)

type GamblingService struct {
	db *gorm.DB
}

func NewGamblingService(db *gorm.DB) *GamblingService {
	rand.Seed(time.Now().UnixNano())
	return &GamblingService{db: db}
}

func (s *GamblingService) PlayCoinFlip(userID uint, betAmount int, guess string) (*models.GamblingLog, error) {
	if betAmount <= 0 {
		return nil, errors.New("bet amount must be greater than zero")
	}
	if guess != "heads" && guess != "tails" {
		return nil, errors.New("you must choose either 'heads' or 'tails'")
	}

	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var user models.User
	if err := tx.First(&user, userID).Error; err != nil {
		tx.Rollback()
		return nil, errors.New("user not found")
	}

	if user.Wallet < betAmount {
		tx.Rollback()
		return nil, errors.New("insufficient coins in wallet")
	}

	user.Wallet -= betAmount

	flipResult := "heads"
	if rand.Intn(2) == 1 {
		flipResult = "tails"
	}

	var winAmount int = 0
	if guess == flipResult {
		winAmount = betAmount * 2
		user.Wallet += winAmount
	}

	if err := tx.Save(&user).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	logEntry := models.GamblingLog{
		UserID:    user.ID,
		GameType:  "coin_flip",
		BetAmount: betAmount,
		WinAmount: winAmount,
		Result:    flipResult,
	}
	if err := tx.Create(&logEntry).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	return &logEntry, tx.Commit().Error
}