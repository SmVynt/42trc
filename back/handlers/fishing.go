package handlers

import (
	"errors"
	"math/rand"
	"net/http"
	"strings"
	"sync"

	"github.com/SmVynt/42trc/back/internal/auth"
	"github.com/SmVynt/42trc/back/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// pendingCasts holds the fish rolled by CastFish for each user until it is
// caught. CatchFish only saves this fish, so the client can't pick one.
var (
	pendingCasts   = map[uint]uint{} // userID -> fishID
	pendingCastsMu sync.Mutex
)

// fishItemID maps a fish to its inventory item, e.g. "Carp" -> "fish_carp".
func fishItemID(name string) string {
	return "fish_" + strings.ToLower(name)
}

// CastFish picks a random fish weighted by Rarity (higher = more common)
// and returns it. The pick happens server-side so the client can't choose.
func CastFish(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, ok := currentUserFromRequest(db, c)
		if !ok {
			return
		}

		var fish []models.Fish
		if err := db.Find(&fish).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load fish"})
			return
		}
		if len(fish) == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "no fish available"})
			return
		}

		// Sum all weights
		total := 0
		for _, f := range fish {
			total += f.Rarity
		}

		// Roll a number in [0, total) and walk the list subtracting weights.
		picked := fish[len(fish)-1] // fallback (shouldn't happen if total > 0)
		roll := rand.Intn(total)
		for _, f := range fish {
			roll -= f.Rarity
			if roll < 0 {
				picked = f
				break
			}
		}

		pendingCastsMu.Lock()
		pendingCasts[user.ID] = picked.ID
		pendingCastsMu.Unlock()

		c.JSON(http.StatusOK, picked)
	}
}

// GetRods returns all rods (catalog) for the client to choose from
func GetRods(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var rods []models.Rod
		if err := db.Order("id").Find(&rods).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load rods"})
			return
		}
		c.JSON(http.StatusOK, rods)
	}
}

// CreateRods inserts the base rods if they don't exist yet
func CreateRods(db *gorm.DB) error {
	rods := []models.Rod{
		{Name: "Piscine Rod", BarHeight: 18, Control: 0.8, CatchRate: 0.28},
		{Name: "Cadet Rod", BarHeight: 24, Control: 1.0, CatchRate: 0.35},
		{Name: "Internship Rod", BarHeight: 30, Control: 1.3, CatchRate: 0.45},
	}
	for i := range rods {
		if err := db.Where("name = ?", rods[i].Name).FirstOrCreate(&rods[i]).Error; err != nil {
			return err
		}
	}
	return nil
}

// CreateFish inserts the base fish if they don't exist yet
func CreateFish(db *gorm.DB) error {
	fish := []models.Fish{
		{Name: "Carp", Speed: 0.28, EscapeRate: 0.35, Rarity: 5}, // slow, forgiving
		{Name: "Bass", Speed: 0.42, EscapeRate: 0.45, Rarity: 3},
		{Name: "Pike", Speed: 0.62, EscapeRate: 0.60, Rarity: 1}, // fast, punishing
	}
	for i := range fish {
		if err := db.Where("name = ?", fish[i].Name).FirstOrCreate(&fish[i]).Error; err != nil {
			return err
		}
	}

	items := []models.Item{
		{ID: fishItemID("Carp"), Name: "Carp", Category: "fish", IsSellable: true, Price: 5},
		{ID: fishItemID("Bass"), Name: "Bass", Category: "fish", IsSellable: true, Price: 10},
		{ID: fishItemID("Pike"), Name: "Pike", Category: "fish", IsSellable: true, Price: 25},
	}
	for i := range items {
		if err := db.Where("id = ?", items[i].ID).FirstOrCreate(&items[i]).Error; err != nil {
			return err
		}
	}
	return nil
}

// addFishToInventory gives the user one fish: new inventory row or quantity +1.
func addFishToInventory(tx *gorm.DB, userID uint, itemID string) error {
	var inv models.UserInventory
	err := tx.Where("user_id = ? AND item_id = ?", userID, itemID).First(&inv).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return createInventoryItem(tx, userID, itemID)
	}
	if err != nil {
		return err
	}
	return incrementInventoryItem(tx, inv.ID)
}

// createInventoryItem adds a new inventory row with quantity 1.
func createInventoryItem(tx *gorm.DB, userID uint, itemID string) error {
	return tx.Create(&models.UserInventory{
		UserID:   userID,
		ItemID:   itemID,
		Quantity: 1,
	}).Error
}

// incrementInventoryItem adds 1 to an existing inventory row.
func incrementInventoryItem(tx *gorm.DB, inventoryID uint) error {
	return tx.Model(&models.UserInventory{}).
		Where("id = ?", inventoryID).
		Update("quantity", gorm.Expr("quantity + ?", 1)).Error
}

// CatchFish saves the user's pending fish (rolled by CastFish) as a catch.
func CatchFish(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, ok := currentUserFromRequest(db, c)
		if !ok {
			return
		}

		pendingCastsMu.Lock()
		fishID, found := pendingCasts[user.ID]
		delete(pendingCasts, user.ID)
		pendingCastsMu.Unlock()

		if !found {
			c.JSON(http.StatusBadRequest, gin.H{"message": "No fish on the line."})
			return
		}

		var fish models.Fish
		if err := db.First(&fish, fishID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"message": "Fish not found."})
			return
		}

		catch := models.FishCatch{
			UserID: user.ID,
			FishID: fish.ID,
		}

		// Save the catch (leaderboard) and add the fish to the inventory together.
		err := db.Transaction(func(tx *gorm.DB) error {
			if err := tx.Create(&catch).Error; err != nil {
				return err
			}
			return addFishToInventory(tx, user.ID, fishItemID(fish.Name))
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to save catch."})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"message": "Fish caught.",
			"catch":   catch,
			"fish":    fish,
		})
	}
}

// EquipRod stores which rod the current user has equipped.
func EquipRod(db *gorm.DB) gin.HandlerFunc {
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

		var body struct {
			RodID uint `json:"rodId"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request body."})
			return
		}

		// verify the rod exists
		var rod models.Rod
		if err := db.First(&rod, body.RodID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"message": "Rod not found."})
			return
		}

		user.EquippedRodID = &rod.ID
		if err := db.Save(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to equip rod."})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Rod equipped.",
			"user":    userResponse(user),
		})
	}
}
