package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/MaweuPaul/BubbleForge/backend/internal/compiler"
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
}

func (h *ComponentsHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	var comp Component
	var propValsBytes []byte
	err := h.DB.QueryRow(c.Request.Context(),
		"SELECT id, category, name, description, access, template_id, property_values FROM components WHERE id = $1",
		id,
	).Scan(&comp.ID, &comp.Category, &comp.Name, &comp.Description, &comp.Access, &comp.TemplateID, &propValsBytes)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Component not found"})
		return
	}

	if propValsBytes != nil {
		_ = json.Unmarshal(propValsBytes, &comp.PropertyValues)
	}

	c.JSON(http.StatusOK, comp)
}

func (h *ComponentsHandler) List(c *gin.Context) {
	rows, err := h.DB.Query(c.Request.Context(), "SELECT id, category, name, description, access, template_id, property_values FROM components ORDER BY created_at ASC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query database"})
		return
	}
	defer rows.Close()

	var comps []Component
	for rows.Next() {
		var comp Component
		var propValsBytes []byte
		if err := rows.Scan(&comp.ID, &comp.Category, &comp.Name, &comp.Description, &comp.Access, &comp.TemplateID, &propValsBytes); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan database row"})
			return
		}
		if propValsBytes != nil {
			_ = json.Unmarshal(propValsBytes, &comp.PropertyValues)
		}
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

	// 4. Load global brand_tokens defaults
	brandTokens := map[string]string{
		"PRIMARY_COLOR":    "#ea580c",
		"SECONDARY_COLOR":  "#0f172a",
		"TEXT_COLOR":       "#ffffff",
		"BACKGROUND_COLOR": "#ffffff",
		"RADIUS":           "8",
		"FONT_FAMILY":      "Inter, ui-sans-serif",
	}

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
