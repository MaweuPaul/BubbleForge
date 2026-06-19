(function () {
  "use strict";

  const ROOT_ID     = "bubbleforge-extension-v0-root";
  const REOPEN_ID   = "bubbleforge-extension-v0-reopen";
  const QUICKBAR_ID = "bubbleforge-quickbar";
  const DRAG_MIME   = "application/x-bubbleforge-component";
  const LS_PINS     = "bubbleforge_pins";
  const LS_QBAR_POS = "bubbleforge_qbar_pos";
  const LS_REOPEN_POS = "bubbleforge_reopen_pos";
  const LS_THEME    = "bubbleforge_active_theme";
  const MAX_PINS    = 8;
  let components    = [];

  function safeAppend(el) {
    if (document.body) {
      document.body.appendChild(el);
    } else {
      document.documentElement.appendChild(el);
    }
  }

  function getSoftBgColor(bgcolor) {
    if (!bgcolor) return `rgba(${hexToRgbStr(activeTheme.primary)}, 0.12)`;
    if (bgcolor.startsWith("rgba")) return bgcolor;
    const hex = normalizeHex(bgcolor);
    const r = parseInt(hex.substring(1, 3), 16) || 0;
    const g = parseInt(hex.substring(3, 5), 16) || 0;
    const b = parseInt(hex.substring(5, 7), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, 0.12)`;
  }

  function hexToRgbStr(hex) {
    const h = normalizeHex(hex).replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }

  // Convert rgba(r,g,b,a) from getComputedStyle to a #rrggbb hex string
  function rgbaToCssHex(rgba) {
    if (!rgba) return null;
    const m = rgba.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return null;
    return "#" + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, "0")).join("");
  }

  // Read Bubble's CSS variables off the root element and save as the active theme
  function extractAppTheme() {
    try {
      const style = getComputedStyle(document.documentElement);
      const read = (v) => style.getPropertyValue(v).trim();
      const toHex = (cssVar) => rgbaToCssHex(read(cssVar));

      const extracted = {
        primary:         toHex("--color_primary_default")         || activeTheme.primary,
        primaryContrast: toHex("--color_primary_contrast_default") || activeTheme.primaryContrast,
        text:            toHex("--color_text_default")            || activeTheme.text,
        surface:         toHex("--color_surface_default")         || activeTheme.surface,
        background:      toHex("--color_background_default")      || activeTheme.background,
        destructive:     toHex("--color_destructive_default")     || activeTheme.destructive,
        success:         toHex("--color_success_default")         || activeTheme.success,
        alert:           toHex("--color_alert_default")           || activeTheme.alert,
        font:            read("--font_default").replace(/['"/]/g, "") || activeTheme.font
      };

      // Only update and save if at least primary was found (confirms we are in the editor)
      if (extracted.primary && extracted.primary !== "#" && extracted.primary !== "#000000") {
        Object.assign(activeTheme, extracted);
        try { localStorage.setItem(LS_THEME, JSON.stringify(activeTheme)); } catch (_) {}
        console.log("[BubbleForge] App theme extracted:", activeTheme);
      }
    } catch (e) {
      console.warn("[BubbleForge] Theme extraction failed:", e);
    }
  }

  // Convert any color value to a hex string safe for <input type="color">
  // Resolves CSS var() strings using the active theme.
  function toColorInputValue(color) {
    if (!color) return activeTheme.primary;
    if (/^#[0-9a-fA-F]{6}$/.test(color)) return color.toLowerCase();
    if (/^#[0-9a-fA-F]{3}$/.test(color)) {
      const [,r,g,b] = color.match(/#(.)(.)(.)/);
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    // Resolve CSS variables to theme hex values
    if (color.includes("--color_primary_default") && !color.includes("contrast")) return activeTheme.primary;
    if (color.includes("--color_primary_contrast_default")) return activeTheme.primaryContrast;
    if (color.includes("--color_text_default")) return activeTheme.text;
    if (color.includes("--color_surface_default")) return activeTheme.surface;
    if (color.includes("--color_destructive_default")) return activeTheme.destructive;
    if (color.includes("--color_success_default")) return activeTheme.success;
    if (color.includes("--color_alert_default")) return activeTheme.alert;
    // rgba fallback
    const hex = rgbaToCssHex(color);
    if (hex) return hex;
    return activeTheme.primary;
  }

  function normalizeHex(hex) {
    hex = hex.replace("#", "");
    if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
    return `#${hex}`;
  }

  // ── STRICT EDITOR-ONLY GUARD ──────────────────────
  // Bubble's editor lives on bubble.io at paths like:
  //   /page?name=myapp&id=...
  //   /editor?name=myapp
  //   /builder/...
  // Live apps run on *.bubbleapps.io or custom domains — we never inject there.
  // We also never inject into iframes (Intercom, analytics, etc.).
  const _host   = window.location.hostname;
  const _path   = window.location.pathname;
  const _search = window.location.search;

  const isBubbleEditor =
    window === window.top &&                        // top-level frame only
    _host === "bubble.io" &&                        // bubble.io domain only
    (
      _path.startsWith("/page")    ||              // /page?name=... (main editor)
      _path.startsWith("/editor")  ||              // /editor?name=...
      _path.startsWith("/builder") ||              // /builder/...
      _search.includes("name=")                    // any bubble.io page with ?name= (editor tabs)
    );

  if (!isBubbleEditor) return;

  /* ── State ──────────────────────────────────────── */
  let activeTab      = "Components";
  let activeCategory = "All";
  let searchQuery    = "";
  let expandedCard   = null;
  let lastDragIntercept = "No drag intercepted yet.";
  let recorderLog = "Waiting to record...";
  let csrfScanResult = "Not scanned yet.";
  const customizations = {};

  // ── Styleset Importer state ───────────────────────
  let stylesetStep = 1;
  let stylesetImporting = false;
  let stylesetLog = [];
  let stylesetPalette = {
    primary:   "#1E6DF6",
    secondary: "#625DFE",
    danger:    "#EF2F15",
    warning:   "#FFB505",
    success:   "#2EA84A",
    gray:      "#8A8A8A"
  };
  let stylesetSelected = { colors: true, buttons: true };

  // Active theme — resolved HEX values from the host Bubble app
  let activeTheme = {
    primary:         "#ea580c",
    primaryContrast: "#ffffff",
    text:            "#1a1a1a",
    surface:         "#ffffff",
    background:      "#ffffff",
    destructive:     "#dc2626",
    success:         "#16a34a",
    alert:           "#d97706",
    font:            "Inter"
  };
  try {
    const savedTheme = localStorage.getItem(LS_THEME);
    if (savedTheme) Object.assign(activeTheme, JSON.parse(savedTheme));
  } catch (_) {}

  let pinnedIds = [];
  try {
    const saved = localStorage.getItem(LS_PINS);
    pinnedIds = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(pinnedIds)) pinnedIds = [];
  } catch (_) {
    pinnedIds = [];
  }

  function savePins() {
    try {
      localStorage.setItem(LS_PINS, JSON.stringify(pinnedIds));
    } catch (e) {
      console.error("[BubbleForge] Failed to save pins to localStorage", e);
    }
  }

  function isPinned(id) {
    return pinnedIds.includes(id);
  }

  function togglePin(id) {
    // Re-sync with localStorage to prevent any stale array state
    try {
      const saved = localStorage.getItem(LS_PINS);
      pinnedIds = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(pinnedIds)) pinnedIds = [];
    } catch (_) {
      pinnedIds = [];
    }

    if (isPinned(id)) {
      pinnedIds = pinnedIds.filter((p) => p !== id);
    } else {
      if (pinnedIds.length >= MAX_PINS) {
        showToast(`Max ${MAX_PINS} pins reached.`);
        return;
      }
      pinnedIds.push(id);
    }
    savePins();
    refresh();
    refreshQuickBar();
  }

  function getCustomization(component) {
    if (!customizations[component.id]) {
      customizations[component.id] = getDefaultCustomization(component);
    }
    return customizations[component.id];
  }

  function getDefaultCustomization(component) {
    const c = {};
    if (component.property_schema && typeof component.property_schema === 'object') {
      for (const [key, prop] of Object.entries(component.property_schema)) {
        c[key] = prop.default;
      }
    } else {
      // Fallback for legacy components without schema
      const p  = activeTheme.primary;
      const pc = activeTheme.primaryContrast;
      c.label = component.name;
      c.bgcolor = p;
      c.fgcolor = pc;
      c.radius = 8;
    }
    return c;
  }

  if (document.getElementById(ROOT_ID)) return;

  // ── STARTUP: Only show Quick Bar + reopen button ──
  // Panel is CLOSED by default — user opens it on demand
  extractAppTheme();  // Phase 1: read the Bubble app's design system from the DOM
  injectQuickBar();
  showReopenButton();
  injectProbes();

  // Fetch components dynamically from the backend
  function fetchComponents() {
    fetch("http://localhost:8081/api/v1/components")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          components = data;
          refreshQuickBar();
          if (document.getElementById(ROOT_ID)) refresh();
        }
      })
      .catch((err) => {
        console.error("[BubbleForge] Failed to fetch components. Is the backend running?", err);
      });
  }
  fetchComponents();

  async function runComponentImport(btn) {
    const name = document.getElementById("bf-import-name")?.value.trim();
    const cat = document.getElementById("bf-import-cat")?.value.trim();
    const desc = document.getElementById("bf-import-desc")?.value.trim();
    if (!name || !cat) return showToast("Name and Category are required!");

    const originalText = btn.textContent;
    btn.textContent = "Reading clipboard...";
    btn.style.opacity = "0.6";
    btn.style.pointerEvents = "none";

    try {
      const text = await navigator.clipboard.readText();
      const rawJson = JSON.parse(text);
      
      btn.textContent = "Importing...";
      const resp = await fetch("http://localhost:8081/api/v1/templates/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category: cat, description: desc, raw_bubble_json: rawJson })
      });

      if (!resp.ok) throw new Error(await resp.text());
      showToast("✅ Component imported successfully!");
      activeTab = "Components";
      activeCategory = "All";
      fetchComponents(); // Refresh the list!
      
      // Clear form
      if (document.getElementById("bf-import-name")) document.getElementById("bf-import-name").value = "";
      if (document.getElementById("bf-import-desc")) document.getElementById("bf-import-desc").value = "";
    } catch (e) {
      console.error(e);
      showToast("❌ Import failed: " + e.message);
    } finally {
      btn.textContent = originalText;
      btn.style.opacity = "1";
      btn.style.pointerEvents = "auto";
    }
  }

  document.addEventListener("drop", handleDocumentDrop, true);
  window.addEventListener("message", handleWindowMessage);
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === "D") {
      activeTab = activeTab === "Tools" ? "Components" : "Tools";
      const root = document.getElementById(ROOT_ID);
      if (root) refresh(); else injectPanel();
    }
  });

  /* ══════════════════════════════════════════════════
     SHARED DRAG-TO-REPOSITION
  ══════════════════════════════════════════════════ */
  function makeElementDraggable(el, handle, lsKey) {
    let startX, startY, startLeft, startTop;

    // Restore saved position
    try {
      const saved = JSON.parse(localStorage.getItem(lsKey) || "null");
      if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
        // Clamp to current viewport so dragged-offscreen elements snap back
        const clampedX = Math.max(0, Math.min(window.innerWidth  - (el.offsetWidth  || 100), saved.x));
        const clampedY = Math.max(0, Math.min(window.innerHeight - (el.offsetHeight || 50),  saved.y));
        el.style.left      = clampedX + "px";
        el.style.top       = clampedY + "px";
        el.style.right     = "auto";
        el.style.bottom    = "auto";
        el.style.transform = "none";
      }
      // If no saved position: leave CSS defaults (bottom/right) intact
    } catch (_) {}

    function onMouseMove(e) {
      const w = window.innerWidth, h = window.innerHeight;
      const newLeft = Math.max(0, Math.min(w - el.offsetWidth,  startLeft + e.clientX - startX));
      const newTop  = Math.max(0, Math.min(h - el.offsetHeight, startTop  + e.clientY - startY));
      el.style.left = newLeft + "px";
      el.style.top  = newTop  + "px";
    }

    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      el.style.transition = "";
      const rect = el.getBoundingClientRect();
      localStorage.setItem(lsKey, JSON.stringify({ x: rect.left, y: rect.top }));
    }

    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      startX = e.clientX; startY = e.clientY;
      startLeft = rect.left; startTop = rect.top;
      el.style.transition = "none";
      el.style.bottom = "auto"; el.style.right = "auto";
      el.style.transform = "none";

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
  }

  /* ══════════════════════════════════════════════════
     QUICK BAR
  ══════════════════════════════════════════════════ */
  function injectQuickBar() {
    const existing = document.getElementById(QUICKBAR_ID);
    if (existing) existing.remove();
    const bar = document.createElement("div");
    bar.id = QUICKBAR_ID;
    bar.innerHTML = renderQuickBarContent();
    safeAppend(bar);
    bindQuickBarEvents(bar);
    makeElementDraggable(bar, bar.querySelector(".bf-qbar-handle"), LS_QBAR_POS);
  }

  function renderQuickBarContent() {
    const pinned = pinnedIds.map((id) => components.find((c) => c.id === id)).filter(Boolean);
    const items = pinned.map((comp) => {
      const c = getCustomization(comp);
      const shortName = comp.name.replace(" Button", "").replace(" Component", "");
      let dotStyle = "";
      let dotInner = "";

      switch (comp.name) {
        case "Solid Button":
          dotStyle = `background:${c.bgcolor};border-radius:5px;box-shadow:0 2px 6px rgba(234,88,12,0.4);`;
          dotInner = `<span style="color:${c.fgcolor};font-size:9px;font-weight:800;letter-spacing:-0.5px">BTN</span>`;
          break;
        case "Outline Button":
          dotStyle = `background:transparent;border:2px solid ${c.fgcolor};border-radius:5px;`;
          dotInner = `<span style="color:${c.fgcolor};font-size:9px;font-weight:800">BTN</span>`;
          break;
        case "Ghost Button":
          dotStyle = `background:rgba(255,255,255,0.05);border-radius:5px;`;
          dotInner = `<span style="color:${c.fgcolor};font-size:9px;font-weight:800;opacity:0.9">BTN</span>`;
          break;
        case "Pill Button":
          dotStyle = `background:${c.bgcolor};border-radius:999px;box-shadow:0 2px 6px rgba(234,88,12,0.4);`;
          dotInner = `<span style="color:${c.fgcolor};font-size:9px;font-weight:800">●</span>`;
          break;
        case "Soft Button":
          dotStyle = `background:${getSoftBgColor(c.fgcolor)};border-radius:5px;`;
          dotInner = `<span style="color:${c.fgcolor};font-size:9px;font-weight:800">BTN</span>`;
          break;
        case "Destructive Button":
          dotStyle = `background:${c.bgcolor};border-radius:5px;box-shadow:0 2px 6px rgba(220,38,38,0.4);`;
          dotInner = `<span style="color:${c.fgcolor};font-size:11px;font-weight:900">✕</span>`;
          break;
        case "Icon Button":
          dotStyle = `background:${c.bgcolor};border:1px solid rgba(255,255,255,0.15);border-radius:5px;`;
          dotInner = `<span style="color:${c.fgcolor};font-size:14px;font-weight:700;line-height:1">+</span>`;
          break;
        case "FAB Button":
          dotStyle = `background:${c.bgcolor};border-radius:999px;width:28px;height:28px;box-shadow:0 3px 8px rgba(234,88,12,0.45);`;
          dotInner = `<span style="color:${c.fgcolor};font-size:15px;font-weight:700;line-height:1">+</span>`;
          break;
        case "Link Button":
          dotStyle = `background:transparent;border-radius:4px;`;
          dotInner = `<span style="color:${c.fgcolor};font-size:11px;font-weight:700;text-decoration:underline;text-decoration-color:${c.fgcolor};text-underline-offset:2px">→</span>`;
          break;
        default:
          dotStyle = `background:${c.bgcolor};border-radius:5px;`;
          dotInner = `<span style="color:${c.fgcolor};font-size:9px;font-weight:800">BTN</span>`;
      }

      return `
        <button class="bf-qbar-item" data-qbar-component="${comp.id}" title="${comp.name} — click to copy">
          <span class="bf-qbar-dot" style="${dotStyle}">${dotInner}</span>
          <span class="bf-qbar-label">${shortName}</span>
        </button>`;
    }).join("");

    const emptyHint = pinned.length === 0
      ? `<span class="bf-qbar-hint">Pin components above</span>` : "";

    return `
      <div class="bf-qbar-handle" id="bf-qbar-handle" title="Drag to reposition">
        <span class="bf-qbar-logo"></span>
      </div>
      <div class="bf-qbar-items">${emptyHint}${items}</div>
      <button class="bf-qbar-open" id="bf-qbar-open" title="Open BubbleForge panel">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>`;
  }

  function refreshQuickBar() {
    const bar = document.getElementById(QUICKBAR_ID);
    if (!bar) { injectQuickBar(); return; }
    bar.innerHTML = renderQuickBarContent();
    bindQuickBarEvents(bar);
    makeElementDraggable(bar, bar.querySelector(".bf-qbar-handle"), LS_QBAR_POS);
  }

  function bindQuickBarEvents(bar) {
    bar.querySelectorAll("[data-qbar-component]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const comp = components.find((c) => c.id === btn.dataset.qbarComponent);
        if (comp) {
          copyComponent(comp);
          btn.classList.add("bf-qbar-item--flash");
          setTimeout(() => btn.classList.remove("bf-qbar-item--flash"), 600);
        }
      });
    });

    const openBtn = bar.querySelector("#bf-qbar-open");
    if (openBtn) {
      openBtn.addEventListener("click", () => {
        const existing = document.getElementById(ROOT_ID);
        if (existing) existing.remove(); else injectPanel();
      });
    }
  }

  /* ══════════════════════════════════════════════════
     MAIN PANEL
  ══════════════════════════════════════════════════ */
  function injectPanel() {
    removeReopenButton();
    const root = document.createElement("aside");
    root.id = ROOT_ID;
    root.setAttribute("aria-label", "BubbleForge component library");
    root.innerHTML = renderPanel();
    safeAppend(root);
    bindEvents(root);
  }

  function injectProbes() {
    ["drag-probe.js", "recorder-probe.js"].forEach(file => {
      try {
        const script = document.createElement("script");
        script.src = chrome.runtime.getURL(file);
        script.onload = function () { this.remove(); };
        (document.head || document.documentElement).appendChild(script);
      } catch (e) { console.error("[BubbleForge] probe failed", file, e); }
    });
  }

  function handleWindowMessage(event) {
    if (!event.data) return;
    if (event.data.type === "BF_DRAG_INTERCEPT") {
      let niceData = event.data.payload;
      try { niceData = JSON.stringify(JSON.parse(niceData), null, 2); } catch (_) {}
      lastDragIntercept = `Format: ${event.data.format}\n\n${niceData}`;
      if (activeTab === "Tools") refresh();
    }
    if (event.data.type === "BF_RECORDER_EVENT") {
      const payload = event.data.payload;
      const ts = new Date().toLocaleTimeString();
      let msg = `[${ts}] [${payload.type}]`;
      if (payload.data.url) msg += ` ${payload.data.method} ${payload.data.url}`;
      if (payload.data.key) msg += ` SET ${payload.data.key}`;
      
      if (recorderLog === "Waiting to record...") recorderLog = "";
      recorderLog = msg + "\n" + recorderLog;
      // keep log bounded
      if (recorderLog.length > 5000) recorderLog = recorderLog.substring(0, 5000) + "...";
      
      const logEl = document.getElementById("bf-recorder-log");
      if (logEl) logEl.textContent = recorderLog;
    }
    if (event.data.type === "BF_RECORDER_EXPORT") {
      const blob = new Blob([event.data.payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bubbleforge-recording-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
    if (event.data.type === "BF_CSRF_SCAN_RESULT") {
      const keys = Object.keys(event.data.payload || {});
      if (keys.length === 0) {
        csrfScanResult = "No CSRF tokens found in window globals or meta tags.\n" +
          "Next step: Start Recording, make a change in Bubble, Stop, then Export.";
      } else {
        csrfScanResult = keys.map(k => `${k}: ${event.data.payload[k]}`).join("\n");
      }
      const el = document.getElementById("bf-csrf-log");
      if (el) el.textContent = csrfScanResult;
    }
    if (event.data.type === "BF_WRITES_DATA") {
      const writes = event.data.payload || [];
      if (writes.length === 0) {
        showToast("No Bubble writes captured yet. Make a change in Bubble first!");
      } else {
        const blob = new Blob([JSON.stringify(writes, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bubble-writes-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Exported ${writes.length} Bubble write(s)!`);
      }
    }
  }

  /* ── Render ─────────────────────────────────────── */
  function renderPanel() {
    const categories = ["All", ...new Set(components.map((c) => c.category))];
    return `
      <div class="bf-shell">
        <aside class="bf-sidebar">
          <div class="bf-sidebar-top">
            <button class="bf-logo-btn" type="button" data-action="close" aria-label="Close BubbleForge">
              <span class="bf-logo-mark"></span>
            </button>
            <span class="bf-logo-name">BubbleForge</span>
          </div>

          <nav class="bf-nav">
            ${renderNavItem("Components", `<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>`)}
            ${renderNavItem("Pinned", `<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>`, pinnedIds.length > 0 ? pinnedIds.length : null)}
            ${renderNavItem("My Library", `<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>`)}
            <!-- ${renderNavItem("Styleset", `<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>`)} -->
            ${renderNavItem("Tools", `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 9.36l-7.1 7.1a1 1 0 0 1-1.41 0l-1.42-1.42a1 1 0 0 1 0-1.41l7.1-7.1a6 6 0 0 1 9.36-7.94l-3.77 3.77z"/>`)}
          </nav>

          <div class="bf-cat-section">
            <span class="bf-cat-label">Categories</span>
            <div class="bf-cat-list">
              ${categories.map((cat) =>
                `<button class="bf-cat-item ${activeCategory === cat ? "is-active" : ""}" type="button" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`
              ).join("")}
            </div>
          </div>
        </aside>

        <div class="bf-main-wrapper">
          <header class="bf-header">
            <div class="bf-search-wrap">
              <svg class="bf-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input id="bf-search" class="bf-search" type="search" value="${escapeHtml(searchQuery)}" placeholder="Search components…">
            </div>
            <button class="bf-close-btn" type="button" data-action="close" title="Close BubbleForge (panel stays accessible via the floating bar)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </header>
          <main class="bf-main">${renderActiveContent()}</main>
          <div class="bf-toast" role="status" aria-live="polite"></div>
        </div>
      </div>`;
  }

  function renderNavItem(label, iconPaths, badge) {
    return `
      <button class="bf-nav-item ${activeTab === label ? "is-active" : ""}" type="button" data-tab="${label}">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconPaths}</svg>
        ${label}
        ${badge ? `<span class="bf-nav-badge">${badge}</span>` : ""}
      </button>`;
  }

  function renderActiveContent() {
    if (activeTab === "Tools") return renderTools();
    // if (activeTab === "Styleset") return renderStyleset();

    if (activeTab === "Pinned") {
      const pinned = pinnedIds.map((id) => components.find((c) => c.id === id)).filter(Boolean);
      return `
        <div class="bf-section-head"><h1>Pinned</h1><span class="bf-count">${pinned.length}</span></div>
        ${pinned.length === 0
          ? `<div class="bf-empty">
              <div class="bf-empty-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
              <h2>Nothing pinned yet</h2>
              <p>Click the 📍 button on any component card to add it here and the floating Quick Bar.</p>
            </div>`
          : `<div class="bf-grid">${pinned.map(renderComponentCard).join("")}</div>`
        }
        ${pinned.length > 0 ? `<div class="bf-pinned-tip">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Pinned items appear in the floating Quick Bar. Click the bar's "+" to toggle this panel.
        </div>` : ""}`;
    }

    if (activeTab === "My Library") {
      return `
        <div class="bf-section-head"><h1>My Library</h1></div>
        <div class="bf-empty">
          <div class="bf-empty-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></div>
          <h2>No saved components yet</h2><p>Components you save will appear here.</p>
        </div>`;
    }

    const filtered = getFilteredComponents();
    return `
      <div class="bf-section-head">
        <h1>${activeCategory === "All" ? "All Components" : activeCategory}</h1>
        <span class="bf-count">${filtered.length}</span>
      </div>
      <div class="bf-grid">
        ${filtered.length
          ? filtered.map(renderComponentCard).join("")
          : `<div class="bf-empty bf-empty--inline"><h2>No results</h2><p>Try a different search.</p></div>`}
      </div>`;
  }

  function renderComponentCard(component) {
    const c = getCustomization(component);
    const isExpanded = expandedCard === component.id;
    const pinned = isPinned(component.id);
    return `
      <article class="bf-card ${isExpanded ? "is-expanded" : ""}" data-component-wrapper="${escapeHtml(component.id)}">
        <div class="bf-card-preview ${getPreviewClass(component)}" aria-hidden="true">
          ${renderPreview(component, c)}
        </div>
        <div class="bf-card-body">
          <div class="bf-card-meta">
            <span class="bf-card-name">${escapeHtml(component.name)}</span>
            <div class="bf-card-actions">
              <span class="bf-access-badge bf-access-${(component.access || "free").toLowerCase()}">${escapeHtml(component.access || "Free")}</span>
              <button class="bf-pin-btn ${pinned ? "is-pinned" : ""}" type="button" data-pin="${escapeHtml(component.id)}" title="${pinned ? "Unpin" : "Pin to Quick Bar"}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="${pinned ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </button>
              <button class="bf-customize-toggle ${isExpanded ? "is-open" : ""}" type="button" data-expand="${escapeHtml(component.id)}" title="${isExpanded ? "Close" : "Customize"}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  ${isExpanded
                    ? `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`
                    : `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>`}
                </svg>
              </button>
            </div>
          </div>
          ${isExpanded ? renderCustomizePanel(component, c) : `<p class="bf-card-desc">${escapeHtml(component.description)}</p>`}
          <button class="bf-copy-btn" type="button" data-component-id="${escapeHtml(component.id)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy to Bubble
          </button>
        </div>
      </article>`;
  }

  function renderCustomizePanel(component, c) {
    const id = component.id;
    const schema = component.property_schema || {};
    const hasSchema = Object.keys(schema).length > 0;
    
    let html = `<div class="bf-customize-panel">`;
    
    if (!hasSchema) {
      html += `<p style="font-size:12px;color:#94a3b8;padding:8px">No customization schema available for this component.</p>`;
    } else {
      // We will render fields. To keep it compact, we can just use margin-bottom.
      for (const [key, prop] of Object.entries(schema)) {
        const val = c[key] !== undefined ? c[key] : prop.default;
        
        if (prop.type === "color") {
          const hex = toColorInputValue(val);
          const display = val === "transparent" ? "Transparent" : String(val).startsWith("rgba") ? val : String(val).toUpperCase();
          html += `
            <div class="bf-field" style="margin-bottom:12px">
              <label class="bf-field-label" for="bf-${key}-${id}">${escapeHtml(prop.label)}</label>
              <div class="bf-color-field">
                <input class="bf-field-color" id="bf-${key}-${id}" type="color" value="${hex}" data-prop="${escapeHtml(key)}" data-comp="${id}">
                <span class="bf-color-field-hex">${escapeHtml(display)}</span>
              </div>
            </div>`;
        } else if (prop.type === "number") {
          html += `
            <div class="bf-field" style="margin-bottom:12px">
              <label class="bf-field-label" for="bf-${key}-${id}">${escapeHtml(prop.label)} <span class="bf-field-value">${escapeHtml(val)}</span></label>
              <input class="bf-field-range" id="bf-${key}-${id}" type="range" min="${prop.min || 0}" max="${prop.max || 999}" value="${escapeHtml(val)}" data-prop="${escapeHtml(key)}" data-comp="${id}">
            </div>`;
        } else {
          // text, url, etc.
          const inputType = prop.type === "url" ? "url" : "text";
          html += `
            <div class="bf-field" style="margin-bottom:12px">
              <label class="bf-field-label" for="bf-${key}-${id}">${escapeHtml(prop.label)}</label>
              <input class="bf-field-input" id="bf-${key}-${id}" type="${inputType}" value="${escapeHtml(val)}" data-prop="${escapeHtml(key)}" data-comp="${id}">
            </div>`;
        }
      }
    }

    html += `
        <button class="bf-reset-btn" type="button" data-reset="${escapeHtml(id)}" title="Reset to defaults" style="margin-top:4px">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
          Reset defaults
        </button>
      </div>`;
    return html;
  }

  function renderPreview(component, c) {
    const cat = (component.category || "").toLowerCase();
    
    // Attempt to extract values from dynamic schema customizations
    const label = escapeHtml(c.label || c.text || component.name);
    const r = c.radius !== undefined ? c.radius : 8;
    const bg = c.bgcolor || activeTheme.primary;
    const fg = c.fgcolor || activeTheme.primaryContrast;

    // Legacy Button specific rendering to keep cool UI
    switch (component.name) {
      case "Outline Button":
        return `<div class="bf-prev-btn" style="background:transparent;color:${fg};border:2px solid ${fg};border-radius:${r}px">${label}</div>`;
      case "Ghost Button":
        return `<div class="bf-prev-btn" style="background:transparent;color:${fg};border:none;border-radius:${r}px">${label}</div>`;
      case "Soft Button":
        return `<div class="bf-prev-btn" style="background:${getSoftBgColor(fg)};color:${fg};border:none;border-radius:${r}px">${label}</div>`;
      case "Destructive Button":
        return `<div class="bf-prev-btn" style="background:${bg};color:${fg};border:none;border-radius:${r}px;box-shadow:0 2px 8px rgba(220,38,38,0.35)">${label}</div>`;
      case "Icon Button":
        return `<div class="bf-prev-icon-wrap"><div class="bf-prev-btn" style="background:${bg};color:${fg};border:1px solid #e2e8f0;border-radius:${r}px;width:44px;height:44px;font-size:22px;display:flex;align-items:center;justify-content:center;padding:0;min-width:unset;box-shadow:0 1px 4px rgba(0,0,0,0.08)">+</div></div>`;
      case "FAB Button":
        return `<div class="bf-prev-icon-wrap"><div class="bf-prev-btn" style="background:${bg};color:${fg};border-radius:999px;width:56px;height:56px;font-size:24px;display:flex;align-items:center;justify-content:center;padding:0;min-width:unset;box-shadow:0 4px 16px rgba(234,88,12,0.4)">+</div></div>`;
      case "Link Button":
        return `<div class="bf-prev-btn" style="background:transparent;color:${fg};border:none;padding:0;font-weight:500;text-decoration:underline;text-underline-offset:4px;text-decoration-color:${fg};height:auto">${label}</div>`;
      case "Pill Button":
        return `<div class="bf-prev-btn" style="background:${bg};color:${fg};border-radius:999px;padding:0 24px;box-shadow:0 2px 8px rgba(234,88,12,0.3)">${label}</div>`;
    }

    // Dynamic rendering by category
    if (cat.includes("button")) {
      return `<div class="bf-prev-btn" style="background:${bg};color:${fg};border-radius:${r}px;box-shadow:0 2px 8px rgba(0,0,0,0.15)">${label}</div>`;
    } else if (cat.includes("text") || cat.includes("typography")) {
      return `<div style="color:${fg};font-size:16px;font-family:${activeTheme.font};font-weight:500;line-height:1.4;max-width:100%;word-break:break-word">${label}</div>`;
    } else if (cat.includes("image") || cat.includes("media")) {
      const url = c.image_url || "https://placehold.co/600x400";
      return `<img src="${escapeHtml(url)}" style="max-width:100%;max-height:100%;border-radius:${r}px;object-fit:cover" alt="${label}">`;
    } else {
      // Fallback: Card or Container
      return `<div style="background:${bg};border-radius:${r}px;width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:${fg};font-size:12px;padding:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);border:1px solid rgba(255,255,255,0.1)">${label}</div>`;
    }
  }

  function getPreviewClass(c) {
    const map = {
      "Solid Button":       "preview-solid",
      "Outline Button":     "preview-outline",
      "Ghost Button":       "preview-ghost",
      "Pill Button":        "preview-pill",
      "Soft Button":        "preview-soft",
      "Destructive Button": "preview-destructive",
      "Icon Button":        "preview-icon",
      "FAB Button":         "preview-fab",
      "Link Button":        "preview-link",
    };
    return map[c.name] || "preview-default";
  }

  /* ══════════════════════════════════════════════════
     STYLESET IMPORTER — Helpers + UI
  ══════════════════════════════════════════════════ */

  // Extract Bubble app context from the DOM for API calls
  function getBubbleContext() {
    const params = new URLSearchParams(window.location.search);
    const appname = params.get("name") ||
                    window.location.pathname.split("/").filter(Boolean)[1] ||
                    "unknown";
    const sessionId = Date.now() + "x" + Math.floor(Math.random() * 9999);
    return { appname, sessionId, version: "test" };
  }

  // Convert hex to HSL (returns [h 0-360, s 0-100, l 0-100])
  function hexToHSL(hex) {
    hex = normalizeHex(hex).replace("#", "");
    let r = parseInt(hex.substring(0,2),16)/255;
    let g = parseInt(hex.substring(2,4),16)/255;
    let b = parseInt(hex.substring(4,6),16)/255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h, s, l = (max+min)/2;
    if (max === min) { h = s = 0; }
    else {
      const d = max-min;
      s = l > 0.5 ? d/(2-max-min) : d/(max+min);
      switch(max) {
        case r: h = ((g-b)/d + (g<b?6:0))/6; break;
        case g: h = ((b-r)/d + 2)/6; break;
        case b: h = ((r-g)/d + 4)/6; break;
      }
    }
    return [Math.round(h*360), Math.round(s*100), Math.round(l*100)];
  }

  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h/30) % 12;
    const a = s * Math.min(l, 1-l);
    const f = n => Math.round(255*(l - a*Math.max(-1, Math.min(k(n)-3, Math.min(9-k(n), 1)))));
    return "#" + [f(0),f(8),f(4)].map(x=>x.toString(16).padStart(2,"0")).join("");
  }

  // Generate 8-shade scale (10=lightest, 80=darkest) from a base hex
  function generateShades(baseHex) {
    const [h, s] = hexToHSL(baseHex);
    return {
      10: hslToHex(h, Math.max(s*0.15, 8), 97),
      20: hslToHex(h, Math.max(s*0.25, 12), 93),
      30: hslToHex(h, Math.max(s*0.4, 18), 86),
      40: hslToHex(h, Math.max(s*0.6, 28), 76),
      50: baseHex,
      60: hslToHex(h, s, hexToHSL(baseHex)[2] * 0.78),
      70: hslToHex(h, s, hexToHSL(baseHex)[2] * 0.58),
      80: hslToHex(h, s, hexToHSL(baseHex)[2] * 0.35),
    };
  }

  function hexToRgba(hex) {
    const h = normalizeHex(hex).replace("#","");
    const r=parseInt(h.substring(0,2),16);
    const g=parseInt(h.substring(2,4),16);
    const b=parseInt(h.substring(4,6),16);
    return `rgba(${r}, ${g}, ${b}, 1)`;
  }

  // POST changes to Bubble via the MAIN world probe.
  // The probe makes the actual fetch so Origin = "https://bubble.io" (not the extension).
  function bubbleWrite(changes) {
    return new Promise((resolve, reject) => {
      const { appname, version } = getBubbleContext();
      const requestId = "bfw_" + Date.now();
      const payload = { v: 1, appname, app_version: version, changes };

      function onResult(e) {
        if (!e.data || e.data.type !== "BF_WRITE_RESULT" || e.data.requestId !== requestId) return;
        window.removeEventListener("message", onResult);
        if (e.data.ok) {
          resolve(e.data.body);
        } else {
          reject(new Error(`HTTP ${e.data.status}: ${JSON.stringify(e.data.body)}`));
        }
      }

      window.addEventListener("message", onResult);
      window.postMessage({ type: "BF_WRITE", requestId, payload }, "*");

      setTimeout(() => {
        window.removeEventListener("message", onResult);
        reject(new Error("Request timed out after 15s"));
      }, 15000);
    });
  }

  // Build changes array for creating one color token
  function makeColorChange(id, name, hex, order, sessionId) {
    return [
      {
        body: `color_tokens.${id}`,
        path_array: ["_index", "id_to_path", id],
        intent: { name: "Update index" },
        version_control_api_version: 4,
        changelog_data: [],
        session_id: sessionId
      },
      {
        body: { name, rgba: hexToRgba(hex), deleted: false, description: "", order },
        path_array: ["color_tokens", id],
        intent: { name: "CreateColorToken", id: 1, source_appname: "" },
        version_control_api_version: 4,
        changelog_data: [],
        session_id: sessionId
      }
    ];
  }

  // Build changes array for creating one Button style
  function makeStyleChange(id, displayName, bgcVar, fcVar, borderColor, borderWidth, br, sessionId) {
    const props = {
      "%b": false,
      "%f": "var(--font_default):::600",
      "%br": br || 8,
      "%fc": fcVar,
      "%fs": 16,
      "%ic": fcVar,
      "%lh": 1.4,
      "%ls": 0,
      "%bas": "bgcolor",
      "%bgc": bgcVar,
      "button_gap": 12,
      "font_family": "var(--font_default)",
      "font_weight": "600",
      "padding_top": 0,
      "padding_left": 20,
      "padding_right": 20,
      "padding_bottom": 0
    };
    if (borderColor) { props["%bc"] = borderColor; props["%bw"] = borderWidth || 2; props["%bs"] = "solid"; }
    return [
      {
        body: `styles.${id}`,
        path_array: ["_index", "id_to_path", id],
        intent: { name: "Update index" },
        version_control_api_version: 4,
        changelog_data: [],
        session_id: sessionId
      },
      {
        body: { "%d": displayName, "%x": "Button", "%p": props, "id": id },
        path_array: ["styles", id],
        intent: { name: "CreateStyle", id: 7, source_appname: "" },
        version_control_api_version: 4,
        changelog_data: [],
        session_id: sessionId
      }
    ];
  }

  // Run the full import
  async function runStylesetImport() {
    if (stylesetImporting) return;
    stylesetImporting = true;
    stylesetLog = [];
    refresh();

    const log = (msg, ok=true) => {
      stylesetLog.push({ msg, ok });
      const el = document.getElementById("bf-styleset-log");
      if (el) el.innerHTML = stylesetLog.map(l =>
        `<div style="color:${l.ok?"#4ade80":"#f87171"}">${escapeHtml(l.msg)}</div>`
      ).join("");
    };

    try {
      const { sessionId } = getBubbleContext();
      const allChanges = [];

      if (stylesetSelected.colors) {
        log("Generating color palette...");
        const groups = [
          { key: "primary",   prefix: "bf_primary",   label: "Primary" },
          { key: "secondary", prefix: "bf_secondary",  label: "Secondary" },
          { key: "danger",    prefix: "bf_danger",     label: "Danger" },
          { key: "warning",   prefix: "bf_warning",    label: "Warning" },
          { key: "success",   prefix: "bf_success",    label: "Success" },
          { key: "gray",      prefix: "bf_gray",       label: "Gray" },
        ];
        let order = 100;
        for (const grp of groups) {
          const shades = generateShades(stylesetPalette[grp.key]);
          for (const [shade, hex] of Object.entries(shades)) {
            const id = `${grp.prefix}_${shade}`;
            const name = `${grp.label} ${shade}`;
            allChanges.push(...makeColorChange(id, name, hex, order++, sessionId));
          }
          log(`✓ ${grp.label} palette (8 shades)`);
        }
      }

      if (stylesetSelected.buttons) {
        log("Building button styles...");
        const p50 = "var(--color_bf_primary_50_default)";
        const p10 = "var(--color_bf_primary_10_default)";
        const contrast = "var(--color_primary_contrast_default)";
        const textVar = "var(--color_text_default)";
        const d50 = "var(--color_bf_danger_50_default)";
        const styles = [
          makeStyleChange("Button_bf_filled_primary_",     "BF Filled Primary",     p50,            contrast, null,  0,   8, sessionId),
          makeStyleChange("Button_bf_outline_primary_",    "BF Outline Primary",    "transparent",  p50,      p50,   2,   8, sessionId),
          makeStyleChange("Button_bf_ghost_primary_",      "BF Ghost Primary",      "transparent",  p50,      null,  0,   8, sessionId),
          makeStyleChange("Button_bf_soft_primary_",       "BF Soft Primary",       p10,            p50,      null,  0,   8, sessionId),
          makeStyleChange("Button_bf_pill_primary_",       "BF Pill Primary",       p50,            contrast, null,  0, 999, sessionId),
          makeStyleChange("Button_bf_destructive_",        "BF Destructive",        d50,            contrast, null,  0,   8, sessionId),
        ];
        for (const s of styles) allChanges.push(...s);
        log("✓ Button styles (6 variants)");
      }

      log(`Sending ${allChanges.length} changes to Bubble...`);
      const result = await bubbleWrite(allChanges);
      log(`✓ Import complete! ${JSON.stringify(result).substring(0,60)}`, true);
      showToast("BubbleForge Styleset imported!");
    } catch (e) {
      log(`✗ Error: ${e.message}`, false);
    }

    stylesetImporting = false;
    refresh();
  }

  function renderStyleset() {
    const steps = ["Clean App", "Edit Palette", "Import"];
    const stepIndicator = steps.map((s, i) => {
      const n = i+1;
      const active = n === stylesetStep;
      const done   = n < stylesetStep;
      return `<div style="display:flex;align-items:center;gap:6px;${active?"opacity:1":"opacity:0.45"}">
        <span style="width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;background:${done?"#4ade80":active?"#1E6DF6":"rgba(255,255,255,0.1)"};color:${done||active?"#000":"#fff"};flex-shrink:0">${done?"✓":n}</span>
        <span style="font-size:12px;font-weight:${active?600:400};white-space:nowrap">${s}</span>
      </div>
      ${i<2?`<div style="flex:1;height:1px;background:rgba(255,255,255,0.1);margin:0 4px"></div>`:""}`;
    }).join("");

    const groups = [
      { key: "primary",   label: "Primary",   desc: "Primary brand color" },
      { key: "secondary", label: "Secondary", desc: "Accent / secondary brand color" },
      { key: "danger",    label: "Danger",    desc: "Errors, deletes, destructive actions" },
      { key: "warning",   label: "Warning",   desc: "Alerts and caution states" },
      { key: "success",   label: "Success",   desc: "Confirmations and positive states" },
      { key: "gray",      label: "Gray",      desc: "Backgrounds, borders, text, icons" },
    ];

    let stepContent = "";

    if (stylesetStep === 1) {
      stepContent = `
        <div style="padding:16px;background:rgba(255,255,255,0.04);border-radius:10px;border:1px solid rgba(255,255,255,0.08);margin-bottom:16px">
          <div style="font-size:13px;font-weight:600;margin-bottom:8px">Optional: Clean your App</div>
          <p style="font-size:12px;color:#94a3b8;line-height:1.6">Bubble creates default styles and colors on new apps that may conflict with BubbleForge components. You can remove unused ones for a cleaner starting point.</p>
          <p style="font-size:11px;color:#64748b;margin-top:8px">⚠️ Styles used somewhere in your app will NOT be removed.</p>
        </div>
        <button class="bf-btn-primary" type="button" data-action="ss-next" style="width:100%">Continue to Edit Palette →</button>`;
    }

    if (stylesetStep === 2) {
      const palettePickers = groups.map(g => {
        const shades = generateShades(stylesetPalette[g.key]);
        const swatchRow = Object.entries(shades).map(([n, h]) =>
          `<div title="${g.label} ${n}: ${h}" style="width:18px;height:18px;border-radius:3px;background:${h};flex-shrink:0"></div>`
        ).join("");
        return `
          <div style="margin-bottom:16px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
              <input type="color" value="${stylesetPalette[g.key]}" data-ss-color="${g.key}"
                style="width:32px;height:32px;border-radius:6px;border:2px solid rgba(255,255,255,0.15);cursor:pointer;padding:2px;background:transparent;flex-shrink:0">
              <div>
                <div style="font-size:13px;font-weight:600">${g.label}</div>
                <div style="font-size:11px;color:#64748b">${g.desc}</div>
              </div>
            </div>
            <div style="display:flex;gap:3px;padding:6px;background:rgba(0,0,0,0.2);border-radius:6px">${swatchRow}</div>
          </div>`;
      }).join("");

      stepContent = `
        <div style="margin-bottom:16px">
          <div style="font-size:13px;font-weight:600;margin-bottom:4px">Edit your palette</div>
          <p style="font-size:12px;color:#94a3b8;margin-bottom:16px">Pick a base color for each group. BubbleForge will automatically generate 8 shades.</p>
          ${palettePickers}
        </div>
        <div style="display:flex;gap:8px">
          <button class="bf-reset-btn" type="button" data-action="ss-back" style="flex:1">← Back</button>
          <button class="bf-btn-primary" type="button" data-action="ss-next" style="flex:2">Continue to Import →</button>
        </div>`;
    }

    if (stylesetStep === 3) {
      const checkRow = (key, label, count) => `
        <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(255,255,255,0.04);border-radius:8px;cursor:pointer;margin-bottom:8px;border:1px solid rgba(255,255,255,0.07)">
          <input type="checkbox" ${stylesetSelected[key]?"checked":""} data-ss-check="${key}" style="width:16px;height:16px;accent-color:#1E6DF6;cursor:pointer">
          <span style="font-size:13px;font-weight:500;flex:1">${label}</span>
          <span style="font-size:11px;color:#64748b">${count}</span>
        </label>`;

      const logHtml = stylesetLog.length ? `
        <div id="bf-styleset-log" style="margin-top:12px;max-height:120px;overflow-y:auto;font-size:11px;font-family:monospace;background:rgba(0,0,0,0.3);padding:8px;border-radius:6px;line-height:1.8">
          ${stylesetLog.map(l=>`<div style="color:${l.ok?"#4ade80":"#f87171"}">${escapeHtml(l.msg)}</div>`).join("")}
        </div>` : `<div id="bf-styleset-log"></div>`;

      stepContent = `
        <div style="margin-bottom:16px">
          <div style="font-size:13px;font-weight:600;margin-bottom:4px">Select what to import</div>
          <p style="font-size:12px;color:#94a3b8;margin-bottom:12px">The following will be created inside your Bubble app.</p>
          ${checkRow("colors",  "Color Palette",  "6 groups × 8 shades = 48 colors")}
          ${checkRow("buttons", "Button Styles",  "6 variants (Filled, Outline, Ghost, Soft, Pill, Destructive)")}
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <button class="bf-reset-btn" type="button" data-action="ss-back" style="flex:1">← Back</button>
          <button class="bf-btn-primary" type="button" data-action="ss-import"
            style="flex:2;background:#1E6DF6;${stylesetImporting?"opacity:0.6;pointer-events:none":""}">
            ${stylesetImporting ? "Importing…" : "Import into Bubble ↑"}
          </button>
        </div>
        ${logHtml}`;
    }

    return `
      <div class="bf-section-head"><h1>Styleset Importer</h1></div>
      <div style="padding:0 16px">
        <p style="font-size:12px;color:#94a3b8;margin-bottom:16px">Import a full BubbleForge design system into your Bubble app — colors, fonts, and button styles compatible with all BubbleForge components.</p>
        <div style="display:flex;align-items:center;gap:4px;margin-bottom:20px;padding:12px;background:rgba(255,255,255,0.04);border-radius:10px;border:1px solid rgba(255,255,255,0.07)">
          ${stepIndicator}
        </div>
        ${stepContent}
      </div>`;
  }

  function renderTools() {
    let lsData = "Copy an element in Bubble first.";
    try {
      const raw = localStorage.getItem("bubble_element_clipboard");
      if (raw) { try { lsData = JSON.stringify(JSON.parse(raw), null, 2); } catch (_) { lsData = raw; } }
      else lsData = "No bubble_element_clipboard found.";
    } catch (e) { lsData = "Error: " + e.message; }

    const swatches = [
      { label: "Primary",     color: activeTheme.primary },
      { label: "Contrast",    color: activeTheme.primaryContrast },
      { label: "Text",        color: activeTheme.text },
      { label: "Surface",     color: activeTheme.surface },
      { label: "Danger",      color: activeTheme.destructive },
      { label: "Success",     color: activeTheme.success },
      { label: "Alert",       color: activeTheme.alert },
    ];
    const swatchHtml = swatches.map(s => `
      <div style="display:flex;align-items:center;gap:8px;padding:4px 0;">
        <div style="width:24px;height:24px;border-radius:5px;background:${s.color};border:1px solid rgba(255,255,255,0.15);flex-shrink:0"></div>
        <span style="font-size:11px;color:#94a3b8;flex:1">${s.label}</span>
        <span style="font-size:11px;font-family:monospace;color:#e2e8f0">${s.color}</span>
      </div>`).join("");

    return `
      <div class="bf-section-head"><h1>Developer Tools</h1></div>

      <div class="bf-tool-card" style="margin-bottom:16px; border-color:#FF9900;">
        <h2 style="color:#FF9900;">Component Importer</h2>
        <p>Copy any element in the Bubble Editor, fill in the details below, and click Import to instantly add it to your BubbleForge catalog.</p>
        <div style="margin-top:10px;">
          <input type="text" id="bf-import-name" class="bf-search" placeholder="Component Name (e.g. Clean Pricing Table)" style="margin-bottom:8px">
          <input type="text" id="bf-import-cat" class="bf-search" placeholder="Category (e.g. Marketing)" style="margin-bottom:8px">
          <textarea id="bf-import-desc" class="bf-search" placeholder="Description (optional)" style="margin-bottom:8px;resize:vertical;min-height:40px"></textarea>
          <button class="bf-btn-primary" type="button" data-action="comp-import" style="width:100%;background:#FF9900;color:#000">⬇️ Import from Clipboard</button>
        </div>
      </div>

      <div class="bf-tool-card" style="margin-bottom:16px;">
        <h2>App Theme</h2>
        <p style="margin-bottom:10px">Colors detected from the active Bubble app. Font: <strong>${escapeHtml(activeTheme.font)}</strong></p>
        ${swatchHtml}
        <div class="bf-btn-row" style="margin-top:12px">
          <button class="bf-btn-primary" type="button" data-action="refresh-theme">Re-detect Theme</button>
        </div>
      </div>
      
      <div class="bf-tool-card" style="margin-bottom:16px; border-color:#513EDF;">
        <h2 style="color:#513EDF;">Bubble Editor Style Recorder</h2>
        <p>Records network requests (with headers) and storage mutations. Use this to find Bubble's CSRF token.</p>
        <div style="margin-bottom:10px;padding:10px;background:rgba(0,0,0,0.3);border-radius:6px">
          <div style="font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:4px">CSRF Token Scan</div>
          <pre id="bf-csrf-log" style="font-size:10px;color:#e2e8f0;white-space:pre-wrap;max-height:80px;overflow-y:auto">${escapeHtml(csrfScanResult)}</pre>
          <button class="bf-reset-btn" type="button" data-action="rec-scan-csrf" style="margin-top:6px;font-size:11px">Re-scan for CSRF token</button>
        </div>
        <div style="margin-bottom:10px;padding:10px;background:rgba(0,0,0,0.3);border-radius:6px">
          <div style="font-size:11px;font-weight:600;color:#4ade80;margin-bottom:4px">Spy on Bubble's Own Writes</div>
          <p style="font-size:11px;color:#94a3b8;margin-bottom:6px">Make any change in Bubble (create a style, rename an element), then click below to download the exact payload Bubble sent — including the real intent names.</p>
          <button class="bf-btn-primary" type="button" data-action="rec-get-writes" style="font-size:11px;background:#4ade80;color:#000">Export Captured Bubble Writes</button>
        </div>
        <div class="bf-btn-row" style="margin-top:12px">
          <button class="bf-btn-primary" type="button" data-action="rec-start" style="background:#2EA84A">Start Recording</button>
          <button class="bf-btn-primary" type="button" data-action="rec-stop" style="background:#B0200C">Stop</button>
          <button class="bf-reset-btn" type="button" data-action="rec-clear">Clear</button>
          <button class="bf-btn-primary" type="button" data-action="rec-export" style="margin-left:auto">Export JSON</button>
        </div>
        <pre class="bf-log" id="bf-recorder-log" style="height:150px">${escapeHtml(recorderLog)}</pre>
      </div>

      <div class="bf-tool-card">
        <h2>LocalStorage Reader</h2><p>Reads Bubble's clipboard payload.</p>
        <div class="bf-btn-row"><button class="bf-btn-primary" type="button" data-action="read-ls">Read LocalStorage</button></div>
        <pre class="bf-log">${escapeHtml(lsData)}</pre>
      </div>
      <div class="bf-tool-card" style="margin-top:16px">
        <h2>Drag Payload Intercept</h2><p>Drag any element in Bubble to capture its DataTransfer payload.</p>
        <pre class="bf-log">${escapeHtml(lastDragIntercept)}</pre>
      </div>`;
  }

  /* ── Events ─────────────────────────────────────── */
  function bindEvents(root) {
    root.addEventListener("click", (e) => {
      const tab    = e.target.closest("[data-tab]");      if (tab)    { activeTab = tab.dataset.tab; refresh(); return; }
      const cat    = e.target.closest("[data-category]"); if (cat)    { activeCategory = cat.dataset.category; activeTab = "Components"; refresh(); return; }
      const pin    = e.target.closest("[data-pin]");      if (pin)    { e.stopPropagation(); togglePin(pin.dataset.pin); return; }
      const expand = e.target.closest("[data-expand]");   if (expand) { e.stopPropagation(); expandedCard = expandedCard === expand.dataset.expand ? null : expand.dataset.expand; refresh(); return; }
      const reset  = e.target.closest("[data-reset]");   if (reset)  { e.stopPropagation(); const comp = components.find(x => x.id === reset.dataset.reset); if (comp) { customizations[comp.id] = getDefaultCustomization(comp); refresh(); if (isPinned(comp.id)) refreshQuickBar(); } return; }
      const copy   = e.target.closest("[data-component-id]"); if (copy) { e.stopPropagation(); const c = components.find((x) => x.id === copy.dataset.componentId); if (c) copyComponent(c); return; }
      const action = e.target.closest("[data-action]");
      if (action) {
        if (action.dataset.action === "close") closePanel();
        if (action.dataset.action === "read-ls") refresh();
        if (action.dataset.action === "refresh-theme") {
          extractAppTheme();
          // Reset all cached customizations so they pick up the new theme
          Object.keys(customizations).forEach(k => delete customizations[k]);
          refresh();
          refreshQuickBar();
        }
        if (action.dataset.action === "rec-start") {
          recorderLog = "Recording started...\n";
          const logEl = document.getElementById("bf-recorder-log");
          if (logEl) logEl.textContent = recorderLog;
          window.postMessage({ type: "BF_RECORDER_CMD", cmd: "START" }, "*");
        }
        if (action.dataset.action === "rec-stop") {
          recorderLog = "Recording stopped.\n" + recorderLog;
          const logEl = document.getElementById("bf-recorder-log");
          if (logEl) logEl.textContent = recorderLog;
          window.postMessage({ type: "BF_RECORDER_CMD", cmd: "STOP" }, "*");
        }
        if (action.dataset.action === "rec-clear") {
          recorderLog = "Waiting to record...";
          const logEl = document.getElementById("bf-recorder-log");
          if (logEl) logEl.textContent = recorderLog;
          window.postMessage({ type: "BF_RECORDER_CMD", cmd: "CLEAR" }, "*");
        }
        if (action.dataset.action === "rec-export") {
          window.postMessage({ type: "BF_RECORDER_CMD", cmd: "EXPORT" }, "*");
        }
        if (action.dataset.action === "rec-scan-csrf") {
          window.postMessage({ type: "BF_RECORDER_CMD", cmd: "SCAN_CSRF" }, "*");
        }
        if (action.dataset.action === "rec-get-writes") {
          window.postMessage({ type: "BF_RECORDER_CMD", cmd: "GET_WRITES" }, "*");
        }
        // Styleset wizard navigation
        if (action.dataset.action === "ss-next") { stylesetStep = Math.min(3, stylesetStep + 1); refresh(); }
        if (action.dataset.action === "ss-back") { stylesetStep = Math.max(1, stylesetStep - 1); refresh(); }
        if (action.dataset.action === "ss-import") { runStylesetImport(); }
        
        // Component Importer
        if (action.dataset.action === "comp-import") { runComponentImport(action); }
      }
    });

    root.addEventListener("input", (e) => {
      const search = e.target.closest("#bf-search");
      if (search) { searchQuery = search.value; updateMainOnly(); return; }
      const compId = e.target.dataset.comp, prop = e.target.dataset.prop;
      if (compId && prop) {
        const comp = components.find((c) => c.id === compId);
        if (!comp) return;
        const cust = getCustomization(comp);
        cust[prop] = prop === "radius" ? parseInt(e.target.value, 10) : e.target.value;
        // Live preview
        const preview = root.querySelector(`[data-component-wrapper="${compId}"] .bf-card-preview`);
        if (preview) preview.innerHTML = renderPreview(comp, cust);
        if (prop === "radius") { const lbl = root.querySelector(`#bf-radius-${compId}`)?.closest(".bf-field")?.querySelector(".bf-field-value"); if (lbl) lbl.textContent = `${cust.radius}px`; }
        if (prop === "bgcolor") { const hex = root.querySelector(`#bf-bg-${compId}`)?.closest(".bf-color-field")?.querySelector(".bf-color-field-hex"); if (hex) hex.textContent = cust.bgcolor.toUpperCase(); }
        if (prop === "fgcolor") { const hex = root.querySelector(`#bf-fg-${compId}`)?.closest(".bf-color-field")?.querySelector(".bf-color-field-hex"); if (hex) hex.textContent = cust.fgcolor.toUpperCase(); }
        if (isPinned(compId)) refreshQuickBar();
      }
      // Styleset color pickers
      const ssColor = e.target.dataset.ssColor;
      if (ssColor && e.target.type === "color") {
        stylesetPalette[ssColor] = e.target.value;
        // Re-render just the swatch row below this picker without a full refresh
        const shades = generateShades(e.target.value);
        const swatchRow = e.target.closest("div[style]")?.nextElementSibling;
        if (swatchRow) {
          swatchRow.innerHTML = Object.entries(shades).map(([n, h]) =>
            `<div title="${ssColor} ${n}: ${h}" style="width:18px;height:18px;border-radius:3px;background:${h};flex-shrink:0"></div>`
          ).join("");
        }
      }
      // Styleset import checkboxes
      const ssCheck = e.target.dataset.ssCheck;
      if (ssCheck && e.target.type === "checkbox") {
        stylesetSelected[ssCheck] = e.target.checked;
      }
    });

    // Removed drag listeners
  }

  function updateMainOnly() {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;
    const main = root.querySelector(".bf-main");
    if (main) main.innerHTML = renderActiveContent();
    // Sync sidebar badges (pin count) without rebuilding the whole panel
    const pinnedBadge = root.querySelector(".bf-nav-item[data-tab='Pinned'] .bf-nav-badge");
    const pinnedNav = root.querySelector(".bf-nav-item[data-tab='Pinned']");
    if (pinnedNav) {
      const existing = pinnedNav.querySelector(".bf-nav-badge");
      if (pinnedIds.length > 0) {
        if (existing) existing.textContent = pinnedIds.length;
        else pinnedNav.insertAdjacentHTML("beforeend", `<span class="bf-nav-badge">${pinnedIds.length}</span>`);
      } else if (existing) existing.remove();
    }
  }

  function refresh() {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;
    // Only replace the inner shell, keep root element alive so event listeners persist
    root.innerHTML = renderPanel();
  }

  /* ── Copy ───────────────────────────────────────── */
  async function copyComponent(component) {
    try {
      const c = getCustomization(component);

      const res = await fetch(`http://localhost:8081/api/v1/components/${component.id}/compile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_values: c })
      });

      if (!res.ok) {
        throw new Error("Compilation failed: " + await res.text());
      }

      const payload = await res.json();
      const ts = Date.now();
      const messageId = `${ts}x${Math.floor(Math.random() * 1e16)}`;
      const jsonStr = JSON.stringify(payload);

      localStorage.setItem("bubble_element_clipboard", jsonStr);
      localStorage.setItem("bubble_element_clipboard_most_recent", jsonStr);
      localStorage.setItem("_this_session_clipboard_bubble_element_clipboard", ts.toString());
      localStorage.setItem("_this_session_clipboard_bubble_element_clipboard_most_recent", ts.toString());
      localStorage.setItem(`global_clipboard_message_${messageId}`, JSON.stringify({
        action: "global_clipboard_put", key: "bubble_element_clipboard",
        data: payload, timestamp: ts, id: messageId
      }));

      try { await navigator.clipboard.writeText("BubbleForge: " + component.name); } catch (_) {}
      showToast("Copied! Click the Bubble canvas and press Ctrl+V");
    } catch (err) {
      showToast("Failed. Check DevTools console.");
      console.error("[BubbleForge] Copy failed", err);
    }
  }


  // Drag code has been completely removed to prioritize copy-paste reliability

  /* ── Panel Helpers ──────────────────────────────── */
  function closePanel() {
    const root = document.getElementById(ROOT_ID);
    if (root) root.remove();
    showReopenButton();
  }

  function showReopenButton() {
    if (document.getElementById(REOPEN_ID)) return;
    const btn = document.createElement("button");
    btn.id = REOPEN_ID;
    btn.type = "button";
    btn.title = "Open BubbleForge";
    btn.innerHTML = `<span class="bf-reopen-mark"></span>`;
    btn.addEventListener("click", (e) => {
      // Only open if wasn't dragging
      if (btn._wasDragged) { btn._wasDragged = false; return; }
      const existing = document.getElementById(ROOT_ID);
      if (existing) existing.remove(); else injectPanel();
    });
    safeAppend(btn);

    // Make it draggable
    makeElementDraggable(btn, btn, LS_REOPEN_POS);
    // Track drag vs click
    btn.addEventListener("mousedown", () => { btn._wasDragged = false; });
    btn.addEventListener("mousemove", () => { btn._wasDragged = true; });
  }

  function removeReopenButton() {
    const btn = document.getElementById(REOPEN_ID);
    if (btn) btn.remove();
  }

  function showToast(message) {
    const root = document.getElementById(ROOT_ID);
    const toast = root ? root.querySelector(".bf-toast") : null;
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast._tid);
    showToast._tid = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
  }

  function getFilteredComponents() {
    const q = searchQuery.trim().toLowerCase();
    return components.filter((c) => {
      const matchesCat = activeCategory === "All" || c.category === activeCategory;
      const matchesQ = !q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  }

  function escapeHtml(v) {
    return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  }
})();
