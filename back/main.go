package main

import (
	"log"
	"os"

	"github.com/SmVynt/42trc/back/database"
	"github.com/SmVynt/42trc/back/handlers"
	"github.com/SmVynt/42trc/back/models"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load("../.env")

	database.Connect()

	err := database.DB.AutoMigrate(
		&models.Item{},
		&models.GamblingLog{},
		&models.User{},
		&models.UserCursus{},
		&models.UserProject{},
		&models.UserInventory{},
	)
	if err != nil {
		log.Fatal("AutoMigrate failed: ", err)
	}

	r := gin.Default()

	r.GET("/", func(c *gin.Context) {
		c.String(200, "Server works!")
	})

	api := r.Group("/api")
	{
		api.GET("/users/levels", handlers.GetLevels(database.DB))
		api.POST("/auth/oauth/42/callback", handlers.Handle42Callback(database.DB))
		api.GET("/auth/me", handlers.GetMe(database.DB))
		api.POST("/auth/test-login", handlers.HandleTestLogin(database.DB))
		api.GET("/users/:username/clothing", handlers.GetUserClothing(database.DB))
		api.POST("/users/me/buy-item", handlers.BuyItem(database.DB))
		api.POST("/gambling/coinflip", handlers.HandleCoinFlip(database.DB))
	}

	apiV1 := r.Group("/api/v1")
	{
		apiV1.GET("/inventory", handlers.GetInventory(database.DB))
		apiV1.POST("/inventory/sell", handlers.SellInventory(database.DB))
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "5055"
	}
	r.Run(":" + port)
}
