#!/usr/bin/env bash
# Creates V1 implementation issues for ecc-runner
set -euo pipefail

REPO="iamthamanic/tauri-plugin-visual-editor"

create_issue() {
  local title="$1"
  local body="$2"
  local labels="$3"
  gh issue create --repo "$REPO" --title "$title" --body "$body" --label "$labels"
}

# Labels (ignore errors if exist)
for label in "P0" "P1" "P2" "agent-ready" "epic" "rust" "typescript" "docs" "examples"; do
  case "$label" in
    P0) color="B60205" ;;
    P1) color="D93F0B" ;;
    P2) color="FBCA04" ;;
    agent-ready) color="0E8A16" ;;
    epic) color="5319E7" ;;
    rust) color="1D76DB" ;;
    typescript) color="3178C6" ;;
    docs) color="0075CA" ;;
    examples) color="C5DEF5" ;;
  esac
  gh label create "$label" --repo "$REPO" --color "$color" --force 2>/dev/null || true
done

echo "Creating issues..."

create_issue "Monorepo scaffold: Cargo workspace + npm workspaces" "$(cat <<'EOF'
## Summary
Bootstrap the monorepo structure per `docs/architecture.md`.

## Acceptance Criteria
- [ ] Root `Cargo.toml` workspace with `crates/core`, `crates/plugin`
- [ ] npm workspaces: `packages/guest`, `packages/sdk`, `packages/inspector-app`
- [ ] Placeholder `examples/react-vite`, `examples/vanilla` directories
- [ ] `bench/` directory stub
- [ ] Synchronized version `0.1.0` across crates/packages
- [ ] `npm run checks` runs (may skip until code exists)
- [ ] README structure matches architecture doc

## References
- docs/architecture.md
- docs/PRD.md

## Labels
P0 — blocks all other work
EOF
)" "P0,agent-ready,epic"

create_issue "crates/core: session model, types, and hub state" "$(cat <<'EOF'
## Summary
Implement canonical Rust types and session state in `crates/core`.

## Acceptance Criteria
- [ ] `ElementSnapshot`, `SelectedElement`, `Capture`, `Session`, `WebViewRegistration` types
- [ ] Session supports unlimited selections and captures
- [ ] `primary_capture_id`, element status (`valid`, `stale_after_reload`, `not_found`, `webview_closed`)
- [ ] Unit tests for session mutations (add/remove element, set primary capture)
- [ ] No Tauri dependency in `crates/core`

## References
- docs/architecture.md#inspector-hub
EOF
)" "P0,agent-ready,rust"

create_issue "crates/core: selector algorithm and stable-class heuristic" "$(cat <<'EOF'
## Summary
Canonical selector builder from `ElementSnapshot` — single source of truth.

## Acceptance Criteria
- [ ] Priority: data-inspector-id > component+id > id > aria > stable class > nth-child
- [ ] Legacy fallback for data-component/data-file (undocumented)
- [ ] Conservative unstable-class detection (hash patterns)
- [ ] Open shadow DOM boundary hints in selector string
- [ ] Unit tests with fixture snapshots (L1, L2, L3 inputs)

## References
- docs/architecture.md#selector-algorithm-rust-canonical
EOF
)" "P0,agent-ready,rust"

create_issue "crates/core: context bundle exporter and relationship calculator" "$(cat <<'EOF'
## Summary
Export fixed English Context Bundle text; compute DOM and visual relationship hints.

## Acceptance Criteria
- [ ] Bundle matches `docs/context-bundle-format.md` examples
- [ ] No Issue block when issue text empty
- [ ] Primary + additional screenshots sections
- [ ] Relationships: DOM parent-child separate from visual overlap/containment
- [ ] Max 20 curated CSS properties per element
- [ ] Unit tests for L1 and L3 bundle output (snapshot tests)

## References
- docs/context-bundle-format.md
EOF
)" "P0,agent-ready,rust"

create_issue "crates/plugin: Tauri plugin registration and Inspector Hub" "$(cat <<'EOF'
## Summary
Tauri 2 plugin with hub as single source of truth; push event broadcast.

## Acceptance Criteria
- [ ] Plugin registers with `tauri-plugin` builder pattern
- [ ] Hub holds `HubState`; thread-safe
- [ ] `on_webview_created` auto-registers webviews
- [ ] Push events to inspector window on state change
- [ ] `getState` for one-time hydration
- [ ] Feature flag `visual-inspector`: off = zero compiled runtime

## References
- docs/architecture.md
EOF
)" "P0,agent-ready,rust"

create_issue "crates/plugin: IPC commands API" "$(cat <<'EOF'
## Summary
Implement all V1 commands per architecture doc.

## Commands
enable, disable, open, close, toggle, capture, revalidate, clearSession, setTargetWebView, pinTargetWebView, unpinTargetWebView, exportContext, getState

## Acceptance Criteria
- [ ] `open()` default autoEnable=false; `open({ autoEnable: true })` enables
- [ ] `disable` removes overlay state but preserves session
- [ ] `toggle` only affects inspector window visibility
- [ ] Integration tests with mock webview

## References
- docs/architecture.md#commands-api
EOF
)" "P0,agent-ready,rust"

create_issue "crates/plugin: security gates and Tauri capabilities" "$(cat <<'EOF'
## Summary
Five-gate AND security model + capability permission sets.

## Acceptance Criteria
- [ ] Gates: feature, enabled, allow, capability, devModeAllowed
- [ ] `allowInProduction` override for release builds
- [ ] Permission sets: visual-editor:default, :inspect, :capture, :all
- [ ] Clear diagnostic log on capability denial
- [ ] Unit tests for each gate combination

## References
- docs/architecture.md#security-model
- docs/PRD.md
EOF
)" "P0,agent-ready,rust"

create_issue "crates/plugin: native screenshot capture and crop" "$(cat <<'EOF'
## Summary
Rust screenshot pipeline: window, webview, element crop, region crop.

## Acceptance Criteria
- [ ] Modes: window, webview, element, region
- [ ] PNG to configurable dir (default AppData/visual-editor/screenshots/)
- [ ] Physical pixel crops with DPR from guest metadata
- [ ] Element crop: default 24px CSS padding, configurable
- [ ] Async with 5s timeout; error preserves session
- [ ] No html2canvas

## References
- docs/architecture.md#screenshot-pipeline
EOF
)" "P1,agent-ready,rust"

create_issue "crates/plugin: clipboard and hard reload" "$(cat <<'EOF'
## Summary
System clipboard (text + PNG) and hard reload orchestration.

## Acceptance Criteria
- [ ] Copy Context Bundle → text clipboard
- [ ] Copy Screenshot Image → PNG image clipboard
- [ ] Copy Screenshot Path → text path
- [ ] Open Screenshot Folder
- [ ] Hard reload: bootstrap re-inject, overlay restore if enabled, selections → stale
- [ ] No auto-revalidate after reload

## References
- docs/architecture.md#hard-reload-lifecycle
EOF
)" "P1,agent-ready,rust"

create_issue "packages/guest: bootstrap, overlay, and selection engine" "$(cat <<'EOF'
## Summary
Injected guest JS: bootstrap, overlay, inspect mode, multi-select, passthrough.

## Acceptance Criteria
- [ ] Minimal bootstrap on enable only (not when disabled)
- [ ] Embedded asset injection via Rust eval (no dynamic import)
- [ ] Inspect mode default; Space/Alt passthrough
- [ ] Click=replace, Shift+click=add/remove, Esc clears hover only
- [ ] Hover upward heuristic per architecture
- [ ] 1px borders, numbered selected labels, no dimming
- [ ] Sends ElementSnapshot to hub on selection

## References
- docs/architecture.md#overlay-interaction
EOF
)" "P0,agent-ready,typescript"

create_issue "packages/guest: DOM measurement and revalidate" "$(cat <<'EOF'
## Summary
Measure bounds, curated computedStyle, visibility; revalidate via querySelector.

## Acceptance Criteria
- [ ] partial visibility: visibleBounds + fullBounds
- [ ] off-viewport: controlled capture failure message
- [ ] revalidate: found → valid; not found → not_found; relationships recalculated in core
- [ ] Max 20 CSS properties sent to hub
- [ ] Shadow DOM: open traverse, closed → hint only

## References
- docs/architecture.md
EOF
)" "P1,agent-ready,typescript"

create_issue "packages/inspector-app: Inspector window UI" "$(cat <<'EOF'
## Summary
React inspector panel: target selector, elements, captures, issue text, actions.

## Acceptance Criteria
- [ ] WebviewWindow label `visual-inspector`, URL `tauri://visual-editor/index.html`
- [ ] Label conflict → clear init error
- [ ] Target dropdown + pin mode
- [ ] Selected elements list with stale/webview_closed badges
- [ ] Capture thumbnails with primary/include controls
- [ ] Buttons: Copy Context Bundle, Copy Screenshot Image, Copy Path, Clear, Enable, Revalidate, Hard Reload
- [ ] German UI per docs/UI_STYLEGUIDE.md
- [ ] getState hydration + push updates only

## References
- docs/UI_STYLEGUIDE.md
EOF
)" "P0,agent-ready,typescript"

create_issue "packages/inspector-app: settings persistence" "$(cat <<'EOF'
## Summary
Persistent settings: theme, shortcut, overlay color, cropPadding, screenshotDir.

## Acceptance Criteria
- [ ] Settings dialog in inspector app
- [ ] Persist to disk across sessions
- [ ] Session-only state NOT persisted (selections, captures, issue)
- [ ] screenshotDir modes: appData, project (needs projectRoot), temp, absolutePath

## References
- docs/architecture.md#settings-persistence
EOF
)" "P1,agent-ready,typescript"

create_issue "packages/sdk: framework-neutral metadata helpers" "$(cat <<'EOF'
## Summary
Optional SDK for data-inspector-* attributes.

## Exports
- setInspectorMetadata(element, metadata)
- getInspectorMetadata(element)
- createInspectorAttributes(metadata)
- Optional InspectorMeta React component (peer dependency)

## Acceptance Criteria
- [ ] Framework-neutral core works without React
- [ ] Canonical attribute names per PRD
- [ ] README with usage examples

## References
- docs/plugin-api.md
EOF
)" "P1,agent-ready,typescript"

create_issue "examples/react-vite: reference host app integration" "$(cat <<'EOF'
## Summary
Release-blocker example demonstrating full plugin integration with React + Vite.

## Acceptance Criteria
- [ ] Tauri 2 app with plugin registered
- [ ] Dev capability with visual-editor:all
- [ ] Sample UI with data-inspector-* via SDK
- [ ] Multi-webview demo (main + modal) optional but recommended
- [ ] Documented dev workflow: enable + open
- [ ] Runs with `npm run tauri dev`

## References
- docs/PRD.md (release blockers)
EOF
)" "P0,agent-ready,examples"

create_issue "examples/vanilla: reference host app without framework" "$(cat <<'EOF'
## Summary
Release-blocker example with vanilla JS host app.

## Acceptance Criteria
- [ ] Tauri 2 app with plugin registered
- [ ] Manual data-inspector-* attributes in HTML
- [ ] L1 DOM-only workflow demonstrable
- [ ] Runs with `npm run tauri dev`

## References
- docs/PRD.md
EOF
)" "P0,agent-ready,examples"

create_issue "bench: idle overhead benchmark script" "$(cat <<'EOF'
## Summary
Documented performance verification per PRD.

## Acceptance Criteria
- [ ] `bench/idle-overhead.ts` measures feature-off, feature-on-disabled, enabled-idle
- [ ] Targets: <0.05% CPU, <100KB heap (documented, not CI gate)
- [ ] README in bench/ explaining how to run locally
- [ ] Uses examples/react-vite as host

## References
- docs/PRD.md#akzeptanzkriterien
EOF
)" "P1,agent-ready"

create_issue "CI: smoke tests and checks pipeline" "$(cat <<'EOF'
## Summary
GitHub Actions for build smoke tests on PRs.

## Acceptance Criteria
- [ ] Workflow: cargo fmt, clippy, test
- [ ] Workflow: npm typecheck (when packages exist)
- [ ] Runs on push/PR to main
- [ ] CPU/heap benchmarks NOT in CI (documented limitation)

## References
- scripts/run-checks.sh
EOF
)" "P1,agent-ready"

create_issue "docs: complete plugin-api.md and integration guide" "$(cat <<'EOF'
## Summary
Finalize public API documentation for host app integrators.

## Acceptance Criteria
- [ ] Full registration steps (Rust + TS + capabilities + config)
- [ ] All commands documented with parameters
- [ ] Security gates explained with examples
- [ ] Troubleshooting: CSP, capability errors, label conflicts
- [ ] Cross-link from README

## References
- docs/plugin-api.md (stub)
EOF
)" "P2,agent-ready,docs"

echo "Done. Issues created at https://github.com/$REPO/issues"
