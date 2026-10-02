package main

import (
	"context"
	"flag"
	"log"
	"os"

	"github.com/SmVynt/42trc/back/database"
	"github.com/SmVynt/42trc/back/internal/api42"
	"github.com/SmVynt/42trc/back/models"
	"github.com/joho/godotenv"
)

var logins = []string{"nmikuka", "psmolin", "vpushkar", "omizin", "icorrale"}

func main() {
	// --stars enables the slow star/exam pass (many extra API calls)
	withStars := flag.Bool("stars", false, "also fetch stars and exam flag per project")
	testUsers := flag.Bool("test-users", false, "seed only the five test users")
	flag.Parse()

	if err := godotenv.Load("../.env"); err != nil && !os.IsNotExist(err) {
		log.Println("could not load ../.env (continuing with real env):", err)
	}

	database.Connect()

	InitializeStoreItems(database.DB)

	ctx := context.Background()
	if *testUsers {
		client, err := api42.NewClient(ctx)
		if err != nil {
			log.Fatal("failed to create 42 client: ", err)
		}
		log.Println("test mode: seeding five test users")
		if err := client.SeedLogins(ctx, database.DB, logins, *withStars); err != nil {
			log.Fatal("seed failed: ", err)
		}
		log.Println("Done.")
		return
	}

	var users []models.User
	if err := database.DB.Select("intra").Where("last_login_at IS NOT NULL").Find(&users).Error; err != nil {
		log.Fatal("failed to load OAuth users: ", err)
	}
	if len(users) == 0 {
		log.Println("No OAuth users to sync yet. Users are added after their first 42 login.")
		return
	}

	logins := make([]string, 0, len(users))
	for _, user := range users {
		if user.Intra != "" {
			logins = append(logins, user.Intra)
		}
	}

	mode := "fast (OAuth users only)"
	if *withStars {
		mode = "full (+ stars & exam; OAuth users only)"
	}
	log.Println("seed mode:", mode)

	client, err := api42.NewClient(ctx)
	if err != nil {
		log.Fatal("failed to create 42 client: ", err)
	}
	if err := client.SeedLogins(ctx, database.DB, logins, *withStars); err != nil {
		log.Fatal("seed failed: ", err)
	}
	log.Printf("Done. Synchronized %d OAuth users.", len(logins))
}
