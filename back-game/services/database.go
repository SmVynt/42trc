package services

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DatabaseService struct {
	pool *pgxpool.Pool
}

func NewDatabaseService(dbURL string) (*DatabaseService, error) {
	config, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		return nil, err
	}

	config.MaxConns = 20
	config.MinConns = 5

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, err
	}

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 10*1000000000)
	defer cancel()

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Println("✅ PostgreSQL connected")

	ds := &DatabaseService{pool: pool}
	if err := ds.createTables(); err != nil {
		return nil, err
	}

	return ds, nil
}

func (ds *DatabaseService) createTables() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS rooms (
			id SERIAL PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			max_players INT DEFAULT 4,
			player_count INT DEFAULT 0,
			active BOOLEAN DEFAULT true,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS players (
			id VARCHAR(255) PRIMARY KEY,
			room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
			username VARCHAR(255),
			x FLOAT DEFAULT 0,
			y FLOAT DEFAULT 0,
			z FLOAT DEFAULT 0,
			rotation_y FLOAT DEFAULT 0,
			connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS player_sessions (
			id SERIAL PRIMARY KEY,
			player_id VARCHAR(255) REFERENCES players(id) ON DELETE CASCADE,
			room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
			join_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			leave_time TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS game_events (
			id SERIAL PRIMARY KEY,
			player_id VARCHAR(255) REFERENCES players(id) ON DELETE CASCADE,
			room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
			event_type VARCHAR(50),
			event_data JSONB,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
	}

	for _, query := range queries {
		if _, err := ds.pool.Exec(context.Background(), query); err != nil {
			// Ignore table already exists errors
			if err.Error() != "no rows in result set" {
				log.Printf("Warning creating table: %v", err)
			}
		}
	}

	return nil
}

// Query executes a query and returns rows
func (ds *DatabaseService) Query(ctx context.Context, sql string, args ...interface{}) (pgx.Rows, error) {
	return ds.pool.Query(ctx, sql, args...)
}

// QueryRow executes a query that returns at most one row
func (ds *DatabaseService) QueryRow(ctx context.Context, sql string, args ...interface{}) pgx.Row {
	return ds.pool.QueryRow(ctx, sql, args...)
}

// Exec executes a query without returning rows
func (ds *DatabaseService) Exec(ctx context.Context, sql string, args ...interface{}) error {
	_, err := ds.pool.Exec(ctx, sql, args...)
	return err
}

// Close closes the database connection pool
func (ds *DatabaseService) Close() {
	ds.pool.Close()
}
