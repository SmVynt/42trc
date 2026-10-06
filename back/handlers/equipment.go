package handlers

import (
	"net/http"
	"strings"

	"github.com/SmVynt/42trc/back/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type equipItemRequest struct {
	ItemID   string `json:"itemId"`
	Category string `json:"category"`
}

func equippedCategory(category string) string {
	switch strings.ToLower(strings.TrimSpace(category)) {
	case "hats", "hat":
		return "hats"
	case "glasses", "glass":
		return "glasses"
	case "masks", "mask", "face":
		return "face"
	default:
		return ""
	}
}

func ownsItem(user models.User, itemID string) bool {
	for _, ownedItem := range strings.Split(user.OwnedItems, ",") {
		if strings.TrimSpace(ownedItem) == itemID {
			return true
		}
	}
	return false
}

func itemMatchesCategory(itemID string, category string) bool {
	itemID = strings.ToLower(itemID)
	switch category {
	case "hats":
		return strings.HasPrefix(itemID, "hat-")
	case "glasses":
		return strings.HasPrefix(itemID, "glasses-")
	case "face":
		return strings.HasPrefix(itemID, "face-") || strings.HasPrefix(itemID, "mask-")
	default:
		return false
	}
}

// EquipItem persists an owned cosmetic in the user's equipment slot.
func EquipItem(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, ok := currentUserFromRequest(db, c)
		if !ok {
			return
		}

		var body equipItemRequest
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request body."})
			return
		}

		category := equippedCategory(body.Category)
		if category == "" {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Unsupported equipment category."})
			return
		}

		itemID := strings.TrimSpace(body.ItemID)
		if itemID != "" && !ownsItem(*user, itemID) {
			c.JSON(http.StatusForbidden, gin.H{"message": "You do not own this item."})
			return
		}
		if itemID != "" && !itemMatchesCategory(itemID, category) {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Item does not belong to this equipment slot."})
			return
		}

		switch category {
		case "hats":
			user.EquippedHat = itemID
		case "glasses":
			user.EquippedGlasses = itemID
		case "face":
			user.EquippedFace = itemID
		}

		if err := db.Save(user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to save equipment."})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Equipment updated.",
			"user":    userResponse(*user),
		})
	}
}
