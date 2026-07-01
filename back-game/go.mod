module github.com/SmVynt/42trc/back-game

go 1.21

// Use local packages in development (before git push)
replace github.com/SmVynt/42trc/back-game => ./

require (
	github.com/gorilla/websocket v1.5.3
	github.com/jackc/pgx/v5 v5.5.2
	github.com/joho/godotenv v1.5.1
	github.com/rs/cors v1.10.1
)

require (
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20221227161230-091c0ba34f0a // indirect
	github.com/jackc/puddle/v2 v2.2.1 // indirect
	golang.org/x/crypto v0.17.0 // indirect
	golang.org/x/sync v0.5.0 // indirect
	golang.org/x/text v0.14.0 // indirect
)
