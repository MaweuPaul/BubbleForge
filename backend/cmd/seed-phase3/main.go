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

	// Seed component_types
	types := []struct{ id, name, slug, desc string }{
		{"type_button", "Button", "button", "Interactive buttons"},
		{"type_input", "Input", "input", "Form inputs"},
		{"type_badge", "Badge", "badge", "Status badges"},
		{"type_card", "Card", "card", "Container cards"},
		{"type_text", "Text", "text", "Typography blocks"},
		{"type_image", "Image", "image", "Image and media blocks"},
		{"type_icon", "Icon", "icon", "Vector icons"},
		{"type_container", "Container", "container", "Layout wrappers"},
	}

	fmt.Println("Seeding component_types...")
	for _, t := range types {
		_, err := pool.Exec(ctx, `
			INSERT INTO component_types (id, name, slug, description)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT (slug) DO NOTHING
		`, t.id, t.name, t.slug, t.desc)
		if err != nil {
			log.Printf("Failed to seed type %s: %v", t.slug, err)
		}
	}

	// Seed brand_tokens
	fmt.Println("Seeding brand_tokens...")
	_, err = pool.Exec(ctx, `
		INSERT INTO brand_tokens (
			primary_color, secondary_color, text_color, background_color, border_radius, font_family
		) VALUES (
			'#ea580c', '#0f172a', '#ffffff', '#ffffff', 8, 'Inter, ui-sans-serif'
		)
		-- Since there's no unique constraint that covers the default easily without a user_id, 
		-- we just check if any exists.
	`)
	// We only want 1 default global brand token for now if none exist
	var count int
	pool.QueryRow(ctx, "SELECT COUNT(*) FROM brand_tokens WHERE user_id IS NULL").Scan(&count)
	if count == 0 {
		_, err = pool.Exec(ctx, `
			INSERT INTO brand_tokens (
				primary_color, secondary_color, text_color, background_color, border_radius, font_family
			) VALUES (
				'#ea580c', '#0f172a', '#ffffff', '#ffffff', 8, 'Inter, ui-sans-serif'
			)
		`)
		if err != nil {
			log.Printf("Failed to seed brand_tokens: %v", err)
		}
	} else {
		fmt.Println("brand_tokens already seeded.")
	}

	fmt.Println("Seeding phase 3 data completed.")
}
