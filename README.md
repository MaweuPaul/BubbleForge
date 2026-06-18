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
- Bubble Properties Compiler package
- template-backed component compilation endpoint
- seeded Bubble-compatible button component payloads
- backend seed command for loading `backend/data/components.json`

## Build Checklist

### Complete In This Repo

- [x] Private BubbleForge repository created
- [x] Go backend scaffolded with Gin
- [x] PostgreSQL connection and schema setup
- [x] Redis service added to Docker Compose for future queues/cache
- [x] Docker Compose local environment created
- [x] Backend health routes added
- [x] Component CRUD API added
- [x] Component seed command added
- [x] Seeded component catalog stored in `backend/data/components.json`
- [x] Next.js admin dashboard created
- [x] Admin component list, create, and edit screens added
- [x] Chrome Extension Manifest V3 prototype created
- [x] Bubble editor sidebar injected by the extension
- [x] Component search and category browsing added to the extension
- [x] Pinned components and quick bar added to the extension
- [x] Bubble localStorage clipboard writer added
- [x] MAIN-world drag/paste probe added for Bubble editor research
- [x] README updated to describe the current architecture

### Proven By Testing Or Research

- [x] Backend tests run successfully with `go test ./...`
- [x] Frontend production build run successfully with `npm run build`
- [x] Extension scripts pass syntax checks with `node --check`
- [x] Bubble editor can read component payloads from localStorage clipboard keys
- [x] Manual paste into Bubble is the practical insertion path for V0
- [x] External drag/drop alone does not reliably insert Bubble elements
- [x] Bubble-compatible payloads need fresh IDs before this becomes scalable
- [x] Raw Bubble JSON works for a prototype but needs a compiler layer for production quality
- [x] AI should sit on top of the compiler, not directly write arbitrary Bubble JSON
- [x] Compiler smoke output preserves numeric width and height values
- [x] Extension copy path calls the backend compiler endpoint

### Not Complete Yet

- [x] Bubble Properties Compiler implementation
- [x] `POST /api/v1/components/:id/compile` endpoint
- [x] Fresh Bubble element ID generation at copy time
- [x] Parent/child `current_parent` remapping
- [x] Unsafe Bubble internal field stripping
- [x] Tokenized component templates
- [x] Typed component property schemas
- [x] Brand token system
- [ ] Component versioning
- [ ] Bubble token behavior research
- [ ] Bubble style import/install workflow
- [ ] Multi-element atom composition for AI-generated sections
- [ ] Production auth flow
- [ ] BYOK provider storage and encryption flow
- [ ] AI component generation
- [ ] Production CORS/security hardening
- [ ] Hosted deployment

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
POST /api/v1/components/:id/compile
GET  /api/v1/templates
GET  /api/v1/templates/:id
POST /api/v1/templates
```

Current compiler-backed component tables:

```sql
CREATE TABLE IF NOT EXISTS component_templates (
  id                TEXT PRIMARY KEY,
  component_type_id TEXT NOT NULL REFERENCES component_types(id),
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  base_json         JSONB NOT NULL,
  property_schema   JSONB NOT NULL DEFAULT '{}'
);

ALTER TABLE components ADD COLUMN IF NOT EXISTS template_id TEXT REFERENCES component_templates(id);
ALTER TABLE components ADD COLUMN IF NOT EXISTS property_values JSONB NOT NULL DEFAULT '{}';
```

Current component model:

```json
{
  "id": "comp-button-solid",
  "category": "Buttons",
  "name": "Solid Button",
  "description": "A bold filled button.",
  "access": "Free",
  "template_id": "tmpl_solid-button",
  "property_values": {
    "label": "Submit",
    "width": 150,
    "height": 44,
    "radius": 8
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

## Token Research Checklist

Bubble tokens are now the next major unknown after insertion and compiler output.

The research target is:

```text
color_tokens
font_tokens
style references
Bubble app style sets
token IDs
```

### Color Token Change Test

- [ ] Copy a known working button payload.
- [ ] Change a color token such as `Primary 50` from `rgba(30,109,246,1)` to `rgba(255,90,31,1)`.
- [ ] Paste the changed payload into Bubble.
- [ ] Check whether the button color changes.
- [ ] Check whether Bubble accepts the payload without repair.
- [ ] Check whether Bubble creates or updates app color variables.
- [ ] Check whether Bubble ignores token changes and keeps the original app tokens.

### Style Reference Test

- [ ] Change a style reference such as `Button_filled_light_primary_` to another real style name from the same Bubble app.
- [ ] Paste the payload into Bubble.
- [ ] Check whether the pasted button uses the new style.
- [ ] Check whether missing style names are ignored, repaired, or rejected.

### Token ID Dependency Test

- [ ] Inspect token IDs such as `bTGzw`, `bTGzx`, and `bTHAB`.
- [ ] Test whether those IDs are app-specific.
- [ ] Test whether Bubble matches tokens by ID, by name, or by both.
- [ ] Paste a payload with a known token name but changed token ID.
- [ ] Paste a payload with a known token ID but changed token name.

### Font Token Test

- [ ] Create a text element with a custom font or text style.
- [ ] Copy it from Bubble.
- [ ] Inspect when `font_tokens` is populated.
- [ ] Check whether pasted font tokens create, map to, or ignore app fonts.

### App Style Set Test

- [ ] Create App A with a blue primary color.
- [ ] Create App B with an orange primary color.
- [ ] Copy a styled button from App A.
- [ ] Paste it into App B.
- [ ] Check whether it keeps App A colors.
- [ ] Check whether it adapts to App B styles.
- [ ] Check whether it creates missing tokens.
- [ ] Check whether it breaks or loses style references.

### Possible Outcomes

Best case:

```text
Tokens can be replaced safely.
Brand kit -> rewrite color_tokens -> paste works.
```

Medium case:

```text
Styles must already exist in the Bubble app.
BubbleForge must first install or import a style set.
```

Hard case:

```text
Token IDs are app-specific.
Compiler must map token names to each app's token IDs before paste.
```

The product question this research answers:

```text
Can BubbleForge safely inject brand colors and styles,
or must it first import a Bubble-compatible style set?
```

## Bubble Properties Compiler

The Bubble Properties Compiler is now implemented as the backend layer that turns templates and typed values into Bubble clipboard payloads.

Earlier prototypes stored raw `bubble_json` blobs. The compiler-backed path is the scalable direction.

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

Current endpoint:

```text
POST /api/v1/components/:id/compile
```

Current compiler package:

```text
backend/internal/compiler/
  compiler.go
  tokens.go
  ids.go
  strip.go
  conditionals.go
```

Current compiler flow:

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
