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
		&models.Items{},
		&models.User{},
		&models.UserCursus{},
		&models.UserProject{},
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
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "5055"
	}
	r.Run(":" + port)
}