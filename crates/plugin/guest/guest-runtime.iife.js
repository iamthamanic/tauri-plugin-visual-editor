"use strict";
(() => {
  // ../../node_modules/@tauri-apps/api/external/tslib/tslib.es6.js
  function __classPrivateFieldGet(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
  }
  function __classPrivateFieldSet(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
  }

  // ../../node_modules/@tauri-apps/api/core.js
  var _Channel_onmessage;
  var _Channel_nextMessageIndex;
  var _Channel_pendingMessages;
  var _Channel_messageEndIndex;
  var _Resource_rid;
  var SERIALIZE_TO_IPC_FN = "__TAURI_TO_IPC_KEY__";
  function transformCallback(callback, once = false) {
    return window.__TAURI_INTERNALS__.transformCallback(callback, once);
  }
  var Channel = class {
    constructor(onmessage) {
      _Channel_onmessage.set(this, void 0);
      _Channel_nextMessageIndex.set(this, 0);
      _Channel_pendingMessages.set(this, []);
      _Channel_messageEndIndex.set(this, void 0);
      __classPrivateFieldSet(this, _Channel_onmessage, onmessage || (() => {
      }), "f");
      this.id = transformCallback((rawMessage) => {
        const index = rawMessage.index;
        if ("end" in rawMessage) {
          if (index == __classPrivateFieldGet(this, _Channel_nextMessageIndex, "f")) {
            this.cleanupCallback();
          } else {
            __classPrivateFieldSet(this, _Channel_messageEndIndex, index, "f");
          }
          return;
        }
        const message = rawMessage.message;
        if (index == __classPrivateFieldGet(this, _Channel_nextMessageIndex, "f")) {
          __classPrivateFieldGet(this, _Channel_onmessage, "f").call(this, message);
          __classPrivateFieldSet(this, _Channel_nextMessageIndex, __classPrivateFieldGet(this, _Channel_nextMessageIndex, "f") + 1, "f");
          while (__classPrivateFieldGet(this, _Channel_nextMessageIndex, "f") in __classPrivateFieldGet(this, _Channel_pendingMessages, "f")) {
            const message2 = __classPrivateFieldGet(this, _Channel_pendingMessages, "f")[__classPrivateFieldGet(this, _Channel_nextMessageIndex, "f")];
            __classPrivateFieldGet(this, _Channel_onmessage, "f").call(this, message2);
            delete __classPrivateFieldGet(this, _Channel_pendingMessages, "f")[__classPrivateFieldGet(this, _Channel_nextMessageIndex, "f")];
            __classPrivateFieldSet(this, _Channel_nextMessageIndex, __classPrivateFieldGet(this, _Channel_nextMessageIndex, "f") + 1, "f");
          }
          if (__classPrivateFieldGet(this, _Channel_nextMessageIndex, "f") === __classPrivateFieldGet(this, _Channel_messageEndIndex, "f")) {
            this.cleanupCallback();
          }
        } else {
          __classPrivateFieldGet(this, _Channel_pendingMessages, "f")[index] = message;
        }
      });
    }
    cleanupCallback() {
      window.__TAURI_INTERNALS__.unregisterCallback(this.id);
    }
    set onmessage(handler) {
      __classPrivateFieldSet(this, _Channel_onmessage, handler, "f");
    }
    get onmessage() {
      return __classPrivateFieldGet(this, _Channel_onmessage, "f");
    }
    [(_Channel_onmessage = /* @__PURE__ */ new WeakMap(), _Channel_nextMessageIndex = /* @__PURE__ */ new WeakMap(), _Channel_pendingMessages = /* @__PURE__ */ new WeakMap(), _Channel_messageEndIndex = /* @__PURE__ */ new WeakMap(), SERIALIZE_TO_IPC_FN)]() {
      return `__CHANNEL__:${this.id}`;
    }
    toJSON() {
      return this[SERIALIZE_TO_IPC_FN]();
    }
  };
  async function invoke(cmd, args = {}, options) {
    return window.__TAURI_INTERNALS__.invoke(cmd, args, options);
  }
  _Resource_rid = /* @__PURE__ */ new WeakMap();

  // src/hover.ts
  var INTERACTIVE_TAGS = /* @__PURE__ */ new Set(["button", "input", "a", "select", "textarea", "label"]);
  function hasInspectorId(el) {
    return el.hasAttribute("data-inspector-id");
  }
  function hasInspectorComponent(el) {
    return el.hasAttribute("data-inspector-component");
  }
  function isInteractive(el) {
    const tag = el.tagName.toLowerCase();
    if (INTERACTIVE_TAGS.has(tag)) {
      return true;
    }
    const role = el.getAttribute("role");
    return role !== null && role.length > 0;
  }
  function isSensibleSize(el) {
    const rect = el.getBoundingClientRect();
    return rect.width >= 8 && rect.height >= 8;
  }
  function scoreCandidate(el) {
    if (hasInspectorId(el)) {
      return 50;
    }
    if (hasInspectorComponent(el)) {
      return 40;
    }
    if (isInteractive(el)) {
      return 30;
    }
    if (isSensibleSize(el)) {
      return 20;
    }
    if (el.children.length === 0) {
      return 10;
    }
    return 0;
  }
  function resolveHoverTarget(raw) {
    let current = raw;
    let best = null;
    let bestScore = -1;
    while (current && current !== document.documentElement) {
      const score = scoreCandidate(current);
      if (score > bestScore) {
        best = current;
        bestScore = score;
      }
      if (score >= 50) {
        return current;
      }
      current = current.parentElement;
    }
    return best ?? raw;
  }

  // src/constants.ts
  var CURATED_CSS_PROPERTIES = [
    "display",
    "position",
    "top",
    "right",
    "bottom",
    "left",
    "width",
    "height",
    "margin",
    "padding",
    "flex",
    "flex-direction",
    "align-items",
    "justify-content",
    "gap",
    "z-index",
    "overflow",
    "pointer-events",
    "opacity",
    "transform"
  ];
  var MAX_CSS_PROPERTIES = 20;
  var CLOSED_SHADOW_HINT = " [closed shadow root \u2014 outer host only]";

  // src/dom-path.ts
  function segment(element) {
    const tag = element.tagName.toLowerCase();
    if (element.id) {
      return `${tag}#${element.id}`;
    }
    const parent = element.parentElement;
    if (!parent) {
      return tag;
    }
    const siblings = Array.from(parent.children).filter(
      (child) => child.tagName === element.tagName
    );
    if (siblings.length <= 1) {
      return tag;
    }
    const index = siblings.indexOf(element) + 1;
    return `${tag}:nth-child(${index})`;
  }
  function buildDomPath(element) {
    const parts = [];
    let closedHint = false;
    let current = element;
    while (current) {
      parts.unshift(segment(current));
      const parent = current.parentElement;
      if (parent) {
        current = parent;
        continue;
      }
      const root = current.getRootNode();
      if (root instanceof ShadowRoot) {
        if (root.mode === "closed") {
          closedHint = true;
        }
        current = root.host;
        continue;
      }
      break;
    }
    const path = parts.join(" > ");
    return closedHint ? `${path}${CLOSED_SHADOW_HINT}` : path;
  }

  // src/measure.ts
  function round(value) {
    return Math.round(value * 1e3) / 1e3;
  }
  function rectToBounds(rect) {
    return {
      x: round(rect.x),
      y: round(rect.y),
      width: round(rect.width),
      height: round(rect.height)
    };
  }
  function intersectBounds(a, b) {
    const x1 = Math.max(a.x, b.x);
    const y1 = Math.max(a.y, b.y);
    const x2 = Math.min(a.x + a.width, b.x + b.width);
    const y2 = Math.min(a.y + a.height, b.y + b.height);
    if (x2 <= x1 || y2 <= y1) {
      return null;
    }
    return { x: round(x1), y: round(y1), width: round(x2 - x1), height: round(y2 - y1) };
  }
  function resolveViewport(ctx) {
    const width = ctx.viewportWidth ?? globalThis.innerWidth ?? 0;
    const height = ctx.viewportHeight ?? globalThis.innerHeight ?? 0;
    return { x: 0, y: 0, width, height };
  }
  function computeVisibility(cssBounds, viewport) {
    if (cssBounds.width <= 0 || cssBounds.height <= 0) {
      return {
        visibility: "outside_viewport",
        visibleBounds: null,
        fullBounds: cssBounds
      };
    }
    const intersection = intersectBounds(cssBounds, viewport);
    if (!intersection) {
      return {
        visibility: "outside_viewport",
        visibleBounds: null,
        fullBounds: cssBounds
      };
    }
    const fullyVisible = intersection.x <= cssBounds.x + 1e-3 && intersection.y <= cssBounds.y + 1e-3 && intersection.width >= cssBounds.width - 1e-3 && intersection.height >= cssBounds.height - 1e-3;
    if (fullyVisible) {
      return { visibility: "visible", visibleBounds: null, fullBounds: null };
    }
    return {
      visibility: "partially_visible",
      visibleBounds: intersection,
      fullBounds: cssBounds
    };
  }
  function collectAttributes(element) {
    const pairs = [];
    for (const attr of Array.from(element.attributes)) {
      pairs.push([attr.name, attr.value]);
    }
    return pairs;
  }
  function collectComputedLayout(element) {
    const style = globalThis.getComputedStyle(element);
    const layout = [];
    for (const key of CURATED_CSS_PROPERTIES) {
      if (layout.length >= MAX_CSS_PROPERTIES) {
        break;
      }
      const value = style.getPropertyValue(key);
      if (value) {
        layout.push([key, value]);
      }
    }
    return layout;
  }
  function toPhysical(bounds, dpr) {
    return {
      x: round(bounds.x * dpr),
      y: round(bounds.y * dpr),
      width: round(bounds.width * dpr),
      height: round(bounds.height * dpr)
    };
  }
  function elementText(element) {
    const text = element.textContent?.trim() ?? "";
    if (!text) {
      return null;
    }
    return text.length > 200 ? `${text.slice(0, 197)}...` : text;
  }
  function measureElement(element, ctx) {
    const dpr = ctx.devicePixelRatio ?? globalThis.devicePixelRatio ?? 1;
    const rect = element.getBoundingClientRect();
    const cssBounds = rectToBounds(rect);
    const viewport = resolveViewport(ctx);
    const { visibility, visibleBounds, fullBounds } = computeVisibility(cssBounds, viewport);
    return {
      webview_id: ctx.webviewId,
      tag: element.tagName.toLowerCase(),
      text: elementText(element),
      attributes: collectAttributes(element),
      dom_path: buildDomPath(element),
      visibility,
      css_bounds: cssBounds,
      physical_bounds: toPhysical(cssBounds, dpr),
      visible_bounds: visibleBounds,
      full_bounds: fullBounds,
      computed_layout: collectComputedLayout(element)
    };
  }

  // src/overlay.ts
  var ROOT_ID = "visual-editor-overlay-root";
  function ensureRoot() {
    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement("div");
      root.id = ROOT_ID;
      root.setAttribute("data-visual-editor-overlay", "true");
      Object.assign(root.style, {
        position: "fixed",
        inset: "0",
        pointerEvents: "none",
        zIndex: "2147483646"
      });
      document.documentElement.appendChild(root);
    }
    return root;
  }
  function boxStyle(bounds, color) {
    return {
      position: "fixed",
      left: `${bounds.x}px`,
      top: `${bounds.y}px`,
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
      border: `1px solid ${color}`,
      boxSizing: "border-box",
      pointerEvents: "none"
    };
  }
  function labelFor(snapshot) {
    const component = snapshot.attributes.find(([k]) => k === "data-inspector-component")?.[1];
    return component ?? snapshot.tag;
  }
  var OverlayRenderer = class {
    hoverEl = null;
    hoverLabel = null;
    mount() {
      ensureRoot();
    }
    unmount() {
      document.getElementById(ROOT_ID)?.remove();
      this.hoverEl = null;
      this.hoverLabel = null;
    }
    setHover(snapshot) {
      const root = ensureRoot();
      if (!snapshot) {
        this.hoverEl?.remove();
        this.hoverLabel?.remove();
        this.hoverEl = null;
        this.hoverLabel = null;
        return;
      }
      if (!this.hoverEl) {
        this.hoverEl = document.createElement("div");
        this.hoverLabel = document.createElement("div");
        Object.assign(this.hoverLabel.style, {
          position: "fixed",
          font: "11px/1.2 system-ui, sans-serif",
          background: "rgba(59,130,246,0.9)",
          color: "#fff",
          padding: "2px 4px",
          borderRadius: "2px",
          pointerEvents: "none"
        });
        root.appendChild(this.hoverEl);
        root.appendChild(this.hoverLabel);
      }
      Object.assign(this.hoverEl.style, boxStyle(snapshot.css_bounds, "#3b82f6"));
      Object.assign(this.hoverLabel.style, {
        left: `${snapshot.css_bounds.x}px`,
        top: `${Math.max(0, snapshot.css_bounds.y - 16)}px`
      });
      this.hoverLabel.textContent = labelFor(snapshot);
    }
    renderSelections(selections) {
      const root = ensureRoot();
      root.querySelectorAll("[data-ve-selection]").forEach((el) => el.remove());
      selections.forEach((item, index) => {
        const box = document.createElement("div");
        box.setAttribute("data-ve-selection", item.id);
        const badge = document.createElement("div");
        badge.textContent = `#${index + 1}`;
        Object.assign(box.style, boxStyle(item.snapshot.css_bounds, "#22c55e"));
        Object.assign(badge.style, {
          position: "fixed",
          left: `${item.snapshot.css_bounds.x}px`,
          top: `${Math.max(0, item.snapshot.css_bounds.y - 16)}px`,
          font: "11px/1.2 system-ui, sans-serif",
          background: "rgba(34,197,94,0.95)",
          color: "#fff",
          padding: "2px 4px",
          borderRadius: "2px",
          pointerEvents: "none"
        });
        root.appendChild(box);
        root.appendChild(badge);
      });
    }
  };

  // src/selection.ts
  var SelectionEngine = class {
    overlay = new OverlayRenderer();
    options;
    active = false;
    passthrough = false;
    hoverTarget = null;
    selections = [];
    nextId = 1;
    constructor(options) {
      this.options = options;
    }
    activate() {
      if (this.active) {
        return;
      }
      this.active = true;
      this.overlay.mount();
      window.addEventListener("pointermove", this.onPointerMove, true);
      window.addEventListener("click", this.onClick, true);
      window.addEventListener("keydown", this.onKeyDown, true);
      window.addEventListener("keyup", this.onKeyUp, true);
    }
    deactivate() {
      if (!this.active) {
        return;
      }
      this.active = false;
      window.removeEventListener("pointermove", this.onPointerMove, true);
      window.removeEventListener("click", this.onClick, true);
      window.removeEventListener("keydown", this.onKeyDown, true);
      window.removeEventListener("keyup", this.onKeyUp, true);
      this.overlay.unmount();
      this.hoverTarget = null;
    }
    measure(el) {
      return measureElement(el, { webviewId: this.options.webviewId });
    }
    onPointerMove = (event) => {
      if (!this.active || this.passthrough) {
        return;
      }
      const raw = document.elementFromPoint(event.clientX, event.clientY);
      if (raw instanceof HTMLElement && raw.closest("#visual-editor-overlay-root")) {
        return;
      }
      const target = resolveHoverTarget(raw);
      this.hoverTarget = target;
      this.overlay.setHover(target ? this.measure(target) : null);
    };
    onClick = (event) => {
      if (!this.active) {
        return;
      }
      if (this.passthrough || event.altKey) {
        return;
      }
      const target = this.hoverTarget ?? resolveHoverTarget(event.target);
      if (!target) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const snapshot = this.measure(target);
      const action = event.shiftKey ? "toggle" : "replace";
      void this.options.reportSelection(snapshot, action).then(() => {
        if (action === "replace") {
          const id = `sel-${this.nextId++}`;
          this.selections = [{ id, label: id, snapshot }];
        } else {
          const existing = this.selections.findIndex(
            (s) => s.snapshot.dom_path === snapshot.dom_path
          );
          if (existing >= 0) {
            this.selections.splice(existing, 1);
          } else {
            const id = `sel-${this.nextId++}`;
            this.selections.push({ id, label: id, snapshot });
          }
        }
        this.overlay.renderSelections(this.selections);
      });
    };
    onKeyDown = (event) => {
      if (!this.active) {
        return;
      }
      if (event.code === "Space") {
        this.passthrough = true;
        this.overlay.setHover(null);
      }
      if (event.code === "Escape") {
        this.hoverTarget = null;
        this.overlay.setHover(null);
      }
    };
    onKeyUp = (event) => {
      if (event.code === "Space") {
        this.passthrough = false;
      }
    };
  };

  // src/guest-runtime.ts
  var engine = null;
  async function reportSelection(snapshot, action) {
    await invoke("plugin:visual-editor|report_selection", { snapshot, action });
  }
  var runtime = {
    version: "0.1.0",
    activate(webviewId) {
      if (!engine) {
        engine = new SelectionEngine({ webviewId, reportSelection });
      }
      engine.activate();
    },
    deactivate() {
      engine?.deactivate();
      engine = null;
    }
  };
  window.__VISUAL_EDITOR_GUEST__ = runtime;
  var guest_runtime_default = runtime;
})();
