# Feature: CI smoke tests and checks pipeline

## Intent
GitHub Actions runs the same smoke checks as `scripts/run-checks.sh` on every push and PR to `main`.

## Happy Path
- [x] Workflow: cargo fmt, clippy, test
- [x] Workflow: npm typecheck (when packages exist)
- [x] Runs on push/PR to main
- [x] CPU/heap benchmarks NOT in CI (documented limitation)
