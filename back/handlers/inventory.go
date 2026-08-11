package handlers

import (
	"net/http"
	"strings"

	"github.com/SmVynt/42trc/back/internal/auth"
	"github.com/SmVynt/42trc/back/models"
	"github.com/SmVynt/42trc/back/services"
	"github.com/SmVynt/42trc/back/stores"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type inventorySellRequest struct {
	InventoryID uint `json:"inventory_id"`
	Quantity    int  `json:"quantity"`
}

func currentUserFromRequest(db *gorm.DB, c *gin.Context) (*models.User, bool) {
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
		return nil, false
	}

	claims, err := auth.ParseSessionToken(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid or expired token."})
		return nil, false
	}

	var user models.User
	if err := db.Where("email = ?", claims.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User not found."})
		return nil, false
	}

	return &user, true
}

func GetInventory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, ok := currentUserFromRequest(db, c)
		if !ok {
			return
		}

		tab := strings.TrimSpace(c.Query("tab"))
		if tab == "" {
			c.JSON(http.StatusBadRequest, gin.H{"message": "tab is required."})
			return
		}

		service := services.NewInventoryService(db)
		inventory, err := service.List(user.ID, tab)
		if err != nil {
			if err == stores.ErrInvalidInventoryTab {
				c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to load inventory."})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"inventory": inventory,
			"tab":       strings.ToLower(tab),
		})
	}
}

func SellInventory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, ok := currentUserFromRequest(db, c)
		if !ok {
			return
		}

		var body inventorySellRequest
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request body."})
			return
		}

		service := services.NewInventoryService(db)
		result, err := service.Sell(user.ID, body.InventoryID, body.Quantity)
		if err != nil {
			switch err {
			case services.ErrInventoryNotFound:
				c.JSON(http.StatusNotFound, gin.H{"message": err.Error()})
			case services.ErrInventoryForbidden:
				c.JSON(http.StatusForbidden, gin.H{"message": err.Error()})
			case services.ErrItemNotSellable, services.ErrInsufficientQuantity, services.ErrInvalidSellQuantity:
				c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			default:
				c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to sell inventory item."})
			}
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message":           result.Message(),
			"wallet":            result.Wallet,
			"remainingQuantity": result.RemainingAmount,
			"inventoryRemoved":  result.InventoryRemoved,
			"item": gin.H{
				"id":    result.Item.ID,
				"name":  result.Item.Name,
				"price": result.Item.Price,
			},
		})
	}
}
