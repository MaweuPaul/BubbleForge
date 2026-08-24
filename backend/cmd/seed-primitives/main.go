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

	seedPrimitive(
		ctx, pool,
		"tmpl_primitive_text", "type_text", "Primitive Text", "primitive-text",
		`{
			"type": "Text",
			"properties": {
				"text": {
					"type": "TextExpression",
					"entries": { "0": "{{TEXT}}" }
				},
				"font_size": "{{FONT_SIZE}}",
				"font_color": "{{FGCOLOR}}",
				"font_bold": "{{FONT_BOLD}}",
				"horiz_alignment": "{{ALIGNMENT}}",
				"width": 250,
				"height": 40,
				"fit_width": false,
				"fit_height": true,
				"collapse_when_hidden": true
			},
			"default_name": "BF: Text"
		}`,
		`{
			"text": {"type": "text", "label": "Text Content", "default": "Hello World", "description": "The text to display."},
			"font_size": {"type": "number", "label": "Font Size", "default": 16, "description": "Text size in pixels."},
			"fgcolor": {"type": "color", "label": "Text Color", "default": "#1e293b", "description": "Color of the text."},
			"font_bold": {"type": "boolean", "label": "Bold", "default": false, "description": "Make text bold."},
			"alignment": {"type": "select", "label": "Alignment", "default": "left", "description": "Text alignment.", "options": ["left", "center", "right"]}
		}`,
		[]variant{
			{"comp_text_heading", "text", "H1 Heading", "Large bold heading text.", map[string]any{"text": "Main Heading", "font_size": 32, "font_bold": true, "fgcolor": "#0f172a", "alignment": "left"}},
			{"comp_text_body", "text", "Body Text", "Standard paragraph text.", map[string]any{"text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", "font_size": 16, "font_bold": false, "fgcolor": "#334155", "alignment": "left"}},
			{"comp_text_muted", "text", "Muted Label", "Small muted helper text.", map[string]any{"text": "Helper text goes here", "font_size": 12, "font_bold": false, "fgcolor": "#94a3b8", "alignment": "left"}},
		},
	)

	seedPrimitive(
		ctx, pool,
		"tmpl_primitive_link", "type_link", "Primitive Link", "primitive-link",
		`{
			"type": "Link",
			"properties": {
				"text": {
					"type": "TextExpression",
					"entries": { "0": "{{TEXT}}" }
				},
				"title_attribute": {
					"type": "TextExpression",
					"entries": { "0": "{{TITLE_ATTRIBUTE}}" }
				},
				"font_size": "{{FONT_SIZE}}",
				"font_color": "{{FGCOLOR}}",
				"font_bold": "{{FONT_BOLD}}",
				"horiz_alignment": "{{ALIGNMENT}}",
				"open_in_new_tab": true,
				"width": 150,
				"height": 20,
				"fit_width": true,
				"fit_height": true,
				"collapse_when_hidden": true
			},
			"default_name": "BF: Link"
		}`,
		`{
			"text": {"type": "text", "label": "Link Text", "default": "Click Here", "description": "The clickable text."},
			"title_attribute": {"type": "text", "label": "Tooltip Title", "default": "Go to link", "description": "Hover tooltip."},
			"font_size": {"type": "number", "label": "Font Size", "default": 14, "description": "Text size in pixels."},
			"fgcolor": {"type": "color", "label": "Link Color", "default": "#3b82f6", "description": "Color of the link."},
			"font_bold": {"type": "boolean", "label": "Bold", "default": true, "description": "Make link bold."},
			"alignment": {"type": "select", "label": "Alignment", "default": "left", "description": "Text alignment.", "options": ["left", "center", "right"]}
		}`,
		[]variant{
			{"comp_link_primary", "navigation", "Primary Link", "Standard blue navigation link.", map[string]any{"text": "Read Documentation", "title_attribute": "View Docs", "font_size": 14, "font_bold": true, "fgcolor": "#2563eb", "alignment": "left"}},
			{"comp_link_subtle", "navigation", "Subtle Link", "Gray muted link for footers.", map[string]any{"text": "Terms of Service", "title_attribute": "TOS", "font_size": 12, "font_bold": false, "fgcolor": "#64748b", "alignment": "left"}},
		},
	)

	seedPrimitive(
		ctx, pool,
		"tmpl_primitive_image", "type_image", "Primitive Image", "primitive-image",
		`{
			"type": "Image",
			"properties": {
				"src": {
					"type": "TextExpression",
					"entries": { "0": "{{IMAGE_URL}}" }
				},
				"alt_tag": {
					"type": "TextExpression",
					"entries": { "0": "{{ALT}}" }
				},
				"image_fit": "{{FIT}}",
				"border_roundness": "{{RADIUS}}",
				"width": 300,
				"height": 200,
				"use_aspect_ratio": false,
				"collapse_when_hidden": true
			},
			"default_name": "BF: Image"
		}`,
		`{
			"image_url": {"type": "url", "label": "Image URL", "default": "https://placehold.co/600x400", "description": "Source URL."},
			"alt": {"type": "text", "label": "Alt Text", "default": "Placeholder", "description": "Accessibility alt text."},
			"fit": {"type": "select", "label": "Fit Mode", "default": "cover", "description": "Image scaling mode.", "options": ["cover", "contain", "stretch"]},
			"radius": {"type": "number", "label": "Corner Radius", "default": 0, "description": "Border radius."}
		}`,
		[]variant{
			{"comp_img_rounded", "images", "Rounded Image", "Image with softly rounded corners.", map[string]any{"image_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600", "alt": "Abstract", "fit": "cover", "radius": 12}},
			{"comp_img_avatar", "images", "Avatar Image", "Perfectly circular avatar image.", map[string]any{"image_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200", "alt": "User Avatar", "fit": "cover", "radius": 999}},
		},
	)

	seedPrimitive(
		ctx, pool,
		"tmpl_primitive_group", "type_group", "Primitive Group", "primitive-group",
		`{
			"type": "Group",
			"properties": {
				"container_layout": "{{CONTAINER_LAYOUT}}",
				"background_style": "{{BACKGROUND_STYLE}}",
				"bgcolor": "{{BGCOLOR}}",
				"border_roundness": "{{RADIUS}}",
				"border_style": "{{BORDER_STYLE}}",
				"border_color": "{{BORDER_COLOR}}",
				"boxshadow_style": "{{BOXSHADOW_STYLE}}",
				"width": 200,
				"height": 200,
				"min_width_css": "40px",
				"min_height_css": "40px",
				"collapse_when_hidden": true
			},
			"default_name": "BF: Group"
		}`,
		`{
			"container_layout": {"type": "select", "label": "Layout", "default": "column", "description": "Flexbox layout.", "options": ["column", "row", "align_to_parent", "fixed"]},
			"background_style": {"type": "select", "label": "Background Style", "default": "bgcolor", "description": "Fill style.", "options": ["none", "bgcolor", "gradient", "image"]},
			"bgcolor": {"type": "color", "label": "Background Color", "default": "#ffffff", "description": "Fill color."},
			"radius": {"type": "number", "label": "Corner Radius", "default": 8, "description": "Border radius."},
			"border_style": {"type": "select", "label": "Border Style", "default": "solid", "description": "Border style.", "options": ["none", "solid", "dashed"]},
			"border_color": {"type": "color", "label": "Border Color", "default": "#e2e8f0", "description": "Border color."},
			"boxshadow_style": {"type": "select", "label": "Shadow Style", "default": "outset", "description": "Shadow type.", "options": ["none", "outset", "inset"]}
		}`,
		[]variant{
			{"comp_grp_card", "containers", "Card Container", "Standard card box with a shadow.", map[string]any{"container_layout": "column", "background_style": "bgcolor", "bgcolor": "#ffffff", "radius": 16, "border_style": "solid", "border_color": "#f1f5f9", "boxshadow_style": "outset"}},
			{"comp_grp_ghost", "containers", "Ghost Container", "Invisible layout wrapper.", map[string]any{"container_layout": "column", "background_style": "none", "bgcolor": "rgba(0,0,0,0)", "radius": 0, "border_style": "none", "border_color": "transparent", "boxshadow_style": "none"}},
		},
	)
}

type variant struct {
	id       string
	category string
	name     string
	desc     string
	props    map[string]any
}

func seedPrimitive(ctx context.Context, pool *pgxpool.Pool, templateID, typeID, templateName, templateSlug, baseJSONStr, schemaStr string, variants []variant) {
	var baseJSON map[string]any
	json.Unmarshal([]byte(baseJSONStr), &baseJSON)

	_, err := pool.Exec(ctx, `
		INSERT INTO component_templates (id, component_type_id, name, slug, base_json, property_schema, status)
		VALUES ($1, $2, $3, $4, $5, $6, 'published')
		ON CONFLICT (slug) DO UPDATE SET base_json = EXCLUDED.base_json, property_schema = EXCLUDED.property_schema
	`, templateID, typeID, templateName, templateSlug, baseJSON, schemaStr)
	if err != nil {
		log.Fatalf("Failed to insert template %s: %v", templateName, err)
	}

	for _, v := range variants {
		propsJSON, _ := json.Marshal(v.props)
		_, err := pool.Exec(ctx, `
			INSERT INTO components (id, category, name, description, access, template_id, property_values)
			VALUES ($1, $2, $3, $4, 'Free', $5, $6)
			ON CONFLICT (id) DO UPDATE SET 
				name = EXCLUDED.name,
				category = EXCLUDED.category,
				description = EXCLUDED.description,
				property_values = EXCLUDED.property_values
		`, v.id, v.category, v.name, v.desc, templateID, propsJSON)

		if err != nil {
			log.Printf("Failed to insert variant %s: %v", v.name, err)
		} else {
			log.Printf("Seeded variant: %s", v.name)
		}
	}
}
