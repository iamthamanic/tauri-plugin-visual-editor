#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> npm: bundle guest runtime"
npm run bundle --workspace=@tauri-plugin/visual-editor --if-present

echo "==> Rust: fmt check"
cargo fmt --all -- --check

echo "==> Rust: clippy"
cargo clippy --workspace -- -D warnings

echo "==> Rust: test"
cargo test --workspace

echo "==> npm: typecheck"
npm run typecheck --workspaces --if-present

echo "==> npm: test"
npm run test --workspace=@tauri-plugin/visual-editor --if-present

echo "==> All checks passed (or skipped pending scaffold)"
