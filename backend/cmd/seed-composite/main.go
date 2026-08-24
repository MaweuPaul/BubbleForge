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

	// 1. Create the Master Hero Card Template
	templateID := "tmpl_composite_hero_card"
	baseJSONStr := `{
		"type": "copy",
		"elements": [
			{
				"id": "grp_hero",
				"type": "Group",
				"properties": {
					"width": 320,
					"height": 400,
					"container_layout": "column",
					"min_width_css": "280px",
					"collapse_when_hidden": true,
					"horiz_alignment": "center",
					"fit_height": true,
					"background_style": "bgcolor",
					"bgcolor": "{{BGCOLOR}}",
					"border_roundness": "{{RADIUS}}",
					"border_style": "{{BORDER_STYLE}}",
					"border_color": "{{BORDER_COLOR}}",
					"padding_top": "{{PADDING}}",
					"padding_bottom": "{{PADDING}}",
					"padding_left": "{{PADDING}}",
					"padding_right": "{{PADDING}}"
				},
				"default_name": "BF: Hero Card"
			},
			{
				"id": "img_hero",
				"type": "Image",
				"current_parent": "grp_hero",
				"properties": {
					"width": 320,
					"height": 200,
					"single_width": false,
					"min_width_css": "100%",
					"min_height_css": "200px",
					"use_aspect_ratio": true,
					"aspect_ratio_width": 16,
					"aspect_ratio_height": 9,
					"src": {
						"type": "TextExpression",
						"entries": {
							"0": "{{IMAGE_URL}}"
						}
					},
					"alt_tag": {
						"type": "TextExpression",
						"entries": {
							"0": "{{ALT}}"
						}
					},
					"image_fit": "cover"
				},
				"default_name": "BF: Hero Image"
			},
			{
				"id": "txt_hero",
				"type": "Text",
				"current_parent": "grp_hero",
				"properties": {
					"text": {
						"type": "TextExpression",
						"entries": {
							"0": "{{LABEL}}"
						}
					},
					"width": 320,
					"height": 40,
					"fit_width": false,
					"min_width_css": "100%",
					"fit_height": true,
					"font_size": 24,
					"font_bold": true,
					"font_color": "{{FGCOLOR}}",
					"horiz_alignment": "left"
				},
				"default_name": "BF: Hero Title"
			},
			{
				"id": "lnk_hero",
				"type": "Link",
				"current_parent": "grp_hero",
				"properties": {
					"title_attribute": {
						"type": "TextExpression",
						"entries": {
							"0": "Read more about {{LABEL}}"
						}
					},
					"text": {
						"type": "TextExpression",
						"entries": {
							"0": "Read More"
						}
					},
					"width": 320,
					"height": 20,
					"font_color": "{{FGCOLOR}}",
					"font_bold": true,
					"open_in_new_tab": true
				},
				"default_name": "BF: Hero Link"
			}
		]
	}`

	schemaStr := `{
		"label": {"type": "text", "label": "Title", "default": "Welcome to BubbleForge", "description": "Hero title text."},
		"bgcolor": {"type": "color", "label": "Card Background", "default": "#ffffff", "description": "Background color of the card."},
		"fgcolor": {"type": "color", "label": "Text Color", "default": "#000000", "description": "Color for text and links."},
		"border_color": {"type": "color", "label": "Border Color", "default": "#e2e8f0", "description": "Card border color."},
		"border_style": {"type": "text", "label": "Border Style", "default": "solid", "description": "Border style."},
		"radius": {"type": "number", "label": "Corner Radius", "default": 12, "description": "Corner rounding."},
		"padding": {"type": "number", "label": "Padding", "default": 24, "description": "Inner padding of the card."},
		"image_url": {"type": "url", "label": "Hero Image URL", "default": "https://placehold.co/600x400", "description": "Hero image source."},
		"alt": {"type": "text", "label": "Image Alt Text", "default": "Hero image", "description": "Accessibility alt text."}
	}`

	var baseJSON map[string]any
	json.Unmarshal([]byte(baseJSONStr), &baseJSON)

	_, err = pool.Exec(ctx, `
		INSERT INTO component_templates (id, component_type_id, name, slug, base_json, property_schema, status)
		VALUES ($1, 'type_card', 'Composite Hero Card', 'composite-hero-card', $2, $3, 'published')
		ON CONFLICT (slug) DO UPDATE SET base_json = EXCLUDED.base_json, property_schema = EXCLUDED.property_schema
	`, templateID, baseJSON, schemaStr)
	if err != nil {
		log.Fatalf("Failed to insert template: %v", err)
	}

	// 2. Create the Variants
	variants := []struct {
		id    string
		name  string
		desc  string
		props map[string]any
	}{
		{
			id:   "comp_hero_default",
			name: "Light Hero Card",
			desc: "Standard hero card for light mode.",
			props: map[string]any{
				"label":        "Next Gen Web Design",
				"bgcolor":      "#ffffff",
				"fgcolor":      "#0f172a",
				"border_style": "solid",
				"border_color": "#e2e8f0",
				"radius":       12,
				"padding":      16,
				"image_url":    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600&h=400",
				"alt":          "Laptop",
			},
		},
		{
			id:   "comp_hero_dark",
			name: "Dark Hero Card",
			desc: "Sleek hero card for dark mode.",
			props: map[string]any{
				"label":        "Dark Mode Aesthetics",
				"bgcolor":      "#0f172a",
				"fgcolor":      "#f8fafc",
				"border_style": "solid",
				"border_color": "#334155",
				"radius":       16,
				"padding":      24,
				"image_url":    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600&h=400",
				"alt":          "Cyberpunk",
			},
		},
	}

	for _, v := range variants {
		propsJSON, _ := json.Marshal(v.props)
		_, err := pool.Exec(ctx, `
			INSERT INTO components (id, category, name, description, access, template_id, property_values)
			VALUES ($1, 'cards', $2, $3, 'Free', $4, $5)
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

	log.Println("Composite Hero Card variants successfully seeded!")
}
