(function () {
  "use strict";

  const ROOT_ID     = "bubbleforge-extension-v0-root";
  const REOPEN_ID   = "bubbleforge-extension-v0-reopen";
  const QUICKBAR_ID = "bubbleforge-quickbar";
  const DRAG_MIME   = "application/x-bubbleforge-component";
  const LS_PINS     = "bubbleforge_pins";
  const LS_QBAR_POS = "bubbleforge_qbar_pos";
  const LS_REOPEN_POS = "bubbleforge_reopen_pos";
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
    if (!bgcolor) return "rgba(234, 88, 12, 0.12)";
    if (bgcolor.startsWith("rgba")) return bgcolor;
    const hex = normalizeHex(bgcolor);
    const r = parseInt(hex.substring(1, 3), 16) || 0;
    const g = parseInt(hex.substring(3, 5), 16) || 0;
    const b = parseInt(hex.substring(5, 7), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, 0.12)`;
  }

  // Convert any color value to a hex string safe for <input type="color">
  // Falls back to #ea580c (brand color) if it can't be converted.
  function toColorInputValue(color) {
    if (!color) return "#ea580c";
    if (/^#[0-9a-fA-F]{6}$/.test(color)) return color.toLowerCase();
    if (/^#[0-9a-fA-F]{3}$/.test(color)) {
      const [,r,g,b] = color.match(/#(.)(.)(.)/);
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    // rgba / transparent -> brand fallback
    return "#ea580c";
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
  const customizations = {};

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
    switch (component.name) {
      case "Solid Button":        return { label: "Submit",       bgcolor: "#ea580c",              fgcolor: "#ffffff", radius: 8,   icon: "" };
      case "Outline Button":      return { label: "Secondary",    bgcolor: "#ea580c",              fgcolor: "#ea580c", radius: 8,   icon: "" };
      case "Ghost Button":        return { label: "Cancel",       bgcolor: "#ea580c",              fgcolor: "#ea580c", radius: 8,   icon: "" };
      case "Pill Button":         return { label: "Pill Action",  bgcolor: "#ea580c",              fgcolor: "#ffffff", radius: 999, icon: "" };
      case "Soft Button":         return { label: "Get Started",  bgcolor: "rgba(234,88,12,0.12)",fgcolor: "#ea580c", radius: 8,   icon: "" };
      case "Destructive Button":  return { label: "Delete",       bgcolor: "#dc2626",              fgcolor: "#ffffff", radius: 8,   icon: "" };
      case "Icon Button":         return { label: "+",            bgcolor: "#ffffff",              fgcolor: "#0f172a", radius: 8,   icon: "add" };
      case "FAB Button":          return { label: "+",            bgcolor: "#ea580c",              fgcolor: "#ffffff", radius: 999, icon: "add" };
      case "Link Button":         return { label: "Learn more →", bgcolor: "transparent",          fgcolor: "#ea580c", radius: 4,   icon: "" };
      default:                    return { label: "Button",        bgcolor: "#ea580c",              fgcolor: "#ffffff", radius: 8,   icon: "" };
    }
  }

  if (document.getElementById(ROOT_ID)) return;

  // ── STARTUP: Only show Quick Bar + reopen button ──
  // Panel is CLOSED by default — user opens it on demand
  injectQuickBar();
  showReopenButton();
  injectDragProbe();

  // Fetch components dynamically from the backend
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

  function injectDragProbe() {
    try {
      const script = document.createElement("script");
      script.src = chrome.runtime.getURL("drag-probe.js");
      script.onload = function () { this.remove(); };
      (document.head || document.documentElement).appendChild(script);
    } catch (e) { console.error("[BubbleForge] drag probe failed", e); }
  }

  function handleWindowMessage(event) {
    if (event.data && event.data.type === "BF_DRAG_INTERCEPT") {
      let niceData = event.data.payload;
      try { niceData = JSON.stringify(JSON.parse(niceData), null, 2); } catch (_) {}
      lastDragIntercept = `Format: ${event.data.format}\n\n${niceData}`;
      if (activeTab === "Tools") refresh();
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
      <article class="bf-card ${isExpanded ? "is-expanded" : ""}" draggable="true" data-draggable-component-id="${escapeHtml(component.id)}">
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
    // <input type="color"> only accepts #rrggbb — convert rgba/transparent to a safe hex
    const bgHex = toColorInputValue(c.bgcolor);
    const fgHex = toColorInputValue(c.fgcolor);
    const bgDisplay = c.bgcolor === "transparent" ? "Transparent" : c.bgcolor.startsWith("rgba") ? c.bgcolor : c.bgcolor.toUpperCase();
    const fgDisplay = c.fgcolor === "transparent" ? "Transparent" : c.fgcolor.startsWith("rgba") ? c.fgcolor : c.fgcolor.toUpperCase();
    return `
      <div class="bf-customize-panel">
        <div class="bf-field-row">
          <div class="bf-field">
            <label class="bf-field-label" for="bf-label-${id}">Label</label>
            <input class="bf-field-input" id="bf-label-${id}" type="text" value="${escapeHtml(c.label)}" data-prop="label" data-comp="${id}">
          </div>
          <div class="bf-field">
            <label class="bf-field-label" for="bf-icon-${id}">Icon (Material)</label>
            <input class="bf-field-input" id="bf-icon-${id}" type="text" value="${escapeHtml(c.icon || '')}" data-prop="icon" data-comp="${id}" placeholder="e.g. star, home">
          </div>
        </div>
        <div class="bf-field-row">
          <div class="bf-field">
            <label class="bf-field-label" for="bf-bg-${id}">Background</label>
            <div class="bf-color-field">
              <input class="bf-field-color" id="bf-bg-${id}" type="color" value="${bgHex}" data-prop="bgcolor" data-comp="${id}">
              <span class="bf-color-field-hex">${escapeHtml(bgDisplay)}</span>
            </div>
          </div>
          <div class="bf-field">
            <label class="bf-field-label" for="bf-fg-${id}">Text</label>
            <div class="bf-color-field">
              <input class="bf-field-color" id="bf-fg-${id}" type="color" value="${fgHex}" data-prop="fgcolor" data-comp="${id}">
              <span class="bf-color-field-hex">${escapeHtml(fgDisplay)}</span>
            </div>
          </div>
        </div>
        <div class="bf-field">
          <label class="bf-field-label" for="bf-radius-${id}">Radius <span class="bf-field-value">${c.radius}px</span></label>
          <input class="bf-field-range" id="bf-radius-${id}" type="range" min="0" max="999" value="${c.radius}" data-prop="radius" data-comp="${id}">
        </div>
        <button class="bf-reset-btn" type="button" data-reset="${escapeHtml(id)}" title="Reset to defaults">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
          Reset defaults
        </button>
      </div>`;
  }

  function renderPreview(component, c) {
    const label = escapeHtml(c.label);
    const r = c.radius;
    switch (component.name) {
      case "Outline Button":
        return `<div class="bf-prev-btn" style="background:transparent;color:${c.fgcolor};border:2px solid ${c.fgcolor};border-radius:${r}px">${label}</div>`;
      case "Ghost Button":
        return `<div class="bf-prev-btn" style="background:transparent;color:${c.fgcolor};border:none;border-radius:${r}px">${label}</div>`;
      case "Soft Button":
        return `<div class="bf-prev-btn" style="background:${getSoftBgColor(c.fgcolor)};color:${c.fgcolor};border:none;border-radius:${r}px">${label}</div>`;
      case "Destructive Button":
        return `<div class="bf-prev-btn" style="background:${c.bgcolor};color:${c.fgcolor};border:none;border-radius:${r}px;box-shadow:0 2px 8px rgba(220,38,38,0.35)">${label}</div>`;
      case "Icon Button":
        return `<div class="bf-prev-icon-wrap"><div class="bf-prev-btn" style="background:${c.bgcolor};color:${c.fgcolor};border:1px solid #e2e8f0;border-radius:${r}px;width:44px;height:44px;font-size:22px;display:flex;align-items:center;justify-content:center;padding:0;min-width:unset;box-shadow:0 1px 4px rgba(0,0,0,0.08)">+</div></div>`;
      case "FAB Button":
        return `<div class="bf-prev-icon-wrap"><div class="bf-prev-btn" style="background:${c.bgcolor};color:${c.fgcolor};border-radius:999px;width:56px;height:56px;font-size:24px;display:flex;align-items:center;justify-content:center;padding:0;min-width:unset;box-shadow:0 4px 16px rgba(234,88,12,0.4)">+</div></div>`;
      case "Link Button":
        return `<div class="bf-prev-btn" style="background:transparent;color:${c.fgcolor};border:none;padding:0;font-weight:500;text-decoration:underline;text-underline-offset:4px;text-decoration-color:${c.fgcolor};height:auto">${label}</div>`;
      case "Pill Button":
        return `<div class="bf-prev-btn" style="background:${c.bgcolor};color:${c.fgcolor};border-radius:999px;padding:0 24px;box-shadow:0 2px 8px rgba(234,88,12,0.3)">${label}</div>`;
      default: // Solid
        return `<div class="bf-prev-btn" style="background:${c.bgcolor};color:${c.fgcolor};border-radius:${r}px;box-shadow:0 2px 8px rgba(234,88,12,0.3)">${label}</div>`;
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

  function renderTools() {
    let lsData = "Copy an element in Bubble first.";
    try {
      const raw = localStorage.getItem("bubble_element_clipboard");
      if (raw) { try { lsData = JSON.stringify(JSON.parse(raw), null, 2); } catch (_) { lsData = raw; } }
      else lsData = "No bubble_element_clipboard found.";
    } catch (e) { lsData = "Error: " + e.message; }
    return `
      <div class="bf-section-head"><h1>Developer Tools</h1></div>
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
        const preview = root.querySelector(`[data-draggable-component-id="${compId}"] .bf-card-preview`);
        if (preview) preview.innerHTML = renderPreview(comp, cust);
        if (prop === "radius") { const lbl = root.querySelector(`#bf-radius-${compId}`)?.closest(".bf-field")?.querySelector(".bf-field-value"); if (lbl) lbl.textContent = `${cust.radius}px`; }
        if (prop === "bgcolor") { const hex = root.querySelector(`#bf-bg-${compId}`)?.closest(".bf-color-field")?.querySelector(".bf-color-field-hex"); if (hex) hex.textContent = cust.bgcolor.toUpperCase(); }
        if (prop === "fgcolor") { const hex = root.querySelector(`#bf-fg-${compId}`)?.closest(".bf-color-field")?.querySelector(".bf-color-field-hex"); if (hex) hex.textContent = cust.fgcolor.toUpperCase(); }
        if (isPinned(compId)) refreshQuickBar();
      }
    });

    root.addEventListener("dragstart", (e) => {
      const card = e.target.closest("[data-draggable-component-id]");
      if (card) handleCardDragStart(card, e.dataTransfer);
    });

    root.addEventListener("dragend", (e) => {
      const card = e.target.closest("[data-draggable-component-id]");
      if (card) handleCardDragEnd(card, e.clientX, e.clientY);
    });
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

      // Deep clone then apply template replacements via string substitution.
      // We ONLY replace {{PRIMARY_COLOR}}, {{TEXT_COLOR}}, {{LABEL}}, {{RADIUS}}
      // tokens — never blindly overwrite all bgcolor/font_color values.
      // This preserves intentional transparent backgrounds on Outline/Ghost buttons.
      let jsonStr = JSON.stringify(component.bubbleJson)
        .replace(/{{PRIMARY_COLOR}}/g, c.bgcolor)
        .replace(/{{TEXT_COLOR}}/g,    c.fgcolor)
        .replace(/{{LABEL}}/g,         c.label)
        .replace(/{{RADIUS}}/g,        String(c.radius))
        .replace(/{{SOFT_BG}}/g,       getSoftBgColor(c.bgcolor));

      // Apply border_roundness and label on every element (safe to always do)
      const payload = JSON.parse(jsonStr);
      if (payload.elements) {
        payload.elements.forEach((el) => {
          if (!el.properties) return;
          // Radius — always apply
          if (el.properties.border_roundness !== undefined)
            el.properties.border_roundness = c.radius;
          // Label — only override text if the element has a text field
          if (el.properties.text?.entries)
            el.properties.text.entries["0"] = c.label;
          // Icon support
          if (c.icon) {
            el.properties.icon = "material outlined " + c.icon;
            el.properties.button_type = c.label ? "label_icon" : "icon";
          } else if (el.properties.button_type) {
            // Remove icon if empty but it previously had one
            delete el.properties.icon;
            el.properties.button_type = "label";
          }
        });
      }

      const ts = Date.now();
      const messageId = `${ts}x${Math.floor(Math.random() * 1e16)}`;
      jsonStr = JSON.stringify(payload);

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


  /* ── Drag ───────────────────────────────────────── */
  function handleCardDragStart(card, dataTransfer) {
    const comp = components.find((c) => c.id === card.dataset.draggableComponentId);
    if (!comp || !dataTransfer) return;
    copyComponent(comp);
    dataTransfer.effectAllowed = "copy";
    dataTransfer.setData(DRAG_MIME, JSON.stringify(comp.bubbleJson));
    dataTransfer.setData("text/plain", comp.name);
    card.classList.add("is-dragging");
    showDragOverlay(comp.name);
  }

  function handleCardDragEnd(card, clientX, clientY) {
    card.classList.remove("is-dragging");
    hideDragOverlay();

    // Attempt to automatically trigger Bubble's paste handler at the drop position.
    // 1. Try directly in the content script since it has clipboardRead permissions.
    setTimeout(() => {
      try {
        const target = document.elementFromPoint(clientX, clientY) || document.body;
        if (typeof target.focus === "function") target.focus();
        document.execCommand("paste");
      } catch (e) {}
      
      // 2. Send a message to the MAIN world function injected by drag-probe.js as a fallback
      window.postMessage({ type: "BF_TRIGGER_PASTE", x: clientX, y: clientY }, "*");
      console.info("[BubbleForge] Auto-paste trigger message sent to main world", clientX, clientY);
    }, 80);
  }


  function handleDocumentDrop(event) {
    if (!event.dataTransfer) return;
    if (!Array.from(event.dataTransfer.types).includes(DRAG_MIME)) return;
    console.info("[BubbleForge] Drop intercepted");
  }

  function showDragOverlay(name) {
    const existing = document.getElementById("bf-drag-overlay");
    if (existing) existing.remove();
    const el = document.createElement("div");
    el.id = "bf-drag-overlay";
    el.style.cssText = `position:fixed;inset:0;z-index:2147483644;background:rgba(234,88,12,0.05);border:2px dashed rgba(234,88,12,0.35);pointer-events:none;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;font-family:'Inter',ui-sans-serif,sans-serif;`;
    el.innerHTML = `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px 32px;text-align:center;box-shadow:0 12px 32px rgba(0,0,0,0.12)"><div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:6px">"${name}" is ready!</div><div style="font-size:12px;color:#64748b">Drop anywhere on the canvas to auto-paste</div></div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = "1"; });
  }

  function hideDragOverlay() {
    const el = document.getElementById("bf-drag-overlay");
    if (!el) return;
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 200);
  }

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
