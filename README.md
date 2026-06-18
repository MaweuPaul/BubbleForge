# BubbleForge

AI-powered component platform for Bubble developers.

BubbleForge helps Bubble builders create better interfaces faster by combining a high-quality component library with AI-powered component generation and customization.

If a component already exists, users can browse, preview, and insert it into Bubble. If it does not exist, BubbleForge generates it with AI, validates it, saves it, and makes it reusable.

> If it exists, use it. If it does not, generate it.

## Vision

BubbleForge is built for Bubble developers who want polished UI components without spending hours manually designing and rebuilding common interface patterns.

The goal is to create a private, production-grade component system that can eventually support:

- ready-made Bubble-compatible UI components
- AI-generated components on demand
- AI customization of existing components
- reusable personal and team component libraries
- Chrome extension-assisted Bubble insertion
- bring-your-own-key AI provider support
- backend-powered validation, caching, and versioning

This project starts with one core technical question:

Can BubbleForge reliably insert a prepared component into the Bubble editor?

Once that is proven, the rest of the platform can grow around it.

---

## Component Architecture: Atoms → Molecules → Pages

BubbleForge is built on an **Atomic Design System** — the same strategy used by Figma, Tailwind UI, and Radix.

Components are built from the smallest unit up. Each level can be assembled from the level below it.

### Level 1: Atoms

The smallest valid Bubble elements. Each must be independently pasteable into Bubble.

```
Button
Input
Badge
Icon
Text block
Divider
Avatar
Tag
```

### Level 2: Molecules

Composed of multiple atoms. Each molecule is a self-contained UI unit.

```
Search bar         (Input + Icon Button)
Alert banner       (Icon + Text + Close Button)
Stat card          (Text + Badge + Icon)
Avatar with label  (Avatar + Text block)
CTA row            (Text + Button + Outline Button)
```

### Level 3: Sections

Full UI sections composed of molecules and atoms.

```
Navbar
Footer
Pricing card
Hero section
Sidebar
Dashboard panel
Form group
Feature list
Testimonial block
```

### Level 4: Pages

Complete layouts assembled from sections.

```
Landing page
Dashboard
Settings page
Checkout page
Profile page
```

### Why This Strategy

Building atoms first gives BubbleForge a reusable foundation that AI can recombine safely.

Instead of asking AI to build a full footer from scratch (which risks invalid Bubble JSON), the system works like this:

```text
Valid atom library
       ↓
AI selects relevant atoms
       ↓
Compiler assembles atoms with correct IDs and parent links
       ↓
Brand tokens applied
       ↓
Valid Bubble-native section generated
```

This is significantly safer and more reliable than generating full structures from scratch.

---

## Bubble Properties Compiler

The most important technical system in BubbleForge is the **Bubble Properties Compiler**.

The Bubble Properties Compiler is a Go-based compilation layer that converts typed component properties into Bubble-compatible element JSON. Instead of treating every component as a static blob, BubbleForge stores reusable templates, property schemas, property values, and brand tokens, then compiles them into fresh Bubble clipboard payloads at copy time.

A component is not a single JSON blob. It is a template combined with a set of typed properties that are injected at copy time.

```text
base_json template
       +
property_schema (what can be customized)
       +
property_values (user's choices)
       +
brand tokens
       +
fresh ID generation
       =
valid Bubble JSON
```

### Why Not Store One Giant JSON

Storing one hardcoded JSON per component creates fragility:

- Every color change requires editing raw JSON
- AI cannot reliably edit unknown JSON structures
- Two users who paste the same component share identical element IDs, causing silent Bubble conflicts
- Conditionals reference internal IDs that break across apps

The compiler solves all of these problems.

### Tokenized Templates

The base JSON template uses placeholder tokens instead of real values:

```json
{
  "properties": {
    "width": "{{WIDTH}}",
    "height": "{{HEIGHT}}",
    "bgcolor": "{{PRIMARY_COLOR}}",
    "font_color": "{{TEXT_COLOR}}",
    "border_roundness": "{{RADIUS}}",
    "icon": "material outlined {{ICON}}",
    "button_type": "{{BUTTON_TYPE}}"
  }
}
```

The compiler replaces tokens at copy time with the user's property values.

### Element Targeting for Molecules

For molecules with multiple nested elements, the compiler targets elements by their `default_name` field rather than array index:

```text
elements[0].properties.width  ← fragile when children exist
```

```text
Find element where default_name = "BF_CTA_Button" ← safe
```

This means templates remain valid even when the structure changes.

### ID Generation at Copy Time

Every element in Bubble has a unique 5-character ID. When the compiler assembles a component, it:

1. Generates a fresh random ID for every element
2. Maps `current_parent` of children to the newly generated parent ID
3. Strips unsafe internal fields: `said`, `state condition element_id`, internal breakpoint references

IDs must be generated at **copy time**, not at save time. If IDs are generated once and stored, two users pasting the same component will have identical IDs on their canvases, causing Bubble conflicts.

### Conditional Abstraction

Bubble conditionals reference internal page element IDs:

```json
"condition": {
  "type": "PageData",
  "properties": { "element_id": "bTGYf" }
}
```

This ID is the Bubble Page element — different in every app. The compiler translates human-readable conditions:

```text
page_width < mobile_breakpoint
```

into the correct Bubble conditional format, without hardcoding app-specific IDs.

---

## Database Design

### component_types

Defines what kind of component this is.

```text
id
name           // Button, Card, Input, Footer
slug           // button, card, input, footer
description
created_at
```

### component_templates

Stores the base tokenized Bubble JSON for each component variant.

```text
id
component_type_id
name                    // "Primary Button", "Outline Button"
slug
base_json               // tokenized Bubble JSON (JSONB)
property_schema         // what properties this template accepts (JSONB)
preview_html            // rendered HTML preview
status                  // draft | tested | published
created_at
updated_at
```

The `property_schema` field defines every customizable property:

```json
{
  "label":       { "type": "string",  "default": "Click Me",   "token": "{{LABEL}}"        },
  "width":       { "type": "number",  "default": 150,          "token": "{{WIDTH}}"         },
  "height":      { "type": "number",  "default": 44,           "token": "{{HEIGHT}}"        },
  "icon":        { "type": "string",  "default": "",           "token": "{{ICON}}"          },
  "button_type": { "type": "select",  "default": "label",      "token": "{{BUTTON_TYPE}}",
                   "options": ["label", "icon", "label_icon"]                               },
  "radius":      { "type": "number",  "default": 8,            "token": "{{RADIUS}}"        },
  "style":       { "type": "select",  "default": "Button_filled_light_primary_",
                   "token": "{{STYLE}}",
                   "options": ["Button_filled_light_primary_", "Button_outline_light_primary_"] }
}
```

### components

Actual library items that users see and copy.

```text
id
template_id
name
category_id
description
tags                    // text[]
property_values         // user-selected values (JSONB)
is_public
created_by
access                  // free | pro
created_at
updated_at
```

The `property_values` field stores only the user's choices:

```json
{
  "label": "Get Started",
  "width": 180,
  "height": 48,
  "icon": "bolt",
  "button_type": "label_icon",
  "style": "Button_filled_light_primary_"
}
```

### component_versions

Git-style version history for every component.

```text
id
component_id
parent_version_id
version_number
property_values         // source of truth for this version (JSONB)
compiled_json           // cached final Bubble JSON (JSONB)
change_summary
created_by
created_at
```

Both `property_values` and `compiled_json` are stored:

- `property_values` is the editable source
- `compiled_json` is a cached snapshot for reference and rollback

The live copy is always recompiled fresh at copy time.

### categories

```text
id
name
slug
order
icon
```

### brand_tokens

Per-user or per-team brand configuration.

```text
id
user_id
team_id
primary_color
secondary_color
text_color
background_color
border_radius
font_family
custom_tokens          // additional arbitrary tokens (JSONB)
created_at
updated_at
```

### ai_keys

Encrypted API keys for BYOK support.

```text
id
user_id
provider              // claude | openai | gemini | mistral | deepseek
encrypted_key
key_last_four
is_active
created_at
updated_at
```

### generation_jobs

Async AI generation job queue.

```text
id
user_id
prompt
component_type_id
status                // queued | running | done | failed
result_component_id
error_message
created_at
updated_at
```

### Full Table List

```text
users
component_types
component_templates
components
component_versions
categories
brand_tokens
favorites
ai_keys
generation_jobs
usage_events
teams
team_members
audit_logs
```

---

## Compiler Flow

```text
User clicks "Copy"
       ↓
Load component.property_values
       ↓
Load template.base_json
       ↓
Load template.property_schema
       ↓
Replace all {{TOKENS}} with property_values
       ↓
Apply brand tokens (primary_color, radius, etc.)
       ↓
Generate fresh random IDs for every element
       ↓
Map current_parent fields to new IDs
       ↓
Inject responsive conditionals (page width breakpoints)
       ↓
Strip unsafe fields (said, internal element_id refs)
       ↓
Write to localStorage bubble_element_clipboard
       ↓
User pastes with Ctrl+V into Bubble
```

---

## What Not to Expose as Properties

Some Bubble JSON fields must be managed by the compiler and never exposed as editable user properties:

```text
id                            // regenerated fresh per copy
current_parent                // linked by compiler during assembly
said                          // internal Bubble app fingerprint
state condition element_id    // resolved by conditional abstraction layer
breakpoint_id references      // mapped to current app's page element
color_tokens                  // injected from brand_tokens
font_tokens                   // injected from brand_tokens
```

---

## Tech Stack

### Backend

- Go
- PostgreSQL
- Redis
- REST API initially
- worker queue for generation jobs
- structured logging
- API key encryption
- rate limiting
- usage tracking

### Frontend

- Next.js
- TypeScript
- Tailwind CSS

### Chrome Extension

The extension handles the full user workflow inside the Bubble editor:

- component browsing
- search and filter
- live preview
- customization panel
- copy to Bubble clipboard
- quick bar for pinned components
- developer tools for clipboard inspection

---

## Bring Your Own Key

BubbleForge supports BYOK: Bring Your Own Key.

Users can add API keys for:

- Claude
- OpenAI
- Gemini
- Mistral
- DeepSeek

API keys must be treated as production secrets. They are encrypted before storage and decrypted only on the backend during provider calls. Raw keys are never returned to the frontend.

---

## Roadmap

### Phase 0: Bubble Insertion Research ✅

Goal: Prove that BubbleForge can insert a prepared component into Bubble.

Completed:
- Studied Bubble editor paste behavior
- Inspected clipboard payloads via Chrome extension Tools tab
- Confirmed localStorage-based insertion works
- Captured real Bubble JSON format for buttons
- Confirmed layout properties, conditionals, and icon fields
- Documented `said`, `current_parent`, and internal ID risks

Success metric achieved: A button can be inserted into Bubble reliably via the extension.

---

### Phase 1: Component Library MVP ✅

Goal: Build the basic component management platform.

Completed:
- Go + Gin + PostgreSQL + Redis backend running in Docker
- Component CRUD API at `/api/v1/components`
- 9 seeded button components with real Bubble JSON
- Layout properties injected: `fit_width`, `single_width`, `min_width_css`
- Responsive conditionals injected (page width < mobile breakpoint)
- Icon field + `button_type` support added
- Next.js admin dashboard with search and category filter
- Component create/edit forms

Success metric achieved: Components can be browsed, saved, and managed.

---

### Phase 2: Chrome Extension MVP ✅

Goal: Bring BubbleForge into the Bubble editor workflow.

Completed:
- Extension injects into bubble.io editor pages only
- Sidebar panel with search, category filter, and previews
- Customization panel: label, background, text color, radius, icon
- Copy to Bubble writes correct localStorage clipboard keys
- Pinned components and Quick Bar for fast access
- Developer Tools tab for clipboard inspection

Success metric achieved: Users can access BubbleForge components while working inside Bubble.

---

### Phase 3: Bubble Properties Compiler

Goal: Replace raw JSON blobs with a typed template + compiler system.

Tasks:
- Migrate database to new schema (component_types, component_templates, components, component_versions)
- Build tokenized base_json templates for all existing components
- Write property_schema for each component type
- Build Go compiler: token injection, ID generation, conditional abstraction
- Update extension to compile at copy time
- Update admin dashboard to show property_schema editor
- Add brand_tokens support

Success metric: A component is stored as property_values and compiled into valid Bubble JSON at copy time with fresh IDs on every paste.

---

### Phase 4: AI Generation

Goal: Generate and customize components with AI.

Tasks:
- BYOK support: encrypted API key storage and provider routing
- Redis-backed async generation job queue
- AI prompt system for atom generation
- AI prompt system for molecule assembly from atoms
- Validation pipeline before saving generated components
- Save generated components to library

Success metric: Users can generate a missing component from a text prompt and save it to their library.

---

### Phase 5: Automated Validation

Goal: Make generated components safer and more reliable.

Tasks:
- Schema validation against property_schema
- Isolated HTML render testing
- Screenshot preview generation
- Bubble compatibility checks
- Version history and rollback

Success metric: Generated components are validated before users can paste them.

---

### Phase 6: Community and Marketplace

Goal: Turn the component library into a growing ecosystem.

Tasks:
- Public and private components
- Ratings and reviews
- Download and usage counts
- Trending components
- Team libraries
- Creator profiles

Success metric: The component library grows from user-created and AI-generated components.

---

## Project Principles

- Keep the repository private.
- Validate Bubble insertion before building too much around it.
- Design the backend for concurrent users from the beginning.
- Use background jobs for AI generation and validation.
- Treat API keys like production secrets.
- Cache aggressively so the platform becomes faster over time.
- Save generated components for reuse.
- Prefer practical working demos over premature complexity.
- Build the extension as a serious product surface.
- Components are atoms first. Molecules and pages are assembled from atoms.
- The compiler owns ID generation. Users never set internal Bubble IDs.
- Property schemas are typed per component type, never universal.

---

## Repository Status

Phase 0, 1, and 2 are complete.

Current priority:

```text
Build the Bubble Properties Compiler.
Migrate to typed property schema database.
Replace raw JSON blobs with template + property_values + compiler output.
```

---

## License

No license is provided.

All rights reserved.

This is a private commercial/portfolio project. No permission is granted to copy, modify, redistribute, sublicense, or use the source code without explicit written permission from the owner.

