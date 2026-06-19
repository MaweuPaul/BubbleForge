package main

import (
	"context"
	"encoding/json"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load("../../.env")
	if os.Getenv("DATABASE_URL") == "" {
		_ = godotenv.Load("../.env")
	}

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

	templateID := "tmpl_shadcn_master_button"

	// Create the Glassmorphism Variants using the EXACT SAME master template!
	variants := []struct {
		id    string
		name  string
		desc  string
		props map[string]any
	}{
		{
			id:   "comp_glass_light",
			name: "Glass Light Button",
			desc: "Frosted glass effect for dark backgrounds.",
			props: map[string]any{
				"label":        "Glass Light",
				"bgcolor":      "rgba(255, 255, 255, 0.15)",
				"fgcolor":      "#ffffff",
				"border_style": "solid",
				"border_color": "rgba(255, 255, 255, 0.3)",
				"radius":       12,
			},
		},
		{
			id:   "comp_glass_dark",
			name: "Glass Dark Button",
			desc: "Smoked glass effect for light backgrounds.",
			props: map[string]any{
				"label":        "Glass Dark",
				"bgcolor":      "rgba(0, 0, 0, 0.15)",
				"fgcolor":      "#000000",
				"border_style": "solid",
				"border_color": "rgba(0, 0, 0, 0.1)",
				"radius":       12,
			},
		},
		{
			id:   "comp_glass_primary",
			name: "Glass Tinted Button",
			desc: "Tinted frosted glass effect.",
			props: map[string]any{
				"label":        "Glass Tinted",
				"bgcolor":      "rgba(234, 88, 12, 0.2)", // Primary orange tint
				"fgcolor":      "#ea580c",
				"border_style": "solid",
				"border_color": "rgba(234, 88, 12, 0.4)",
				"radius":       12,
			},
		},
	}

	for _, v := range variants {
		propsJSON, _ := json.Marshal(v.props)
		_, err := pool.Exec(ctx, `
			INSERT INTO components (id, category, name, description, access, template_id, property_values)
			VALUES ($1, 'Button', $2, $3, 'Free', $4, $5)
			ON CONFLICT (id) DO UPDATE SET 
				name = EXCLUDED.name,
				description = EXCLUDED.description,
				property_values = EXCLUDED.property_values
		`, v.id, v.name, v.desc, templateID, propsJSON)

		if err != nil {
			log.Printf("Failed to insert variant %s: %v", v.name, err)
		} else {
			log.Printf("Seeded Glass variant: %s", v.name)
		}
	}

	log.Println("Glassmorphism variants successfully seeded!")
}
