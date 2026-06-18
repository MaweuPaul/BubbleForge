# BubbleForge Extension V0

Local Chrome extension prototype for testing a Bubble component library sidebar.

This version does not use a backend, AI, auth, database, or payments. The goal is to validate component browsing, copying stored component data to the clipboard, experimental drag/drop payloads, and inspecting Bubble clipboard payloads later.

## Files

```text
bubbleforge-extension-v0/
  manifest.json
  content.js
  styles.css
  sample-components.js
  README.md
```

## Load Locally In Chrome

1. Open Chrome.
2. Go to `chrome://extensions`.
3. Enable `Developer mode`.
4. Click `Load unpacked`.
5. Select the `bubbleforge-extension-v0` folder.

## Test In Bubble

1. Open a Bubble editor page such as `https://bubble.io/page...`.
2. The BubbleForge sidebar should appear inside the page.
3. Browse the sample components.
4. Click `Copy Component`.
5. Paste into the Bubble editor.

The current copied payload is placeholder JSON. Real Bubble component JSON still needs to be captured.

## Drag And Drop Experiment

Component cards are draggable.

Drag a card from the BubbleForge sidebar into the Bubble editor canvas. The extension attaches these data types to the drag event:

- `application/x-bubbleforge-component`
- `application/json`
- `text/plain`

The extension also logs attempted drops to Chrome DevTools.

This does not guarantee Bubble will accept the drop yet. It is an experiment to learn whether Bubble editor drop targets read browser `DataTransfer` payloads.

When drag starts, BubbleForge also writes the component JSON to the clipboard. If dropping does nothing, click the Bubble editor canvas and press `Ctrl+V`.

## Clipboard Experiment

When `Copy Component` is clicked, the extension tries:

```js
navigator.clipboard.write([
  new ClipboardItem({
    "application/json": new Blob([json], { type: "application/json" }),
    "text/plain": new Blob([json], { type: "text/plain" })
  })
])
```

If `ClipboardItem` fails, it falls back to:

```js
navigator.clipboard.writeText(json)
```

## Paste Debugging

Open the `Tools` tab and click `Log Next Paste`.

The next paste event logs:

- `clipboardData.types`
- `application/json` content
- `text/plain` content

The payload appears in the sidebar and in Chrome DevTools.

## Capture And Replay Real Bubble Clipboard Data

This is the most important research workflow.

1. Build a simple native Bubble button.
2. Select it in the Bubble editor.
3. Press `Ctrl+C`.
4. Open BubbleForge `Tools`.
5. Click `Read Clipboard Now`.
6. Inspect the captured MIME types and payload previews.
7. Click `Replay Last Clipboard`.
8. Click the Bubble canvas and press `Ctrl+V`.

If the replayed payload inserts the same Bubble button, we have validated the core insertion mechanism.

If replay fails, check DevTools for errors. Some clipboard MIME types may require special handling or may be blocked by Chrome.

## Capture Real Bubble Clipboard Data

Use the current manual workflow:

1. Build a simple button in Bubble.
2. Select the button in the Bubble editor.
3. Press `Ctrl+C`.
4. Click `Log Next Paste` in BubbleForge.
5. Paste into the Bubble editor page.
6. Inspect the logged clipboard payload.

Once the real Bubble clipboard structure is understood, replace the placeholder `bubbleJson` objects in `sample-components.js`.

## Edit Sample Components

Open `sample-components.js` and edit the objects in:

```js
window.BUBBLEFORGE_SAMPLE_COMPONENTS
```

Each component uses this shape:

```js
{
  id: "button-primary",
  name: "Primary Button",
  category: "Buttons",
  description: "Simple primary button",
  bubbleJson: {}
}
```

## Current Limitations

- Real Bubble JSON has not been captured yet.
- Copy/paste may need additional MIME types after Bubble clipboard research.
- Drag and drop is experimental and may not insert into Bubble until the real Bubble payload format is known.
- Clipboard replay is experimental and depends on the MIME types Bubble uses.
- No backend.
- No AI generation.
- No authentication.
- No persistent user library.
