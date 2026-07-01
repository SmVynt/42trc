package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"
	"github.com/rs/cors"

	"github.com/SmVynt/42trc/back-game/handlers"
	"github.com/SmVynt/42trc/back-game/services"
)

func main() {
	// Load environment variables
	godotenv.Load()

	// Database configuration
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "postgres"
	}
	dbPort := os.Getenv("DB_PORT")
	if dbPort == "" {
		dbPort = "5432"
	}
	dbUser := os.Getenv("DB_USER")
	if dbUser == "" {
		dbUser = "postgres"
	}
	dbPassword := os.Getenv("DB_PASSWORD")
	if dbPassword == "" {
		dbPassword = "postgres"
	}
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "42trc_game"
	}

	// Build connection string
	dbURL := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		dbUser, dbPassword, dbHost, dbPort, dbName)

	// Initialize database
	db, err := services.NewDatabaseService(dbURL)
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize services
	roomManager := services.NewRoomManager()
	playerService := services.NewPlayerService(db)

	// Create WebSocket hub
	hub := handlers.NewHub(roomManager, playerService)
	go hub.Run()

	// Setup HTTP routes
	mux := http.NewServeMux()

	// Health check
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"status":"ok","server":"back-game","timestamp":"%s"}`,
			time.Now().Format(time.RFC3339))
	})

	// WebSocket
	mux.HandleFunc("/ws", hub.HandleWebSocket)

	// CORS configuration
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{frontendURL, "*"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})

	handler := c.Handler(mux)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "5001"
	}

	log.Printf("🚀 Game server starting on port %s", port)
	log.Printf("📡 Frontend URL: %s", frontendURL)
	log.Printf("🐘 Database: postgres://%s:%s@%s:%s/%s",
		dbUser, "***", dbHost, dbPort, dbName)

	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("❌ Server error: %v", err)
	}
}
