# Issue #10 — Guest bootstrap, overlay, selection

## Done
- Guest runtime: hover heuristic, overlay boxes, selection engine
- Space/Alt passthrough, Shift toggle, Esc clears hover
- `report_selection` IPC → core selector + hub session
- Rust `webview` module injects bundled IIFE on enable/disable
- esbuild bundle → `crates/plugin/guest/guest-runtime.iife.js`
