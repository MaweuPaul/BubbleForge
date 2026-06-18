package http

import (
	"time"

	"github.com/MaweuPaul/BubbleForge/backend/internal/config"
	"github.com/MaweuPaul/BubbleForge/backend/internal/http/handlers"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type RouterDeps struct {
	Config config.Config
	Logger *zap.Logger
	DB     *pgxpool.Pool
	Redis  *redis.Client
}

func NewRouter(deps RouterDeps) *gin.Engine {
	if deps.Config.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(cors.New(cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type", "Origin", "Accept"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	health := handlers.NewHealthHandler(deps.DB, deps.Redis)
	components := handlers.NewComponentsHandler()

	router.GET("/health", health.Check)

	api := router.Group("/api/v1")
	{
		api.GET("/health", health.Check)
		api.GET("/components", components.List)
	}

	return router
}
