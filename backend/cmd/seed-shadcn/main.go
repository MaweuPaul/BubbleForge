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
		dbURL = "postgres://bubbleforge:bubbleforge@127.0.0.1:5432/bubbleforge?sslmode=disable"
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer pool.Close()

	// 1. Create the Master Shadcn Button Template
	templateID := "tmpl_shadcn_master_button"
	baseJSONStr := `{
		"type": "copy",
		"elements": [
			{
				"id": "{{ELEMENT_ID_0}}",
				"type": "Button",
				"properties": {
					"text": {
						"type": "TextExpression",
						"entries": {
							"0": "{{LABEL}}"
						}
					},
					"width": 120,
					"height": 40,
					"bgcolor": "{{BGCOLOR}}",
					"font_color": "{{FGCOLOR}}",
					"border_roundness": "{{RADIUS}}",
					"border_style": "{{BORDER_STYLE}}",
					"border_color": "{{BORDER_COLOR}}",
					"font_size": 14,
					"font_bold": true,
					"fit_width": true,
					"min_width_css": "100px",
					"single_height": true,
					"fit_height": false,
					"horiz_alignment": "center",
					"padding_top": 8,
					"padding_bottom": 8,
					"padding_left": 16,
					"padding_right": 16
				},
				"default_name": "BF: Master Button"
			}
		]
	}`

	schemaStr := `{
		"label": {"type": "text", "label": "Label", "default": "Button", "description": "The text displayed inside the button."},
		"bgcolor": {"type": "color", "label": "Background", "default": "#0f172a", "description": "The main background color of the button."},
		"fgcolor": {"type": "color", "label": "Text Color", "default": "#ffffff", "description": "The color of the label text."},
		"border_color": {"type": "color", "label": "Border Color", "default": "transparent", "description": "The color of the button's outer edge."},
		"border_style": {"type": "text", "label": "Border Style", "default": "none", "description": "Set to solid, dashed, or none."},
		"radius": {"type": "number", "label": "Radius", "default": 6, "description": "How rounded the corners should be (in px)."}
	}`

	var baseJSON map[string]any
	json.Unmarshal([]byte(baseJSONStr), &baseJSON)

	_, err = pool.Exec(ctx, `
		INSERT INTO component_templates (id, component_type_id, name, slug, base_json, property_schema, status)
		VALUES ($1, 'type_button', 'Shadcn Master Button', 'shadcn-master-button', $2, $3, 'published')
		ON CONFLICT (slug) DO UPDATE SET base_json = EXCLUDED.base_json, property_schema = EXCLUDED.property_schema
	`, templateID, baseJSON, schemaStr)
	if err != nil {
		log.Fatalf("Failed to insert template: %v", err)
	}

	// 2. Create the Shadcn Variants
	variants := []struct {
		id    string
		name  string
		desc  string
		props map[string]any
	}{
		{
			id:   "comp_shadcn_default",
			name: "Default Button",
			desc: "Primary action button.",
			props: map[string]any{
				"label":        "Primary",
				"bgcolor":      "#0f172a",
				"fgcolor":      "#f8fafc",
				"border_style": "none",
				"border_color": "transparent",
				"radius":       6,
			},
		},
		{
			id:   "comp_shadcn_secondary",
			name: "Secondary Button",
			desc: "Alternative action button.",
			props: map[string]any{
				"label":        "Secondary",
				"bgcolor":      "#f1f5f9",
				"fgcolor":      "#0f172a",
				"border_style": "none",
				"border_color": "transparent",
				"radius":       6,
			},
		},
		{
			id:   "comp_shadcn_destructive",
			name: "Destructive Button",
			desc: "Dangerous action button.",
			props: map[string]any{
				"label":        "Delete",
				"bgcolor":      "#ef4444",
				"fgcolor":      "#f8fafc",
				"border_style": "none",
				"border_color": "transparent",
				"radius":       6,
			},
		},
		{
			id:   "comp_shadcn_outline",
			name: "Outline Button",
			desc: "Bordered button for subtle actions.",
			props: map[string]any{
				"label":        "Outline",
				"bgcolor":      "transparent",
				"fgcolor":      "#0f172a",
				"border_style": "solid",
				"border_color": "#e2e8f0",
				"radius":       6,
			},
		},
		{
			id:   "comp_shadcn_ghost",
			name: "Ghost Button",
			desc: "No background, no border.",
			props: map[string]any{
				"label":        "Ghost",
				"bgcolor":      "transparent",
				"fgcolor":      "#0f172a",
				"border_style": "none",
				"border_color": "transparent",
				"radius":       6,
			},
		},
		{
			id:   "comp_shadcn_link",
			name: "Link Button",
			desc: "Looks like a link.",
			props: map[string]any{
				"label":        "Link",
				"bgcolor":      "transparent",
				"fgcolor":      "#0f172a",
				"border_style": "none",
				"border_color": "transparent",
				"radius":       6, // Bubble links don't have radius natively but the button does
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
			log.Printf("Seeded variant: %s", v.name)
		}
	}

	log.Println("Shadcn variants successfully seeded!")
}
