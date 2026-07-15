package handlers

import (
	"net/http"
	"strings"

	"github.com/SmVynt/42trc/back/internal/auth"
	"github.com/SmVynt/42trc/back/models"
	"github.com/SmVynt/42trc/back/services"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type coinFlipRequest struct {
	BetAmount int  `json:"betAmount"`
	Guess     string `json:"guess"`
}

func HandleCoinFlip(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		token := ""
		if strings.HasPrefix(authHeader, "Bearer ") {
			token = strings.TrimPrefix(authHeader, "Bearer ")
		}
		if token == "" {
			token = c.Query("token")
		}
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Missing auth token."})
			return
		}

		claims, err := auth.ParseSessionToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid or expired token."})
			return
		}

		var body coinFlipRequest
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request body."})
			return
		}

		guess := strings.ToLower(strings.TrimSpace(body.Guess))
		if body.BetAmount <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Bet amount must be greater than zero."})
			return
		}
		if guess != "heads" && guess != "tails" {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Guess must be 'heads' or 'tails'."})
			return
		}

		var user models.User
		if err := db.Where("email = ?", claims.Email).First(&user).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"message": "User not found."})
			return
		}

		service := services.NewGamblingService(db)
		logEntry, err := service.PlayCoinFlip(user.ID, body.BetAmount, guess)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}

		if err := db.First(&user, user.ID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to refresh user wallet."})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message":   "Coin flip completed.",
			"result":    logEntry.Result,
			"winAmount": logEntry.WinAmount,
			"betAmount": logEntry.BetAmount,
			"wallet":    user.Wallet,
		})
	}
}