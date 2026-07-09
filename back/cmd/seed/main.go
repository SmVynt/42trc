package main

import (
	"context"
	"flag"
	"log"

	"github.com/SmVynt/42trc/back/database"
	"github.com/SmVynt/42trc/back/internal/api42"
	"github.com/joho/godotenv"
	"github.com/SmVynt/42trc/back/cmd/seed"
)

var logins = []string{"nmikuka", "psmolin", "vpushkar", "omizin", "icorrale"}

func main() {
	// --stars enables the slow star/exam pass (many extra API calls)
	withStars := flag.Bool("stars", false, "also fetch stars and exam flag per project")
	flag.Parse()

	if err := godotenv.Load("../.env"); err != nil {
		log.Println("no ../.env loaded (continuing with real env):", err)
	}

	database.Connect()

	seed.InitializeStoreItems(database.DB)

	ctx := context.Background()
	client, err := api42.NewClient(ctx)
	if err != nil {
		log.Fatal("failed to create 42 client: ", err)
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