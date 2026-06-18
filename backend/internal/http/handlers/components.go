package handlers

import (
	"net/http"

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
	ID          string `json:"id"`
	Category    string `json:"category"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Access      string `json:"access"`
	BubbleJSON  any    `json:"bubbleJson"`
}

func (h *ComponentsHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	var comp Component
	err := h.DB.QueryRow(c.Request.Context(),
		"SELECT id, category, name, description, access, bubble_json FROM components WHERE id = $1",
		id,
	).Scan(&comp.ID, &comp.Category, &comp.Name, &comp.Description, &comp.Access, &comp.BubbleJSON)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Component not found"})
		return
	}

	c.JSON(http.StatusOK, comp)
}

func (h *ComponentsHandler) List(c *gin.Context) {
	rows, err := h.DB.Query(c.Request.Context(), "SELECT id, category, name, description, access, bubble_json FROM components ORDER BY created_at ASC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query database"})
		return
	}
	defer rows.Close()

	var comps []Component
	for rows.Next() {
		var comp Component
		if err := rows.Scan(&comp.ID, &comp.Category, &comp.Name, &comp.Description, &comp.Access, &comp.BubbleJSON); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan database row"})
			return
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

	_, err := h.DB.Exec(c.Request.Context(), `
		INSERT INTO components (id, category, name, description, access, bubble_json)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, comp.ID, comp.Category, comp.Name, comp.Description, comp.Access, comp.BubbleJSON)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create component"})
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

	res, err := h.DB.Exec(c.Request.Context(), `
		UPDATE components SET
			category = $1,
			name = $2,
			description = $3,
			access = $4,
			bubble_json = $5,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $6
	`, comp.Category, comp.Name, comp.Description, comp.Access, comp.BubbleJSON, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update component"})
		return
	}

	if res.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Component not found"})
		return
	}

	comp.ID = id
	c.JSON(http.StatusOK, comp)
}
