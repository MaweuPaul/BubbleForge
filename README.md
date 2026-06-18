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

- [ ] Component versioning
- [ ] BubbleForge Styleset Importer
- [ ] Style reset/cleanup workflow
- [ ] Palette editor before styleset import
- [ ] Style-backed compiler mode
- [ ] Styleset-installed detection in the extension
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

- [x] Copy a known working button payload.
- [x] Change a color token such as `Primary 50` from `rgba(30,109,246,1)` to `rgba(255,90,31,1)`.
- [x] Paste the changed payload into Bubble.
- [x] Check whether the button color changes.
- [x] Check whether Bubble accepts the payload without repair.
- [x] Check whether Bubble creates or updates app color variables.
- [x] Check whether Bubble ignores token changes and keeps the original app tokens.

### Style Reference Test

- [x] Change a style reference such as `Button_filled_light_primary_` to another real style name from the same Bubble app.
- [x] Paste the payload into Bubble.
- [x] Check whether the pasted button uses the new style.
- [x] Check whether missing style names are ignored, repaired, or rejected.

### Token ID Dependency Test

- [x] Inspect token IDs such as `bTGzw`, `bTGzx`, and `bTHAB`.
- [x] Test whether those IDs are app-specific.
- [x] Test whether Bubble matches tokens by ID, by name, or by both.
- [x] Paste a payload with a known token name but changed token ID.
- [x] Paste a payload with a known token ID but changed token name.

### Font Token Test

- [x] Create a text element with a custom font or text style.
- [x] Copy it from Bubble.
- [x] Inspect when `font_tokens` is populated.
- [x] Check whether pasted font tokens create, map to, or ignore app fonts.

### App Style Set Test

- [ ] Copy a styled button from App A.
- [ ] Paste it into App B.
- [ ] Check whether it keeps App A colors.
- [ ] Check whether it adapts to App B styles.
- [ ] Check whether it creates missing tokens.
- [ ] Check whether it breaks or loses style references.

### Official Research Outcome: Detached Properties Required

```text
Tokens CANNOT be safely replaced or injected. 
Bubble ignores foreign token payloads and strictly relies on its own internal app dictionaries.
Token IDs are completely app-specific.
Missing styles are gracefully ignored, causing components to render as default unstyled elements.
Raw Google Font strings passed in `font_face` work flawlessly without token dictionaries.
```

**Architectural Decision:** BubbleForge needs two compile modes.

Mode 1 is **Detached Properties**. This is the default no-setup mode. Components strip their `"style"` property and inject colors, typography, spacing, radius, and sizing directly into each element's `properties` block. This guarantees pasted components look correct even when the destination Bubble app has never installed BubbleForge styles.

Mode 2 is **Styleset Mode**. This is the Elemium-style advanced workflow. The user imports a BubbleForge styleset into the Bubble app first, then components can reference BubbleForge-controlled styles, colors, fonts, and breakpoints inside that app.

```text
compile_mode: "detached" | "styleset"
```

Detached mode is the reliable V0 path. Styleset mode is the next major research/build milestone.

## BubbleForge Styleset Importer

To match Elemium-level capability, BubbleForge needs an import workflow for a full app styleset.

Target product flow:

```text
Tools tab
  -> Import BubbleForge Styleset
  -> Optional: clean unused default Bubble styles/colors/fonts/breakpoints
  -> Edit palette before import
  -> Import colors
  -> Import font styles
  -> Import button styles
  -> Import card/input/form styles
  -> Components can now compile in styleset mode
```

The styleset should include:

- gray palette for backgrounds, borders, text, icons, and surfaces
- primary palette for brand actions
- danger palette for destructive actions and errors
- warning palette for warning states
- success palette for success states
- typography styles for headings, body, captions, labels, and buttons
- button styles
- input styles
- card/container styles
- modal styles
- table/list styles
- responsive breakpoint assumptions

### Styleset Import Research Checklist

- [ ] Discover where Bubble stores app colors.
- [ ] Discover where Bubble stores reusable styles.
- [ ] Discover where Bubble stores font settings and font tokens.
- [ ] Discover where Bubble stores breakpoints.
- [ ] Test whether styles can be imported through clipboard/localStorage.
- [ ] Test whether styles require Bubble editor internal APIs.
- [ ] Test whether existing styles can be reset or cleaned safely.
- [ ] Test whether imported styles get stable names inside the target app.
- [ ] Test whether imported styles get app-specific IDs that must be mapped.
- [ ] Add an extension tool for detecting whether BubbleForge styles are installed.
- [ ] Add an extension tool for importing or resetting BubbleForge styles.

### Compiler Mode Decision

Detached mode:

```text
Use direct properties.
Works in any Bubble app.
No styleset required.
Best for instant copy/paste and generated one-off components.
```

Styleset mode:

```text
Use BubbleForge style references.
Requires imported BubbleForge styleset.
Best for large apps, consistent design systems, and Elemium-style workflows.
```

The practical rule:

```text
If styleset is not installed, compile detached.
If styleset is installed, allow style-backed compile.
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
- brand colors, fonts, spacing, and radius should compile into detached properties by default
- style references should only be used when a BubbleForge styleset is installed
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
style_sets
style_set_tokens
```

Raw `components.bubble_json` is deprecated after the compiler migration. The scalable source of truth is template JSON plus typed property values.

Planned migration direction:

```text
components.template_id          new compiler-backed template reference
components.property_values      typed values used by compiler
components.compile_mode         detached or styleset
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
