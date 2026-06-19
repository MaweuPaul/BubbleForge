(function() {
  if (window.__bfRecorderInstalled) return;
  window.__bfRecorderInstalled = true;

  console.log("[BubbleForge Recorder] Installed in MAIN world.");

  let isRecording = false;
  let recordingBuffer = [];
  let editorWriteLog = [];  // Always captures Bubble's own appeditor/write calls

  window.__bfStartRecording = function() {
    isRecording = true;
    recordingBuffer = [];
    console.log("[BubbleForge Recorder] Recording started.");
  };

  window.__bfStopRecording = function() {
    isRecording = false;
    console.log("[BubbleForge Recorder] Recording stopped. Events:", recordingBuffer.length);
  };

  window.__bfGetRecording = function() {
    return JSON.stringify(recordingBuffer, null, 2);
  };

  window.__bfClearRecording = function() {
    recordingBuffer = [];
  };

  // CSRF Scanner: scans the window object and DOM for a Bubble CSRF token
  window.__bfScanCsrf = function() {
    const found = {};

    // 1. Check meta tags
    document.querySelectorAll("meta").forEach(m => {
      const name = m.getAttribute("name") || m.getAttribute("property") || "";
      const content = m.getAttribute("content") || "";
      if (name.toLowerCase().includes("csrf") || name.toLowerCase().includes("token")) {
        found["meta:" + name] = content;
      }
    });

    // 2. Scan window globals for csrf-related keys
    const csrfKeys = ["csrf", "csrfToken", "csrf_token", "__csrf", "X-Bubble-Csrf",
                      "bubbleCsrf", "__bubble_csrf", "appToken", "editorToken"];
    csrfKeys.forEach(k => {
      try {
        if (window[k] !== undefined) found["window." + k] = String(window[k]).substring(0, 200);
      } catch(_) {}
    });

    // 3. Scan all window keys for any key matching csrf/token patterns
    try {
      Object.keys(window).filter(k => /csrf|csrftoken|_token|bubble.*token/i.test(k)).forEach(k => {
        try { found["window." + k] = String(window[k]).substring(0, 200); } catch(_) {}
      });
    } catch(_) {}

    // 4. Check cookies for CSRF-like names
    document.cookie.split(";").forEach(c => {
      const [name] = c.trim().split("=");
      if (/csrf|xsrf/i.test(name)) found["cookie:" + name.trim()] = c.trim().split("=").slice(1).join("=");
    });

    // 5. Try to find the CSRF token in Bubble's internal state objects
    const stateKeys = ["__bubble_state", "bubble_state", "__app_state", "appState",
                       "__editor_state", "editorState", "Bubble", "__bubbleRuntime"];
    stateKeys.forEach(k => {
      try {
        if (window[k]) {
          const s = JSON.stringify(window[k]).substring(0, 500);
          if (s.toLowerCase().includes("csrf") || s.toLowerCase().includes("token")) {
            found["state:" + k] = s;
          }
        }
      } catch(_) {}
    });

    console.log("[BubbleForge CSRF Scan]", found);
    window.postMessage({ type: "BF_CSRF_SCAN_RESULT", payload: found }, "*");
    return found;
  };

  function recordEvent(type, data) {
    if (!isRecording) return;
    recordingBuffer.push({ timestamp: Date.now(), type: type, data: data });
    window.postMessage({ type: "BF_RECORDER_EVENT", payload: { type, data } }, "*");
  }

  // 1. Storage Intercept
  const origSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    if (isRecording) {
      const storageType = this === window.localStorage ? "localStorage" : "sessionStorage";
      recordEvent("STORAGE_SET", {
        storage: storageType,
        key: key,
        valueLength: value ? value.length : 0,
        valuePreview: value && value.length > 5000 ? value.substring(0, 5000) + "..." : value
      });
    }
    return origSetItem.apply(this, arguments);
  };

  // 2. Fetch Intercept — now also captures ALL request headers
  const origFetch = window.fetch;
  window.fetch = async function(...args) {
    let reqUrl = typeof args[0] === "string" ? args[0] : (args[0] && args[0].url ? args[0].url : String(args[0]));
    let reqMethod = "GET";
    let reqBody = null;
    let reqHeaders = {};

    if (args[1]) {
      reqMethod = args[1].method || "GET";
      reqBody = args[1].body;
      try {
        const h = args[1].headers;
        if (h instanceof Headers) {
          h.forEach((v, k) => { reqHeaders[k] = v; });
        } else if (h && typeof h === "object") {
          Object.assign(reqHeaders, h);
        }
      } catch (_) {}
    }

    // Always record appeditor/write calls — Bubble's OWN writes reveal the real intent format
    const isEditorWrite = reqUrl && reqUrl.includes("appeditor/write");
    if (isEditorWrite) {
      editorWriteLog.push({
        timestamp: Date.now(),
        url: reqUrl,
        method: reqMethod,
        headers: reqHeaders,
        body: typeof reqBody === "string" ? reqBody : "[non-string body]"
      });
      console.log("[BubbleForge] Captured appeditor/write call. Total:", editorWriteLog.length);
    }

    if (isRecording) {
      let bodyPreview = typeof reqBody === "string" ? reqBody : "[Object/Blob]";
      if (bodyPreview && bodyPreview.length > 5000) bodyPreview = bodyPreview.substring(0, 5000) + "...";
      recordEvent("NETWORK_FETCH", {
        url: reqUrl,
        method: reqMethod,
        headers: reqHeaders,
        isEditorWrite,
        bodyPreview: bodyPreview
      });
    }

    return origFetch.apply(this, args);
  };

  // 3. XHR Intercept — also captures setRequestHeader calls
  const origXhrOpen = XMLHttpRequest.prototype.open;
  const origXhrSend = XMLHttpRequest.prototype.send;
  const origXhrSetHeader = XMLHttpRequest.prototype.setRequestHeader;

  XMLHttpRequest.prototype.open = function(method, url) {
    this._bfMethod = method;
    this._bfUrl = url;
    this._bfHeaders = {};
    return origXhrOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
    if (this._bfHeaders) this._bfHeaders[name] = value;
    return origXhrSetHeader.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function(body) {
    if (isRecording) {
      let bodyPreview = typeof body === "string" ? body : "[Object/Blob]";
      if (bodyPreview && bodyPreview.length > 5000) bodyPreview = bodyPreview.substring(0, 5000) + "...";
      recordEvent("NETWORK_XHR", {
        url: this._bfUrl,
        method: this._bfMethod,
        headers: this._bfHeaders || {},
        bodyPreview: bodyPreview
      });
    }
    return origXhrSend.apply(this, arguments);
  };

  // Listen for commands from Content Script
  window.addEventListener("message", (e) => {
    if (e.source !== window || !e.data) return;
    if (e.data.type === "BF_RECORDER_CMD") {
      if (e.data.cmd === "START") window.__bfStartRecording();
      if (e.data.cmd === "STOP") window.__bfStopRecording();
      if (e.data.cmd === "CLEAR") window.__bfClearRecording();
      if (e.data.cmd === "SCAN_CSRF") window.__bfScanCsrf();
      if (e.data.cmd === "GET_WRITES") {
        window.postMessage({ type: "BF_WRITES_DATA", payload: editorWriteLog }, "*");
      }
      if (e.data.cmd === "EXPORT") {
        window.postMessage({ type: "BF_RECORDER_EXPORT", payload: window.__bfGetRecording() }, "*");
      }
    }
    // BF_WRITE: make the appeditor/write call from MAIN world so Origin = bubble.io
    if (e.data.type === "BF_WRITE") {
      const { requestId, payload } = e.data;
      origFetch("https://bubble.io/appeditor/write", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      .then(async resp => {
        const text = await resp.text();
        let json = null;
        try { json = JSON.parse(text); } catch(_) { json = { raw: text }; }
        window.postMessage({ type: "BF_WRITE_RESULT", requestId, ok: resp.ok, status: resp.status, body: json }, "*");
      })
      .catch(err => {
        window.postMessage({ type: "BF_WRITE_RESULT", requestId, ok: false, status: 0, body: { error: err.message } }, "*");
      });
    }
  });

  // Auto-scan for CSRF token 2 seconds after load (passive)
  setTimeout(() => window.__bfScanCsrf(), 2000);

})();
