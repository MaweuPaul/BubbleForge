(function () {
  "use strict";

  const ROOT_ID = "bubbleforge-extension-v0-root";
  const REOPEN_ID = "bubbleforge-extension-v0-reopen";
  const DRAG_MIME = "application/x-bubbleforge-component";
  const components = window.BUBBLEFORGE_SAMPLE_COMPONENTS || [];

  let activeTab = "Components";
  let activeCategory = "All";
  let searchQuery = "";
  let logNextPaste = false;
  let lastClipboardPayload = readStoredClipboardPayload();

  if (document.getElementById(ROOT_ID)) {
    return;
  }

  injectPanel();
  document.addEventListener("paste", handlePasteCapture, true);
  document.addEventListener("drop", handleDocumentDrop, true);

  function injectPanel() {
    removeReopenButton();

    const root = document.createElement("aside");
    root.id = ROOT_ID;
    root.setAttribute("aria-label", "BubbleForge component library");
    root.innerHTML = renderPanel();
    document.documentElement.appendChild(root);

    bindEvents(root);
  }

  function renderPanel() {
    return `
      <div class="bf-shell">
        <header class="bf-topbar">
          <div class="bf-brand" aria-label="BubbleForge">
            <span class="bf-mark" aria-hidden="true"></span>
            <span>BubbleForge</span>
          </div>
          <button class="bf-icon-button" type="button" data-action="close" aria-label="Close BubbleForge">Close</button>
        </header>

        <nav class="bf-tabs" aria-label="BubbleForge sections">
          ${renderTab("Components")}
          ${renderTab("My Library")}
          ${renderTab("Tools")}
        </nav>

        <div class="bf-body">
          <aside class="bf-categories">
            <div class="bf-switch-row">
              <span>Advanced Plugins</span>
              <span class="bf-toggle" aria-hidden="true"></span>
            </div>
            <div class="bf-switch-row">
              <span>Link Styles</span>
              <span class="bf-pro">Pro</span>
            </div>
            <button class="bf-import-button" type="button" data-action="instructions">Import Styleset first</button>

            <label class="bf-search-label" for="bf-search">Search in Library...</label>
            <input id="bf-search" class="bf-search" type="search" value="${escapeHtml(searchQuery)}" placeholder="Search components" />

            <div class="bf-category-list" role="list">
              ${renderCategories()}
            </div>
          </aside>

          <main class="bf-main">
            ${renderActiveContent()}
          </main>
        </div>

        <div class="bf-toast" role="status" aria-live="polite"></div>
      </div>
    `;
  }

  function renderTab(tab) {
    const selected = activeTab === tab ? "true" : "false";
    const badge = tab === "Tools" ? `<span class="bf-tab-badge">New</span>` : "";
    return `<button class="bf-tab" type="button" data-tab="${tab}" aria-selected="${selected}">${tab}${badge}</button>`;
  }

  function renderCategories() {
    const categories = ["All", ...new Set(components.map((component) => component.category))];

    return categories
      .map((category) => {
        const active = category === activeCategory ? "true" : "false";
        return `<button class="bf-category" type="button" data-category="${escapeHtml(category)}" aria-selected="${active}">${escapeHtml(category)}</button>`;
      })
      .join("");
  }

  function renderActiveContent() {
    if (activeTab === "Tools") {
      return renderTools();
    }

    if (activeTab === "My Library") {
      return `
        <section class="bf-empty">
          <h2>My Library</h2>
          <p>Saved custom components will live here after we add persistence. For V0, use the sample components to test clipboard behavior.</p>
        </section>
      `;
    }

    const filtered = getFilteredComponents();
    const cards = filtered.length
      ? filtered.map(renderComponentCard).join("")
      : `<section class="bf-empty"><h2>No components found</h2><p>Try another search or category.</p></section>`;

    return `
      <div class="bf-main-head">
        <div>
          <h1>Components</h1>
          <p>Copy or drag placeholder component JSON into the Bubble editor to test what Bubble accepts.</p>
        </div>
        <span class="bf-count">${filtered.length} shown</span>
      </div>
      <section class="bf-grid" aria-label="Component previews">${cards}</section>
    `;
  }

  function renderTools() {
    return `
      <section class="bf-tools">
        <div class="bf-main-head">
          <div>
            <h1>Tools</h1>
            <p>Debug clipboard payloads while we research Bubble insertion.</p>
          </div>
        </div>

        <div class="bf-tool-card">
          <h2>Clipboard Listener</h2>
          <p>Enable this, copy something from Bubble, then paste on the page. The next paste event will be logged here and in DevTools.</p>
          <button class="bf-primary" type="button" data-action="log-next-paste">${logNextPaste ? "Waiting for Paste..." : "Log Next Paste"}</button>
          <pre class="bf-log" data-role="paste-log">No paste captured yet.</pre>
        </div>

        <div class="bf-tool-card">
          <h2>Clipboard Capture And Replay</h2>
          <p>Copy a real Bubble element first, then read the current clipboard. If we capture Bubble's private payload, replaying it is the insertion unlock.</p>
          <div class="bf-button-row">
            <button class="bf-primary" type="button" data-action="read-clipboard">Read Clipboard Now</button>
            <button class="bf-secondary" type="button" data-action="replay-clipboard" ${lastClipboardPayload ? "" : "disabled"}>Replay Last Clipboard</button>
          </div>
          <pre class="bf-log" data-role="clipboard-log">${escapeHtml(lastClipboardPayload ? formatPayloadSummary(lastClipboardPayload) : "No clipboard payload captured yet.")}</pre>
        </div>

        <div class="bf-tool-card">
          <h2>Current Selection Capture</h2>
          <p>This is the manual research workflow for finding Bubble's real clipboard format.</p>
          <button class="bf-secondary" type="button" data-action="instructions">Copy Current Selection Instructions</button>
          <div class="bf-instructions" data-role="instructions" hidden>
            <ol>
              <li>Build a simple button in Bubble.</li>
              <li>Select the button in the Bubble editor.</li>
              <li>Press Ctrl+C.</li>
              <li>Click Read Clipboard Now in BubbleForge.</li>
              <li>Inspect the clipboard payload in the panel and DevTools.</li>
              <li>Click Replay Last Clipboard, then paste into the Bubble editor.</li>
            </ol>
          </div>
        </div>
      </section>
    `;
  }

  function renderComponentCard(component) {
    return `
      <article class="bf-card" draggable="true" data-draggable-component-id="${escapeHtml(component.id)}">
        <div class="bf-card-top">
          <span class="bf-badge">${escapeHtml(component.access || "Free")}</span>
          <span class="bf-category-pill">${escapeHtml(component.category)}</span>
        </div>
        <div class="bf-preview" aria-hidden="true">
          ${renderPreview(component)}
        </div>
        <div class="bf-card-copy">
          <h2>${escapeHtml(component.name)}</h2>
          <p>${escapeHtml(component.description)}</p>
        </div>
        <div class="bf-drag-hint">Drag into Bubble editor</div>
        <button class="bf-copy-button" type="button" data-component-id="${escapeHtml(component.id)}">Copy Component</button>
      </article>
    `;
  }

  function renderPreview(component) {
    if (component.category === "Buttons") {
      return `<div class="bf-preview-button">${escapeHtml(component.name.replace(" Button", ""))}</div>`;
    }

    if (component.category === "Cards") {
      return `<div class="bf-preview-card"><span></span><strong>$29/mo</strong><em></em><em></em></div>`;
    }

    if (component.category === "Navigation") {
      return `<div class="bf-preview-nav"><span></span><span></span><span></span></div>`;
    }

    if (component.category === "Form components") {
      return `<div class="bf-preview-form"><span></span><span></span><button></button></div>`;
    }

    return `<div class="bf-preview-lines"><span></span><span></span><span></span></div>`;
  }

  function bindEvents(root) {
    root.querySelectorAll("[data-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        activeTab = button.dataset.tab;
        refresh();
      });
    });

    root.querySelectorAll("[data-category]").forEach((button) => {
      button.addEventListener("click", () => {
        activeCategory = button.dataset.category;
        activeTab = "Components";
        refresh();
      });
    });

    root.querySelectorAll("[data-component-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const component = components.find((item) => item.id === button.dataset.componentId);
        if (component) {
          copyComponent(component);
        }
      });
    });

    root.querySelectorAll("[data-draggable-component-id]").forEach((card) => {
      card.addEventListener("dragstart", handleDragStart);
      card.addEventListener("dragend", handleDragEnd);
    });

    const search = root.querySelector("#bf-search");
    if (search) {
      search.addEventListener("input", (event) => {
        searchQuery = event.target.value;
        updateComponentListOnly();
      });
    }

    root.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.action;

        if (action === "close") {
          closePanel();
        }

        if (action === "log-next-paste") {
          logNextPaste = true;
          showToast("Paste listener armed. Copy from Bubble, then paste once.");
          refresh();
        }

        if (action === "instructions") {
          showInstructions();
        }

        if (action === "read-clipboard") {
          readClipboardNow();
        }

        if (action === "replay-clipboard") {
          replayLastClipboard();
        }
      });
    });
  }

  function updateComponentListOnly() {
    const root = document.getElementById(ROOT_ID);
    if (!root) {
      return;
    }
    const main = root.querySelector(".bf-main");
    if (main) {
      main.innerHTML = renderActiveContent();
      bindEvents(root);
    }
  }

  function refresh() {
    const root = document.getElementById(ROOT_ID);
    if (!root) {
      return;
    }

    root.innerHTML = renderPanel();
    bindEvents(root);
  }

  async function copyComponent(component) {
    const json = JSON.stringify(component.bubbleJson, null, 2);

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await writeClipboardTypes({
          "application/json": json,
          "text/plain": json
        });
      } else {
        throw new Error("ClipboardItem is not available");
      }

      showToast("Component copied. Paste into Bubble editor.");
      console.info("[BubbleForge] Copied component with ClipboardItem", component.id, component.bubbleJson);
    } catch (error) {
      try {
        await navigator.clipboard.writeText(json);
        showToast("Component copied as text. Paste into Bubble editor.");
        console.info("[BubbleForge] Copied component with writeText fallback", component.id, component.bubbleJson);
      } catch (fallbackError) {
        console.error("[BubbleForge] Clipboard copy failed", error, fallbackError);
        showToast("Clipboard copy failed. Check browser permissions.");
      }
    }
  }

  function handleDragStart(event) {
    const card = event.currentTarget;
    const component = components.find((item) => item.id === card.dataset.draggableComponentId);
    if (!component || !event.dataTransfer) {
      return;
    }

    const json = JSON.stringify(component.bubbleJson, null, 2);
    const payload = JSON.stringify(
      {
        source: "bubbleforge-extension-v0",
        componentId: component.id,
        componentName: component.name,
        bubbleJson: component.bubbleJson
      },
      null,
      2
    );

    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(DRAG_MIME, payload);
    event.dataTransfer.setData("application/json", json);
    event.dataTransfer.setData("text/plain", json);
    writeClipboardTypes({
      "application/json": json,
      "text/plain": json
    })
      .then(() => {
        showToast(`Dragging ${component.name}. Clipboard also updated; if drop fails, press Ctrl+V.`);
      })
      .catch((error) => {
        console.warn("[BubbleForge] Drag clipboard write failed", error);
      });

    const dragImage = createDragImage(component);
    document.documentElement.appendChild(dragImage);
    event.dataTransfer.setDragImage(dragImage, 18, 18);
    window.setTimeout(() => dragImage.remove(), 0);

    card.classList.add("is-dragging");
    document.documentElement.classList.add("bubbleforge-dragging-component");
    showToast(`Dragging ${component.name}. Drop into Bubble editor.`);
    console.info("[BubbleForge] Drag started", {
      types: [DRAG_MIME, "application/json", "text/plain"],
      component
    });
  }

  function handleDragEnd(event) {
    event.currentTarget.classList.remove("is-dragging");
    document.documentElement.classList.remove("bubbleforge-dragging-component");
  }

  function handleDocumentDrop(event) {
    if (!event.dataTransfer) {
      return;
    }

    const types = Array.from(event.dataTransfer.types || []);
    if (!types.includes(DRAG_MIME) && !types.includes("application/json")) {
      return;
    }

    const payload = {
      types,
      bubbleforge: event.dataTransfer.getData(DRAG_MIME) || null,
      applicationJson: event.dataTransfer.getData("application/json") || null,
      textPlain: event.dataTransfer.getData("text/plain") || null,
      target: describeNode(event.target)
    };

    console.info("[BubbleForge] Drop payload", payload);
    showToast("Drop attempted. Check DevTools for BubbleForge payload.");
  }

  function createDragImage(component) {
    const dragImage = document.createElement("div");
    dragImage.className = "bf-drag-image";
    dragImage.textContent = component.name;
    return dragImage;
  }

  async function handlePasteCapture(event) {
    if (!logNextPaste) {
      return;
    }

    logNextPaste = false;
    const clipboardData = event.clipboardData;
    const types = clipboardData ? Array.from(clipboardData.types) : [];
    const json = clipboardData ? clipboardData.getData("application/json") : "";
    const text = clipboardData ? clipboardData.getData("text/plain") : "";

    const payload = {
      source: "paste-event",
      capturedAt: new Date().toISOString(),
      types,
      items: {
        "application/json": json || null,
        "text/plain": text || null
      }
    };

    saveClipboardPayload(payload);
    console.info("[BubbleForge] Paste payload", payload);
    refresh();

    const root = document.getElementById(ROOT_ID);
    const log = root ? root.querySelector("[data-role='paste-log']") : null;
    if (log) {
      log.textContent = JSON.stringify(payload, null, 2);
    }

    showToast("Paste payload logged in panel and DevTools.");
  }

  async function readClipboardNow() {
    try {
      if (!navigator.clipboard) {
        throw new Error("navigator.clipboard is not available on this page");
      }

      const payload = {
        source: "navigator.clipboard.read",
        capturedAt: new Date().toISOString(),
        types: [],
        items: {}
      };

      if (navigator.clipboard.read) {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          for (const type of item.types) {
            payload.types.push(type);
            const blob = await item.getType(type);
            payload.items[type] = await blob.text();
          }
        }
      } else {
        const text = await navigator.clipboard.readText();
        payload.types.push("text/plain");
        payload.items["text/plain"] = text;
      }

      payload.types = Array.from(new Set(payload.types));
      saveClipboardPayload(payload);
      console.info("[BubbleForge] Clipboard read payload", payload);
      activeTab = "Tools";
      refresh();
      showToast("Clipboard payload captured. Check panel and DevTools.");
    } catch (error) {
      console.error("[BubbleForge] Clipboard read failed", error);
      showToast("Clipboard read failed. Copy from Bubble, then click again.");
    }
  }

  async function replayLastClipboard() {
    if (!lastClipboardPayload || !lastClipboardPayload.items) {
      showToast("No captured clipboard payload to replay.");
      return;
    }

    try {
      await writeClipboardTypes(lastClipboardPayload.items);
      console.info("[BubbleForge] Replayed clipboard payload", lastClipboardPayload);
      showToast("Last clipboard payload replayed. Paste into Bubble editor now.");
    } catch (error) {
      console.error("[BubbleForge] Clipboard replay failed", error);
      showToast("Clipboard replay failed. Some MIME types may be blocked.");
    }
  }

  async function writeClipboardTypes(items) {
    if (!navigator.clipboard || !window.ClipboardItem) {
      throw new Error("ClipboardItem is not available");
    }

    const clipboardItem = {};
    Object.entries(items).forEach(([type, value]) => {
      if (value === null || value === undefined) {
        return;
      }
      clipboardItem[type] = new Blob([String(value)], { type });
    });

    await navigator.clipboard.write([new ClipboardItem(clipboardItem)]);
  }

  function saveClipboardPayload(payload) {
    lastClipboardPayload = payload;
    try {
      sessionStorage.setItem("bubbleforge:lastClipboardPayload", JSON.stringify(payload));
    } catch (error) {
      console.warn("[BubbleForge] Could not store clipboard payload", error);
    }
  }

  function readStoredClipboardPayload() {
    try {
      const raw = sessionStorage.getItem("bubbleforge:lastClipboardPayload");
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn("[BubbleForge] Could not read stored clipboard payload", error);
      return null;
    }
  }

  function formatPayloadSummary(payload) {
    const preview = {
      source: payload.source,
      capturedAt: payload.capturedAt,
      types: payload.types,
      items: {}
    };

    Object.entries(payload.items || {}).forEach(([type, value]) => {
      const text = String(value || "");
      preview.items[type] = {
        length: text.length,
        preview: text.slice(0, 1200)
      };
    });

    return JSON.stringify(preview, null, 2);
  }

  function showInstructions() {
    activeTab = "Tools";
    refresh();
    const root = document.getElementById(ROOT_ID);
    const instructions = root ? root.querySelector("[data-role='instructions']") : null;
    if (instructions) {
      instructions.hidden = false;
    }
    showToast("Selection capture instructions opened.");
  }

  function closePanel() {
    const root = document.getElementById(ROOT_ID);
    if (root) {
      root.remove();
    }
    showReopenButton();
  }

  function showReopenButton() {
    if (document.getElementById(REOPEN_ID)) {
      return;
    }

    const button = document.createElement("button");
    button.id = REOPEN_ID;
    button.type = "button";
    button.textContent = "BubbleForge";
    button.addEventListener("click", injectPanel);
    document.documentElement.appendChild(button);
  }

  function removeReopenButton() {
    const button = document.getElementById(REOPEN_ID);
    if (button) {
      button.remove();
    }
  }

  function showToast(message) {
    const root = document.getElementById(ROOT_ID);
    const toast = root ? root.querySelector(".bf-toast") : null;
    if (!toast) {
      return;
    }

    toast.textContent = message;
    toast.classList.add("is-visible");

    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 3200);
  }

  function getFilteredComponents() {
    const query = searchQuery.trim().toLowerCase();

    return components.filter((component) => {
      const matchesCategory = activeCategory === "All" || component.category === activeCategory;
      const matchesSearch =
        !query ||
        component.name.toLowerCase().includes(query) ||
        component.category.toLowerCase().includes(query) ||
        component.description.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function describeNode(node) {
    if (!node || !node.nodeType) {
      return "unknown";
    }

    if (node === document) {
      return "document";
    }

    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (!element) {
      return node.nodeName;
    }

    const id = element.id ? `#${element.id}` : "";
    const classes = element.className && typeof element.className === "string" ? `.${element.className.trim().replace(/\s+/g, ".")}` : "";
    return `${element.tagName.toLowerCase()}${id}${classes}`;
  }
})();
