package handlers

import (
	"net/http"
	"strings"

	"github.com/SmVynt/42trc/back/internal/api42"
	"github.com/SmVynt/42trc/back/internal/auth"
	"github.com/SmVynt/42trc/back/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type callbackBody struct {
	Code  string `json:"code"`
	State string `json:"state"`
}

// userResponse mirrors the shape the frontend expects
func userResponse(u models.User) gin.H {
	return gin.H{
		"id":              u.ID,
		"username":        u.Username,
		"intra":           u.Intra,
		"email":           u.Email,
		"displayname":     u.Displayname,
		"image":           u.Image,
		"wallet":          u.Wallet,
		"emailVerifiedAt": u.EmailVerifiedAt,
		"lastLoginAt":     u.LastLoginAt,
		"wallet":          u.Wallet,
		"equippedHat":     u.EquippedHat,
		"equippedGlasses": u.EquippedGlasses,
		"equippedFace":    u.EquippedFace,
		"ownedItems":      u.OwnedItems,
		"stats": gin.H{
			"gamesPlayed": u.GamesPlayed,
			"wins":        u.Wins,
			"points":      u.Points,
		},
	}
}

// Handle42Callback exchanges the OAuth code, upserts the user, returns a session JWT
func Handle42Callback(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body callbackBody
		if err := c.ShouldBindJSON(&body); err != nil || body.Code == "" {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Authorization code is required."})
			return
		}

		ctx := c.Request.Context()

		accessToken, err := api42.ExchangeCode(ctx, body.Code, body.State)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"message": err.Error()})
			return
		}

		profile, err := api42.FetchMe(ctx, accessToken)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"message": err.Error()})
			return
		}

		email := strings.ToLower(strings.TrimSpace(profile.Email))
		if email == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "42 profile has no email."})
			return
		}
		username := strings.ToLower(strings.TrimSpace(profile.Login))
		if username == "" {
			username = email
		}
		intra := profile.Login
		if intra == "" {
			intra = username
		}

		user := models.User{
			Username: username,
			Email:    email,
			Intra:    intra,
		}
		// Upsert by email, refresh login timestamps
		if err := db.Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "email"}},
			DoUpdates: clause.Assignments(map[string]interface{}{
				"intra":             intra,
				"email_verified_at": gorm.Expr("now()"),
				"last_login_at":     gorm.Expr("now()"),
				"updated_at":        gorm.Expr("now()"),
			}),
		}).Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to save user."})
			return
		}

		// Reload to get the row (id + refreshed fields)
		var saved models.User
		if err := db.Where("email = ?", email).First(&saved).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to load user."})
			return
		}

		token, err := auth.GenerateSessionToken(email)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to issue session token."})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "42 OAuth login complete.",
			"user":    userResponse(saved),
			"token":   token,
		})
	}
}

// GetMe returns the current user based on the session JWT
func GetMe(db *gorm.DB) gin.HandlerFunc {
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

		var user models.User
		if err := db.Where("email = ?", claims.Email).First(&user).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"message": "User not found."})
			return
		}

		c.JSON(http.StatusOK, gin.H{"user": userResponse(user)})
	}
}

type testLoginBody struct {
	Username string `json:"username"`
}

// HandleTestLogin logs in a test user with a custom username (intra name)
func HandleTestLogin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body testLoginBody
		if err := c.ShouldBindJSON(&body); err != nil || body.Username == "" {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Username is required."})
			return
		}

		username := strings.ToLower(strings.TrimSpace(body.Username))
		email := username + "@test.com"
		intra := body.Username

		user := models.User{
			Username: username,
			Email:    email,
			Intra:    intra,
			Wallet:   1000,
		}

		// Upsert by email or username, refresh login timestamps
		if err := db.Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "email"}},
			DoUpdates: clause.Assignments(map[string]interface{}{
				"username":          username,
				"intra":             intra,
				"email_verified_at": gorm.Expr("now()"),
				"last_login_at":     gorm.Expr("now()"),
				"updated_at":        gorm.Expr("now()"),
			}),
		}).Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to save test user."})
			return
		}

		// Reload to get the row (id + refreshed fields)
		var saved models.User
		if err := db.Where("email = ?", email).First(&saved).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to load test user."})
			return
		}

		token, err := auth.GenerateSessionToken(email)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to issue session token."})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Test login complete.",
			"user":    userResponse(saved),
			"token":   token,
		})
	}
}

// GetUserClothing returns the equipped clothing of a user by username
func GetUserClothing(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		username := c.Param("username")
		var user models.User
		if err := db.Where("username = ?", strings.ToLower(username)).First(&user).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"message": "User not found."})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"equippedHat":     user.EquippedHat,
			"equippedGlasses": user.EquippedGlasses,
			"equippedFace":    user.EquippedFace,
		})
	}
}

type buyItemBody struct {
	ItemID   string `json:"itemId"`
	Category string `json:"category"`
	Price    int    `json:"price"`
}

// BuyItem buys an item, updates the user's wallet, and equips it
func BuyItem(db *gorm.DB) gin.HandlerFunc {
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

		var user models.User
		if err := db.Where("email = ?", claims.Email).First(&user).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"message": "User not found."})
			return
		}

		var body buyItemBody
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request body."})
			return
		}

		// Check if user already owns the item
		ownedItems := strings.Split(user.OwnedItems, ",")
		isOwned := false
		for _, item := range ownedItems {
			if item == body.ItemID {
				isOwned = true
				break
			}
		}

		// If not owned, check balance and deduct price
		if !isOwned {
			if user.Wallet < body.Price {
				c.JSON(http.StatusBadRequest, gin.H{"message": "Insufficient coins."})
				return
			}
			user.Wallet -= body.Price
			if user.OwnedItems == "" {
				user.OwnedItems = body.ItemID
			} else {
				user.OwnedItems = user.OwnedItems + "," + body.ItemID
			}
		}

		switch strings.ToLower(body.Category) {
		case "hats":
			user.EquippedHat = body.ItemID
		case "glasses":
			user.EquippedGlasses = body.ItemID
		case "masks", "face":
			user.EquippedFace = body.ItemID
		}

		if err := db.Save(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to complete purchase."})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Purchase successful.",
			"user":    userResponse(user),
		})
	}
}