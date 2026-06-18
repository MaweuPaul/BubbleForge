package handlers

import (
	"net/http"

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
