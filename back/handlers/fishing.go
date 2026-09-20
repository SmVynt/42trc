package handlers

import (
	"math/rand"
	"net/http"

	"github.com/SmVynt/42trc/back/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CastFish picks a random fish weighted by Rarity (higher = more common)
// and returns it. The pick happens server-side so the client can't choose.
func CastFish(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var fish []models.Fish
		if err := db.Find(&fish).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load fish"})
			return
		}
		if len(fish) == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "no fish available"})
			return
		}

		// Sum all weights.
		total := 0
		for _, f := range fish {
			total += f.Rarity
		}

		// Roll a number in [0, total) and walk the list subtracting weights.
		roll := rand.Intn(total)
		for _, f := range fish {
			roll -= f.Rarity
			if roll < 0 {
				c.JSON(http.StatusOK, f)
				return
			}
		}

		// Fallback (shouldn't happen if total > 0).
		c.JSON(http.StatusOK, fish[len(fish)-1])
	}
}

// GetRods returns all rods (catalog) for the client to choose from.
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

// CreateRods inserts the base rods if they don't exist yet.
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

// CreateFish inserts the base fish if they don't exist yet.
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
	return nil
}
