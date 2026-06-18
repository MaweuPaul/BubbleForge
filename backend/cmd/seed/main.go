package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"path/filepath"

	"github.com/jackc/pgx/v5/pgxpool"
)

type SeedComponent struct {
	ID          string `json:"id"`
	Category    string `json:"category"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Access      string `json:"access"`
	BubbleJSON  any    `json:"bubbleJson"`
}

func main() {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		databaseURL = "postgres://bubbleforge:bubbleforge@localhost:5432/bubbleforge?sslmode=disable"
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	cwd, _ := os.Getwd()
	filePath := filepath.Join(cwd, "data", "components.json")

	bytes, err := os.ReadFile(filePath)
	if err != nil {
		log.Fatalf("Failed to read components.json: %v", err)
	}

	var comps []SeedComponent
	if err := json.Unmarshal(bytes, &comps); err != nil {
		log.Fatalf("Failed to parse JSON: %v", err)
	}

	// Insert into DB
	for _, c := range comps {
		if c.Access == "" {
			c.Access = "Free"
		}

		_, err := pool.Exec(ctx, `
			INSERT INTO components (id, category, name, description, access, bubble_json)
			VALUES ($1, $2, $3, $4, $5, $6)
			ON CONFLICT (id) DO UPDATE SET
				category = EXCLUDED.category,
				name = EXCLUDED.name,
				description = EXCLUDED.description,
				access = EXCLUDED.access,
				bubble_json = EXCLUDED.bubble_json,
				updated_at = CURRENT_TIMESTAMP
		`, c.ID, c.Category, c.Name, c.Description, c.Access, c.BubbleJSON)

		if err != nil {
			log.Printf("Failed to insert %s: %v", c.ID, err)
		} else {
			log.Printf("Successfully inserted %s", c.ID)
		}
	}
	log.Println("Seeding complete.")
}
