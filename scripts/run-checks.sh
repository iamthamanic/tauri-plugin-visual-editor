#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Rust: fmt check"
cargo fmt --all -- --check

echo "==> Rust: clippy"
cargo clippy --workspace -- -D warnings

echo "==> Rust: test"
cargo test --workspace

echo "==> npm: typecheck"
npm run typecheck --workspaces --if-present

echo "==> All checks passed (or skipped pending scaffold)"
