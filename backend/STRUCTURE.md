# Backend Structure

The backend is organized around clear ownership boundaries:

- `cmd/api`: HTTP API entrypoint
- `cmd/worker`: background worker entrypoint
- `internal/auth`: authentication and authorization helpers
- `internal/crypto`: encryption helpers for secrets such as BYOK API keys
- `internal/domain`: domain models and core business rules
- `internal/http`: routing, handlers, middleware, and request/response DTOs
- `internal/repository`: database access
- `internal/service`: application services and orchestration logic
- `internal/worker`: job processing logic
- `internal/ai`: AI provider abstractions and implementations
- `internal/platform`: infrastructure clients such as Postgres, Redis, queues, and storage
- `migrations`: database migrations
- `scripts`: local development and operations scripts
