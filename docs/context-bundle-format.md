# Context Bundle Format (V1)

Canonical copy-paste output for AI editors. English only in V1.

---

## L1 Example (DOM only)

```txt
TAURI VISUAL INSPECTOR CONTEXT

Target:
- Window: main
- WebView: main-webview
- URL: tauri://localhost/
- Captured at: 2026-07-09T13:42:18+02:00

Primary screenshot:
- Path: /Users/ben/Library/Application Support/app/visual-editor/screenshots/shot_2026-07-09_134218.png
- Type: webview
- DPR: 2
- Screenshot size: 2880x1800 physical px
- Viewport size: 1440x900 CSS px

Selected elements:

Element 1
- Component: unknown
- File: unknown
- Inspector ID: unknown
- Tag: button
- Text: "Export"
- Selector: body > div:nth-child(1) > main:nth-child(2) > div:nth-child(4) > button:nth-child(3)
- DOM path: html > body > div#root > main > div.toolbar > button
- Visibility: visible
- CSS bounds: x=1184 y=24 w=96 h=40
- Physical bounds: x=2368 y=48 w=192 h=80
- Computed layout:
  display: flex
  position: relative
  z-index: auto
  overflow: visible
  pointer-events: auto
  opacity: 1
  transform: none
```

---

## L3 Example (with metadata)

```txt
TAURI VISUAL INSPECTOR CONTEXT

Target:
- Window: main
- WebView: editor-modal
- URL: tauri://localhost/editor
- Captured at: 2026-07-09T13:46:03+02:00

Primary screenshot:
- Path: /Users/ben/Library/Application Support/app/visual-editor/screenshots/modal_2026-07-09_134603.png
- Type: element-crop
- DPR: 2
- Screenshot size: 1240x640 physical px
- Viewport size: 1440x900 CSS px
- Crop padding: 24 CSS px

Selected elements:

Element 1
- Component: TimelineClip
- File: src/features/timeline/components/TimelineClip.tsx
- Inspector ID: timeline.clip.clip_123
- Entity: clip_123
- Tag: div
- Text: "Scene 04"
- Selector: [data-inspector-id="timeline.clip.clip_123"]
- Visibility: visible
- CSS bounds: x=312 y=481 w=220 h=48
- Physical bounds: x=624 y=962 w=440 h=96
- Crop bounds: x=288 y=457 w=268 h=96
- Computed layout:
  display: flex
  position: absolute
  z-index: 30
  overflow: hidden
  pointer-events: auto
  opacity: 1
  transform: translate3d(0px, 0px, 0px)

Element 2
- Component: SceneRow
- File: src/features/timeline/components/SceneRow.tsx
- Inspector ID: timeline.scene.scene_04
- Entity: scene_04
- Tag: div
- Text: "Scene 04"
- Selector: [data-inspector-id="timeline.scene.scene_04"]
- Visibility: visible
- CSS bounds: x=280 y=510 w=980 h=64
- Physical bounds: x=560 y=1020 w=1960 h=128
- Computed layout:
  display: grid
  position: relative
  z-index: 1
  overflow: visible
  pointer-events: auto
  opacity: 1
  transform: none

Relationships:

DOM:
- Element 1 is not a DOM parent of Element 2

Visual:
- Element 1 visually overlaps Element 2
- Element 1 bottom edge: 529 CSS px
- Element 2 top edge: 510 CSS px
- Overlap: 19 CSS px

Issue:
Timeline clip overlaps scene row after resize.
```

---

## Rules

- No placeholder `Issue:` block when user did not enter issue text
- Primary screenshot listed first; additional captures under `Additional screenshots:` when included
- `partially_visible` / `outside_viewport` / `webview_closed` / `stale_after_reload` as status fields on elements
- Computed layout: max 20 curated properties per element
