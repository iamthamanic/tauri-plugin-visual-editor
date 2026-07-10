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

  // src/inspector-ui-guard.ts
  var INSPECTOR_UI_SELECTOR = [
    "#visual-editor-overlay-root",
    "#visual-editor-toolbar-root",
    "[data-visual-editor-toolbar]",
    "[data-visual-editor-ui]",
    "[data-visual-editor-picker-toggle]",
    "[data-visual-editor-screenshot-editor]",
    "[data-visual-editor-chip]",
    "[data-visual-editor-capture-chip]",
    "[data-visual-editor-composer-tail]",
    "[data-visual-editor-nav]"
  ].join(",");
  function isInspectorUiElement(el) {
    if (!(el instanceof HTMLElement)) {
      return false;
    }
    return Boolean(el.closest(INSPECTOR_UI_SELECTOR));
  }
  function eventHitsInspectorUi(event) {
    if (typeof event.composedPath === "function") {
      for (const node of event.composedPath()) {
        if (isInspectorUiElement(node)) {
          return true;
        }
      }
    }
    if (event.target instanceof Element && isInspectorUiElement(event.target)) {
      return true;
    }
    if ("clientX" in event && "clientY" in event && typeof event.clientX === "number" && typeof event.clientY === "number") {
      const hit = document.elementFromPoint(event.clientX, event.clientY);
      return isInspectorUiElement(hit);
    }
    return false;
  }

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
    if (isInspectorUiElement(raw)) {
      return null;
    }
    let current = raw;
    let best = null;
    let bestScore = -1;
    while (current && current !== document.documentElement) {
      if (isInspectorUiElement(current)) {
        current = current.parentElement;
        continue;
      }
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

  // src/dom-resolve.ts
  function findElementBySelector(selector) {
    if (!selector.trim()) return null;
    try {
      return document.querySelector(selector);
    } catch {
      return null;
    }
  }
  function findElementForSnapshot(snapshot, selector) {
    const bySelector = findElementBySelector(selector);
    if (bySelector) return bySelector;
    const id = snapshot.attributes.find(([key]) => key === "id")?.[1];
    if (id) {
      const byId = document.getElementById(id);
      if (byId) return byId;
    }
    const inspectorId = snapshot.attributes.find(([key]) => key === "data-inspector-id")?.[1];
    if (inspectorId) {
      const byInspector = document.querySelector(`[data-inspector-id="${CSS.escape(inspectorId)}"]`);
      if (byInspector) return byInspector;
    }
    return null;
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

  // src/navigation-watch.ts
  function watchNavigation(onNavigate) {
    let lastHref = location.href;
    const fire = () => {
      const href = location.href;
      if (href === lastHref) return;
      lastHref = href;
      onNavigate();
    };
    const onPopState = () => fire();
    const onHashChange = () => fire();
    window.addEventListener("popstate", onPopState);
    window.addEventListener("hashchange", onHashChange);
    const historyRef = window.history;
    const origPush = historyRef.pushState.bind(historyRef);
    const origReplace = historyRef.replaceState.bind(historyRef);
    historyRef.pushState = (...args) => {
      origPush(...args);
      queueMicrotask(fire);
    };
    historyRef.replaceState = (...args) => {
      origReplace(...args);
      queueMicrotask(fire);
    };
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("hashchange", onHashChange);
      historyRef.pushState = origPush;
      historyRef.replaceState = origReplace;
    };
  }

  // src/capture-ui.ts
  var HIDE_ATTR = "data-visual-editor-capture-hide";
  function markCaptureHideRoot(el) {
    el.setAttribute(HIDE_ATTR, "true");
  }
  function suspendCaptureUi() {
    for (const el of document.querySelectorAll(`[${HIDE_ATTR}]`)) {
      if (!(el instanceof HTMLElement)) continue;
      if (el.dataset.veCaptureHidden === "true") continue;
      el.dataset.veCaptureHidden = "true";
      el.dataset.veCapturePrevDisplay = el.style.display;
      el.style.display = "none";
    }
  }
  function resumeCaptureUi() {
    for (const el of document.querySelectorAll(`[${HIDE_ATTR}]`)) {
      if (!(el instanceof HTMLElement)) continue;
      if (el.dataset.veCaptureHidden !== "true") continue;
      el.style.display = el.dataset.veCapturePrevDisplay ?? "";
      delete el.dataset.veCaptureHidden;
      delete el.dataset.veCapturePrevDisplay;
    }
  }

  // src/overlay.ts
  var ROOT_ID = "visual-editor-overlay-root";
  function ensureRoot() {
    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement("div");
      root.id = ROOT_ID;
      root.setAttribute("data-visual-editor-overlay", "true");
      markCaptureHideRoot(root);
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
    focusEl = null;
    focusLabel = null;
    overlayColor = "#3b82f6";
    selectionColor = "#22c55e";
    focusColor = "#f59e0b";
    configure(options) {
      if (options.overlayColor) {
        this.overlayColor = options.overlayColor;
      }
    }
    mount() {
      ensureRoot();
    }
    unmount() {
      document.getElementById(ROOT_ID)?.remove();
      this.hoverEl = null;
      this.hoverLabel = null;
      this.focusEl = null;
      this.focusLabel = null;
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
      Object.assign(this.hoverEl.style, boxStyle(snapshot.css_bounds, this.overlayColor));
      Object.assign(this.hoverLabel.style, {
        left: `${snapshot.css_bounds.x}px`,
        top: `${Math.max(0, snapshot.css_bounds.y - 16)}px`
      });
      this.hoverLabel.textContent = labelFor(snapshot);
    }
    setFocus(snapshot) {
      const root = ensureRoot();
      if (!snapshot) {
        this.focusEl?.remove();
        this.focusLabel?.remove();
        this.focusEl = null;
        this.focusLabel = null;
        return;
      }
      if (!this.focusEl) {
        this.focusEl = document.createElement("div");
        this.focusLabel = document.createElement("div");
        Object.assign(this.focusLabel.style, {
          position: "fixed",
          font: "11px/1.2 system-ui, sans-serif",
          background: "rgba(245,158,11,0.95)",
          color: "#111",
          padding: "2px 6px",
          borderRadius: "2px",
          pointerEvents: "none",
          fontWeight: "600"
        });
        root.appendChild(this.focusEl);
        root.appendChild(this.focusLabel);
      }
      Object.assign(this.focusEl.style, {
        ...boxStyle(snapshot.css_bounds, this.focusColor),
        borderWidth: "2px",
        boxShadow: "0 0 0 2px rgba(245,158,11,0.35)"
      });
      Object.assign(this.focusLabel.style, {
        left: `${snapshot.css_bounds.x}px`,
        top: `${Math.max(0, snapshot.css_bounds.y - 18)}px`
      });
      this.focusLabel.textContent = labelFor(snapshot);
    }
    renderSelections(selections) {
      const root = ensureRoot();
      root.querySelectorAll("[data-ve-selection]").forEach((el) => el.remove());
      selections.forEach((item, index) => {
        const box = document.createElement("div");
        box.setAttribute("data-ve-selection", item.id);
        const badge = document.createElement("div");
        badge.textContent = `#${index + 1}`;
        Object.assign(box.style, boxStyle(item.snapshot.css_bounds, this.selectionColor));
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
    unwatchNavigation = null;
    constructor(options) {
      this.options = options;
      this.unwatchNavigation = watchNavigation(() => this.handleNavigation());
    }
    /** Remove all overlay boxes (selection, hover, chip focus). */
    clearVisuals() {
      this.selections = [];
      this.hoverTarget = null;
      this.overlay.setHover(null);
      this.overlay.setFocus(null);
      this.overlay.renderSelections([]);
    }
    handleNavigation() {
      this.clearVisuals();
      this.options.onNavigation?.(this.options.webviewId);
    }
    destroy() {
      this.unwatchNavigation?.();
      this.unwatchNavigation = null;
      this.deactivate();
      this.overlay.unmount();
    }
    configure(options) {
      this.overlay.configure(options);
    }
    activate() {
      if (this.active) {
        return;
      }
      this.active = true;
      this.overlay.mount();
      window.addEventListener("pointerdown", this.onPointerDown, true);
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
      window.removeEventListener("pointerdown", this.onPointerDown, true);
      window.removeEventListener("pointermove", this.onPointerMove, true);
      window.removeEventListener("click", this.onClick, true);
      window.removeEventListener("keydown", this.onKeyDown, true);
      window.removeEventListener("keyup", this.onKeyUp, true);
      this.clearVisuals();
    }
    highlightElement(element) {
      const hubSnapshot = element.snapshot;
      const live = findElementForSnapshot(hubSnapshot, element.selector);
      const snapshot = live ? this.measure(live) : hubSnapshot;
      this.overlay.mount();
      this.overlay.setFocus(snapshot);
      live?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    measure(el) {
      return measureElement(el, { webviewId: this.options.webviewId });
    }
    onPointerDown = (event) => {
      if (!this.active) {
        return;
      }
      if (eventHitsInspectorUi(event)) {
        this.hoverTarget = null;
        this.overlay.setHover(null);
      }
    };
    onPointerMove = (event) => {
      if (!this.active || this.passthrough) {
        return;
      }
      const raw = document.elementFromPoint(event.clientX, event.clientY);
      if (isInspectorUiElement(raw)) {
        this.hoverTarget = null;
        this.overlay.setHover(null);
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
      if (eventHitsInspectorUi(event)) {
        this.hoverTarget = null;
        return;
      }
      if (this.passthrough || event.altKey) {
        return;
      }
      const hit = document.elementFromPoint(event.clientX, event.clientY);
      const target = resolveHoverTarget(hit);
      if (!target) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const snapshot = this.measure(target);
      const action = event.shiftKey ? "toggle" : "add";
      void this.options.reportSelection(snapshot, action).then(() => {
        const existing = this.selections.findIndex(
          (s) => s.snapshot.dom_path === snapshot.dom_path
        );
        if (action === "add") {
          if (existing < 0) {
            const id = `sel-${this.nextId++}`;
            this.selections.push({ id, label: id, snapshot });
          }
        } else if (existing >= 0) {
          this.selections.splice(existing, 1);
        } else {
          const id = `sel-${this.nextId++}`;
          this.selections.push({ id, label: id, snapshot });
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

  // ../../node_modules/@tauri-apps/api/event.js
  var TauriEvent;
  (function(TauriEvent2) {
    TauriEvent2["WINDOW_RESIZED"] = "tauri://resize";
    TauriEvent2["WINDOW_MOVED"] = "tauri://move";
    TauriEvent2["WINDOW_CLOSE_REQUESTED"] = "tauri://close-requested";
    TauriEvent2["WINDOW_DESTROYED"] = "tauri://destroyed";
    TauriEvent2["WINDOW_FOCUS"] = "tauri://focus";
    TauriEvent2["WINDOW_BLUR"] = "tauri://blur";
    TauriEvent2["WINDOW_SCALE_FACTOR_CHANGED"] = "tauri://scale-change";
    TauriEvent2["WINDOW_THEME_CHANGED"] = "tauri://theme-changed";
    TauriEvent2["WINDOW_CREATED"] = "tauri://window-created";
    TauriEvent2["WINDOW_SUSPENDED"] = "tauri://suspended";
    TauriEvent2["WINDOW_RESUMED"] = "tauri://resumed";
    TauriEvent2["WEBVIEW_CREATED"] = "tauri://webview-created";
    TauriEvent2["DRAG_ENTER"] = "tauri://drag-enter";
    TauriEvent2["DRAG_OVER"] = "tauri://drag-over";
    TauriEvent2["DRAG_DROP"] = "tauri://drag-drop";
    TauriEvent2["DRAG_LEAVE"] = "tauri://drag-leave";
  })(TauriEvent || (TauriEvent = {}));
  async function _unlisten(event, eventId) {
    window.__TAURI_EVENT_PLUGIN_INTERNALS__.unregisterListener(event, eventId);
    await invoke("plugin:event|unlisten", {
      event,
      eventId
    });
  }
  async function listen(event, handler, options) {
    var _a;
    const target = typeof (options === null || options === void 0 ? void 0 : options.target) === "string" ? { kind: "AnyLabel", label: options.target } : (_a = options === null || options === void 0 ? void 0 : options.target) !== null && _a !== void 0 ? _a : { kind: "Any" };
    return invoke("plugin:event|listen", {
      event,
      target,
      handler: transformCallback(handler)
    }).then((eventId) => {
      return async () => _unlisten(event, eventId);
    });
  }

  // src/toolbar-icons.ts
  var ICON_RELOAD = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M21 3v5h-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
  var ICON_SEARCH = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="2"/>
  <path d="M16 16l4.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`;
  var ICON_POINTER = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M4 4l7 16 2.5-6.5L20 11 4 4z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
</svg>`;
  var ICON_INSPECT_PICKER = `<span style="display:inline-flex;align-items:center;gap:1px" aria-hidden="true">${ICON_SEARCH}${ICON_POINTER}</span>`;
  var ICON_SCREENSHOT = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
</svg>`;
  var ICON_CONTEXT = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M7 8h10M7 12h10M7 16h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
</svg>`;
  var ICON_CHIP = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
  <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;
  var ICON_CHEVRON_UP = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M6 14l6-6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
  var ICON_CHEVRON_DOWN = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M6 10l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
  var ICON_GRIP = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
  <circle cx="9" cy="8" r="1.2"/><circle cx="15" cy="8" r="1.2"/>
  <circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/>
  <circle cx="9" cy="16" r="1.2"/><circle cx="15" cy="16" r="1.2"/>
</svg>`;
  var ICON_DEVTOOLS = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
  <path d="M7 9l3 3-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 15h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`;
  var ICON_CAPTURE_CHIP = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
  <circle cx="12" cy="12" r="2.5" stroke="currentColor" stroke-width="1.5"/>
</svg>`;
  var ICON_CHECK = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M5 12l5 5L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
  var ICON_DRAW = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M12 20h9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
</svg>`;
  var ICON_TEXT = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M4 7V5h16v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 5v14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <path d="M8 19h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`;
  var ICON_SCISSORS = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <circle cx="6" cy="6" r="3" stroke="currentColor" stroke-width="2"/>
  <circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="2"/>
  <path d="M8.5 8.5L20 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <path d="M8.5 15.5L20 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`;
  var ICON_SAVE = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
  <path d="M17 21v-8H7v8" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
  <path d="M7 3v5h8" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
</svg>`;

  // src/capture-image.ts
  var PLUGIN = "plugin:visual-editor";
  async function loadCaptureBlobUrl(captureId) {
    const bytes = await invoke(`${PLUGIN}|read_capture_image`, { captureId });
    const blob = new Blob([Uint8Array.from(bytes)], { type: "image/png" });
    return URL.createObjectURL(blob);
  }

  // src/composer-flow.ts
  var COMPOSER_TAIL_ATTR = "data-visual-editor-composer-tail";
  var ZWSP = "\u200B";
  var CHIP_SELECTOR = "[data-visual-editor-chip], [data-visual-editor-capture-chip]";
  function stripComposerZwsp(text) {
    return text.replace(/\u200B/g, "");
  }
  function isComposerChipNode(node) {
    return node instanceof HTMLElement && (node.hasAttribute("data-visual-editor-chip") || node.hasAttribute("data-visual-editor-capture-chip"));
  }
  function isLegacyTailNode(node) {
    return node instanceof HTMLElement && node.hasAttribute(COMPOSER_TAIL_ATTR);
  }
  function isGapTextNode(node) {
    return node.nodeType === Node.TEXT_NODE && stripComposerZwsp(node.textContent ?? "").length === 0;
  }
  function hasVisibleText(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return stripComposerZwsp(node.textContent ?? "").length > 0;
    }
    if (node instanceof HTMLElement && !isComposerChipNode(node) && !isLegacyTailNode(node)) {
      return stripComposerZwsp(node.textContent ?? "").length > 0;
    }
    return false;
  }
  function removeLegacyTails(composer) {
    composer.querySelectorAll(`[${COMPOSER_TAIL_ATTR}]`).forEach((node) => node.remove());
  }
  function removeGapTextNodes(composer) {
    for (const node of [...composer.childNodes]) {
      if (isGapTextNode(node)) node.remove();
    }
  }
  function stripZwspFromTextNodes(composer) {
    for (const node of [...composer.childNodes]) {
      if (node.nodeType === Node.TEXT_NODE) {
        const cleaned = stripComposerZwsp(node.textContent ?? "");
        if (!cleaned) {
          node.remove();
        } else if (cleaned !== node.textContent) {
          node.textContent = cleaned;
        }
        continue;
      }
      if (node instanceof HTMLElement && !isComposerChipNode(node) && !isLegacyTailNode(node)) {
        stripZwspFromTextNodes(node);
      }
    }
  }
  function mergeAdjacentTextNodes(composer) {
    let i = 0;
    while (i < composer.childNodes.length) {
      const node = composer.childNodes[i];
      if (node.nodeType !== Node.TEXT_NODE) {
        i++;
        continue;
      }
      let text = stripComposerZwsp(node.textContent ?? "");
      if (!text) {
        node.remove();
        continue;
      }
      let j = i + 1;
      while (j < composer.childNodes.length) {
        const next = composer.childNodes[j];
        if (next.nodeType === Node.TEXT_NODE) {
          text += stripComposerZwsp(next.textContent ?? "");
          next.remove();
          continue;
        }
        break;
      }
      node.textContent = text;
      i++;
    }
  }
  function insertGapBefore(composer, ref) {
    const prev = ref?.previousSibling;
    if (prev && isGapTextNode(prev)) return;
    composer.insertBefore(document.createTextNode(ZWSP), ref);
  }
  function removeOrphanGapNodes(composer) {
    for (const node of [...composer.childNodes]) {
      if (!isGapTextNode(node)) continue;
      const prev = node.previousSibling;
      const next = node.nextSibling;
      const besideChip = prev instanceof HTMLElement && isComposerChipNode(prev) || next instanceof HTMLElement && isComposerChipNode(next);
      if (!besideChip) node.remove();
    }
    let last = composer.lastChild;
    while (last && isGapTextNode(last)) {
      const prev = last.previousSibling;
      if (prev instanceof HTMLElement && isComposerChipNode(prev)) break;
      const orphan = last;
      last = prev;
      orphan.remove();
    }
  }
  function ensureBoundaryGaps(composer) {
    const children = [...composer.childNodes].filter((node) => !isLegacyTailNode(node));
    for (let i = children.length - 1; i > 0; i--) {
      const prev = children[i - 1];
      const curr = children[i];
      if (isGapTextNode(prev) || isGapTextNode(curr)) continue;
      if (!isComposerChipNode(prev) && !isComposerChipNode(curr)) continue;
      composer.insertBefore(document.createTextNode(ZWSP), curr);
    }
    const first = composer.firstChild;
    if (first && isComposerChipNode(first)) {
      insertGapBefore(composer, first);
    }
    const last = composer.lastChild;
    if (last && isComposerChipNode(last)) {
      const next = last.nextSibling;
      if (!next || !isGapTextNode(next)) {
        composer.appendChild(document.createTextNode(ZWSP));
      }
    }
    removeOrphanGapNodes(composer);
  }
  function normalizeComposerInlines(composer) {
    removeLegacyTails(composer);
    removeGapTextNodes(composer);
    stripZwspFromTextNodes(composer);
    mergeAdjacentTextNodes(composer);
    ensureBoundaryGaps(composer);
  }
  function ensureComposerTail(composer) {
    removeLegacyTails(composer);
    const hasChips = composer.querySelector(CHIP_SELECTOR);
    if (hasChips) {
      normalizeComposerInlines(composer);
      return;
    }
    removeOrphanGapNodes(composer);
    stripZwspFromTextNodes(composer);
    mergeAdjacentTextNodes(composer);
  }
  function saveComposerCaret(composer) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const anchor = sel.anchorNode;
    if (!anchor || !composer.contains(anchor)) return null;
    return sel.getRangeAt(0).cloneRange();
  }
  function restoreComposerCaret(range) {
    if (!range) return;
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
  }
  function placeCaretInTextNode(textNode, offset) {
    const range = document.createRange();
    range.setStart(textNode, Math.max(0, Math.min(offset, textNode.length)));
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }
  function ensureZwspGapBefore(chip) {
    const prev = chip.previousSibling;
    if (prev && isGapTextNode(prev)) return prev;
    const gap = document.createTextNode(ZWSP);
    chip.parentElement?.insertBefore(gap, chip);
    return gap;
  }
  function ensureZwspGapAfter(chip) {
    const next = chip.nextSibling;
    if (next && isGapTextNode(next)) return next;
    const gap = document.createTextNode(ZWSP);
    chip.parentElement?.insertBefore(gap, chip.nextSibling);
    return gap;
  }
  function placeCaretBesideChip(chip, after) {
    const gap = after ? ensureZwspGapAfter(chip) : ensureZwspGapBefore(chip);
    placeCaretInTextNode(gap, 0);
  }
  function focusComposerAtChip(composer, clientX, clientY) {
    normalizeComposerInlines(composer);
    composer.focus();
    const hit = document.elementFromPoint(clientX, clientY);
    const chip = hit?.closest(CHIP_SELECTOR);
    if (!(chip instanceof HTMLElement) || !composer.contains(chip)) return;
    const rect = chip.getBoundingClientRect();
    placeCaretBesideChip(chip, clientX > rect.left + rect.width / 2);
  }
  function extractComposerText(composer) {
    const parts = [];
    for (const node of composer.childNodes) {
      if (isLegacyTailNode(node) || isComposerChipNode(node) || isGapTextNode(node)) continue;
      if (node.nodeType === Node.TEXT_NODE) {
        parts.push(stripComposerZwsp(node.textContent ?? ""));
        continue;
      }
      if (node instanceof HTMLElement) {
        if (node.tagName === "BR") {
          parts.push("\n");
          continue;
        }
        if (node.tagName === "DIV" || node.tagName === "P") {
          if (parts.length > 0) parts.push("\n");
          parts.push(stripComposerZwsp(node.textContent ?? ""));
          continue;
        }
        if (hasVisibleText(node)) {
          parts.push(stripComposerZwsp(node.textContent ?? ""));
        }
      }
    }
    return parts.join("");
  }
  function readElementChipId(chip) {
    return chip.getAttribute("data-chip-id");
  }
  function readCaptureChipId(chip) {
    return chip.getAttribute("data-visual-editor-capture-chip");
  }
  function extractComposerBlocks(composer) {
    const blocks = [];
    const pushText = (raw) => {
      const text = stripComposerZwsp(raw);
      if (!text) return;
      const last = blocks[blocks.length - 1];
      if (last?.type === "text") {
        last.content += text;
        return;
      }
      blocks.push({ type: "text", content: text });
    };
    const walk = (parent) => {
      for (const node of parent.childNodes) {
        if (isLegacyTailNode(node) || isGapTextNode(node)) continue;
        if (node instanceof HTMLElement) {
          if (node.hasAttribute("data-visual-editor-chip")) {
            const id = readElementChipId(node);
            if (id) blocks.push({ type: "element", id });
            continue;
          }
          if (node.hasAttribute("data-visual-editor-capture-chip")) {
            const id = readCaptureChipId(node);
            if (id) blocks.push({ type: "capture", id });
            continue;
          }
          if (node.tagName === "BR") {
            pushText("\n");
            continue;
          }
          if (node.tagName === "DIV" || node.tagName === "P") {
            if (blocks.length > 0) pushText("\n");
            walk(node);
            continue;
          }
          pushText(node.textContent ?? "");
          continue;
        }
        if (node.nodeType === Node.TEXT_NODE) {
          pushText(node.textContent ?? "");
        }
      }
    };
    walk(composer);
    return blocks;
  }
  function setupComposerChip(chip, composer, options = {}) {
    chip.setAttribute("contenteditable", "false");
    chip.draggable = true;
    chip.style.cursor = "grab";
    chip.addEventListener("dragstart", (event) => {
      const id = chip.getAttribute("data-chip-id") ?? chip.getAttribute("data-visual-editor-capture-chip") ?? "";
      event.dataTransfer?.setData("application/x-visual-editor-chip", id);
      event.dataTransfer?.setData("text/plain", id);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      chip.style.opacity = "0.55";
    });
    chip.addEventListener("dragend", () => {
      chip.style.opacity = "";
      normalizeComposerInlines(composer);
    });
    chip.addEventListener("mousedown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      normalizeComposerInlines(composer);
      composer.focus();
      const rect = chip.getBoundingClientRect();
      placeCaretBesideChip(chip, event.clientX > rect.left + rect.width / 2);
    });
    chip.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      options.onChipClick?.();
    });
  }
  function findChipById(composer, id) {
    const el = composer.querySelector(`[data-chip-id="${id}"]`);
    if (el instanceof HTMLElement) return el;
    const cap = composer.querySelector(`[data-visual-editor-capture-chip="${id}"]`);
    return cap instanceof HTMLElement ? cap : null;
  }
  function insertChipAtPoint(composer, chip, clientX, clientY) {
    const doc = composer.ownerDocument;
    const range = doc.caretRangeFromPoint?.(clientX, clientY);
    if (!range || !composer.contains(range.startContainer)) {
      composer.appendChild(chip);
      return;
    }
    insertChipAtRange(composer, chip, range);
  }
  function insertChipAtRange(composer, chip, range) {
    const { startContainer, startOffset } = range;
    if (startContainer.nodeType === Node.TEXT_NODE) {
      const textNode = startContainer;
      if (isGapTextNode(textNode)) {
        composer.insertBefore(chip, textNode);
        return;
      }
      const text = textNode.textContent ?? "";
      const before = stripComposerZwsp(text.slice(0, startOffset));
      const after = stripComposerZwsp(text.slice(startOffset));
      textNode.textContent = before;
      const afterNode = document.createTextNode(after);
      const parent = textNode.parentNode;
      if (!parent) return;
      parent.insertBefore(chip, textNode.nextSibling);
      if (after) {
        parent.insertBefore(afterNode, chip.nextSibling);
      }
      return;
    }
    if (startContainer === composer) {
      const ref = composer.childNodes[startOffset] ?? null;
      composer.insertBefore(chip, ref);
      return;
    }
    composer.appendChild(chip);
  }
  function setupComposerDropTarget(composer) {
    composer.addEventListener("dragover", (event) => {
      if (!event.dataTransfer?.types.includes("application/x-visual-editor-chip")) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    });
    composer.addEventListener("drop", (event) => {
      const id = event.dataTransfer?.getData("application/x-visual-editor-chip");
      if (!id) return;
      event.preventDefault();
      const chip = findChipById(composer, id);
      if (!chip) return;
      chip.remove();
      insertChipAtPoint(composer, chip, event.clientX, event.clientY);
      normalizeComposerInlines(composer);
      composer.focus();
      composer.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertFromDrop" }));
    });
  }
  function sanitizeComposerWhileTyping(composer) {
    removeLegacyTails(composer);
    const sel = window.getSelection();
    const anchorNode = sel?.anchorNode ?? null;
    const anchorOffset = sel?.anchorOffset ?? 0;
    const hadFocus = document.activeElement === composer;
    for (const node of [...composer.childNodes]) {
      if (node.nodeType !== Node.TEXT_NODE) continue;
      const text = node.textContent ?? "";
      const cleaned = stripComposerZwsp(text);
      const isActiveText = node === anchorNode || node.contains(anchorNode);
      if (!cleaned) {
        const prev = node.previousSibling;
        const next = node.nextSibling;
        const besideChip = prev instanceof HTMLElement && isComposerChipNode(prev) || next instanceof HTMLElement && isComposerChipNode(next);
        if (!besideChip) {
          if (isActiveText && sel) {
            const target = next ?? prev;
            if (target) {
              const range = document.createRange();
              if (target instanceof Text) {
                range.setStart(target, next ? 0 : target.length);
              } else {
                range.setStartBefore(target);
              }
              range.collapse(true);
              sel.removeAllRanges();
              sel.addRange(range);
            }
          }
          node.remove();
        }
        continue;
      }
      if (cleaned !== text) {
        if (isActiveText && sel) {
          const leadingZwsp = text.length - text.replace(/^\u200B+/, "").length;
          const offset = Math.max(0, anchorOffset - leadingZwsp);
          node.textContent = cleaned;
          const clamped = Math.min(offset, cleaned.length);
          const range = document.createRange();
          range.setStart(node, clamped);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        } else {
          node.textContent = cleaned;
        }
      }
    }
    removeOrphanGapNodes(composer);
    if (hadFocus) composer.focus();
  }
  function isAnyComposerChip(node) {
    return isComposerChipNode(node) || node instanceof HTMLElement && (node.hasAttribute("data-ve-chip") || node.hasAttribute("data-ve-capture-chip"));
  }
  function chipElementId(chip) {
    return chip.getAttribute("data-chip-id") ?? chip.getAttribute("data-ve-chip-id");
  }
  function chipCaptureId(chip) {
    const id = chip.getAttribute("data-visual-editor-capture-chip") ?? chip.getAttribute("data-ve-capture-chip");
    if (!id || id === "true") return null;
    return id;
  }
  function resolveChipSibling(node, direction) {
    if (!node) return null;
    if (isAnyComposerChip(node)) return node;
    if (isGapTextNode(node)) {
      const adjacent = direction === "before" ? node.previousSibling : node.nextSibling;
      if (adjacent instanceof HTMLElement && isAnyComposerChip(adjacent)) return adjacent;
    }
    return null;
  }
  function getAdjacentComposerChip(composer, direction) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return null;
    if (!sel.anchorNode || !composer.contains(sel.anchorNode)) return null;
    const { startContainer, startOffset } = sel.getRangeAt(0);
    if (startContainer.nodeType === Node.TEXT_NODE) {
      const textNode = startContainer;
      if (direction === "before") {
        if (startOffset === 0) {
          return resolveChipSibling(textNode.previousSibling, "before");
        }
        if (isGapTextNode(textNode)) {
          const beforeCaret = textNode.textContent?.slice(0, startOffset) ?? "";
          if (stripComposerZwsp(beforeCaret).length === 0) {
            return resolveChipSibling(textNode.previousSibling, "before");
          }
        }
        return null;
      }
      if (direction === "after" && startOffset === textNode.length) {
        return resolveChipSibling(textNode.nextSibling, "after");
      }
      if (direction === "after" && isGapTextNode(textNode)) {
        const afterCaret = textNode.textContent?.slice(startOffset) ?? "";
        if (stripComposerZwsp(afterCaret).length === 0) {
          return resolveChipSibling(textNode.nextSibling, "after");
        }
      }
      return null;
    }
    if (startContainer === composer) {
      const index = direction === "before" ? startOffset - 1 : startOffset;
      const node = composer.childNodes[index];
      if (node instanceof HTMLElement && isAnyComposerChip(node)) return node;
      if (node) return resolveChipSibling(node, direction);
    }
    return null;
  }
  function handleComposerChipKeydown(composer, event, handlers) {
    if (event.key !== "Backspace" && event.key !== "Delete") return;
    if (event.isComposing) return;
    const direction = event.key === "Backspace" ? "before" : "after";
    const chip = getAdjacentComposerChip(composer, direction);
    if (!chip) return;
    event.preventDefault();
    const elementId = chipElementId(chip);
    const captureId = chipCaptureId(chip);
    if (elementId) void handlers.onRemoveElement?.(elementId);
    if (captureId) void handlers.onRemoveCapture?.(captureId);
    composer.dispatchEvent(new InputEvent("input", { bubbles: true }));
  }
  function setupComposerChipKeydown(composer, handlers) {
    composer.addEventListener("keydown", (event) => {
      handleComposerChipKeydown(composer, event, handlers);
    });
  }

  // src/floating-ui.ts
  var FLOATING_ROOT_ID = "visual-editor-floating-root";
  var Z_FLOATING_LAYER = 2147483647;
  function ensureFloatingRoot() {
    let host = document.getElementById(FLOATING_ROOT_ID);
    if (!host) {
      host = document.createElement("div");
      host.id = FLOATING_ROOT_ID;
      Object.assign(host.style, {
        position: "fixed",
        inset: "0",
        zIndex: String(Z_FLOATING_LAYER),
        pointerEvents: "none",
        overflow: "visible"
      });
      document.documentElement.appendChild(host);
    }
    document.documentElement.appendChild(host);
    return host;
  }
  function mountFloatingElement(el) {
    ensureFloatingRoot().appendChild(el);
  }
  function mountFloatingModal(el) {
    if (!el.style.pointerEvents) {
      el.style.pointerEvents = "auto";
    }
    if (!el.style.zIndex) {
      el.style.zIndex = String(Z_FLOATING_LAYER);
    }
    document.documentElement.appendChild(el);
  }

  // src/toolbar-ui.ts
  var activeTooltip = null;
  var activeInfo = null;
  function attachTooltip(anchor, text) {
    anchor.addEventListener("mouseenter", () => {
      hideTooltip();
      const tip = document.createElement("div");
      tip.textContent = text;
      Object.assign(tip.style, {
        position: "fixed",
        maxWidth: "220px",
        padding: "6px 10px",
        borderRadius: "6px",
        background: "#0d1117",
        color: "#e6edf3",
        fontSize: "11px",
        lineHeight: "1.35",
        boxShadow: "0 4px 16px rgba(0,0,0,0.45)",
        border: "1px solid #3d3d3d",
        pointerEvents: "none",
        fontFamily: "system-ui, -apple-system, sans-serif",
        transform: "translateY(-50%)"
      });
      const rect = anchor.getBoundingClientRect();
      mountFloatingElement(tip);
      const gap = 8;
      const left = Math.max(8, rect.left - tip.offsetWidth - gap);
      tip.style.left = `${left}px`;
      tip.style.top = `${rect.top + rect.height / 2}px`;
      activeTooltip = tip;
    });
    anchor.addEventListener("mouseleave", hideTooltip);
  }
  function hideTooltip() {
    activeTooltip?.remove();
    activeTooltip = null;
  }
  function attrValue(attributes, key) {
    return attributes.find(([k]) => k === key)?.[1];
  }
  function isLayoutUtilityClass(className) {
    const lower = className.toLowerCase();
    const single = /* @__PURE__ */ new Set([
      "flex",
      "inline-flex",
      "grid",
      "inline-grid",
      "block",
      "inline-block",
      "inline",
      "hidden",
      "contents",
      "relative",
      "absolute",
      "fixed",
      "sticky",
      "static",
      "container",
      "truncate",
      "sr-only"
    ]);
    if (single.has(lower)) return true;
    const prefixes = [
      "flex-",
      "items-",
      "justify-",
      "gap-",
      "space-",
      "p-",
      "px-",
      "py-",
      "pt-",
      "pb-",
      "pl-",
      "pr-",
      "m-",
      "mx-",
      "my-",
      "mt-",
      "mb-",
      "ml-",
      "mr-",
      "w-",
      "h-",
      "min-",
      "max-",
      "col-",
      "row-",
      "grid-",
      "self-",
      "place-",
      "overflow-",
      "z-",
      "order-",
      "basis-"
    ];
    return prefixes.some((prefix) => lower.startsWith(prefix));
  }
  function chipClassFromAttributes(attributes) {
    const cls = attrValue(attributes, "class");
    if (!cls) return void 0;
    for (const token of cls.split(/\s+/).filter(Boolean)) {
      if (!isLayoutUtilityClass(token)) return token;
    }
    return void 0;
  }
  function elementChipLabel(el) {
    const { tag, attributes } = el.snapshot;
    const component = el.component || attrValue(attributes, "data-inspector-component");
    if (component) return `<${component}>`;
    const inspectorId = el.inspector_id || attrValue(attributes, "data-inspector-id");
    if (inspectorId) return `<${tag} data-inspector-id="${inspectorId}">`;
    const id = attrValue(attributes, "id");
    if (id) return `<${tag} id="${id}">`;
    const cls = chipClassFromAttributes(attributes);
    if (cls) return `<${tag} class="${cls}">`;
    return `<${tag}>`;
  }
  function section(title, body) {
    return `<div style="margin-bottom:10px"><div style="font-size:10px;font-weight:600;color:#8b949e;margin-bottom:4px">${title}</div><div style="font-family:ui-monospace,monospace;font-size:11px;color:#e6edf3;white-space:pre-wrap;word-break:break-all">${body}</div></div>`;
  }
  function buildElementInfoHtml(el) {
    const snap = el.snapshot;
    const attrs = snap.attributes.filter(([k]) => !k.startsWith("data-cursor-")).slice(0, 12).map(([k, v]) => `${k}: ${v}`).join("\n");
    const layout = snap.computed_layout.slice(0, 16).map(([k, v]) => `${k}: ${v}`).join("\n");
    const elementLine = elementChipLabel(el);
    return section("ELEMENT", elementLine) + section("PATH", el.selector || snap.dom_path) + (attrs ? section("ATTRIBUTES", attrs) : "") + (layout ? section("COMPUTED STYLES", layout) : "");
  }
  function hideElementInfo() {
    activeInfo?.remove();
    activeInfo = null;
  }
  function createChipRemoveButton(composer, chip, onRemove) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("aria-label", "Chip entfernen");
    btn.setAttribute("data-visual-editor-chip-remove", "true");
    btn.setAttribute("data-visual-editor-ui", "true");
    btn.textContent = "\xD7";
    Object.assign(btn.style, {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "14px",
      height: "14px",
      marginLeft: "2px",
      padding: "0",
      border: "none",
      borderRadius: "4px",
      background: "transparent",
      color: "#8b949e",
      fontSize: "13px",
      lineHeight: "1",
      cursor: "pointer",
      flexShrink: "0"
    });
    btn.addEventListener("mouseenter", () => {
      btn.style.background = "rgba(248,81,73,0.2)";
      btn.style.color = "#f85149";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.background = "transparent";
      btn.style.color = "#8b949e";
    });
    btn.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      hideElementInfo();
      onRemove();
    });
    return btn;
  }
  function attachElementInfo(chip, el) {
    chip.addEventListener("mouseenter", () => {
      hideElementInfo();
      const pop = document.createElement("div");
      pop.innerHTML = buildElementInfoHtml(el);
      Object.assign(pop.style, {
        position: "fixed",
        width: "320px",
        maxHeight: "360px",
        overflow: "auto",
        padding: "12px",
        borderRadius: "8px",
        background: "#0d1117",
        border: "1px solid #3d3d3d",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        pointerEvents: "none",
        fontFamily: "system-ui, -apple-system, sans-serif"
      });
      const rect = chip.getBoundingClientRect();
      mountFloatingElement(pop);
      let left = rect.left;
      let top = rect.bottom + 8;
      if (left + 320 > window.innerWidth - 8) left = window.innerWidth - 328;
      if (top + 200 > window.innerHeight - 8) top = rect.top - pop.offsetHeight - 8;
      pop.style.left = `${Math.max(8, left)}px`;
      pop.style.top = `${Math.max(8, top)}px`;
      activeInfo = pop;
    });
    chip.addEventListener("mouseleave", hideElementInfo);
  }
  function renderChip(el, composer, onChipClick, onRemove) {
    const chip = document.createElement("span");
    chip.setAttribute("data-visual-editor-chip", "true");
    Object.assign(chip.style, {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "2px 8px",
      borderRadius: "6px",
      border: "1px solid rgba(88,166,255,0.55)",
      background: "rgba(88,166,255,0.12)",
      color: "#e6edf3",
      fontSize: "11px",
      fontFamily: "ui-monospace, monospace",
      cursor: "pointer",
      maxWidth: "100%",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      verticalAlign: "middle",
      userSelect: "none",
      margin: "4px 6px 10px 0"
    });
    const icon = document.createElement("span");
    icon.innerHTML = ICON_CHIP;
    icon.style.display = "flex";
    icon.style.color = "#58a6ff";
    const label = document.createElement("span");
    label.textContent = elementChipLabel(el);
    chip.append(icon, label);
    if (onRemove) {
      chip.append(createChipRemoveButton(composer, chip, () => onRemove(el.id)));
    }
    attachElementInfo(chip, el);
    setupComposerChip(chip, composer, {
      onChipClick: () => onChipClick?.(el)
    });
    return chip;
  }
  function makeDraggable(shell, handle) {
    handle.style.cursor = "grab";
    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      const root = shell.parentElement;
      const rect = root.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
      handle.style.cursor = "grabbing";
      const onMove = (ev) => {
        const x = Math.min(Math.max(0, ev.clientX - offsetX), window.innerWidth - rect.width);
        const y = Math.min(Math.max(0, ev.clientY - offsetY), window.innerHeight - 40);
        root.style.left = `${x}px`;
        root.style.top = `${y}px`;
        root.style.right = "auto";
      };
      const onUp = () => {
        handle.style.cursor = "grab";
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    });
  }
  function iconButton(label, tooltip, svg, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("aria-label", label);
    btn.setAttribute("data-visual-editor-ui", "true");
    btn.innerHTML = svg;
    const baseBg = "#2a2a2a";
    const hoverBg = "#3d444d";
    const baseBorder = "#3d3d3d";
    Object.assign(btn.style, {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "44px",
      height: "44px",
      borderRadius: "8px",
      border: `1px solid ${baseBorder}`,
      background: baseBg,
      color: "#e6edf3",
      cursor: "pointer",
      transition: "background 0.15s ease, border-color 0.15s ease, transform 0.1s ease"
    });
    btn.addEventListener("mouseenter", () => {
      if (btn.dataset.active === "true") return;
      btn.style.background = hoverBg;
      btn.style.borderColor = "#58a6ff66";
    });
    btn.addEventListener("mouseleave", () => {
      if (btn.dataset.active === "true") return;
      btn.style.background = baseBg;
      btn.style.borderColor = baseBorder;
    });
    btn.addEventListener("mousedown", (event) => {
      event.stopPropagation();
      btn.style.transform = "scale(0.96)";
    });
    btn.addEventListener("mouseup", () => {
      btn.style.transform = "scale(1)";
    });
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      event.stopImmediatePropagation();
      onClick();
    });
    attachTooltip(btn, tooltip);
    return btn;
  }
  var PANEL_BTN_BASE = {
    padding: "4px 10px",
    borderRadius: "6px",
    border: "1px solid #3d3d3d",
    background: "transparent",
    color: "#e6edf3",
    fontSize: "12px",
    cursor: "pointer",
    transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease"
  };
  function createPanelButton(label, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    Object.assign(btn.style, PANEL_BTN_BASE);
    btn.addEventListener("mouseenter", () => {
      if (btn.dataset.state === "success") return;
      btn.style.background = "#2a2a2a";
      btn.style.borderColor = "#58a6ff66";
    });
    btn.addEventListener("mouseleave", () => {
      if (btn.dataset.state === "success") return;
      btn.style.background = "transparent";
      btn.style.borderColor = "#3d3d3d";
    });
    btn.addEventListener("click", (event) => onClick(event));
    return btn;
  }
  function showCopySuccess(btn, resetMs = 2e3) {
    btn.dataset.state = "success";
    btn.innerHTML = ICON_CHECK;
    Object.assign(btn.style, {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "4px",
      background: "#58a6ff",
      borderColor: "#58a6ff",
      color: "#fff",
      minWidth: "56px"
    });
    window.setTimeout(() => {
      btn.dataset.state = "";
      btn.textContent = "Copy";
      Object.assign(btn.style, PANEL_BTN_BASE);
    }, resetMs);
  }
  function runClearWipe(textareaWrap, onDone) {
    const wipe = document.createElement("div");
    Object.assign(wipe.style, {
      position: "absolute",
      inset: "0",
      borderRadius: "6px",
      background: "linear-gradient(90deg, transparent 0%, #0d1117 50%, transparent 100%)",
      pointerEvents: "none",
      transform: "translateX(-100%)",
      animation: "ve-clear-wipe 0.45s ease forwards"
    });
    if (!document.getElementById("ve-clear-wipe-style")) {
      const style = document.createElement("style");
      style.id = "ve-clear-wipe-style";
      style.textContent = `@keyframes ve-clear-wipe { to { transform: translateX(100%); } }`;
      document.head.append(style);
    }
    textareaWrap.style.position = "relative";
    textareaWrap.append(wipe);
    wipe.addEventListener("animationend", () => {
      wipe.remove();
      onDone();
    });
  }

  // src/screenshot-text-box-canvas.ts
  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
  function wrapFillText(ctx, text, x, y, maxWidth, lineHeight) {
    for (const paragraph of text.split("\n")) {
      const words = paragraph.split(/(\s+)/);
      let line = "";
      let cy = y;
      for (const word of words) {
        const test = line + word;
        if (ctx.measureText(test).width > maxWidth && line.trim()) {
          ctx.fillText(line, x, cy);
          line = word.trimStart();
          cy += lineHeight;
        } else {
          line = test;
        }
      }
      if (line.trim()) {
        ctx.fillText(line, x, cy);
        y = cy + lineHeight;
      }
    }
  }
  function drawTextBoxOnCanvas(ctx, x, y, w, h, text, scale) {
    const handleH = 18 * scale;
    const radius = 6 * scale;
    const padding = 8 * scale;
    const fontSize = 16 * scale;
    const lineHeight = 20 * scale;
    roundRect(ctx, x, y, w, h, radius);
    ctx.fillStyle = "rgba(13,17,23,0.92)";
    ctx.fill();
    ctx.strokeStyle = "#f85149";
    ctx.lineWidth = 2 * scale;
    roundRect(ctx, x, y, w, h, radius);
    ctx.stroke();
    ctx.fillStyle = "#21262d";
    ctx.fillRect(x, y, w, handleH);
    ctx.strokeStyle = "#3d3d3d";
    ctx.lineWidth = Math.max(1, scale);
    ctx.beginPath();
    ctx.moveTo(x, y + handleH);
    ctx.lineTo(x + w, y + handleH);
    ctx.stroke();
    ctx.fillStyle = "#f85149";
    ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
    wrapFillText(ctx, text, x + padding, y + handleH + padding + fontSize * 0.85, w - padding * 2, lineHeight);
  }

  // src/screenshot-editor.ts
  var editorOpen = false;
  function openScreenshotEditor(options) {
    if (editorOpen) return;
    editorOpen = true;
    let blobUrl = null;
    let mode = "draw";
    const strokes = [];
    const textOverlays = [];
    let currentStroke = null;
    let drawing = false;
    let cropRect = null;
    let cropDragging = false;
    let cropStart = null;
    const overlay = document.createElement("div");
    overlay.setAttribute("data-visual-editor-screenshot-editor", "true");
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      zIndex: "2147483647",
      pointerEvents: "auto",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      background: "rgba(0,0,0,0.75)",
      fontFamily: "system-ui, -apple-system, sans-serif"
    });
    const toolbar2 = document.createElement("div");
    Object.assign(toolbar2.style, {
      display: "flex",
      gap: "8px",
      padding: "8px 12px",
      borderRadius: "10px",
      border: "1px solid #3d3d3d",
      background: "#1a1a1a",
      alignItems: "center"
    });
    const statusEl = document.createElement("span");
    Object.assign(statusEl.style, { fontSize: "12px", color: "#8b949e", marginRight: "4px" });
    statusEl.textContent = "L\xE4dt\u2026";
    const mkIconBtn = (icon, title, active, onClick, accent) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.title = title;
      btn.innerHTML = icon;
      const border = accent ? "#238636" : active ? "#58a6ff" : "#3d3d3d";
      const bg2 = accent ? "#238636" : active ? "#58a6ff" : "#2a2a2a";
      Object.assign(btn.style, {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "32px",
        height: "32px",
        borderRadius: "6px",
        border: `1px solid ${border}`,
        background: bg2,
        color: "#fff",
        cursor: "pointer"
      });
      btn.addEventListener("click", onClick);
      return btn;
    };
    const mkLabelBtn = (label, accent, onClick) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      Object.assign(btn.style, {
        padding: "6px 12px",
        borderRadius: "6px",
        border: `1px solid ${accent ? "#238636" : "#3d3d3d"}`,
        background: accent ? "#238636" : "#2a2a2a",
        color: "#fff",
        fontSize: "12px",
        cursor: "pointer"
      });
      btn.addEventListener("click", onClick);
      return btn;
    };
    const drawBtn = mkIconBtn(ICON_DRAW, "Zeichnen", true, () => {
      mode = "draw";
      refreshTools();
    });
    const textBtn = mkIconBtn(ICON_TEXT, "Text hinzuf\xFCgen", false, () => {
      mode = "text";
      refreshTools();
      spawnDefaultTextBox();
    });
    const cropBtn = mkIconBtn(ICON_SCISSORS, "Zuschneiden", false, () => {
      mode = "crop";
      refreshTools();
    });
    const saveBtn = mkIconBtn(ICON_SAVE, "Speichern", false, () => void save(), true);
    const cancelBtn = mkLabelBtn("Abbrechen", false, close);
    const refreshTools = () => {
      for (const [btn, active] of [
        [drawBtn, mode === "draw"],
        [textBtn, mode === "text"],
        [cropBtn, mode === "crop"]
      ]) {
        if (btn === saveBtn) continue;
        btn.style.borderColor = active ? "#58a6ff" : "#3d3d3d";
        btn.style.background = active ? "#58a6ff" : "#2a2a2a";
        btn.style.color = active ? "#fff" : "#e6edf3";
      }
      canvas.style.cursor = mode === "draw" ? "crosshair" : mode === "text" ? "text" : "crosshair";
      textLayer.style.pointerEvents = mode === "text" ? "auto" : "none";
      for (const item of textOverlays) {
        item.el.style.pointerEvents = mode === "text" ? "auto" : "none";
      }
    };
    toolbar2.append(statusEl, drawBtn, textBtn, cropBtn, saveBtn, cancelBtn);
    const canvasWrap = document.createElement("div");
    Object.assign(canvasWrap.style, {
      maxWidth: "90vw",
      maxHeight: "calc(100vh - 80px)",
      overflow: "hidden",
      borderRadius: "8px",
      border: "1px solid #3d3d3d",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    });
    const canvasHost = document.createElement("div");
    Object.assign(canvasHost.style, { position: "relative", display: "block", lineHeight: "0" });
    const canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.style.cursor = "crosshair";
    const textLayer = document.createElement("div");
    Object.assign(textLayer.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none"
    });
    const fitCanvasToView = () => {
      if (!canvas.width || !canvas.height) return;
      const maxW = window.innerWidth * 0.9;
      const maxH = window.innerHeight - 100;
      const scale = Math.min(maxW / canvas.width, maxH / canvas.height, 1);
      const displayW = Math.round(canvas.width * scale);
      const displayH = Math.round(canvas.height * scale);
      canvas.style.width = `${displayW}px`;
      canvas.style.height = `${displayH}px`;
      canvasHost.style.width = `${displayW}px`;
      canvasHost.style.height = `${displayH}px`;
      syncAllTextPositions();
    };
    const spawnDefaultTextBox = () => {
      if (!canvas.width || !canvas.height) return;
      const x = Math.max(16, canvas.width * 0.25);
      const y = Math.max(16, canvas.height * 0.35);
      createTextOverlay(x, y, true);
    };
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      editorOpen = false;
      return;
    }
    const bg = new Image();
    const syncTextOverlayPosition = (item) => {
      if (!canvas.width || !canvas.height) return;
      const rect = canvas.getBoundingClientRect();
      item.el.style.left = `${item.x / canvas.width * rect.width}px`;
      item.el.style.top = `${item.y / canvas.height * rect.height}px`;
    };
    const syncAllTextPositions = () => {
      for (const item of textOverlays) {
        syncTextOverlayPosition(item);
      }
    };
    const createTextOverlay = (x, y, focusInput = false) => {
      const box = document.createElement("div");
      box.setAttribute("data-visual-editor-ui", "true");
      Object.assign(box.style, {
        position: "absolute",
        minWidth: "120px",
        maxWidth: "280px",
        border: "2px solid #f85149",
        borderRadius: "6px",
        background: "rgba(13,17,23,0.92)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.45)",
        pointerEvents: "auto",
        zIndex: "2"
      });
      const handle = document.createElement("div");
      handle.title = "Verschieben";
      Object.assign(handle.style, {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "18px",
        cursor: "move",
        background: "#21262d",
        borderBottom: "1px solid #3d3d3d",
        color: "#8b949e",
        fontSize: "10px",
        userSelect: "none"
      });
      handle.textContent = "\u22EE\u22EE";
      const content = document.createElement("textarea");
      content.placeholder = "Text eingeben\u2026";
      content.rows = 2;
      Object.assign(content.style, {
        display: "block",
        boxSizing: "border-box",
        width: "100%",
        padding: "6px 8px",
        minHeight: "48px",
        outline: "none",
        resize: "none",
        border: "none",
        background: "transparent",
        color: "#f85149",
        font: "bold 16px system-ui, sans-serif",
        cursor: "text"
      });
      box.append(handle, content);
      textLayer.append(box);
      const item = { x, y, el: box };
      textOverlays.push(item);
      syncTextOverlayPosition(item);
      let dragging = false;
      let dragOffsetX = 0;
      let dragOffsetY = 0;
      const moveDrag = (event) => {
        if (!dragging) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        item.x = Math.max(0, Math.min(canvas.width, (event.clientX - rect.left - dragOffsetX) * scaleX));
        item.y = Math.max(0, Math.min(canvas.height, (event.clientY - rect.top - dragOffsetY) * scaleY));
        syncTextOverlayPosition(item);
      };
      const endDrag = () => {
        dragging = false;
        window.removeEventListener("pointermove", moveDrag);
        window.removeEventListener("pointerup", endDrag);
      };
      handle.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const rect = box.getBoundingClientRect();
        dragging = true;
        dragOffsetX = event.clientX - rect.left;
        dragOffsetY = event.clientY - rect.top;
        handle.setPointerCapture(event.pointerId);
        window.addEventListener("pointermove", moveDrag);
        window.addEventListener("pointerup", endDrag);
      });
      content.addEventListener("pointerdown", (event) => event.stopPropagation());
      content.addEventListener("mousedown", (event) => event.stopPropagation());
      content.addEventListener("keydown", (event) => event.stopPropagation());
      content.addEventListener("keyup", (event) => event.stopPropagation());
      if (focusInput) {
        requestAnimationFrame(() => content.focus());
      }
    };
    const normalizeCropRect = (x1, y1, x2, y2) => {
      const x = Math.min(x1, x2);
      const y = Math.min(y1, y2);
      return { x, y, width: Math.abs(x2 - x1), height: Math.abs(y2 - y1) };
    };
    const redraw = () => {
      if (!ctx || !bg.naturalWidth) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bg, 0, 0);
      ctx.strokeStyle = "#f85149";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const stroke of strokes) {
        if (stroke.points.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      }
      if (cropRect && cropRect.width > 1 && cropRect.height > 1) {
        ctx.save();
        ctx.strokeStyle = "#58a6ff";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.strokeRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(0, 0, canvas.width, cropRect.y);
        ctx.fillRect(0, cropRect.y, cropRect.x, cropRect.height);
        ctx.fillRect(
          cropRect.x + cropRect.width,
          cropRect.y,
          canvas.width - cropRect.x - cropRect.width,
          cropRect.height
        );
        ctx.fillRect(
          0,
          cropRect.y + cropRect.height,
          canvas.width,
          canvas.height - cropRect.y - cropRect.height
        );
        ctx.restore();
      }
    };
    const flattenTextToCanvas = () => {
      const canvasRect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / canvasRect.width;
      const scaleY = canvas.height / canvasRect.height;
      const scale = Math.min(scaleX, scaleY);
      for (const item of textOverlays) {
        const input = item.el.querySelector("textarea");
        const text = input instanceof HTMLTextAreaElement ? input.value.trim() : "";
        if (!text) continue;
        const w = item.el.offsetWidth * scaleX;
        const h = item.el.offsetHeight * scaleY;
        drawTextBoxOnCanvas(ctx, item.x, item.y, w, h, text, scale);
      }
    };
    const canvasPoint = (event) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
      };
    };
    canvas.addEventListener("pointerdown", (event) => {
      if (!bg.naturalWidth) return;
      event.preventDefault();
      const pt = canvasPoint(event);
      if (mode === "text") {
        createTextOverlay(pt.x, pt.y, true);
        return;
      }
      if (mode === "crop") {
        cropDragging = true;
        cropStart = pt;
        cropRect = { x: pt.x, y: pt.y, width: 0, height: 0 };
        canvas.setPointerCapture(event.pointerId);
        redraw();
        return;
      }
      drawing = true;
      currentStroke = { points: [pt] };
      strokes.push(currentStroke);
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (cropDragging && cropStart) {
        cropRect = normalizeCropRect(cropStart.x, cropStart.y, canvasPoint(event).x, canvasPoint(event).y);
        redraw();
        return;
      }
      if (!drawing || !currentStroke) return;
      currentStroke.points.push(canvasPoint(event));
      redraw();
    });
    const endStroke = () => {
      drawing = false;
      currentStroke = null;
      cropDragging = false;
      cropStart = null;
    };
    canvas.addEventListener("pointerup", endStroke);
    canvas.addEventListener("pointerleave", endStroke);
    const resizeObserver = new ResizeObserver(() => fitCanvasToView());
    resizeObserver.observe(canvas);
    window.addEventListener("resize", fitCanvasToView);
    canvasHost.append(canvas, textLayer);
    canvasWrap.append(canvasHost);
    overlay.append(toolbar2, canvasWrap);
    mountFloatingModal(overlay);
    void loadCaptureBlobUrl(options.captureId).then((url) => {
      blobUrl = url;
      bg.onload = () => {
        canvas.width = bg.naturalWidth;
        canvas.height = bg.naturalHeight;
        statusEl.textContent = "";
        fitCanvasToView();
        redraw();
        syncAllTextPositions();
      };
      bg.onerror = () => {
        statusEl.textContent = "Screenshot konnte nicht geladen werden";
        statusEl.style.color = "#f85149";
      };
      bg.src = url;
    }).catch((error) => {
      statusEl.textContent = error instanceof Error ? error.message : "Laden fehlgeschlagen";
      statusEl.style.color = "#f85149";
    });
    function close() {
      resizeObserver.disconnect();
      window.removeEventListener("resize", fitCanvasToView);
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      overlay.remove();
      editorOpen = false;
    }
    async function save() {
      if (!bg.naturalWidth) return;
      saveBtn.disabled = true;
      try {
        redraw();
        flattenTextToCanvas();
        let exportCanvas = canvas;
        if (cropRect && cropRect.width >= 4 && cropRect.height >= 4) {
          const cropped = document.createElement("canvas");
          const x = Math.round(cropRect.x);
          const y = Math.round(cropRect.y);
          const w = Math.round(cropRect.width);
          const h = Math.round(cropRect.height);
          cropped.width = w;
          cropped.height = h;
          const croppedCtx = cropped.getContext("2d");
          if (!croppedCtx) throw new Error("Export fehlgeschlagen");
          croppedCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h);
          exportCanvas = cropped;
        }
        const blob = await new Promise(
          (resolve) => exportCanvas.toBlob(resolve, "image/png")
        );
        if (!blob) throw new Error("Export fehlgeschlagen");
        const buffer = await blob.arrayBuffer();
        await options.onSave(Array.from(new Uint8Array(buffer)));
        close();
      } catch {
        saveBtn.disabled = false;
        redraw();
      }
    }
  }

  // src/toolbar-captures.ts
  var PLUGIN2 = "plugin:visual-editor";
  var activePreview = null;
  var activePreviewUrl = null;
  function hidePreview() {
    activePreview?.remove();
    activePreview = null;
    if (activePreviewUrl) {
      URL.revokeObjectURL(activePreviewUrl);
      activePreviewUrl = null;
    }
  }
  function captureLabel(capture, index) {
    const type = capture.capture_type === "webview" ? "Screenshot" : capture.capture_type;
    return `${type} #${index + 1}`;
  }
  function renderCaptureChip(capture, index, _cacheBust, composer, onSaved, onRemove) {
    const chip = document.createElement("span");
    chip.setAttribute("data-visual-editor-capture-chip", capture.id);
    chip.setAttribute("contenteditable", "false");
    Object.assign(chip.style, {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "2px 8px",
      borderRadius: "6px",
      border: "1px solid rgba(63,185,80,0.55)",
      background: "rgba(63,185,80,0.12)",
      color: "#e6edf3",
      fontSize: "11px",
      cursor: "pointer",
      maxWidth: "100%",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      verticalAlign: "middle",
      userSelect: "none",
      margin: "4px 6px 10px 0",
      transition: "background 0.15s ease, border-color 0.15s ease"
    });
    const icon = document.createElement("span");
    icon.innerHTML = ICON_CAPTURE_CHIP;
    icon.style.display = "flex";
    icon.style.color = "#3fb950";
    const label = document.createElement("span");
    label.textContent = captureLabel(capture, index);
    chip.append(icon, label);
    if (onRemove) {
      chip.append(
        createChipRemoveButton(composer, chip, () => {
          hidePreview();
          onRemove(capture.id);
        })
      );
    }
    chip.addEventListener("mouseenter", () => {
      hidePreview();
      chip.style.background = "rgba(63,185,80,0.22)";
      chip.style.borderColor = "#3fb950";
      void loadCaptureBlobUrl(capture.id).then((url) => {
        activePreviewUrl = url;
        const pop = document.createElement("div");
        const img = document.createElement("img");
        img.src = url;
        img.alt = "Screenshot Vorschau";
        Object.assign(img.style, {
          display: "block",
          maxWidth: "280px",
          maxHeight: "200px",
          borderRadius: "6px"
        });
        Object.assign(pop.style, {
          position: "fixed",
          padding: "8px",
          borderRadius: "8px",
          background: "#0d1117",
          border: "1px solid #3d3d3d",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          pointerEvents: "none"
        });
        pop.append(img);
        mountFloatingElement(pop);
        activePreview = pop;
        const rect = chip.getBoundingClientRect();
        let left = rect.left;
        let top = rect.bottom + 8;
        if (left + 300 > window.innerWidth - 8) left = window.innerWidth - 308;
        if (top + 220 > window.innerHeight - 8) top = rect.top - 228;
        pop.style.left = `${Math.max(8, left)}px`;
        pop.style.top = `${Math.max(8, top)}px`;
      }).catch(() => void 0);
    });
    chip.addEventListener("mouseleave", () => {
      hidePreview();
      chip.style.background = "rgba(63,185,80,0.12)";
      chip.style.borderColor = "rgba(63,185,80,0.55)";
    });
    setupComposerChip(chip, composer, {
      onChipClick: () => {
        hidePreview();
        openScreenshotEditor({
          captureId: capture.id,
          onSave: async (pngBytes) => {
            await invoke(`${PLUGIN2}|save_capture_image`, {
              captureId: capture.id,
              pngBytes
            });
            onSaved();
          }
        });
      }
    });
    return chip;
  }

  // src/toolbar.ts
  var PLUGIN3 = "plugin:visual-editor";
  var COMPOSER_PLACEHOLDER = "Write some context...";
  function syncComposerPlaceholder(composer) {
    const hasChips = Boolean(
      composer.querySelector("[data-visual-editor-chip], [data-visual-editor-capture-chip]")
    );
    const hasText = extractComposerText(composer).trim().length > 0;
    composer.dataset.empty = hasText || hasChips ? "false" : "true";
  }
  var STATE_EVENT = "visual-editor://state-updated";
  var ROOT_ID2 = "visual-editor-toolbar-root";
  var InspectorToolbar = class {
    root = null;
    shell = null;
    body = null;
    panel = null;
    composerBox = null;
    composerFlow = null;
    messageEl = null;
    copyBtn = null;
    pickerBtn = null;
    panelBtn = null;
    collapseBtn = null;
    devtoolsBtn = null;
    headerTitle = null;
    nav = null;
    panelOpen = false;
    collapsed = false;
    pickerEnabled = false;
    prevSelectionCount = 0;
    prevCaptureCount = 0;
    captureCacheBust = /* @__PURE__ */ new Map();
    state = null;
    unlisten = null;
    issueTimer = null;
    messageTimer = null;
    pickerAutoDisabledForTyping = false;
    options;
    constructor(options = {}) {
      this.options = options;
    }
    async open() {
      if (this.root) {
        this.root.style.display = "block";
        return;
      }
      await new Promise((resolve) => {
        const mountNow = () => {
          this.mount();
          resolve();
        };
        if (typeof requestIdleCallback === "function") {
          requestIdleCallback(mountNow, { timeout: 50 });
        } else {
          setTimeout(mountNow, 0);
        }
      });
      await this.refreshState();
      this.unlisten = await listen(STATE_EVENT, (event) => {
        this.state = event.payload;
        this.syncUi();
      });
    }
    close() {
      if (this.root) {
        this.root.style.display = "none";
      }
    }
    destroy() {
      this.unlisten?.();
      this.unlisten = null;
      this.root?.remove();
      this.root = null;
      this.shell = null;
      this.panel = null;
    }
    async refreshState() {
      try {
        this.state = await invoke(`${PLUGIN3}|get_state`);
        this.syncUi();
      } catch {
      }
    }
    mount() {
      const root = document.createElement("div");
      root.id = ROOT_ID2;
      root.setAttribute("data-visual-editor-toolbar", "true");
      root.setAttribute("data-visual-editor-ui", "true");
      markCaptureHideRoot(root);
      Object.assign(root.style, {
        position: "fixed",
        top: "8px",
        right: "8px",
        zIndex: "2147483647",
        fontFamily: "system-ui, -apple-system, sans-serif",
        pointerEvents: "none"
      });
      const shell = document.createElement("div");
      shell.setAttribute("data-visual-editor-ui", "true");
      Object.assign(shell.style, {
        display: "flex",
        flexDirection: "column",
        width: "fit-content",
        borderRadius: "12px",
        border: "1px solid #3d3d3d",
        background: "rgba(26,26,26,0.96)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        pointerEvents: "auto",
        overflow: "hidden"
      });
      const header = document.createElement("div");
      Object.assign(header.style, {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "6px",
        padding: "4px 8px",
        borderBottom: "1px solid #3d3d3d",
        background: "#1a1a1a",
        userSelect: "none"
      });
      const grip = document.createElement("span");
      grip.innerHTML = ICON_GRIP;
      grip.style.display = "flex";
      grip.style.color = "#8b949e";
      attachTooltip(grip, "Overlay verschieben");
      const headerTitle = document.createElement("span");
      headerTitle.textContent = "Visual Inspector";
      this.headerTitle = headerTitle;
      Object.assign(headerTitle.style, {
        flex: "1",
        fontSize: "10px",
        color: "#8b949e",
        textAlign: "center"
      });
      this.collapseBtn = document.createElement("button");
      this.collapseBtn.type = "button";
      this.collapseBtn.innerHTML = ICON_CHEVRON_UP;
      Object.assign(this.collapseBtn.style, {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "24px",
        height: "24px",
        border: "none",
        borderRadius: "6px",
        background: "transparent",
        color: "#e6edf3",
        cursor: "pointer",
        transition: "background 0.15s ease"
      });
      this.collapseBtn.addEventListener("mouseenter", () => {
        this.collapseBtn.style.background = "#2a2a2a";
      });
      this.collapseBtn.addEventListener("mouseleave", () => {
        this.collapseBtn.style.background = "transparent";
      });
      attachTooltip(this.collapseBtn, "Overlay einklappen");
      this.collapseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.setCollapsed(!this.collapsed);
      });
      header.append(grip, headerTitle, this.collapseBtn);
      makeDraggable(shell, header);
      this.body = document.createElement("div");
      Object.assign(this.body.style, {
        display: "flex",
        alignItems: "flex-start",
        gap: "8px",
        padding: "8px",
        width: "fit-content"
      });
      this.panel = document.createElement("div");
      this.panel.setAttribute("data-visual-editor-ui", "true");
      Object.assign(this.panel.style, {
        display: "none",
        flexDirection: "column",
        width: "280px",
        minHeight: "300px",
        padding: "10px",
        borderRadius: "10px",
        border: "1px solid #3d3d3d",
        background: "#0d1117",
        color: "#e6edf3"
      });
      this.composerBox = document.createElement("div");
      this.composerBox.setAttribute("data-visual-editor-ui", "true");
      Object.assign(this.composerBox.style, {
        position: "relative",
        flex: "1 1 auto",
        display: "flex",
        flexDirection: "column",
        minHeight: "180px",
        marginBottom: "8px",
        borderRadius: "6px",
        border: "1px solid #3d3d3d",
        background: "#161b22",
        overflow: "hidden"
      });
      this.composerFlow = document.createElement("div");
      this.composerFlow.setAttribute("contenteditable", "true");
      this.composerFlow.setAttribute("data-visual-editor-composer", "true");
      this.composerFlow.setAttribute("data-placeholder", COMPOSER_PLACEHOLDER);
      Object.assign(this.composerFlow.style, {
        display: "block",
        flex: "1 1 auto",
        minHeight: "160px",
        padding: "8px",
        outline: "none",
        color: "#e6edf3",
        fontSize: "12px",
        lineHeight: "1.5",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        cursor: "text",
        overflowY: "auto"
      });
      syncComposerPlaceholder(this.composerFlow);
      ensureComposerTail(this.composerFlow);
      this.composerFlow.addEventListener("mousedown", (event) => {
        if (event.button !== 0) return;
        const hit = document.elementFromPoint(event.clientX, event.clientY);
        const chip = hit?.closest("[data-visual-editor-chip], [data-visual-editor-capture-chip]");
        if (!(chip instanceof HTMLElement) || !this.composerFlow.contains(chip)) return;
        event.preventDefault();
        focusComposerAtChip(this.composerFlow, event.clientX, event.clientY);
      });
      setupComposerDropTarget(this.composerFlow);
      setupComposerChipKeydown(this.composerFlow, {
        onRemoveElement: (elementId) => invoke(`${PLUGIN3}|remove_element`, { elementId }),
        onRemoveCapture: (captureId) => invoke(`${PLUGIN3}|remove_capture`, { captureId })
      });
      this.composerFlow.addEventListener("input", () => {
        sanitizeComposerWhileTyping(this.composerFlow);
        syncComposerPlaceholder(this.composerFlow);
        void this.disablePickerIfTyping();
        if (this.issueTimer) clearTimeout(this.issueTimer);
        this.issueTimer = setTimeout(() => {
          void invoke(`${PLUGIN3}|set_issue_text`, {
            text: extractComposerText(this.composerFlow)
          });
        }, 800);
      });
      this.composerFlow.addEventListener("paste", (event) => {
        event.preventDefault();
        const text = event.clipboardData?.getData("text/plain") ?? "";
        document.execCommand("insertText", false, text);
      });
      this.composerBox.append(this.composerFlow);
      const composerStyle = document.createElement("style");
      composerStyle.textContent = `
[data-visual-editor-composer][data-empty="true"]::before{content:attr(data-placeholder);color:#8b949e;pointer-events:none}
[data-visual-editor-composer] [data-visual-editor-chip],
[data-visual-editor-composer] [data-visual-editor-capture-chip]{
  margin:4px 6px 10px 0;
  vertical-align:middle;
}`;
      root.append(composerStyle);
      const actions = document.createElement("div");
      Object.assign(actions.style, {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        flexShrink: "0"
      });
      const btnRow = document.createElement("div");
      Object.assign(btnRow.style, { display: "flex", gap: "8px" });
      this.copyBtn = createPanelButton("Copy", (event) => void this.runAction("copy", event.shiftKey));
      attachTooltip(this.copyBtn, "Issue + Kontext-Refs kopieren (Shift: volles Bundle)");
      const clearBtn = createPanelButton("Clear", () => void this.runClear());
      btnRow.append(this.copyBtn, clearBtn);
      this.messageEl = document.createElement("span");
      Object.assign(this.messageEl.style, { fontSize: "11px", color: "#8b949e" });
      actions.append(btnRow, this.messageEl);
      this.panel.append(this.composerBox, actions);
      const nav = document.createElement("nav");
      nav.setAttribute("data-visual-editor-ui", "true");
      nav.setAttribute("data-visual-editor-nav", "true");
      Object.assign(nav.style, { display: "flex", flexDirection: "column", gap: "8px" });
      this.nav = nav;
      nav.appendChild(
        iconButton(
          "Hard Reload",
          "Hard Reload (Clear Cache)",
          ICON_RELOAD,
          () => void this.runAction("reload")
        )
      );
      nav.appendChild(
        iconButton(
          "Screenshot",
          "Take a Screenshot",
          ICON_SCREENSHOT,
          () => void this.runAction("capture")
        )
      );
      this.pickerBtn = iconButton(
        "Element-Picker",
        "Visual Inspector (Inspect Elements in UI)",
        ICON_INSPECT_PICKER,
        () => void this.togglePicker()
      );
      this.pickerBtn.setAttribute("data-visual-editor-picker-toggle", "true");
      nav.appendChild(this.pickerBtn);
      this.panelBtn = iconButton(
        "Kontext-Panel",
        "Context Box (Write Text, Edit Screenshots, Analyze inspected UI)",
        ICON_CONTEXT,
        () => this.togglePanel()
      );
      nav.appendChild(this.panelBtn);
      this.devtoolsBtn = iconButton(
        "Console",
        "Devtools (Elements, Console, Network etc..)",
        ICON_DEVTOOLS,
        () => void this.toggleDevtools()
      );
      nav.appendChild(this.devtoolsBtn);
      this.body.append(this.panel, nav);
      shell.append(header, this.body);
      root.append(shell);
      document.documentElement.appendChild(root);
      this.root = root;
      this.shell = shell;
      this.syncShellLayout();
    }
    syncShellLayout() {
      const compact = !this.panelOpen;
      if (this.headerTitle) {
        this.headerTitle.style.display = compact ? "none" : "block";
      }
      if (this.nav) {
        this.nav.style.flexShrink = "0";
      }
    }
    showTransientMessage(text, ms = 2500) {
      if (!this.messageEl) return;
      if (this.messageTimer) clearTimeout(this.messageTimer);
      this.messageEl.textContent = text;
      this.messageTimer = setTimeout(() => {
        if (this.messageEl) this.messageEl.textContent = "";
        this.messageTimer = null;
      }, ms);
    }
    setCollapsed(collapsed) {
      this.collapsed = collapsed;
      if (this.body) {
        this.body.style.display = collapsed ? "none" : "flex";
      }
      if (this.collapseBtn) {
        this.collapseBtn.innerHTML = collapsed ? ICON_CHEVRON_DOWN : ICON_CHEVRON_UP;
        attachTooltip(this.collapseBtn, collapsed ? "Overlay ausklappen" : "Overlay einklappen");
      }
    }
    renderChips() {
      if (!this.composerFlow) return;
      const isFocused = document.activeElement === this.composerFlow;
      const elements = this.state?.session.selected_elements ?? [];
      const captures = this.state?.session.captures ?? [];
      const wantedElementIds = new Set(elements.map((el) => el.id));
      const wantedCaptureIds = new Set(captures.map((c) => c.id));
      const currentElementIds = new Set(
        [...this.composerFlow.querySelectorAll("[data-visual-editor-chip]")].map((node) => node.getAttribute("data-chip-id")).filter((id) => Boolean(id))
      );
      const currentCaptureIds = new Set(
        [...this.composerFlow.querySelectorAll("[data-visual-editor-capture-chip]")].map((node) => node.getAttribute("data-visual-editor-capture-chip")).filter((id) => Boolean(id))
      );
      const chipsChanged = elements.some((el) => !currentElementIds.has(el.id)) || captures.some((cap) => !currentCaptureIds.has(cap.id)) || [...currentElementIds].some((id) => !wantedElementIds.has(id)) || [...currentCaptureIds].some((id) => !wantedCaptureIds.has(id));
      if (isFocused && !chipsChanged) {
        return;
      }
      const savedCaret = isFocused ? saveComposerCaret(this.composerFlow) : null;
      this.composerFlow.querySelectorAll("[data-visual-editor-chip]").forEach((node) => {
        const id = node.getAttribute("data-chip-id");
        if (!id || !wantedElementIds.has(id)) node.remove();
      });
      this.composerFlow.querySelectorAll("[data-visual-editor-capture-chip]").forEach((node) => {
        const id = node.getAttribute("data-visual-editor-capture-chip");
        if (!id || !wantedCaptureIds.has(id)) node.remove();
      });
      if (!isFocused) {
        ensureComposerTail(this.composerFlow);
      }
      const insertAtCaret = (chip) => {
        if (isFocused) {
          const sel = window.getSelection();
          if (sel?.rangeCount && this.composerFlow.contains(sel.anchorNode ?? null)) {
            const range = sel.getRangeAt(0);
            insertChipAtRange(this.composerFlow, chip, range);
            return;
          }
        }
        this.composerFlow.appendChild(chip);
      };
      for (const el of elements) {
        if (this.composerFlow.querySelector(`[data-chip-id="${el.id}"]`)) continue;
        const chip = renderChip(
          el,
          this.composerFlow,
          (selected) => this.options.onChipFocus?.(selected),
          (elementId) => void invoke(`${PLUGIN3}|remove_element`, { elementId })
        );
        chip.setAttribute("data-chip-id", el.id);
        insertAtCaret(chip);
      }
      captures.forEach((capture, index) => {
        if (this.composerFlow.querySelector(`[data-visual-editor-capture-chip="${capture.id}"]`)) {
          return;
        }
        const bust = this.captureCacheBust.get(capture.id) ?? capture.id;
        const chip = renderCaptureChip(
          capture,
          index,
          bust,
          this.composerFlow,
          () => {
            this.captureCacheBust.set(capture.id, Date.now());
            this.renderChips();
          },
          (captureId) => void invoke(`${PLUGIN3}|remove_capture`, { captureId })
        );
        insertAtCaret(chip);
      });
      if (!isFocused) {
        normalizeComposerInlines(this.composerFlow);
      }
      if (savedCaret) {
        restoreComposerCaret(savedCaret);
      }
      syncComposerPlaceholder(this.composerFlow);
    }
    setComposerIssueText(text) {
      if (!this.composerFlow) return;
      const chips = [
        ...this.composerFlow.querySelectorAll(
          "[data-visual-editor-chip], [data-visual-editor-capture-chip]"
        )
      ];
      for (const node of [...this.composerFlow.childNodes]) {
        if (!isComposerChipNode(node)) node.remove();
      }
      if (text) {
        this.composerFlow.insertBefore(document.createTextNode(text), this.composerFlow.firstChild);
      }
      for (const chip of chips) {
        this.composerFlow.appendChild(chip);
      }
      normalizeComposerInlines(this.composerFlow);
      syncComposerPlaceholder(this.composerFlow);
    }
    syncUi() {
      if (!this.state) return;
      this.pickerEnabled = this.state.enabled;
      if (this.state.enabled) {
        this.pickerAutoDisabledForTyping = false;
      }
      const selectionCount = this.state.session.selected_elements.length;
      const captureCount = this.state.session.captures?.length ?? 0;
      if (selectionCount > 0 && selectionCount !== this.prevSelectionCount) {
        this.setPanelOpen(true);
      }
      if (captureCount > 0 && captureCount !== this.prevCaptureCount) {
        this.setPanelOpen(true);
      }
      this.prevSelectionCount = selectionCount;
      this.prevCaptureCount = captureCount;
      this.renderChips();
      if (this.composerFlow && this.state.session.issue_text != null) {
        const next = this.state.session.issue_text;
        const composerFocused = document.activeElement === this.composerFlow;
        if (!composerFocused && extractComposerText(this.composerFlow) !== next) {
          this.setComposerIssueText(next);
        }
      }
      this.syncActiveButtons();
    }
    syncActiveButtons() {
      if (this.pickerBtn) {
        const active = this.pickerEnabled;
        this.pickerBtn.dataset.active = active ? "true" : "";
        this.pickerBtn.style.borderColor = active ? "#58a6ff" : "#3d3d3d";
        this.pickerBtn.style.background = active ? "#58a6ff" : "#2a2a2a";
        this.pickerBtn.style.color = active ? "#fff" : "#e6edf3";
      }
      if (this.panelBtn) {
        const active = this.panelOpen;
        this.panelBtn.dataset.active = active ? "true" : "";
        this.panelBtn.style.borderColor = active ? "#58a6ff" : "#3d3d3d";
        this.panelBtn.style.background = active ? "#58a6ff" : "#2a2a2a";
        this.panelBtn.style.color = active ? "#fff" : "#e6edf3";
      }
    }
    togglePanel() {
      this.setPanelOpen(!this.panelOpen);
    }
    setPanelOpen(open) {
      this.panelOpen = open;
      if (this.panel) {
        this.panel.style.display = open ? "flex" : "none";
      }
      this.syncShellLayout();
      this.syncActiveButtons();
    }
    async disablePickerIfTyping() {
      if (this.pickerAutoDisabledForTyping || !this.pickerEnabled || !this.composerFlow) {
        return;
      }
      if (extractComposerText(this.composerFlow).length === 0) return;
      this.pickerAutoDisabledForTyping = true;
      try {
        await invoke(`${PLUGIN3}|disable`);
        this.pickerEnabled = false;
        this.options.onPickerChange?.(false);
      } catch {
        this.pickerAutoDisabledForTyping = false;
        await this.refreshState();
      }
    }
    async toggleDevtools() {
      try {
        const open = await invoke(`${PLUGIN3}|toggle_devtools`);
        if (this.devtoolsBtn) {
          this.devtoolsBtn.dataset.active = open ? "true" : "";
          this.devtoolsBtn.style.borderColor = open ? "#58a6ff" : "#3d3d3d";
          this.devtoolsBtn.style.background = open ? "#58a6ff" : "#2a2a2a";
          this.devtoolsBtn.style.color = open ? "#fff" : "#e6edf3";
        }
        this.showTransientMessage(open ? "DevTools ge\xF6ffnet" : "DevTools geschlossen");
      } catch (error) {
        this.showTransientMessage(
          error instanceof Error ? error.message : "DevTools fehlgeschlagen",
          4e3
        );
        if (!this.panelOpen) {
          this.setPanelOpen(true);
        }
      }
    }
    async togglePicker() {
      const nextEnabled = !this.pickerEnabled;
      try {
        if (nextEnabled) {
          await invoke(`${PLUGIN3}|enable`);
        } else {
          await invoke(`${PLUGIN3}|disable`);
        }
        this.pickerEnabled = nextEnabled;
        this.options.onPickerChange?.(nextEnabled);
        await this.refreshState();
      } catch (error) {
        await this.refreshState();
        if (this.messageEl) {
          this.messageEl.textContent = error instanceof Error ? error.message : "Picker-Aktion fehlgeschlagen";
        }
        if (!this.panelOpen) {
          this.setPanelOpen(true);
        }
      }
    }
    runClear() {
      if (!this.composerBox) return;
      runClearWipe(this.composerBox, () => {
        void this.runAction("clear");
      });
    }
    async runAction(kind, fullBundle = false) {
      if (this.messageTimer) {
        clearTimeout(this.messageTimer);
        this.messageTimer = null;
      }
      if (this.messageEl) this.messageEl.textContent = "";
      try {
        if (kind === "reload") await invoke(`${PLUGIN3}|hard_reload`);
        if (kind === "capture") await invoke(`${PLUGIN3}|capture`, { options: { mode: "webview" } });
        if (kind === "copy") {
          const blocks = !fullBundle && this.composerFlow ? extractComposerBlocks(this.composerFlow) : void 0;
          await invoke(`${PLUGIN3}|copy_context_bundle`, { full: fullBundle, blocks });
          if (this.copyBtn && !fullBundle) showCopySuccess(this.copyBtn);
        }
        if (kind === "clear") {
          await invoke(`${PLUGIN3}|clear_session`);
          if (this.composerFlow) {
            this.setComposerIssueText("");
          }
          this.captureCacheBust.clear();
        }
        if (kind !== "copy") {
          const msg = kind === "reload" ? "Hard Reload ausgef\xFChrt" : kind === "capture" ? "Screenshot erstellt" : kind === "clear" ? "Session geleert" : "";
          if (msg) this.showTransientMessage(msg);
        } else if (this.messageEl) {
          this.showTransientMessage(
            fullBundle ? "Context Bundle kopiert" : "Composer kopiert"
          );
        }
        await this.refreshState();
      } catch (error) {
        if (!this.panelOpen) {
          this.setPanelOpen(true);
        }
        this.showTransientMessage(
          error instanceof Error ? error.message : "Aktion fehlgeschlagen",
          4e3
        );
      }
    }
  };

  // src/guest-runtime.ts
  var engine = null;
  var toolbar = null;
  async function reportSelection(snapshot, action) {
    await invoke("plugin:visual-editor|report_selection", { snapshot, action });
  }
  async function notifyNavigation(webviewId) {
    await invoke("plugin:visual-editor|notify_navigation", { webviewId });
  }
  var runtime = window.__VISUAL_EDITOR_GUEST__ ?? {
    version: "0.1.0",
    activate(webviewId) {
      if (!engine) {
        engine = new SelectionEngine({
          webviewId,
          reportSelection,
          onNavigation: (id) => {
            void notifyNavigation(id).catch(() => void 0);
          }
        });
      }
      engine.activate();
    },
    deactivate() {
      engine?.destroy();
      engine = null;
    },
    configure(options) {
      engine?.configure(options);
    },
    async openToolbar() {
      if (!toolbar) {
        toolbar = new InspectorToolbar({
          onPickerChange: (enabled) => {
            if (enabled && engine) {
              engine.activate();
            } else {
              engine?.deactivate();
            }
          },
          onChipFocus: (element) => {
            engine?.highlightElement(element);
          }
        });
      }
      await toolbar.open();
    },
    closeToolbar() {
      toolbar?.close();
    }
  };
  window.__VISUAL_EDITOR_GUEST__ = runtime;
  window.__VISUAL_EDITOR_SUSPEND_CAPTURE_UI__ = suspendCaptureUi;
  window.__VISUAL_EDITOR_RESUME_CAPTURE_UI__ = resumeCaptureUi;
  var guest_runtime_default = runtime;
})();
