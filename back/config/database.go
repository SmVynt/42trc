package config

import (
	"log"
	"os"
	"transcendence-back/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func	InitDB() *gorm.DB {
	dsn := os.Getenv("DB_DSN")

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Error with connecting to db: %v", err)
	}
	err = db.AutoMigrate(&models.Item{})
	if err != nil {
		log.Fatalf("Migrate error: %v", err)
	}
	log.Println("DB init successfully")
	return db
}