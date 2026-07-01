package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"transcendence-back/seed"
	"transcendence-back/config"
)

func	main() {
	log.Println("Starting application")

	db := config.InitDB()
	seed.InitializeStoreItems(db)

	port := os.Getenv("PORT")

	http.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status": "ok", "message": "Backend is running and healthy"}`))
	})

	addr := fmt.Sprintf(":%s", port)
	log.Printf("Backend server is successfully listening on port %s", port)

	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}