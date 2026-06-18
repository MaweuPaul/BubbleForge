# Bubble Editor Research

This document tracks what BubbleForge has learned about inserting components into the Bubble editor.

## Insertion Path

The reliable V0 path is localStorage clipboard injection followed by manual paste.

```text
Extension receives compiled payload
        |
        v
Writes Bubble clipboard localStorage keys
        |
        v
User focuses Bubble canvas
        |
        v
User presses Ctrl+V
        |
        v
Bubble creates the element
```

Important keys:

```text
bubble_element_clipboard
bubble_element_clipboard_most_recent
_this_session_clipboard_bubble_element_clipboard
_this_session_clipboard_bubble_element_clipboard_most_recent
global_clipboard_message_<timestamp>
```

## Drag And Drop

External drag/drop is not reliable for insertion.

Bubble's editor uses React/editor internal state and does not treat normal external browser `DataTransfer` payloads as native Bubble elements. Drag/drop can still be useful as a research probe, but it should not be the main product path for V0.

## Token Research Outcome

Token and style behavior appears app-specific.

Current conclusion:

```text
Foreign token payloads cannot be safely injected as a universal strategy.
Bubble relies on app-specific internal dictionaries for colors, fonts, styles, and IDs.
Missing styles are gracefully ignored and elements can render as default unstyled components.
Raw Google Font strings in font_face work without font token dictionaries.
```

This leads to the two-mode architecture:

- detached mode for instant reliable paste
- styleset mode after BubbleForge styles are imported into the target app

## Recorder Needed

The next research tool should be a style recorder in the extension Tools tab.

The recorder should capture what Bubble does when a user manually creates or edits:

- colors
- styles
- fonts
- breakpoints
- element style assignments

Record:

- `fetch` calls
- `XMLHttpRequest` calls
- request URL, method, headers, and body
- readable response body
- localStorage/sessionStorage mutations
- copy/paste payloads
- useful global editor object hints

Target workflow:

```text
Start Style Recorder
Manually create one Bubble color/style
Stop Style Recorder
Export JSON recording
Analyze Bubble's real mutation path
Reproduce it from BubbleForge
```
