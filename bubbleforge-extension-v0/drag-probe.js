(function() {
  if (window.__bubbleForgeDragProbeInstalled) return;
  window.__bubbleForgeDragProbeInstalled = true;

  console.log("[BubbleForge Probe] Installed in MAIN world.");

  // ── Intercept DataTransfer.setData ──────────────────
  // Records what format/data Bubble uses during its own internal drags.
  const originalSetData = DataTransfer.prototype.setData;
  DataTransfer.prototype.setData = function(format, data) {
    console.log(`[BubbleForge Probe] DataTransfer.setData intercepted: ${format}`);
    window.postMessage({
      type: "BF_DRAG_INTERCEPT",
      format: format,
      payload: data
    }, "*");
    return originalSetData.apply(this, arguments);
  };

  // ── Auto-Paste Trigger ──────────────────────────────
  // Called by BubbleForge after a drag ends and the component is already
  // written to localStorage. Attempts to simulate Ctrl+V so the user
  // doesn't have to press it manually.
  window.__bubbleForgeTriggerPaste = function(x, y) {
    try {
      // Find the deepest element at the drop coordinates
      const target = document.elementFromPoint(x, y) || document.body;

      // Try to give it focus first
      if (typeof target.focus === "function") {
        target.focus({ preventScroll: true });
      }

      // Dispatch keydown + keyup for Ctrl+V on the element and the document
      const targets = [target, document, document.body];
      targets.forEach((el) => {
        ["keydown", "keyup"].forEach((type) => {
          try {
            el.dispatchEvent(new KeyboardEvent(type, {
              key: "v",
              code: "KeyV",
              keyCode: 86,
              which: 86,
              ctrlKey: true,
              bubbles: true,
              cancelable: true,
              composed: true
            }));
          } catch (_) {}
        });
      });

      // Also try a ClipboardEvent paste on the document as a secondary attempt
      try {
        document.dispatchEvent(new ClipboardEvent("paste", {
          bubbles: true,
          cancelable: true,
          composed: true
        }));
      } catch (_) {}

      // Try native execCommand
      try {
        if (typeof target.focus === "function") target.focus();
        const success = document.execCommand("paste");
        console.log("[BubbleForge Probe] execCommand('paste') returned", success);
      } catch (e) {
        console.warn("[BubbleForge Probe] execCommand failed", e);
      }

      console.log("[BubbleForge Probe] Paste trigger fired at", x, y, "on", target.tagName);
    } catch (e) {
      console.warn("[BubbleForge Probe] Paste trigger failed:", e);
    }
  };

  window.addEventListener("message", (e) => {
    if (e.source !== window || !e.data) return;
    if (e.data.type === "BF_TRIGGER_PASTE") {
      window.__bubbleForgeTriggerPaste(e.data.x, e.data.y);
    }
  });

})();
