(function () {
  "use strict";

  const ROOT_ID = "bubbleforge-extension-v0-root";
  const REOPEN_ID = "bubbleforge-extension-v0-reopen";
  const components = window.BUBBLEFORGE_SAMPLE_COMPONENTS || [];

  let activeTab = "Components";
  let activeCategory = "All";
  let searchQuery = "";
  let logNextPaste = false;

  if (document.getElementById(ROOT_ID)) {
    return;
  }

  injectPanel();
  document.addEventListener("paste", handlePasteCapture, true);

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
          <p>Copy placeholder Bubble component JSON, then test manual paste in the Bubble editor.</p>
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
          <h2>Current Selection Capture</h2>
          <p>This is the manual research workflow for finding Bubble's real clipboard format.</p>
          <button class="bf-secondary" type="button" data-action="instructions">Copy Current Selection Instructions</button>
          <div class="bf-instructions" data-role="instructions" hidden>
            <ol>
              <li>Build a simple button in Bubble.</li>
              <li>Select the button in the Bubble editor.</li>
              <li>Press Ctrl+C.</li>
              <li>Click Log Next Paste in BubbleForge.</li>
              <li>Paste into the Bubble page and inspect the clipboard payload in DevTools.</li>
            </ol>
          </div>
        </div>
      </section>
    `;
  }

  function renderComponentCard(component) {
    return `
      <article class="bf-card">
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
        await navigator.clipboard.write([
          new ClipboardItem({
            "application/json": new Blob([json], { type: "application/json" }),
            "text/plain": new Blob([json], { type: "text/plain" })
          })
        ]);
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
      types,
      applicationJson: json || null,
      textPlain: text || null
    };

    console.info("[BubbleForge] Paste payload", payload);
    refresh();

    const root = document.getElementById(ROOT_ID);
    const log = root ? root.querySelector("[data-role='paste-log']") : null;
    if (log) {
      log.textContent = JSON.stringify(payload, null, 2);
    }

    showToast("Paste payload logged in panel and DevTools.");
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
})();
