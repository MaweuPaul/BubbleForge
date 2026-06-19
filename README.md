# BubbleForge

BubbleForge is a Bubble-native component platform.

The goal is to help Bubble builders browse, customize, compile, and paste high-quality components directly into the Bubble editor. If a component already exists, users should be able to use it immediately. If it does not exist, BubbleForge should eventually generate it with AI and compile it into safe Bubble-compatible JSON.

```text
If it exists, use it.
If it does not exist, generate it.
If it is customized, compile it safely.
```

## Current Product

BubbleForge is currently a local working prototype with three main parts:

- **Backend:** Go, Gin, PostgreSQL, Redis, Docker Compose
- **Admin dashboard:** Next.js component/template management UI
- **Chrome extension:** Bubble editor sidebar that copies compiled components into Bubble's clipboard storage

The supported V0 insertion path is:

```text
Pick component in BubbleForge
        |
        v
Backend compiler returns Bubble JSON
        |
        v
Extension writes Bubble clipboard localStorage keys
        |
        v
User focuses Bubble canvas and presses Ctrl+V
```

Drag/drop was tested and is not the supported path right now. Bubble's editor relies on internal state and does not reliably accept normal external `DataTransfer` payloads.

## What Is Proven

- [x] Bubble editor can read copied component payloads from localStorage clipboard keys
- [x] Manual paste into Bubble works as the practical V0 path
- [x] External drag/drop alone is not reliable for insertion
- [x] Backend compiler endpoint is wired into the extension copy flow
- [x] Compiler smoke output preserves numeric values such as width and height
- [x] Fresh Bubble element IDs can be generated at copy time
- [x] Unsafe Bubble fields can be stripped before paste
- [x] AI should generate typed component data, not arbitrary raw Bubble JSON

## Next Major Milestones

- [ ] BubbleForge Styleset Importer
- [ ] Style recorder/probe for discovering Bubble editor style APIs
- [ ] Style-backed compiler mode
- [ ] Multi-element atom composition
- [ ] Component versioning
- [ ] AI component generation on top of the compiler
- [ ] BYOK provider storage and encryption
- [ ] Production auth, CORS, and deployment hardening

## Architecture

```text
Chrome Extension
        |
        | fetch, customize, copy
        v
Go Backend API
        |
        +----------------------+
        |                      |
        v                      v
 PostgreSQL                 Redis
        |
        v
Component Templates
Property Values
Compiler Output

Next.js Admin Dashboard
        |
        | create/edit components and templates
        v
Go Backend API
```

## Repository Layout

```text
backend/                    Go API, compiler, migrations, seed/smoke commands
frontend/                   Next.js admin dashboard
bubbleforge-extension-v0/   Chrome extension prototype for Bubble editor
docs/                       Research notes and subsystem documentation
docker-compose.yml          Local Postgres, Redis, and backend services
```

## Key Concepts

BubbleForge has two planned compile modes:

- **Detached mode:** inject colors, fonts, sizing, spacing, and radius directly into Bubble element properties. This is the reliable no-setup path.
- **Styleset mode:** import a BubbleForge styleset into the Bubble app first, then compile components using BubbleForge-controlled style references.

Detached mode is the default V0 path. Styleset mode is the next research/build target so BubbleForge can grow toward Elemium-level workflows.

## Documentation

- [Development](docs/development.md)
- [Bubble Compiler](docs/compiler.md)
- [Theme Schema](docs/theme-schema.md)
- [Bubble Editor Research](docs/bubble-research.md)
- [Styleset Importer](docs/styleset-importer.md)
- [Backend](backend/README.md)
- [Chrome Extension](bubbleforge-extension-v0/README.md)

## Local Development

Start local services:

```powershell
docker compose up --build backend
```

Run backend tests:

```powershell
cd backend
go test ./...
```

Build the frontend:

```powershell
cd frontend
npm run build
```

Check extension scripts:

```powershell
node --check bubbleforge-extension-v0\content.js
node --check bubbleforge-extension-v0\drag-probe.js
```

Load the extension:

1. Open Chrome.
2. Go to `chrome://extensions`.
3. Enable Developer Mode.
4. Click `Load unpacked`.
5. Select `E:\BubbleForge\bubbleforge-extension-v0`.

## License

No license is provided.

All rights reserved. This is a private commercial and portfolio project. No permission is granted to copy, modify, redistribute, sublicense, or use the source code without explicit written permission from the owner.
