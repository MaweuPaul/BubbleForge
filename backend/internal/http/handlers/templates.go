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
}

func (h *TemplatesHandler) List(c *gin.Context) {
	rows, err := h.DB.Query(c.Request.Context(), `
		SELECT t.id, t.name, ct.slug
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
		if err := rows.Scan(&t.ID, &t.Name, &t.Type); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan database row"})
			return
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
	err := h.DB.QueryRow(c.Request.Context(),
		`
			SELECT t.id, t.name, ct.slug, t.component_type_id, t.base_json, t.property_schema
			FROM component_templates t
			JOIN component_types ct ON ct.id = t.component_type_id
			WHERE t.id = $1
		`,
		id,
	).Scan(&t.ID, &t.Name, &t.Type, &t.ComponentTypeID, &t.BaseJSON, &t.PropertySchema)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
		return
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

	_, err := h.DB.Exec(c.Request.Context(), `
		INSERT INTO component_templates (id, component_type_id, name, slug, base_json, property_schema)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, t.ID, t.ComponentTypeID, t.Name, t.ID, t.BaseJSON, t.PropertySchema)

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

	return componentTypeID, schemaStr
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

	// 1.5. Auto-Tokenize based on Category
	tokenizedJSON := compiler.AutoTokenize(cleanedJSON, req.Category)

	// 2. Generate IDs
	templateID := "tmpl_" + compiler.GenerateElementID() + compiler.GenerateElementID()
	componentID := "comp_" + compiler.GenerateElementID() + compiler.GenerateElementID()

	// Create a slug from name
	slug := strings.ToLower(strings.ReplaceAll(req.Name, " ", "-")) + "-" + compiler.GenerateElementID()

	componentTypeID, schemaStr := schemaForCategory(req.Category)

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
		INSERT INTO component_templates (id, component_type_id, name, slug, base_json, property_schema, status)
		VALUES ($1, $2, $3, $4, $5, $6, 'published')
	`, templateID, componentTypeID, req.Name, slug, tokenizedJSON, schemaStr)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save template: " + err.Error()})
		return
	}

	// 4. Save Component linking to template
	_, err = h.DB.Exec(c.Request.Context(), `
		INSERT INTO components (id, category, name, description, access, template_id, property_values)
		VALUES ($1, $2, $3, $4, 'Free', $5, '{}')
	`, componentID, req.Category, req.Name, req.Description, templateID)

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
	comp.Category = req.Category
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

	elementID := "element_" + strings.ReplaceAll(slug, "-", "_")
	presetID := "preset-base-" + slug
	presetSlug := "base-" + slug
	presetName := "Base " + req.Name
	if strings.HasPrefix(strings.ToLower(req.Name), "base ") {
		presetName = req.Name
	}

	cleanedJSON := compiler.StripUnsafeFields(req.RawBubbleJSON)
	tokenizedJSON := compiler.AutoTokenize(cleanedJSON, req.Category)
	_, schemaStr := schemaForCategory(req.Category)

	defaultValues := defaultValuesFromSchema(schemaStr)
	defaultValuesBytes, _ := json.Marshal(defaultValues)

	_, err := h.DB.Exec(c.Request.Context(), `
		INSERT INTO element_definitions (
			id, slug, name, bubble_type, category, description,
			base_json, property_schema, property_mappings, status
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '{}', 'published')
		ON CONFLICT (slug) DO UPDATE SET
			name = EXCLUDED.name,
			bubble_type = EXCLUDED.bubble_type,
			category = EXCLUDED.category,
			description = EXCLUDED.description,
			base_json = EXCLUDED.base_json,
			property_schema = EXCLUDED.property_schema,
			status = 'published',
			updated_at = CURRENT_TIMESTAMP
	`, elementID, slug, req.Name, req.BubbleType, req.Category, req.Description, tokenizedJSON, schemaStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save element definition: " + err.Error()})
		return
	}

	_, err = h.DB.Exec(c.Request.Context(), `
		INSERT INTO component_presets (
			id, element_definition_id, name, slug, category,
			description, access, property_values, status
		)
		VALUES ($1, $2, $3, $4, $5, $6, 'Free', $7, 'published')
		ON CONFLICT (slug) DO UPDATE SET
			element_definition_id = EXCLUDED.element_definition_id,
			name = EXCLUDED.name,
			category = EXCLUDED.category,
			description = EXCLUDED.description,
			property_values = EXCLUDED.property_values,
			status = 'published',
			updated_at = CURRENT_TIMESTAMP
	`, presetID, elementID, presetName, presetSlug, req.Category, req.Description, string(defaultValuesBytes))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save starter preset: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":        elementID,
		"slug":      slug,
		"name":      req.Name,
		"preset_id": presetID,
		"category":  req.Category,
	})
}
