package handlers

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

type ComponentsHandler struct{}

func NewComponentsHandler() *ComponentsHandler {
	return &ComponentsHandler{}
}

func (h *ComponentsHandler) List(c *gin.Context) {
	// Read the components.json file from the backend/data directory
	// In production, this would be an absolute path or embedded file,
	// but for local dev this relative path from the backend root will work.
	cwd, err := os.Getwd()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get working directory"})
		return
	}

	filePath := filepath.Join(cwd, "data", "components.json")
	data, err := os.ReadFile(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read components data"})
		return
	}

	// We can just pipe the raw JSON directly back since it's already well-formed JSON,
	// but to ensure the content-type is correct and it's valid, we'll unmarshal and send as JSON.
	// Or even simpler: set the content type and send the bytes.
	c.Data(http.StatusOK, "application/json", data)
}
