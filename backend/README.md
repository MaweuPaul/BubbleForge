# BubbleForge Backend

Go API for BubbleForge.

## Local Services

Start Postgres, Redis, and the backend with Docker:

```bash
docker compose up --build
```

Run the backend locally:

```bash
go run ./cmd/api
```

Health check:

```bash
curl http://localhost:8081/health
```

## Packages

- Gin for HTTP routing
- PostgreSQL via pgx
- Redis via go-redis
- Zap for structured logging
- godotenv for local env loading
- validator for request validation
- x/crypto for password hashing and secret utilities
