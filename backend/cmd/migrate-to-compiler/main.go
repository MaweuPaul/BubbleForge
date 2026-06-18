package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"

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

	// Read all components
	rows, err := pool.Query(ctx, "SELECT id, category, name, bubble_json FROM components WHERE template_id IS NULL")
	if err != nil {
		log.Fatalf("Query failed: %v", err)
	}
	defer rows.Close()

	type ComponentRow struct {
		ID         string
		Category   string
		Name       string
		BubbleJSON map[string]any
	}

	var components []ComponentRow
	for rows.Next() {
		var r ComponentRow
		var b []byte
		if err := rows.Scan(&r.ID, &r.Category, &r.Name, &b); err != nil {
			log.Fatalf("Scan failed: %v", err)
		}
		if err := json.Unmarshal(b, &r.BubbleJSON); err != nil {
			log.Fatalf("Unmarshal failed: %v", err)
		}
		components = append(components, r)
	}

	for _, comp := range components {
		fmt.Printf("Migrating component %s (%s)...\n", comp.Name, comp.ID)

		// 1. Extract values
		elements, ok := comp.BubbleJSON["elements"].([]any)
		if !ok || len(elements) == 0 {
			log.Printf("No elements in component %s", comp.ID)
			continue
		}

		el := elements[0].(map[string]any)
		props := el["properties"].(map[string]any)

		var label string
		if textObj, ok := props["text"].(map[string]any); ok {
			if entries, ok := textObj["entries"].(map[string]any); ok {
				if val, ok := entries["0"].(string); ok {
					label = val
				}
			}
		}

		width := 150.0
		if w, ok := props["width"].(float64); ok {
			width = w
		}
		height := 44.0
		if h, ok := props["height"].(float64); ok {
			height = h
		}

		radius := 8.0
		if r, ok := props["border_roundness"].(float64); ok {
			radius = r
		}

		icon := ""
		if icn, ok := props["icon"].(string); ok {
			icon = strings.TrimPrefix(icn, "material outlined ")
		}

		buttonType := "label"
		if bt, ok := props["button_type"].(string); ok {
			buttonType = bt
		}

		style := ""
		if s, ok := el["style"].(string); ok {
			style = s
		}

		// Construct property_values for the component
		propertyValues := map[string]any{
			"label":       label,
			"width":       width,
			"height":      height,
			"radius":      radius,
			"icon":        icon,
			"button_type": buttonType,
			"style":       style,
		}

		// Prepare property schema
		propertySchema := map[string]any{
			"label":   map[string]any{"type": "string", "default": "Submit", "token": "{{LABEL}}"},
			"width":   map[string]any{"type": "number", "default": 150, "token": "{{WIDTH}}"},
			"height":  map[string]any{"type": "number", "default": 44, "token": "{{HEIGHT}}"},
			"bgcolor": map[string]any{"type": "color", "default": "#ea580c", "token": "{{PRIMARY_COLOR}}"},
			"fgcolor": map[string]any{"type": "color", "default": "#ffffff", "token": "{{TEXT_COLOR}}"},
			"radius":  map[string]any{"type": "number", "default": 8, "token": "{{RADIUS}}"},
			"icon":    map[string]any{"type": "string", "default": "", "token": "{{ICON}}"},
			"button_type": map[string]any{
				"type": "select", "default": "label", "token": "{{BUTTON_TYPE}}",
				"options": []string{"label", "icon", "label_icon"},
			},
			"style": map[string]any{
				"type": "string", "default": "", "token": "{{STYLE}}",
			},
		}

		// Tokenize base JSON
		// We replace specific hardcoded values with tokens
		// But in data/components.json, some colors are already {{PRIMARY_COLOR}}

		// Set properties in the base JSON to tokens
		if textObj, ok := props["text"].(map[string]any); ok {
			if entries, ok := textObj["entries"].(map[string]any); ok {
				entries["0"] = "{{LABEL}}"
			}
		}
		props["width"] = "{{WIDTH}}"
		props["height"] = "{{HEIGHT}}"
		if _, ok := props["border_roundness"]; ok {
			props["border_roundness"] = "{{RADIUS}}"
		}

		if icon != "" || buttonType != "label" {
			props["icon"] = "material outlined {{ICON}}"
			props["button_type"] = "{{BUTTON_TYPE}}"
		}

		if style != "" {
			el["style"] = "{{STYLE}}"
		}

		el["id"] = "{{ELEMENT_ID_0}}"

		// If there is an outline/border, we might need to handle font_color and border_color tokens
		// It's already mostly handled by {{PRIMARY_COLOR}} in the db.
		// For the sake of schema purity, let's leave existing {{PRIMARY_COLOR}} alone as it will be matched by the compiler.

		comp.BubbleJSON["elements"] = []any{el}
		baseJSONBytes, _ := json.Marshal(comp.BubbleJSON)
		propertySchemaBytes, _ := json.Marshal(propertySchema)
		propertyValuesBytes, _ := json.Marshal(propertyValues)

		slug := strings.ReplaceAll(strings.ToLower(comp.Name), " ", "-")
		templateID := "tmpl_" + slug

		fmt.Printf("  -> Template: %s\n", templateID)

		// Insert Template
		_, err = pool.Exec(ctx, `
			INSERT INTO component_templates (id, component_type_id, name, slug, base_json, property_schema)
			VALUES ($1, 'type_button', $2, $3, $4, $5)
			ON CONFLICT (slug) DO UPDATE SET base_json = EXCLUDED.base_json, property_schema = EXCLUDED.property_schema
		`, templateID, comp.Name, slug, string(baseJSONBytes), string(propertySchemaBytes))

		if err != nil {
			log.Fatalf("Failed to insert template: %v", err)
		}

		// Update component
		_, err = pool.Exec(ctx, `
			UPDATE components 
			SET template_id = $1, property_values = $2, migration_status = 'migrated'
			WHERE id = $3
		`, templateID, string(propertyValuesBytes), comp.ID)

		if err != nil {
			log.Fatalf("Failed to update component: %v", err)
		}
	}

	fmt.Println("Template generation and data migration complete!")
}
