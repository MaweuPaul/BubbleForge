package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type HealthHandler struct {
	db    *pgxpool.Pool
	redis *redis.Client
}

func NewHealthHandler(db *pgxpool.Pool, redis *redis.Client) HealthHandler {
	return HealthHandler{
		db:    db,
		redis: redis,
	}
}

func (h HealthHandler) Check(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	checks := map[string]string{
		"api":      "ok",
		"postgres": "ok",
		"redis":    "ok",
	}

	status := http.StatusOK

	if err := h.db.Ping(ctx); err != nil {
		checks["postgres"] = "error"
		status = http.StatusServiceUnavailable
	}

	if err := h.redis.Ping(ctx).Err(); err != nil {
		checks["redis"] = "error"
		status = http.StatusServiceUnavailable
	}

	c.JSON(status, gin.H{
		"status": checks,
	})
}
