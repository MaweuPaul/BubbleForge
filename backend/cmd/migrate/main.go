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

	migrations := []string{
		"migrations/002_drop_bubble_json.sql",
		"migrations/003_property_registry.sql",
		"migrations/004_property_descriptions.sql",
		"migrations/005_categories.sql",
		"migrations/006_atoms.sql",
		"migrations/007_consolidate_presets.sql",
		"migrations/008_text_atoms.sql",
		"migrations/009_link_atoms.sql",
		"migrations/010_image_atoms.sql",
		"migrations/011_shape_atoms.sql",
		"migrations/012_group_atoms.sql",
		"migrations/013_template_rules.sql",
	}

	for _, path := range migrations {
		sqlBytes, err := os.ReadFile(path)
		if err != nil {
			log.Fatalf("Failed to read migration file %s: %v\n", path, err)
		}

		fmt.Printf("Running %s...\n", path)
		_, err = pool.Exec(ctx, string(sqlBytes))
		if err != nil {
			log.Fatalf("Migration failed for %s: %v\n", path, err)
		}
	}

	fmt.Println("All migrations completed successfully!")
}
