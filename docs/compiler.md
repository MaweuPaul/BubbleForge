# Bubble Compiler

The Bubble Properties Compiler turns template JSON and typed property values into Bubble-compatible clipboard payloads.

The compiler exists because Bubble JSON should be treated as an internal output format, not something users or AI edit directly.

## Current Responsibilities

- clone template JSON without mutating the source
- replace typed tokens while preserving JSON types
- generate fresh 5-character Bubble element IDs
- remap repeated ID tokens consistently through a two-pass replacement
- preserve numeric values such as `width: 150` and `height: 44`
- strip unsafe Bubble internals such as `said`
- return a final `type: "copy"` Bubble payload

## Current Endpoint

```text
POST /api/v1/components/:id/compile
```

The extension uses this endpoint when a user copies a component.

## Current Package

```text
backend/internal/compiler/
  compiler.go
  tokens.go
  ids.go
  strip.go
  conditionals.go
```

## Compile Flow

```text
Load component
        |
        v
Load template
        |
        v
Merge defaults, saved values, and request overrides
        |
        v
Replace typed tokens
        |
        v
Generate fresh element IDs
        |
        v
Strip unsafe internals
        |
        v
Return Bubble clipboard JSON
```

## Data Model Direction

The scalable source of truth is:

```text
component_templates.base_json
component_templates.property_schema
components.template_id
components.property_values
```

Raw `components.bubble_json` is deprecated after the compiler migration.

## Compile Modes

BubbleForge should support two modes:

```text
detached
styleset
```

Detached mode injects direct visual properties into the element JSON. It works in any Bubble app.

Styleset mode references BubbleForge styles that already exist inside the destination Bubble app. It requires the Styleset Importer.

## Next Compiler Work

- [ ] add explicit `compile_mode`
- [ ] support multi-element templates
- [ ] remap `current_parent` across parent/child groups
- [ ] strip style references in detached mode
- [ ] preserve style references only in styleset mode
- [ ] add component version snapshots
- [ ] add compiler tests for tokens, IDs, stripping, and nested elements
