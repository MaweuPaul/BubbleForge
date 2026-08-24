package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/MaweuPaul/BubbleForge/backend/internal/compiler"
	"github.com/MaweuPaul/BubbleForge/backend/internal/theme"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ComponentsHandler struct {
	DB *pgxpool.Pool
}

func NewComponentsHandler(db *pgxpool.Pool) *ComponentsHandler {
	return &ComponentsHandler{DB: db}
}

type Component struct {
	ID             string         `json:"id"`
	Category       string         `json:"category"`
	Name           string         `json:"name"`
	Description    string         `json:"description"`
	Access         string         `json:"access"`
	BubbleJSON     any            `json:"bubbleJson,omitempty"`
	TemplateID     *string        `json:"template_id,omitempty"`
	PropertyValues map[string]any `json:"property_values,omitempty"`
	PropertySchema any            `json:"property_schema,omitempty"`
	RulesJSON      any            `json:"rules_json,omitempty"`
	Source         string         `json:"source,omitempty"`
}

// GetByID returns a single component with its enriched property schema.
func (h *ComponentsHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	var comp Component
	var propValsBytes []byte
	var schemaBytes []byte
	var rulesBytes []byte
	err := h.DB.QueryRow(c.Request.Context(),
		`SELECT c.id, c.category, c.name, c.description, c.access, c.template_id, c.property_values, t.property_schema, t.rules_json
		 FROM components c
		 LEFT JOIN component_templates t ON c.template_id = t.id
		 WHERE c.id = $1`,
		id,
	).Scan(&comp.ID, &comp.Category, &comp.Name, &comp.Description, &comp.Access, &comp.TemplateID, &propValsBytes, &schemaBytes, &rulesBytes)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Component not found"})
		return
	}

	if propValsBytes != nil {
		_ = json.Unmarshal(propValsBytes, &comp.PropertyValues)
	}
	atoms, _ := LoadAtoms(c.Request.Context(), h.DB)
	comp.PropertySchema = EnrichSchema(schemaBytes, atoms)
	if rulesBytes != nil {
		_ = json.Unmarshal(rulesBytes, &comp.RulesJSON)
	}
	comp.Source = "component"

	c.JSON(http.StatusOK, comp)
}

// List returns all published components with enriched property schemas.
func (h *ComponentsHandler) List(c *gin.Context) {
	atoms, _ := LoadAtoms(c.Request.Context(), h.DB)

	rows, err := h.DB.Query(c.Request.Context(), `
		SELECT c.id, c.category, c.name, c.description, c.access, c.template_id, c.property_values, t.property_schema, t.rules_json
		FROM components c
		LEFT JOIN component_templates t ON c.template_id = t.id
		ORDER BY c.created_at ASC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query database"})
		return
	}
	defer rows.Close()

	var comps []Component
	for rows.Next() {
		var comp Component
		var propValsBytes []byte
		var schemaBytes []byte
		var rulesBytes []byte
		if err := rows.Scan(&comp.ID, &comp.Category, &comp.Name, &comp.Description, &comp.Access, &comp.TemplateID, &propValsBytes, &schemaBytes, &rulesBytes); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan row: " + err.Error()})
			return
		}
		if propValsBytes != nil {
			_ = json.Unmarshal(propValsBytes, &comp.PropertyValues)
		}
		comp.PropertySchema = EnrichSchema(schemaBytes, atoms)
		if rulesBytes != nil {
			_ = json.Unmarshal(rulesBytes, &comp.RulesJSON)
		}
		comp.Source = "component"
		comps = append(comps, comp)
	}

	if comps == nil {
		comps = []Component{}
	}
	c.JSON(http.StatusOK, comps)
}

func (h *ComponentsHandler) Create(c *gin.Context) {
	var comp Component
	if err := c.ShouldBindJSON(&comp); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	if comp.ID == "" || comp.Name == "" || comp.Category == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields"})
		return
	}
	if comp.Access == "" {
		comp.Access = "Free"
	}

	propValsBytes, _ := json.Marshal(comp.PropertyValues)

	_, err := h.DB.Exec(c.Request.Context(), `
		INSERT INTO components (id, category, name, description, access, template_id, property_values)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, comp.ID, comp.Category, comp.Name, comp.Description, comp.Access, comp.TemplateID, propValsBytes)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create component: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, comp)
}

func (h *ComponentsHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var comp Component
	if err := c.ShouldBindJSON(&comp); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	if comp.Access == "" {
		comp.Access = "Free"
	}

	propValsBytes, _ := json.Marshal(comp.PropertyValues)

	res, err := h.DB.Exec(c.Request.Context(), `
		UPDATE components SET
			category = $1,
			name = $2,
			description = $3,
			access = $4,
			template_id = $5,
			property_values = $6,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $7
	`, comp.Category, comp.Name, comp.Description, comp.Access, comp.TemplateID, propValsBytes, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update component: " + err.Error()})
		return
	}

	if res.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Component not found"})
		return
	}

	comp.ID = id
	c.JSON(http.StatusOK, comp)
}

// Compile compiles a component's property_values into final Bubble JSON.
func (h *ComponentsHandler) Compile(c *gin.Context) {
	id := c.Param("id")

	// 1. Load component property_values and template_id
	var templateID *string
	var propValsBytes []byte
	err := h.DB.QueryRow(c.Request.Context(),
		"SELECT template_id, property_values FROM components WHERE id = $1",
		id,
	).Scan(&templateID, &propValsBytes)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Component not found"})
		return
	}

	if templateID == nil || *templateID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Component does not have an associated template"})
		return
	}

	var propertyValues map[string]any
	if propValsBytes != nil {
		_ = json.Unmarshal(propValsBytes, &propertyValues)
	}
	if propertyValues == nil {
		propertyValues = make(map[string]any)
	}

	// 2. Accept optional property_values override from request body
	var req struct {
		PropertyValues map[string]any `json:"property_values"`
	}
	if err := c.ShouldBindJSON(&req); err == nil && req.PropertyValues != nil {
		for k, v := range req.PropertyValues {
			propertyValues[k] = v
		}
	}

	// 3. Load matching component_template
	var baseJSONBytes []byte
	var rulesBytes []byte
	err = h.DB.QueryRow(c.Request.Context(),
		"SELECT base_json, rules_json FROM component_templates WHERE id = $1",
		*templateID,
	).Scan(&baseJSONBytes, &rulesBytes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load component template"})
		return
	}

	var baseJSON map[string]any
	if err := json.Unmarshal(baseJSONBytes, &baseJSON); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse template base JSON"})
		return
	}
	var rulesJSON map[string]any
	if rulesBytes != nil {
		_ = json.Unmarshal(rulesBytes, &rulesJSON)
	}

	// 4. Load brand tokens and compile
	brandTokens := h.loadBrandTokens(c)

	output, err := compiler.Compile(compiler.CompileInput{
		Template:       compiler.ComponentTemplate{BaseJSON: baseJSON, RulesJSON: rulesJSON},
		PropertyValues: propertyValues,
		BrandTokens:    brandTokens,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Compilation failed: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, output.BubbleJSON)
}

func (h *ComponentsHandler) loadBrandTokens(c *gin.Context) map[string]string {
	brandTokens := theme.CompilerTokenMap(theme.DefaultValues())

	var pColor, sColor, tColor, bColor, font string
	var radius int
	err := h.DB.QueryRow(c.Request.Context(),
		"SELECT primary_color, secondary_color, text_color, background_color, border_radius, font_family FROM brand_tokens LIMIT 1",
	).Scan(&pColor, &sColor, &tColor, &bColor, &radius, &font)
	if err == nil {
		brandTokens["PRIMARY_COLOR"] = pColor
		brandTokens["SECONDARY_COLOR"] = sColor
		brandTokens["TEXT_COLOR"] = tColor
		brandTokens["BACKGROUND_COLOR"] = bColor
		brandTokens["RADIUS"] = fmt.Sprintf("%d", radius)
		brandTokens["FONT_FAMILY"] = font
	}
	return brandTokens
}
