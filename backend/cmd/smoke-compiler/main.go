package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/MaweuPaul/BubbleForge/backend/internal/compiler"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://bubbleforge:bubbleforge@localhost:5432/bubbleforge?sslmode=disable"
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer pool.Close()

	// 1. Get default brand tokens
	var pColor, sColor, tColor, bColor, font string
	var radius int
	err = pool.QueryRow(ctx, "SELECT primary_color, secondary_color, text_color, background_color, border_radius, font_family FROM brand_tokens LIMIT 1").
		Scan(&pColor, &sColor, &tColor, &bColor, &radius, &font)
	if err != nil {
		log.Fatalf("Failed to fetch brand tokens: %v", err)
	}

	brandTokens := map[string]string{
		"PRIMARY_COLOR":    pColor,
		"SECONDARY_COLOR":  sColor,
		"TEXT_COLOR":       tColor,
		"BACKGROUND_COLOR": bColor,
		"RADIUS":           fmt.Sprintf("%d", radius),
		"FONT_FAMILY":      font,
	}

	// 2. Get a template and property values
	// We'll just grab the Solid Button component
	var baseJSONBytes, propValuesBytes []byte
	err = pool.QueryRow(ctx, `
		SELECT t.base_json, c.property_values 
		FROM components c 
		JOIN component_templates t ON c.template_id = t.id 
		WHERE c.id = 'comp-button-solid'
	`).Scan(&baseJSONBytes, &propValuesBytes)
	if err != nil {
		log.Fatalf("Failed to fetch component data: %v", err)
	}

	var baseJSON map[string]any
	var propValues map[string]any
	json.Unmarshal(baseJSONBytes, &baseJSON)
	json.Unmarshal(propValuesBytes, &propValues)

	// 3. Compile!
	fmt.Printf("Property Values: %+v\n", propValues)
	fmt.Printf("Brand Tokens: %+v\n", brandTokens)

	input := compiler.CompileInput{
		Template:       compiler.ComponentTemplate{BaseJSON: baseJSON},
		PropertyValues: propValues,
		BrandTokens:    brandTokens,
	}

	output, err := compiler.Compile(input)
	if err != nil {
		log.Fatalf("Compile failed: %v", err)
	}

	// 4. Save to file
	outBytes, _ := json.MarshalIndent(output.BubbleJSON, "", "  ")
	err = os.WriteFile("smoke-output.json", outBytes, 0644)
	if err != nil {
		log.Fatalf("Failed to write output file: %v", err)
	}

	fmt.Println("Successfully compiled 'comp-button-solid' to smoke-output.json!")
	fmt.Println("Please copy the contents of backend/smoke-output.json to your clipboard, and paste into Bubble to verify.")
}
