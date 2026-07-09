# Idle overhead benchmarks

Measures plugin overhead per [docs/PRD.md](../docs/PRD.md):

| Scenario | Description |
|----------|-------------|
| `feature-off` | Plugin not compiled (`visual-inspector` feature disabled) |
| `feature-on-disabled` | Plugin loaded, inspector disabled — no webview injection |
| `enabled-idle` | Inspector enabled, no user interaction for 3s |

**Documented targets (not CI-gated):** &lt;0.05% idle CPU, &lt;100KB heap.

## Prerequisites

```bash
npm install
npm run build:guest
npm run build:inspector
cd examples/react-vite && npm run tauri:dev
```

## Automated heap sampling (in-app)

1. Open `http://localhost:1420/bench.html` in the running Tauri app
2. Click **Benchmark starten** — runs disable/enable idle samples
3. Copy the printed JSON lines or read heap values from the page

## CLI workflow

```bash
# Show methodology
npm run bench:idle -- plan

# Record samples (heap in KB from bench.html or DevTools performance.memory)
npm run bench:idle -- record feature-on-disabled 12
npm run bench:idle -- record enabled-idle 48 0.02

# Compare against targets
npm run bench:idle -- report
```

Samples are stored in `bench/results.json` (gitignored).

## feature-off scenario

Build `examples/react-vite` with `visual-inspector` disabled in `src-tauri/Cargo.toml`, then measure baseline CPU/heap with Activity Monitor. Record manually:

```bash
npm run bench:idle -- record feature-off 0 0.01
```

CPU measurement is manual (Activity Monitor / Instruments) — the in-app probe only reports JS heap.
