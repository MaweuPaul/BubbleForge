# BubbleForge

BubbleForge is a component platform for Bubble developers.

The current product is a working local prototype with three parts:

- a Go backend that stores Bubble-compatible components in PostgreSQL
- a Next.js admin dashboard for browsing, creating, and editing components
- a Chrome extension that runs inside the Bubble editor and injects component payloads into Bubble's local clipboard storage

The long-term product is an AI-ready component system for Bubble: users browse components, customize them, generate missing components later with AI, and paste Bubble-native UI into the Bubble editor.

The core positioning is:

```text
If it exists, use it.
If it does not exist, generate it.
If it is customized, compile it safely.
```

## Current Status

BubbleForge is not just a static component list anymore. The current repo contains:

- Go API with Gin
- PostgreSQL component catalog
- Redis service for future queues/cache
- Docker Compose local environment
- Next.js admin dashboard
- Chrome Extension Manifest V3 prototype
- Bubble editor sidebar and floating quick bar
- component pinning in extension localStorage
- localStorage-based Bubble clipboard insertion
- MAIN-world drag/paste probe script
- seeded Bubble-compatible button component payloads
- backend seed command for loading `backend/data/components.json`

Current insertion mechanism:

```text
User clicks Copy in BubbleForge extension
        |
        v
Extension prepares Bubble JSON
        |
        v
Extension writes to Bubble localStorage clipboard keys
        |
        v
User focuses Bubble canvas and presses Ctrl+V
        |
        v
Bubble editor reads localStorage and creates the element
```

The key localStorage keys are:

```text
bubble_element_clipboard
bubble_element_clipboard_most_recent
_this_session_clipboard_bubble_element_clipboard
_this_session_clipboard_bubble_element_clipboard_most_recent
global_clipboard_message_<timestamp>
```

This is the current practical path. Native drag/drop alone is not enough because Bubble's editor uses React-controlled internal drag state and ignores normal external `DataTransfer` payloads.

## What BubbleForge Is Building

BubbleForge is a Bubble-native component infrastructure project.

The goal is not to render external HTML widgets inside Bubble. The goal is to generate and paste Bubble-compatible element payloads so the result behaves like normal Bubble UI.

That means the system needs to understand:

- Bubble element JSON
- Bubble element IDs
- parent/child relationships through `current_parent`
- layout properties such as `fit_width`, `single_width`, and `min_width_css`
- responsive conditions
- style references
- icon and button fields
- unsafe internal fields that should not be reused across apps

## Architecture

```text
Chrome Extension
        |
        | fetch components / copy payloads
        v
Go Backend API
        |
        +--------------------+
        |                    |
        v                    v
   PostgreSQL              Redis
        |
        v
Component Catalog

Next.js Admin Dashboard
        |
        | create/edit components
        v
Go Backend API
```

## Repository Layout

```text
backend/
  cmd/api/                         Go API entrypoint
  cmd/seed/                        Loads backend/data/components.json into PostgreSQL
  data/components.json             Seed component catalog
  internal/http/handlers/          HTTP handlers
  internal/platform/database/      PostgreSQL connection and schema
  internal/auth/                   Auth primitives

frontend/
  src/app/                         Next.js app routes
  src/components/                  Admin UI components
  src/lib/api.ts                   API base URL helper

bubbleforge-extension-v0/
  manifest.json                    Chrome MV3 manifest
  content.js                       Bubble editor UI and insertion logic
  drag-probe.js                    MAIN-world browser probe
  styles.css                       Extension UI styles
```

## Backend

The backend is a Go API.

Current API routes:

```text
GET  /health
GET  /api/v1/health
GET  /api/v1/components
GET  /api/v1/components/:id
POST /api/v1/components
PUT  /api/v1/components/:id
```

Current component table:

```sql
CREATE TABLE IF NOT EXISTS components (
    id VARCHAR(255) PRIMARY KEY,
    category VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    access VARCHAR(50) DEFAULT 'Free',
    bubble_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

Current component model:

```json
{
  "id": "comp-button-solid",
  "category": "Buttons",
  "name": "Solid Button",
  "description": "A bold filled button.",
  "access": "Free",
  "bubbleJson": {
    "elements": [],
    "type": "copy"
  }
}
```

### Backend Commands

Run tests:

```powershell
cd backend
go test ./...
```

Seed components:

```powershell
cd backend
go run ./cmd/seed
```

Run API locally without Docker:

```powershell
cd backend
go run ./cmd/api
```

## Docker

Docker Compose starts:

- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- Backend API on `localhost:8081`

Start services:

```powershell
docker compose up --build backend
```

Health check:

```powershell
Invoke-RestMethod http://localhost:8081/health
```

## Frontend Admin Dashboard

The frontend is a Next.js app used as an admin dashboard for the component catalog.

Current features:

- component list
- search/filter UI
- create component page
- edit component page
- API integration with the Go backend

Run locally:

```powershell
cd frontend
npm install
npm run dev
```

Build:

```powershell
cd frontend
npm run build
```

The frontend reads the API base from:

```text
NEXT_PUBLIC_API_URL
```

Default:

```text
http://localhost:8081
```

## Chrome Extension

The extension is a local Manifest V3 prototype.

Current features:

- injects into Bubble editor pages
- fetches components from `http://localhost:8081/api/v1/components`
- shows a BubbleForge UI inside the editor
- supports search and category navigation
- supports pinned components and a quick bar
- supports component customization for button-like payloads
- writes Bubble JSON to Bubble localStorage clipboard keys
- includes `drag-probe.js` as a MAIN-world probe

Load locally:

1. Open Chrome.
2. Go to `chrome://extensions`.
3. Enable Developer Mode.
4. Click `Load unpacked`.
5. Select:

```text
E:\BubbleForge\bubbleforge-extension-v0
```

Then open a Bubble editor URL:

```text
https://bubble.io/page...
```

or:

```text
https://bubble.io/builder...
```

The extension targets:

```text
https://bubble.io/*
https://*.bubbleapps.io/*
```

## Bubble Editor Insertion Research

The important discovery is that Bubble does not behave like a normal external drag/drop target.

External `DataTransfer` payloads are not enough. Bubble's editor uses its own React/editor state and internal clipboard behavior.

The practical insertion route is localStorage injection:

```js
localStorage.setItem("bubble_element_clipboard", json)
localStorage.setItem("bubble_element_clipboard_most_recent", json)
```

The extension also writes session and global clipboard sync keys to better match Bubble's own copy behavior.

`drag-probe.js` exists to inspect what Bubble does in the page's MAIN JavaScript world. It currently intercepts drag data and exposes a paste trigger helper for experiments.

## Bubble Properties Compiler

The next serious milestone is the Bubble Properties Compiler.

Right now components still store raw `bubble_json` blobs in PostgreSQL. That works for the prototype, but it does not scale.

The Bubble Properties Compiler will turn this:

```text
template JSON
+ typed property schema
+ component property values
+ brand tokens
+ fresh Bubble element IDs
```

into this:

```text
valid Bubble clipboard payload
```

The compiler matters because:

- AI should not edit raw Bubble JSON directly
- component IDs must be regenerated on every copy
- user-facing customization should use typed properties
- brand colors and radius should be token-driven
- parent/child IDs must be remapped safely
- unsafe fields must be stripped before paste

Planned endpoint:

```text
POST /api/v1/components/:id/compile
```

Planned compiler package:

```text
backend/internal/compiler/
  compiler.go
  tokens.go
  ids.go
  strip.go
  conditionals.go
```

Planned compiler flow:

```text
Load component
        |
        v
Load template
        |
        v
Merge schema defaults + component values + request overrides
        |
        v
Replace typed tokens
        |
        v
Generate fresh element IDs
        |
        v
Remap current_parent links
        |
        v
Strip unsafe Bubble internals
        |
        v
Return final Bubble JSON
```

Important compiler constraint:

```json
"width": 150
```

must remain a number. It must not compile as:

```json
"width": "150"
```

Token replacement must preserve JSON types.

## Planned Database Evolution

Current table:

```text
components
```

Near-term compiler tables:

```text
component_templates
component_types
component_versions
brand_tokens
```

Current `components.bubble_json` should stay temporarily for backwards compatibility while the compiler is introduced.

Planned migration direction:

```text
components.bubble_json          current raw payload
components.template_id          new compiler-backed template reference
components.property_values      typed values used by compiler
```

## AI Roadmap

AI is intentionally not the first system.

The correct order is:

```text
1. Prove Bubble insertion
2. Build component catalog
3. Build Bubble Properties Compiler
4. Add AI generation on top of compiler
```

When AI is added, it should generate or modify:

```text
property_values
template metadata
component variants
```

It should not directly produce arbitrary Bubble JSON unless the output is validated and compiled.

## Auth And BYOK

The backend already has auth primitives:

- bcrypt password hashing
- HS256 JWT creation and validation
- Gin auth middleware

BYOK is planned but not wired into the product yet.

Planned providers:

- Claude
- OpenAI
- Gemini
- Mistral
- DeepSeek

API keys should be encrypted at rest and decrypted only server-side when calling providers.

## Verification

Current verification commands:

```powershell
cd backend
go test ./...
```

```powershell
cd frontend
npm run build
```

```powershell
node --check bubbleforge-extension-v0\content.js
node --check bubbleforge-extension-v0\drag-probe.js
```

## Current Limitations

- Components are still mostly raw Bubble JSON blobs.
- The compiler is not implemented yet.
- Real Bubble compatibility is based on observed editor behavior and may change if Bubble changes internals.
- Drag/drop is experimental and not the primary insertion mechanism.
- AI generation is not implemented yet.
- BYOK UI/storage is not implemented yet.
- CORS is currently permissive for local development and must be tightened before production.

## Project Principles

- Keep the repository private.
- Prove every Bubble editor assumption through live paste tests.
- Treat Bubble JSON as an internal compiler target, not a user-authored format.
- Keep the extension thin; move compilation and validation into Go.
- Generate fresh Bubble IDs at copy time.
- Do not expose internal Bubble fields as user-facing settings.
- Build atoms first, then molecules, then sections.
- Add AI only after the compiler path is reliable.

## License

No license is provided.

All rights reserved.

This is a private commercial and portfolio project. No permission is granted to copy, modify, redistribute, sublicense, or use the source code without explicit written permission from the owner.
