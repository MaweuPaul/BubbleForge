package config

import (
	"errors"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv        string
	HTTPAddr      string
	DatabaseURL   string
	EncryptionKey string
	Redis         RedisConfig
}

type RedisConfig struct {
	Addr     string
	Password string
	DB       int
}

func Load() (Config, error) {
	_ = godotenv.Load()

	cfg := Config{
		AppEnv:        getEnv("APP_ENV", "development"),
		HTTPAddr:      getEnv("HTTP_ADDR", ":8080"),
		DatabaseURL:   os.Getenv("DATABASE_URL"),
		EncryptionKey: os.Getenv("ENCRYPTION_KEY"),
		Redis: RedisConfig{
			Addr:     getEnv("REDIS_ADDR", "localhost:6379"),
			Password: os.Getenv("REDIS_PASSWORD"),
			DB:       getEnvInt("REDIS_DB", 0),
		},
	}

	if cfg.DatabaseURL == "" {
		return Config{}, errors.New("DATABASE_URL is required")
	}

	if cfg.EncryptionKey == "" {
		return Config{}, errors.New("ENCRYPTION_KEY is required")
	}

	return cfg, nil
}

func getEnv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func getEnvInt(key string, fallback int) int {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}

	return parsed
}
