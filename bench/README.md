# Idle overhead benchmarks

Measures plugin overhead per PRD:

- feature off: no plugin activity
- feature on, disabled: no webview injection
- enabled idle: CPU/heap snapshot (documented targets)

## Run

```bash
# Full benchmark script lands in issue #17
npx tsx bench/idle-overhead.ts
```

Targets (documented, not CI-gated): <0.05% idle CPU, <100KB heap.
