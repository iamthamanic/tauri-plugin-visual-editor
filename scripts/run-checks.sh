#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> npm: bundle guest runtime"
npm run bundle --workspace=@tauri-plugin/visual-editor --if-present

echo "==> npm: build inspector assets"
npm run build:inspector --if-present

echo "==> npm: build SDK (types for examples)"
npm run build --workspace=@tauri-plugin/visual-editor-sdk --if-present

echo "==> Rust: fmt check"
cargo fmt --all -- --check

echo "==> Rust: clippy"
cargo clippy -p tauri-plugin-visual-editor --features visual-inspector -- -D warnings

echo "==> Rust: test"
cargo test -p tauri-plugin-visual-editor-core
cargo test -p tauri-plugin-visual-editor --features visual-inspector

echo "==> npm: typecheck"
npm run typecheck --workspaces --if-present

echo "==> npm: test"
npm run test --workspace=@tauri-plugin/visual-editor --if-present
npm run test --workspace=@tauri-plugin/visual-editor-sdk --if-present

echo "==> All checks passed (or skipped pending scaffold)"
