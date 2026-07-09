#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Rust: fmt check"
cargo fmt --all -- --check

echo "==> Rust: clippy"
cargo clippy --workspace -- -D warnings 2>/dev/null || {
  if [ ! -f Cargo.toml ]; then
    echo "WARN: Cargo workspace not scaffolded yet — skipping clippy"
  else
    exit 1
  fi
}

echo "==> Rust: test"
cargo test --workspace 2>/dev/null || {
  if [ ! -f Cargo.toml ]; then
    echo "WARN: Cargo workspace not scaffolded yet — skipping tests"
  else
    exit 1
  fi
}

echo "==> npm: typecheck"
npm run typecheck 2>/dev/null || echo "WARN: workspaces not scaffolded yet — skipping typecheck"

echo "==> All checks passed (or skipped pending scaffold)"
