# BubbleForge Styleset Importer

The Styleset Importer is the next major milestone after compiler-backed component copy.

The goal is to support an Elemium-style workflow:

```text
Import BubbleForge Styleset
        |
        v
Bubble app receives BubbleForge colors, fonts, styles, and breakpoints
        |
        v
Components can compile using shared BubbleForge style references
```

## Why This Exists

Detached mode makes components work immediately in any Bubble app.

Styleset mode is for larger apps that need a consistent design system. It lets all BubbleForge components share the same app-level styles after those styles have been installed.

## Target Product Flow

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

## Styleset Contents

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

## Research Checklist

- [ ] discover where Bubble stores app colors
- [ ] discover where Bubble stores reusable styles
- [ ] discover where Bubble stores font settings and font tokens
- [ ] discover where Bubble stores breakpoints
- [ ] test whether styles can be imported through clipboard/localStorage
- [ ] test whether styles require Bubble editor internal APIs
- [ ] test whether existing styles can be reset or cleaned safely
- [ ] test whether imported styles get stable names inside the target app
- [ ] test whether imported styles get app-specific IDs that must be mapped
- [ ] add an extension recorder for style/color/font mutations
- [ ] add styleset-installed detection
- [ ] add import/reset UI in the extension Tools tab

## Compile Mode Rule

```text
If styleset is not installed, compile detached.
If styleset is installed, allow style-backed compile.
```

## Open Questions

- Can BubbleForge create colors and styles through Bubble's authenticated editor APIs?
- Does Bubble expose a stable client-side mutation path for styles?
- Can unused default styles/colors/fonts be cleaned safely?
- Can imported styles be updated idempotently?
- How should generated app-specific style IDs be stored for future compile calls?
