package handlers

import (
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

	// Determine component type and default schema based on category
	componentTypeID := "type_container"
	schemaStr := "{}"

	catLower := strings.ToLower(req.Category)
	if strings.Contains(catLower, "button") {
		componentTypeID = "type_button"
		schemaStr = `{"label": {"type": "text", "label": "Label", "default": "Button"}, "bgcolor": {"type": "color", "label": "Background", "default": "var(--color_primary_default)"}, "fgcolor": {"type": "color", "label": "Text Color", "default": "var(--color_primary_contrast_default)"}, "radius": {"type": "number", "label": "Radius", "default": 8}, "icon": {"type": "text", "label": "Icon", "default": ""}}`
	} else if strings.Contains(catLower, "text") {
		componentTypeID = "type_text"
		schemaStr = `{"label": {"type": "text", "label": "Text Content", "default": "Your text here"}, "fgcolor": {"type": "color", "label": "Text Color", "default": "var(--color_text_default)"}}`
	} else if strings.Contains(catLower, "image") {
		componentTypeID = "type_image"
		schemaStr = `{"image_url": {"type": "url", "label": "Image URL", "default": "https://placehold.co/600x400"}, "radius": {"type": "number", "label": "Radius", "default": 8}}`
	} else {
		// Generic container/card schema
		schemaStr = `{"bgcolor": {"type": "color", "label": "Background", "default": "var(--color_surface_default)"}, "radius": {"type": "number", "label": "Radius", "default": 8}}`
	}

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
