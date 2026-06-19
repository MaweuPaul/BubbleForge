package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/MaweuPaul/BubbleForge/backend/internal/compiler"
	"github.com/MaweuPaul/BubbleForge/backend/internal/theme"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
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
	ElementID      *string        `json:"element_definition_id,omitempty"`
	Source         string         `json:"source,omitempty"`
}

func (h *ComponentsHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	if comp, ok, err := h.getPresetComponent(c, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query preset: " + err.Error()})
		return
	} else if ok {
		c.JSON(http.StatusOK, comp)
		return
	}

	var comp Component
	var propValsBytes []byte
	err := h.DB.QueryRow(c.Request.Context(),
		`SELECT c.id, c.category, c.name, c.description, c.access, c.template_id, c.property_values, t.property_schema 
		 FROM components c 
		 LEFT JOIN component_templates t ON c.template_id = t.id 
		 WHERE c.id = $1`,
		id,
	).Scan(&comp.ID, &comp.Category, &comp.Name, &comp.Description, &comp.Access, &comp.TemplateID, &propValsBytes, &comp.PropertySchema)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Component not found"})
		return
	}

	if propValsBytes != nil {
		_ = json.Unmarshal(propValsBytes, &comp.PropertyValues)
	}
	comp.Source = "component"

	c.JSON(http.StatusOK, comp)
}

func (h *ComponentsHandler) List(c *gin.Context) {
	comps, err := h.listPresetComponents(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query presets: " + err.Error()})
		return
	}

	rows, err := h.DB.Query(c.Request.Context(), `
		SELECT c.id, c.category, c.name, c.description, c.access, c.template_id, c.property_values, t.property_schema 
		FROM components c 
		LEFT JOIN component_templates t ON c.template_id = t.id 
		WHERE c.id NOT LIKE 'comp-button-%'
		ORDER BY c.created_at ASC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query database"})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var comp Component
		var propValsBytes []byte
		if err := rows.Scan(&comp.ID, &comp.Category, &comp.Name, &comp.Description, &comp.Access, &comp.TemplateID, &propValsBytes, &comp.PropertySchema); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan database row: " + err.Error()})
			return
		}
		if propValsBytes != nil {
			_ = json.Unmarshal(propValsBytes, &comp.PropertyValues)
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

func (h *ComponentsHandler) Compile(c *gin.Context) {
	id := c.Param("id")

	if ok := h.compilePreset(c, id); ok {
		return
	}

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

	var dbPropertyValues map[string]any
	if propValsBytes != nil {
		_ = json.Unmarshal(propValsBytes, &dbPropertyValues)
	}
	if dbPropertyValues == nil {
		dbPropertyValues = make(map[string]any)
	}

	// 2. Accept optional property_values override from request body
	var req struct {
		PropertyValues map[string]any `json:"property_values"`
	}
	if err := c.ShouldBindJSON(&req); err == nil && req.PropertyValues != nil {
		// Merge overrides
		for k, v := range req.PropertyValues {
			dbPropertyValues[k] = v
		}
	}

	// 2.5 Map legacy extension keys (bgcolor, fgcolor, radius) to the standard Brand Tokens
	if bg, ok := dbPropertyValues["bgcolor"]; ok {
		if bgStr, isStr := bg.(string); isStr && bgStr != "" {
			// Also set it in PropertyValues so the compiler sees it as {{BGCOLOR}} if a template explicitly uses that
			// But we primarily want to inject it into the Brand Tokens override list
			if req.PropertyValues == nil {
				req.PropertyValues = make(map[string]any)
			}
			req.PropertyValues["PRIMARY_COLOR"] = bgStr
		}
	}
	if fg, ok := dbPropertyValues["fgcolor"]; ok {
		if fgStr, isStr := fg.(string); isStr && fgStr != "" {
			if req.PropertyValues == nil {
				req.PropertyValues = make(map[string]any)
			}
			req.PropertyValues["TEXT_COLOR"] = fgStr
		}
	}
	if rad, ok := dbPropertyValues["radius"]; ok {
		if req.PropertyValues == nil {
			req.PropertyValues = make(map[string]any)
		}
		req.PropertyValues["RADIUS"] = fmt.Sprintf("%v", rad)
	}

	// 3. Load matching component_template
	var baseJSONBytes []byte
	err = h.DB.QueryRow(c.Request.Context(),
		"SELECT base_json FROM component_templates WHERE id = $1",
		*templateID,
	).Scan(&baseJSONBytes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load component template"})
		return
	}

	var baseJSON map[string]any
	if err := json.Unmarshal(baseJSONBytes, &baseJSON); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse template base JSON"})
		return
	}

	// 4. Load BubbleForge theme defaults, then optionally override from legacy brand_tokens.
	brandTokens := theme.CompilerTokenMap(theme.DefaultValues())

	var pColor, sColor, tColor, bColor, font string
	var radius int
	err = h.DB.QueryRow(c.Request.Context(),
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

	// Merge the dynamically mapped property values (from bgcolor/fgcolor/radius) into brand tokens
	if req.PropertyValues != nil {
		if pc, ok := req.PropertyValues["PRIMARY_COLOR"].(string); ok && pc != "" {
			brandTokens["PRIMARY_COLOR"] = pc
		}
		if tc, ok := req.PropertyValues["TEXT_COLOR"].(string); ok && tc != "" {
			brandTokens["TEXT_COLOR"] = tc
		}
		if r, ok := req.PropertyValues["RADIUS"].(string); ok && r != "" {
			brandTokens["RADIUS"] = r
		}
	}

	// 5. Call compiler.Compile()
	input := compiler.CompileInput{
		Template:       compiler.ComponentTemplate{BaseJSON: baseJSON},
		PropertyValues: dbPropertyValues,
		BrandTokens:    brandTokens,
	}

	output, err := compiler.Compile(input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Compilation failed: " + err.Error()})
		return
	}

	// 6. Return compiled Bubble JSON
	c.JSON(http.StatusOK, output.BubbleJSON)
}

func (h *ComponentsHandler) getPresetComponent(c *gin.Context, id string) (Component, bool, error) {
	var comp Component
	var propValsBytes []byte
	var schemaBytes []byte
	var elementID string
	err := h.DB.QueryRow(c.Request.Context(), `
		SELECT p.id, p.category, p.name, p.description, p.access, p.property_values, e.property_schema, e.id
		FROM component_presets p
		JOIN element_definitions e ON e.id = p.element_definition_id
		WHERE p.id = $1 AND p.status = 'published'
	`, id).Scan(&comp.ID, &comp.Category, &comp.Name, &comp.Description, &comp.Access, &propValsBytes, &schemaBytes, &elementID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return Component{}, false, nil
		}
		return Component{}, false, err
	}
	if propValsBytes != nil {
		_ = json.Unmarshal(propValsBytes, &comp.PropertyValues)
	}
	if schemaBytes != nil {
		var schema map[string]any
		_ = json.Unmarshal(schemaBytes, &schema)
		comp.PropertySchema = schema
	}
	comp.ElementID = &elementID
	comp.Source = "preset"
	return comp, true, nil
}

func (h *ComponentsHandler) listPresetComponents(c *gin.Context) ([]Component, error) {
	rows, err := h.DB.Query(c.Request.Context(), `
		SELECT p.id, p.category, p.name, p.description, p.access, p.property_values, e.property_schema, e.id
		FROM component_presets p
		JOIN element_definitions e ON e.id = p.element_definition_id
		WHERE p.status = 'published' AND e.status = 'published'
		ORDER BY p.created_at ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comps []Component
	for rows.Next() {
		var comp Component
		var propValsBytes []byte
		var schemaBytes []byte
		var elementID string
		if err := rows.Scan(&comp.ID, &comp.Category, &comp.Name, &comp.Description, &comp.Access, &propValsBytes, &schemaBytes, &elementID); err != nil {
			return nil, err
		}
		if propValsBytes != nil {
			_ = json.Unmarshal(propValsBytes, &comp.PropertyValues)
		}
		if schemaBytes != nil {
			var schema map[string]any
			_ = json.Unmarshal(schemaBytes, &schema)
			comp.PropertySchema = schema
		}
		comp.ElementID = &elementID
		comp.Source = "preset"
		comps = append(comps, comp)
	}
	return comps, rows.Err()
}

func (h *ComponentsHandler) compilePreset(c *gin.Context, id string) bool {
	var propValsBytes []byte
	var baseJSONBytes []byte
	err := h.DB.QueryRow(c.Request.Context(), `
		SELECT p.property_values, e.base_json
		FROM component_presets p
		JOIN element_definitions e ON e.id = p.element_definition_id
		WHERE p.id = $1 AND p.status = 'published' AND e.status = 'published'
	`, id).Scan(&propValsBytes, &baseJSONBytes)
	if err != nil {
		if err == pgx.ErrNoRows {
			return false
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load preset: " + err.Error()})
		return true
	}

	propertyValues := map[string]any{}
	if propValsBytes != nil {
		_ = json.Unmarshal(propValsBytes, &propertyValues)
	}

	var req struct {
		PropertyValues map[string]any `json:"property_values"`
	}
	if err := c.ShouldBindJSON(&req); err == nil && req.PropertyValues != nil {
		for k, v := range req.PropertyValues {
			propertyValues[k] = v
		}
	}

	var baseJSON map[string]any
	if err := json.Unmarshal(baseJSONBytes, &baseJSON); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse element definition base JSON"})
		return true
	}

	brandTokens := h.loadBrandTokens(c)
	output, err := compiler.Compile(compiler.CompileInput{
		Template:       compiler.ComponentTemplate{BaseJSON: baseJSON},
		PropertyValues: propertyValues,
		BrandTokens:    brandTokens,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Compilation failed: " + err.Error()})
		return true
	}

	c.JSON(http.StatusOK, output.BubbleJSON)
	return true
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
