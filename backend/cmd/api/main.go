package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/MaweuPaul/BubbleForge/backend/internal/config"
	httpserver "github.com/MaweuPaul/BubbleForge/backend/internal/http"
	"github.com/MaweuPaul/BubbleForge/backend/internal/platform/cache"
	"github.com/MaweuPaul/BubbleForge/backend/internal/platform/database"
	"go.uber.org/zap"
)

func main() {
	logger, err := zap.NewProduction()
	if err != nil {
		panic(err)
	}
	defer func() {
		_ = logger.Sync()
	}()

	cfg, err := config.Load()
	if err != nil {
		logger.Fatal("load config", zap.Error(err))
	}

	ctx := context.Background()

	postgres, err := database.NewPostgres(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Fatal("connect postgres", zap.Error(err))
	}
	defer postgres.Close()

	redisClient := cache.NewRedis(cfg.Redis)
	defer func() {
		_ = redisClient.Close()
	}()

	router := httpserver.NewRouter(httpserver.RouterDeps{
		Config: cfg,
		Logger: logger,
		DB:     postgres,
		Redis:  redisClient,
	})

	server := &http.Server{
		Addr:              cfg.HTTPAddr,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		logger.Info("backend listening", zap.String("addr", cfg.HTTPAddr))
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Fatal("listen and serve", zap.Error(err))
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error("shutdown server", zap.Error(err))
	}
}
