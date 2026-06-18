package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env if present
	_ = godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://bubbleforge:password@localhost:5432/bubbleforge?sslmode=disable"
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer pool.Close()

	sqlBytes, err := os.ReadFile("migrations/001_phase3_compiler.sql")
	if err != nil {
		log.Fatalf("Failed to read migration file: %v\n", err)
	}

	fmt.Println("Running migration 001_phase3_compiler.sql...")
	_, err = pool.Exec(ctx, string(sqlBytes))
	if err != nil {
		log.Fatalf("Migration 001 failed: %v\n", err)
	}

	sqlBytes2, err := os.ReadFile("migrations/002_drop_bubble_json.sql")
	if err != nil {
		log.Fatalf("Failed to read migration 002 file: %v\n", err)
	}

	fmt.Println("Running migration 002_drop_bubble_json.sql...")
	_, err = pool.Exec(ctx, string(sqlBytes2))
	if err != nil {
		log.Fatalf("Migration 002 failed: %v\n", err)
	}

	fmt.Println("All migrations completed successfully!")
}
