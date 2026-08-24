package main

import (
	"context"
	"encoding/json"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

type catalogComponent struct {
	id          string
	category    string
	name        string
	description string
	templateID  string
	props       map[string]any
}

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

	components := []catalogComponent{
		button("bf_btn_default", "Default Button", "Primary action button with a solid foreground color.", map[string]any{"label": "Button", "bgcolor": "#0f172a", "fgcolor": "#f8fafc", "border_style": "none", "border_color": "transparent", "radius": 6}),
		button("bf_btn_secondary", "Secondary Button", "Quiet secondary action with a muted surface fill.", map[string]any{"label": "Secondary", "bgcolor": "#f1f5f9", "fgcolor": "#0f172a", "border_style": "none", "border_color": "transparent", "radius": 6}),
		button("bf_btn_destructive", "Destructive Button", "High-signal destructive action for delete and remove flows.", map[string]any{"label": "Delete", "bgcolor": "#ef4444", "fgcolor": "#fef2f2", "border_style": "none", "border_color": "transparent", "radius": 6}),
		button("bf_btn_outline", "Outline Button", "Bordered action for lower-emphasis workflows.", map[string]any{"label": "Outline", "bgcolor": "transparent", "fgcolor": "#0f172a", "border_style": "solid", "border_color": "#e2e8f0", "radius": 6}),
		button("bf_btn_ghost", "Ghost Button", "Transparent button for toolbars, menus, and compact actions.", map[string]any{"label": "Ghost", "bgcolor": "transparent", "fgcolor": "#0f172a", "border_style": "none", "border_color": "transparent", "radius": 6}),
		button("bf_btn_link", "Link Button", "Button behavior with a text-link visual style.", map[string]any{"label": "Link", "bgcolor": "transparent", "fgcolor": "#2563eb", "border_style": "none", "border_color": "transparent", "radius": 6}),
		button("bf_btn_success", "Success Button", "Positive action button for confirmation flows.", map[string]any{"label": "Confirm", "bgcolor": "#16a34a", "fgcolor": "#f0fdf4", "border_style": "none", "border_color": "transparent", "radius": 6}),
		button("bf_btn_warning", "Warning Button", "Attention action button for risky but recoverable flows.", map[string]any{"label": "Review", "bgcolor": "#f59e0b", "fgcolor": "#111827", "border_style": "none", "border_color": "transparent", "radius": 6}),

		text("bf_text_display", "Display Heading", "Large marketing or page hero heading.", map[string]any{"text": "Build beautiful apps", "font_size": 48, "font_bold": true, "fgcolor": "#020617", "alignment": "left"}),
		text("bf_text_h1", "Page Heading", "Strong page title for app screens.", map[string]any{"text": "Dashboard", "font_size": 32, "font_bold": true, "fgcolor": "#0f172a", "alignment": "left"}),
		text("bf_text_h2", "Section Heading", "Section title for panels and forms.", map[string]any{"text": "Account settings", "font_size": 24, "font_bold": true, "fgcolor": "#0f172a", "alignment": "left"}),
		text("bf_text_body", "Body Text", "Readable paragraph text for product UI.", map[string]any{"text": "Manage your workspace, billing, and team preferences.", "font_size": 16, "font_bold": false, "fgcolor": "#334155", "alignment": "left"}),
		text("bf_text_muted", "Muted Text", "Subtle helper copy and secondary descriptions.", map[string]any{"text": "Updated a few seconds ago", "font_size": 14, "font_bold": false, "fgcolor": "#64748b", "alignment": "left"}),
		text("bf_text_caption", "Caption", "Small labels, timestamps, and compact metadata.", map[string]any{"text": "LAST UPDATED", "font_size": 12, "font_bold": true, "fgcolor": "#64748b", "alignment": "left"}),

		link("bf_link_primary", "Primary Link", "Standard inline navigation link.", map[string]any{"text": "Read documentation", "title_attribute": "Open documentation", "font_size": 14, "font_bold": true, "fgcolor": "#2563eb", "alignment": "left"}),
		link("bf_link_muted", "Muted Link", "Low-emphasis link for footers and settings screens.", map[string]any{"text": "Privacy policy", "title_attribute": "Open privacy policy", "font_size": 14, "font_bold": false, "fgcolor": "#64748b", "alignment": "left"}),
		link("bf_link_destructive", "Destructive Link", "Text action for destructive secondary flows.", map[string]any{"text": "Delete workspace", "title_attribute": "Delete workspace", "font_size": 14, "font_bold": true, "fgcolor": "#dc2626", "alignment": "left"}),

		image("bf_img_avatar", "Avatar Image", "Circular profile image for account and team screens.", map[string]any{"image_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400", "alt": "User avatar", "fit": "cover", "radius": 999}),
		image("bf_img_rounded", "Rounded Image", "Softly rounded image for cards and content blocks.", map[string]any{"image_url": "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=800", "alt": "Workspace", "fit": "cover", "radius": 12}),
		image("bf_img_hero", "Hero Image", "Large editorial image for landing and feature sections.", map[string]any{"image_url": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200", "alt": "Laptop workspace", "fit": "cover", "radius": 16}),

		group("bf_group_card", "Card Surface", "White bordered card container for dashboards and forms.", map[string]any{"container_layout": "column", "background_style": "bgcolor", "bgcolor": "#ffffff", "radius": 12, "border_style": "solid", "border_color": "#e2e8f0", "boxshadow_style": "none"}),
		group("bf_group_muted", "Muted Surface", "Subtle tinted container for grouped secondary content.", map[string]any{"container_layout": "column", "background_style": "bgcolor", "bgcolor": "#f8fafc", "radius": 12, "border_style": "solid", "border_color": "#e2e8f0", "boxshadow_style": "none"}),
		group("bf_group_panel", "Elevated Panel", "Panel-style container with a light shadow treatment.", map[string]any{"container_layout": "column", "background_style": "bgcolor", "bgcolor": "#ffffff", "radius": 16, "border_style": "solid", "border_color": "#f1f5f9", "boxshadow_style": "outset"}),

		card("bf_card_light_hero", "Light Hero Card", "Composite shadcn-style hero card for product sections.", map[string]any{"label": "Launch faster with BubbleForge", "bgcolor": "#ffffff", "fgcolor": "#0f172a", "border_style": "solid", "border_color": "#e2e8f0", "radius": 16, "padding": 24, "image_url": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=900", "alt": "Developer workspace"}),
		card("bf_card_dark_hero", "Dark Hero Card", "Dark composite card for premium landing sections.", map[string]any{"label": "Production-ready components", "bgcolor": "#020617", "fgcolor": "#f8fafc", "border_style": "solid", "border_color": "#1e293b", "radius": 16, "padding": 24, "image_url": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=900", "alt": "Abstract technology"}),
	}

	if _, err := pool.Exec(ctx, `DELETE FROM components`); err != nil {
		log.Fatalf("Failed to clear components: %v", err)
	}

	for _, component := range components {
		propsJSON, _ := json.Marshal(component.props)
		if _, err := pool.Exec(ctx, `
			INSERT INTO components (id, category, name, description, access, template_id, property_values)
			VALUES ($1, $2, $3, $4, 'Free', $5, $6)
		`, component.id, component.category, component.name, component.description, component.templateID, propsJSON); err != nil {
			log.Fatalf("Failed to insert %s: %v", component.id, err)
		}
		log.Printf("Seeded %s", component.name)
	}

	log.Printf("Seeded %d shadcn-inspired catalog components", len(components))
}

func button(id, name, description string, props map[string]any) catalogComponent {
	return catalogComponent{id: id, category: "buttons", name: name, description: description, templateID: "tmpl_shadcn_master_button", props: props}
}

func text(id, name, description string, props map[string]any) catalogComponent {
	return catalogComponent{id: id, category: "text", name: name, description: description, templateID: "tmpl_primitive_text", props: props}
}

func link(id, name, description string, props map[string]any) catalogComponent {
	return catalogComponent{id: id, category: "navigation", name: name, description: description, templateID: "tmpl_primitive_link", props: props}
}

func image(id, name, description string, props map[string]any) catalogComponent {
	return catalogComponent{id: id, category: "images", name: name, description: description, templateID: "tmpl_primitive_image", props: props}
}

func group(id, name, description string, props map[string]any) catalogComponent {
	return catalogComponent{id: id, category: "containers", name: name, description: description, templateID: "tmpl_primitive_group", props: props}
}

func card(id, name, description string, props map[string]any) catalogComponent {
	return catalogComponent{id: id, category: "cards", name: name, description: description, templateID: "tmpl_composite_hero_card", props: props}
}
