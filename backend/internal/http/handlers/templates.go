package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/MaweuPaul/BubbleForge/backend/internal/compiler"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TemplatesHandler struct {
	DB *pgxpool.Pool
}

func NewTemplatesHandler(db *pgxpool.Pool) *TemplatesHandler {
	return &TemplatesHandler{DB: db}
}

type Template struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	Type            string `json:"type"`
	ComponentTypeID string `json:"component_type_id,omitempty"`
	BaseJSON        any    `json:"base_json,omitempty"`
	PropertySchema  any    `json:"property_schema,omitempty"`
	RulesJSON       any    `json:"rules_json,omitempty"`
}

func (h *TemplatesHandler) List(c *gin.Context) {
	atoms, _ := LoadAtoms(c.Request.Context(), h.DB)

	rows, err := h.DB.Query(c.Request.Context(), `
		SELECT t.id, t.name, ct.slug, t.property_schema, t.rules_json
		FROM component_templates t
		JOIN component_types ct ON ct.id = t.component_type_id
		ORDER BY t.created_at ASC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query database"})
		return
	}
	defer rows.Close()

	var templates []Template
	for rows.Next() {
		var t Template
		var schemaBytes []byte
		var rulesBytes []byte
		if err := rows.Scan(&t.ID, &t.Name, &t.Type, &schemaBytes, &rulesBytes); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan database row"})
			return
		}
		t.PropertySchema = EnrichSchema(schemaBytes, atoms)
		if rulesBytes != nil {
			_ = json.Unmarshal(rulesBytes, &t.RulesJSON)
		}
		templates = append(templates, t)
	}

	if templates == nil {
		templates = []Template{}
	}
	c.JSON(http.StatusOK, templates)
}

func (h *TemplatesHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	var t Template
	var schemaBytes []byte
	var rulesBytes []byte
	err := h.DB.QueryRow(c.Request.Context(),
		`
			SELECT t.id, t.name, ct.slug, t.component_type_id, t.base_json, t.property_schema, t.rules_json
			FROM component_templates t
			JOIN component_types ct ON ct.id = t.component_type_id
			WHERE t.id = $1
		`,
		id,
	).Scan(&t.ID, &t.Name, &t.Type, &t.ComponentTypeID, &t.BaseJSON, &schemaBytes, &rulesBytes)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
		return
	}

	atoms, _ := LoadAtoms(c.Request.Context(), h.DB)
	t.PropertySchema = EnrichSchema(schemaBytes, atoms)
	if rulesBytes != nil {
		_ = json.Unmarshal(rulesBytes, &t.RulesJSON)
	}

	c.JSON(http.StatusOK, t)
}

func (h *TemplatesHandler) Create(c *gin.Context) {
	var t Template
	if err := c.ShouldBindJSON(&t); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	if t.ID == "" || t.Name == "" || t.Type == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields"})
		return
	}
	if t.ComponentTypeID == "" {
		t.ComponentTypeID = t.Type
	}
	if t.RulesJSON == nil {
		t.RulesJSON = map[string]any{}
	}

	_, err := h.DB.Exec(c.Request.Context(), `
		INSERT INTO component_templates (id, component_type_id, name, slug, base_json, property_schema, rules_json)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, t.ID, t.ComponentTypeID, t.Name, t.ID, t.BaseJSON, t.PropertySchema, t.RulesJSON)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create template: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, t)
}

type ImportRequest struct {
	Name          string         `json:"name" binding:"required"`
	Category      string         `json:"category" binding:"required"`
	Description   string         `json:"description"`
	RawBubbleJSON map[string]any `json:"raw_bubble_json" binding:"required"`
}

type ElementImportRequest struct {
	Name          string         `json:"name" binding:"required"`
	Slug          string         `json:"slug"`
	BubbleType    string         `json:"bubble_type" binding:"required"`
	Category      string         `json:"category" binding:"required"`
	Description   string         `json:"description"`
	RawBubbleJSON map[string]any `json:"raw_bubble_json" binding:"required"`
}

type CompositeImportRequest struct {
	Name          string         `json:"name" binding:"required"`
	Category      string         `json:"category" binding:"required"`
	Description   string         `json:"description"`
	RawBubbleJSON map[string]any `json:"raw_bubble_json" binding:"required"`
}

func categoryID(category string) string {
	cat := strings.ToLower(strings.TrimSpace(category))
	cat = strings.ReplaceAll(cat, " ", "-")
	switch cat {
	case "button", "buttons":
		return "buttons"
	case "text", "texts", "typography":
		return "text"
	case "image", "images", "media":
		return "images"
	case "card", "cards":
		return "cards"
	case "container", "containers", "group", "groups":
		return "containers"
	case "input", "inputs", "form", "forms":
		return "inputs"
	case "icon", "icons":
		return "icons"
	case "nav", "navigation":
		return "navigation"
	case "table", "tables":
		return "tables"
	default:
		if cat == "" {
			return "other"
		}
		return cat
	}
}

func schemaForCategory(category string) (string, string) {
	componentTypeID := "type_container"
	schemaStr := "{}"

	catLower := strings.ToLower(category)
	if strings.Contains(catLower, "button") {
		componentTypeID = "type_button"
		schemaStr = `{"label": {"type": "text", "label": "Label", "default": "Button"}, "bgcolor": {"type": "color", "label": "Background", "default": "var(--color_primary_default)"}, "fgcolor": {"type": "color", "label": "Text Color", "default": "var(--color_primary_contrast_default)"}, "border_color": {"type": "color", "label": "Border", "default": "var(--color_primary_default)"}, "radius": {"type": "number", "label": "Radius", "default": 8, "min": 0, "max": 999}, "font_size": {"type": "number", "label": "Font Size", "default": 14, "min": 10, "max": 32}, "font_weight": {"type": "select", "label": "Font Weight", "default": "600", "options": ["400", "500", "600", "700"]}, "font_bold": {"type": "boolean", "label": "Bold", "default": true}, "icon": {"type": "text", "label": "Icon", "default": ""}}`
	} else if strings.Contains(catLower, "text") {
		componentTypeID = "type_text"
		schemaStr = `{"label": {"type": "text", "label": "Text Content", "default": "Your text here"}, "fgcolor": {"type": "color", "label": "Text Color", "default": "var(--color_text_default)"}, "font_size": {"type": "number", "label": "Font Size", "default": 16, "min": 10, "max": 72}, "font_weight": {"type": "select", "label": "Font Weight", "default": "500", "options": ["400", "500", "600", "700", "800"]}, "font_bold": {"type": "boolean", "label": "Bold", "default": false}, "align": {"type": "select", "label": "Alignment", "default": "left", "options": ["left", "center", "right"]}}`
	} else if strings.Contains(catLower, "image") {
		componentTypeID = "type_image"
		schemaStr = `{"image_url": {"type": "url", "label": "Image URL", "default": "https://placehold.co/600x400"}, "alt": {"type": "text", "label": "Alt Text", "default": "Image"}, "radius": {"type": "number", "label": "Radius", "default": 8, "min": 0, "max": 80}, "fit": {"type": "select", "label": "Fit", "default": "cover", "options": ["cover", "contain", "fill"]}}`
	} else if strings.Contains(catLower, "card") {
		componentTypeID = "type_card"
		schemaStr = `{"label": {"type": "text", "label": "Preview Text", "default": "Card"}, "bgcolor": {"type": "color", "label": "Background", "default": "var(--color_surface_default)"}, "fgcolor": {"type": "color", "label": "Text Color", "default": "var(--color_text_default)"}, "border_color": {"type": "color", "label": "Border", "default": "var(--color_border_default)"}, "radius": {"type": "number", "label": "Radius", "default": 12, "min": 0, "max": 80}, "padding": {"type": "number", "label": "Padding", "default": 16, "min": 0, "max": 64}, "shadow": {"type": "select", "label": "Shadow", "default": "md", "options": ["none", "sm", "md"]}}`
	} else {
		schemaStr = `{"label": {"type": "text", "label": "Preview Text", "default": "Container"}, "bgcolor": {"type": "color", "label": "Background", "default": "var(--color_surface_default)"}, "fgcolor": {"type": "color", "label": "Text Color", "default": "var(--color_text_default)"}, "radius": {"type": "number", "label": "Radius", "default": 8, "min": 0, "max": 80}, "padding": {"type": "number", "label": "Padding", "default": 16, "min": 0, "max": 64}}`
	}

	return componentTypeID, addSchemaDescriptions(schemaStr)
}

func rulesForCategory(category string) string {
	switch categoryID(category) {
	case "buttons":
		return `{
			"layout": {
				"height_mode": "fixed",
				"enforce_fixed_height": true,
				"description": "Buttons must compile with fit_height=false and single_height=true so Bubble keeps the explicit numeric height."
			},
			"compiler": {
				"required_properties": ["height"],
				"preserve_numeric_properties": ["height", "width", "border_roundness", "font_size"]
			}
		}`
	case "images":
		return `{
			"media": {
				"requires_alt_text": true,
				"description": "Images should include an alt atom and an image source atom."
			}
		}`
	case "text":
		return `{
			"content": {
				"requires_text_expression": true,
				"description": "Text components should keep content inside Bubble TextExpression entries."
			}
		}`
	default:
		return `{}`
	}
}

// schemaForComposite returns a full property_schema JSON string covering all
// standard visual tokens emitted by AutoTokenizeComposite for a card-type
// composite (Group + Text×N + Button).
func schemaForComposite() string {
	return `{
		"card_bg":       {"type": "color",  "label": "Card Background",   "default": "#ffffff",                    "description": "Background fill of the root Group container."},
		"radius":        {"type": "number", "label": "Corner Radius",     "default": 12, "min": 0, "max": 80,     "description": "Corner radius of the root Group (border_roundness)."},
		"border_color":  {"type": "color",  "label": "Border Color",      "default": "#e2e8f0",                    "description": "Border color of the root Group."},
		"title":         {"type": "text",   "label": "Title",             "default": "Card Title",                 "description": "Text content of the first Text child element."},
		"title_color":   {"type": "color",  "label": "Title Color",       "default": "#0f172a",                    "description": "Font color of the first Text child element."},
		"title_size":    {"type": "number", "label": "Title Font Size",   "default": 20, "min": 12, "max": 48,    "description": "Font size of the first Text child element."},
		"body":          {"type": "text",   "label": "Body Text",         "default": "Supporting text goes here.",  "description": "Text content of the second Text child element."},
		"body_color":    {"type": "color",  "label": "Body Color",        "default": "#64748b",                    "description": "Font color of the second Text child element."},
		"body_size":     {"type": "number", "label": "Body Font Size",    "default": 14, "min": 10, "max": 32,    "description": "Font size of the second Text child element."},
		"btn_label":     {"type": "text",   "label": "Button Label",      "default": "Get Started",                "description": "Text content of the Button child element."},
		"btn_color":     {"type": "color",  "label": "Button Color",      "default": "#1E6DF6",                    "description": "Background color of the Button child element."},
		"btn_radius":    {"type": "number", "label": "Button Radius",     "default": 8,  "min": 0, "max": 999,   "description": "Corner radius of the Button child element."},
		"btn_text_color":{"type": "color",  "label": "Button Text Color", "default": "#ffffff",                    "description": "Font color of the Button child element."}
	}`
}

func addSchemaDescriptions(schemaStr string) string {
	descriptions := map[string]string{
		"label":          "Controls Bubble text content. For text/button elements this maps to properties.text.entries.0.",
		"text":           "Controls Bubble text content. Usually maps to properties.text.entries.0.",
		"width":          "Controls Bubble element width via properties.width.",
		"height":         "Controls Bubble element height via properties.height.",
		"min_width_css":  "Controls Bubble responsive minimum width via properties.min_width_css.",
		"min_height_css": "Controls Bubble responsive minimum height via properties.min_height_css.",
		"bgcolor":        "Controls the element background/fill color. Usually maps to properties.bgcolor or properties.background_color.",
		"fgcolor":        "Controls the main text/icon color. Usually maps to Bubble properties.font_color.",
		"border_color":   "Controls the element border color via properties.border_color.",
		"border_style":   "Controls Bubble border style via properties.border_style, such as none or solid.",
		"border_width":   "Controls Bubble border thickness via properties.border_width.",
		"radius":         "Controls corner roundness via Bubble properties.border_roundness.",
		"padding":        "Controls inner spacing. Can map to properties.padding or the four padding side properties.",
		"font_size":      "Controls text size via Bubble properties.font_size.",
		"font_weight":    "Controls text weight where supported. Can map to font weight related Bubble properties.",
		"font_bold":      "Controls Bubble bold text via properties.font_bold.",
		"icon":           "Controls the icon value for icon-capable Bubble elements.",
		"align":          "Controls text/layout alignment. Usually maps to Bubble alignment properties.",
		"image_url":      "Controls the image source/url for Bubble image elements.",
		"alt":            "Controls image alternative text where Bubble exposes alt text metadata.",
		"fit":            "Controls how image content fits inside its box, such as cover, contain, or fill.",
		"shadow":         "Controls visual elevation in Bubble JSON when the base element contains shadow-related properties.",
	}

	var schema map[string]map[string]any
	if err := json.Unmarshal([]byte(schemaStr), &schema); err != nil {
		return schemaStr
	}
	for key, description := range descriptions {
		if field, ok := schema[key]; ok {
			if _, exists := field["description"]; !exists {
				field["description"] = description
			}
		}
	}
	bytes, err := json.Marshal(schema)
	if err != nil {
		return schemaStr
	}
	return string(bytes)
}

func slugify(v string) string {
	slug := strings.ToLower(strings.TrimSpace(v))
	slug = strings.ReplaceAll(slug, "_", "-")
	slug = strings.ReplaceAll(slug, " ", "-")
	for strings.Contains(slug, "--") {
		slug = strings.ReplaceAll(slug, "--", "-")
	}
	return strings.Trim(slug, "-")
}

func defaultValuesFromSchema(schemaStr string) map[string]any {
	var schema map[string]map[string]any
	values := map[string]any{}
	if err := json.Unmarshal([]byte(schemaStr), &schema); err != nil {
		return values
	}
	for key, field := range schema {
		if v, ok := field["default"]; ok {
			values[key] = v
		}
	}
	return values
}

func (h *TemplatesHandler) Import(c *gin.Context) {
	var req ImportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// 1. Clean the raw JSON from Bubble
	cleanedJSON := compiler.StripUnsafeFields(req.RawBubbleJSON)
	catID := categoryID(req.Category)

	// 1.5. Tokenize Bubble IDs and then properties based on category.
	idTokenizedJSON := compiler.TokenizeElementIDs(cleanedJSON)
	tokenizedJSON := compiler.AutoTokenize(idTokenizedJSON, catID)

	// 2. Generate IDs
	templateID := "tmpl_" + compiler.GenerateElementID() + compiler.GenerateElementID()
	componentID := "comp_" + compiler.GenerateElementID() + compiler.GenerateElementID()

	// Create a slug from name
	slug := strings.ToLower(strings.ReplaceAll(req.Name, " ", "-")) + "-" + compiler.GenerateElementID()

	componentTypeID, schemaStr := schemaForCategory(catID)
	rulesStr := rulesForCategory(catID)

	componentTypeName := strings.TrimPrefix(componentTypeID, "type_")
	componentTypeName = strings.ToUpper(componentTypeName[:1]) + componentTypeName[1:]
	_, err := h.DB.Exec(c.Request.Context(), `
		INSERT INTO component_types (id, name, slug, description)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (slug) DO NOTHING
	`, componentTypeID, componentTypeName, strings.TrimPrefix(componentTypeID, "type_"), "Imported component type")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to ensure component type: " + err.Error()})
		return
	}

	// 3. Save Template
	_, err = h.DB.Exec(c.Request.Context(), `
		INSERT INTO component_templates (id, component_type_id, name, slug, base_json, property_schema, rules_json, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, 'published')
	`, templateID, componentTypeID, req.Name, slug, tokenizedJSON, schemaStr, rulesStr)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save template: " + err.Error()})
		return
	}

	// 4. Save Component linking to template
	_, err = h.DB.Exec(c.Request.Context(), `
		INSERT INTO components (id, category, name, description, access, template_id, property_values)
		VALUES ($1, $2, $3, $4, 'Free', $5, '{}')
	`, componentID, catID, req.Name, req.Description, templateID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save component: " + err.Error()})
		return
	}

	// Fetch the created component to return
	var comp struct {
		ID         string `json:"id"`
		Name       string `json:"name"`
		Category   string `json:"category"`
		TemplateID string `json:"template_id"`
	}
	comp.ID = componentID
	comp.Name = req.Name
	comp.Category = catID
	comp.TemplateID = templateID

	c.JSON(http.StatusCreated, comp)
}

func (h *TemplatesHandler) ImportElementDefinition(c *gin.Context) {
	var req ElementImportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	slug := slugify(req.Slug)
	if slug == "" {
		slug = slugify(req.BubbleType)
	}
	if slug == "" {
		slug = slugify(req.Name)
	}
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Could not derive a valid element slug"})
		return
	}

	templateID := "tmpl_" + strings.ReplaceAll(slug, "-", "_")
	componentID := "comp-base-" + slug
	presetName := "Base " + req.Name
	if strings.HasPrefix(strings.ToLower(req.Name), "base ") {
		presetName = req.Name
	}

	cleanedJSON := compiler.StripUnsafeFields(req.RawBubbleJSON)
	catID := categoryID(req.Category)
	idTokenizedJSON := compiler.TokenizeElementIDs(cleanedJSON)
	tokenizedJSON := compiler.AutoTokenize(idTokenizedJSON, catID)
	componentTypeID, schemaStr := schemaForCategory(catID)
	rulesStr := rulesForCategory(catID)

	defaultValues := defaultValuesFromSchema(schemaStr)
	defaultValuesBytes, _ := json.Marshal(defaultValues)

	componentTypeName := strings.TrimPrefix(componentTypeID, "type_")
	componentTypeName = strings.ToUpper(componentTypeName[:1]) + componentTypeName[1:]
	_, err := h.DB.Exec(c.Request.Context(), `
		INSERT INTO component_types (id, name, slug, description)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (slug) DO NOTHING
	`, componentTypeID, componentTypeName, strings.TrimPrefix(componentTypeID, "type_"), "Imported component type")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to ensure component type: " + err.Error()})
		return
	}

	_, err = h.DB.Exec(c.Request.Context(), `
		INSERT INTO component_templates (
			id, component_type_id, name, slug, base_json, property_schema, rules_json, status
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, 'published')
		ON CONFLICT (slug) DO UPDATE SET
			name = EXCLUDED.name,
			component_type_id = EXCLUDED.component_type_id,
			base_json = EXCLUDED.base_json,
			property_schema = EXCLUDED.property_schema,
			rules_json = EXCLUDED.rules_json,
			status = 'published',
			updated_at = CURRENT_TIMESTAMP
	`, templateID, componentTypeID, req.Name, slug, tokenizedJSON, schemaStr, rulesStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save master template: " + err.Error()})
		return
	}

	_, err = h.DB.Exec(c.Request.Context(), `
		INSERT INTO components (
			id, category, name, description, access, template_id, property_values
		) VALUES (
			$1, $2, $3, $4, 'Free', $5, $6
		)
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name,
			category = EXCLUDED.category,
			description = EXCLUDED.description,
			template_id = EXCLUDED.template_id,
			property_values = EXCLUDED.property_values,
			updated_at = CURRENT_TIMESTAMP
	`, componentID, catID, presetName, req.Description, templateID, string(defaultValuesBytes))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save starter component: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":           templateID,
		"slug":         slug,
		"name":         req.Name,
		"component_id": componentID,
		"category":     catID,
	})
}

// ImportComposite handles POST /api/v1/templates/import-composite.
// It accepts a raw Bubble copy-envelope JSON containing a Group with nested
// child elements, runs the composite tokenizer pipeline, and persists a
// ready-to-compile template + starter component.
func (h *TemplatesHandler) ImportComposite(c *gin.Context) {
	var req CompositeImportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// 1. Strip unsafe Bubble fields recursively.
	cleaned := compiler.StripUnsafeFields(req.RawBubbleJSON)

	// 2. Tokenize element IDs — handles nested elements map + current_parent wiring.
	idTokenized := compiler.TokenizeElementIDs(cleaned)

	// 3. Tokenize visual properties per child type (Text→TITLE/BODY, Button→BTN_*, etc.).
	tokenized := compiler.AutoTokenizeComposite(idTokenized)

	// 4. Generate IDs and slug.
	templateID := "tmpl_composite_" + compiler.GenerateElementID() + compiler.GenerateElementID()
	componentID := "comp_composite_" + compiler.GenerateElementID() + compiler.GenerateElementID()
	slug := slugify(req.Name) + "-" + compiler.GenerateElementID()
	catID := categoryID(req.Category)

	// 5. Ensure the composite component type row exists.
	const compositeTypeID = "type_group"
	_, err := h.DB.Exec(c.Request.Context(), `
		INSERT INTO component_types (id, name, slug, description)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (slug) DO NOTHING
	`, compositeTypeID, "Group", "group", "Composite group-based component")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to ensure component type: " + err.Error()})
		return
	}

	// 6. Build schema — covers all standard composite visual tokens.
	schemaStr := schemaForComposite()

	// 7. Save the template.
	_, err = h.DB.Exec(c.Request.Context(), `
		INSERT INTO component_templates (id, component_type_id, name, slug, base_json, property_schema, rules_json, status)
		VALUES ($1, $2, $3, $4, $5, $6, '{}', 'published')
	`, templateID, compositeTypeID, req.Name, slug, tokenized, schemaStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save template: " + err.Error()})
		return
	}

	// 8. Save starter component — populate property_values from schema defaults so
	//    it compiles immediately without any manual customization step.
	defaultValues := defaultValuesFromSchema(schemaStr)
	defaultValuesBytes, _ := json.Marshal(defaultValues)
	_, err = h.DB.Exec(c.Request.Context(), `
		INSERT INTO components (id, category, name, description, access, template_id, property_values)
		VALUES ($1, $2, $3, $4, 'Free', $5, $6)
	`, componentID, catID, req.Name, req.Description, templateID, string(defaultValuesBytes))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save component: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"template_id":  templateID,
		"component_id": componentID,
		"slug":         slug,
		"name":         req.Name,
		"category":     catID,
	})
}

