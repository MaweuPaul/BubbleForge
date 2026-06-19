# Theme Schema

BubbleForge uses a separate theme schema for global design tokens.

Component `property_schema` answers:

```text
What can this component customize?
```

Theme schema answers:

```text
What design tokens exist globally?
```

## Default Theme

BubbleForge ships with a professional default theme so ready-made components look polished even before app-theme detection or AI generation.

Core colors:

```text
Primary           #1E6DF6
Primary Contrast  #FFFFFF
Text              #111827
Muted Text        #64748B
Surface           #FFFFFF
Background        #F8FAFC
Border            #E2E8F0
Danger            #DC2626
Success           #16A34A
Alert             #D97706
```

Primary scale:

```text
Primary 10        #EFF6FF
Primary 20        #DBEAFE
Primary 30        #BFDBFE
Primary 40        #93C5FD
Primary 50        #1E6DF6
Primary 60        #2563EB
Primary 70        #1D4ED8
Primary 80        #1E40AF
Primary 90        #1E3A8A
```

Neutral scale:

```text
Gray 10           #F8FAFC
Gray 20           #F1F5F9
Gray 30           #E2E8F0
Gray 40           #CBD5E1
Gray 50           #94A3B8
Gray 60           #64748B
Gray 70           #334155
Gray 80           #1E293B
Gray 90           #0F172A
```

## Priority

The compiler should eventually resolve theme values in this order:

```text
1. user component overrides
2. imported/current Bubble app theme
3. BubbleForge default theme
```

## Component Schema References

Components should reference theme values instead of hardcoded colors when possible:

```json
{
  "bgcolor": {
    "type": "theme.color",
    "label": "Background",
    "default": "colors.primary"
  },
  "fgcolor": {
    "type": "theme.color",
    "label": "Text Color",
    "default": "colors.primaryContrast"
  },
  "radius": {
    "type": "theme.radius",
    "label": "Radius",
    "default": "radius.md"
  }
}
```

The extension can render these as normal controls, but their defaults come from the active theme.

## Current Code

The first implementation lives in:

```text
backend/internal/theme/schema.go
```

It exposes:

```text
DefaultSchema()
DefaultValues()
CompilerTokenMap(values)
```
