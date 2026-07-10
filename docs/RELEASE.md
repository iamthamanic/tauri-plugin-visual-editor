# Release process — v0.1.x

Scriptony and other hosts consume **published** artifacts. QA for releases is done in Scriptony (no separate example smoke gate).

## What gets published

| Artifact | Registry | Consumers |
|----------|----------|-----------|
| `tauri-plugin-visual-editor-core` | crates.io | Plugin crate (transitive) |
| `tauri-plugin-visual-editor` | crates.io | Host `Cargo.toml` (includes guest JS + inspector assets) |
| `@tauri-plugin/visual-editor-sdk` | npm | Optional `InspectorMeta` in host frontend |

Not published to npm for hosts: `@tauri-plugin/visual-editor` (guest) — embedded in the Rust crate.

## Prerequisites (one-time)

1. crates.io account + API token → GitHub secret `CARGO_REGISTRY_TOKEN`
2. npm account + token → GitHub secret `NPM_TOKEN`
3. `cargo login` / `npm login` for manual publishes

## Release steps

### 1. Bump version (keep in sync)

All at the same version, e.g. `0.1.1`:

- `Cargo.toml` (`[workspace.package] version`)
- `packages/sdk/package.json`
- `packages/guest/package.json` (monorepo only)
- `CHANGELOG.md`

### 2. Run checks in this repo

```bash
npm run checks
```

### 3. Commit, tag, push

```bash
git add -A
git commit -m "chore: release v0.1.1"
git tag v0.1.1
git push origin main --tags
```

### 4. CI publish (preferred)

Tag push `v*` triggers [.github/workflows/release.yml](../.github/workflows/release.yml):

1. Build guest bundle + inspector dist
2. `cargo publish -p tauri-plugin-visual-editor-core`
3. `cargo publish -p tauri-plugin-visual-editor --features visual-inspector`
4. `npm publish` for `@tauri-plugin/visual-editor-sdk`

### 5. Update Scriptony

```bash
cd /path/to/scriptony
cargo update -p tauri-plugin-visual-editor
npm update @tauri-plugin/visual-editor-sdk   # if used
```

Or merge the Dependabot PR.

## Manual publish (fallback)

```bash
npm run bundle --workspace=@tauri-plugin/visual-editor
npm run build:inspector
cargo publish -p tauri-plugin-visual-editor-core
# wait ~30s for crates.io index
cargo publish -p tauri-plugin-visual-editor --features visual-inspector
npm run build --workspace=@tauri-plugin/visual-editor-sdk
npm publish --workspace=@tauri-plugin/visual-editor-sdk
```

## First release (0.1.0)

First `cargo publish` for a crate name claims it on crates.io. Run manually once if CI secrets are not ready yet.
