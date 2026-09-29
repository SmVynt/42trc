package main

import (
	"context"
	"flag"
	"log"
	"os"
	"strconv"

	"github.com/SmVynt/42trc/back/database"
	"github.com/SmVynt/42trc/back/internal/api42"
	"github.com/joho/godotenv"
)

var logins = []string{"nmikuka", "psmolin", "vpushkar", "omizin", "icorrale"}

func main() {
	// --stars enables the slow star/exam pass (many extra API calls)
	withStars := flag.Bool("stars", false, "also fetch stars and exam flag per project")
	flag.Parse()

	if err := godotenv.Load("../.env"); err != nil && !os.IsNotExist(err) {
		log.Println("could not load ../.env (continuing with real env):", err)
	}

	database.Connect()

	InitializeStoreItems(database.DB)

	ctx := context.Background()
	client, err := api42.NewClient(ctx)
	if err != nil {
		log.Fatal("failed to create 42 client: ", err)
	}

	if campusID := seedCampusID(); campusID > 0 {
		logins, fetchErr := client.FetchCampusUserLogins(ctx, campusID)
		if fetchErr != nil {
			log.Fatal("failed to fetch campus users: ", fetchErr)
		}
		log.Printf("campus %d: selected %d active student logins", campusID, len(logins))
		if len(logins) == 0 {
			log.Fatal("campus user list is empty")
		}
		if err := client.SeedLogins(ctx, database.DB, logins, *withStars); err != nil {
			log.Fatal("seed failed: ", err)
		}
		log.Println("Done.")
		return
	}

	mode := "fast (profile/level/projects)"
	if *withStars {
		mode = "full (+ stars & exam)"
	}
	log.Println("seed mode:", mode)

	if err := client.SeedLogins(ctx, database.DB, logins, *withStars); err != nil {
		log.Fatal("seed failed: ", err)
	}
	log.Println("Done.")
}

func seedCampusID() int {
	raw := os.Getenv("SEED_CAMPUS_ID")
	if raw == "" {
		return 0
	}
	id, err := strconv.Atoi(raw)
	if err != nil || id <= 0 {
		log.Fatalf("invalid SEED_CAMPUS_ID: %q", raw)
	}
	return id
}
