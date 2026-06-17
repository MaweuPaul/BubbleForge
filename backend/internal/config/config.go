package config

import (
	"errors"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv        string
	HTTPAddr      string
	DatabaseURL   string
	EncryptionKey string
	Auth          AuthConfig
	Redis         RedisConfig
}

type AuthConfig struct {
	JWTSecret      string
	JWTIssuer      string
	JWTAudience    string
	AccessTokenTTL time.Duration
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
		Auth: AuthConfig{
			JWTSecret:      os.Getenv("JWT_SECRET"),
			JWTIssuer:      getEnv("JWT_ISSUER", "bubbleforge-api"),
			JWTAudience:    getEnv("JWT_AUDIENCE", "bubbleforge-app"),
			AccessTokenTTL: getEnvDuration("ACCESS_TOKEN_TTL", 15*time.Minute),
		},
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

	if cfg.Auth.JWTSecret == "" {
		return Config{}, errors.New("JWT_SECRET is required")
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

func getEnvDuration(key string, fallback time.Duration) time.Duration {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	parsed, err := time.ParseDuration(value)
	if err != nil {
		return fallback
	}

	return parsed
}
