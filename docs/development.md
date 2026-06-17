# Development

## Services

BubbleForge uses Docker Compose for local infrastructure:

- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- Backend API on `localhost:8081`

Start everything:

```bash
docker compose up --build
```

## Backend

Copy the env example:

```bash
cp backend/.env.example backend/.env
```

Run locally:

```bash
cd backend
go run ./cmd/api
```

Health check:

```bash
curl http://localhost:8081/health
```

## Notes

In this workspace, Go may need repo-local caches:

```powershell
$env:GOPATH='E:\BubbleForge\.go'
$env:GOCACHE='E:\BubbleForge\.cache\go-build'
$env:GOMODCACHE='E:\BubbleForge\.cache\go-mod'
```
