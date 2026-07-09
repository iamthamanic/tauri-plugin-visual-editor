# PRD — Tauri Visual Editor (Visual Inspector)

## Status

**v0.2** — nach Grill-Session finalisiert (2026-07-09)

**Repository:** [iamthamanic/tauri-plugin-visual-editor](https://github.com/iamthamanic/tauri-plugin-visual-editor)

---

## Vision

Ein universelles Tauri-2-Plugin, das eine visuelle Entwickleroberfläche für Desktop-Anwendungen bereitstellt.

Ziel: Den Workflow moderner AI-Editoren (z. B. Cursor Visual Editor) für Tauri-Apps verfügbar machen — **ohne** den Editor nachzubauen.

Das Plugin ist eine **Brücke** zwischen einer laufenden Tauri-Anwendung und einem AI-Codeeditor. Entwickler wählen UI-Elemente aus, erstellen Screenshots und kopieren strukturierte **Context Bundles** in Tools wie Cursor.

---

## Problem Statement

Entwickler können Desktop-UIs nicht direkt inspizieren und referenzieren. Der heutige Workflow (manueller Screenshot, DOM suchen, Prompt schreiben, Cursor öffnen) kostet bei komplexen Kreativanwendungen viel Zeit.

Es fehlen:

- visuelle Elementauswahl
- automatische Screenshots
- strukturierte Referenzen (Context Bundle)
- copy-paste-fertige AI-Kontexte
- wiederverwendbare Dev-Tools für Tauri

---

## Ziel

Ein Plugin, das in Tauri-2-Apps eingebunden wird und folgende Fähigkeiten bereitstellt:

- UI inspizieren
- Elemente markieren (Multi-Selection)
- Screenshots erzeugen
- technische Referenzen sammeln
- Context Bundles kopieren
- Entwicklung beschleunigen

### Nicht-Ziele

- Kein Cursor-Ersatz
- Keine automatische Codeänderung
- Keine AI im Plugin
- Keine IDE
- Kein Tauri 1
- Kein Tray-only / native UI ohne WebView

---

## Users

| Rolle | Bedarf |
|-------|--------|
| **Tauri-Entwickler** | UI-Elemente finden, Screenshots, AI-Kontext für Cursor |
| **Host-App-Integrator** | Plugin konfigurieren, Permissions, optional SDK-Metadaten |

---

## Kernkonzept: Context Bundle

Der Hauptoutput ist **kein Prompt Generator**, sondern ein **Context Bundle**:

- Objektive technische Fakten (Target, Screenshots, Elemente, Relationships)
- Englische Ausgabe
- Optionaler Issue-Text nur wenn User ihn im Inspector-Fenster eingibt
- Zwei Paste-Aktionen in Cursor: **Copy Context Bundle** (Text) + **Copy Screenshot Image** (PNG)

---

## User Journey

1. Plugin installieren (`cargo add tauri-plugin-visual-editor`, `npm install @tauri-plugin/visual-editor`)
2. App starten (`npm run tauri dev`)
3. Inspector aktivieren: `invoke("plugin:visual-editor|enable")` + `open()`
4. Target-WebView wählen (Auto-Focus oder Pin Mode)
5. Elemente per Hover/Klick selektieren (Shift+Click = Multi-Select)
6. Screenshot erstellen
7. **Copy Context Bundle** → in Cursor einfügen
8. **Copy Screenshot Image** → Bild in Cursor einfügen
9. Problem in Cursor beschreiben

---

## Functional Requirements (V1)

### Inspector Mode

- aktivieren / deaktivieren
- Overlay (Hover, Bounding Boxes, Selection)
- Inspect Mode default; Space/Alt = Passthrough zur Host-App
- Esc: Hover weg, Selections bleiben, Inspector bleibt enabled

### Multi Selection

- Click = ersetzen
- Shift+Click = addieren / entfernen
- Clear nur im Inspector-Fenster

### Screenshot

| Modus | Engine |
|-------|--------|
| Gesamtes OS-Fenster | Rust |
| Aktive Target-WebView | Rust |
| Element-Crop (+ Padding) | Rust + JS (Koordinaten) |
| Freihand-Region | Rust + JS |

- PNG only
- Physical pixels; CSS + physical bounds im Bundle
- Primary Capture + Attachments (Include/Exclude)

### Reference Builder / Context Bundle

- Festes englisches Text-Format
- Metadaten-Stufen: L1 DOM → L2 `data-inspector-*` → L3 SDK
- Kuratierte CSS (max 20 Properties/Element)
- Selector-Priorität: `data-inspector-id` > id > aria > stable class > nth-child
- Relationship Hints: DOM und Visual getrennt

### Clipboard

- Copy Context Bundle (Text + Pfade)
- Copy Screenshot Image (PNG in Clipboard)
- Copy Screenshot Path
- Open Screenshot Folder

### Hard Reload

- WebView reload; Bootstrap re-inject
- Session bleibt; Selections → `stale_after_reload`
- Manuelle Revalidate

### Settings (V1, persistent)

- Theme (system/light/dark)
- Shortcut (konfigurierbar)
- Overlay Color
- cropPadding (0|8|16|24|48, default 24)
- screenshotDir (appData|project|temp|absolutePath)

### Session (ephemeral)

- selectedElements, captures, issueText, activeTarget, pinTarget
- Überlebt Inspector-Fenster schließen; verworfen bei App-Neustart
- Unbegrenzte Größe

---

## Akzeptanzkriterien

| Bereich | Kriterium |
|---------|-----------|
| Inspector | Hover, Highlight, Klick speichert Element |
| Multi-Select | Shift+Click add/remove |
| Screenshot | Erstellt, gespeichert, referenzierbar im Bundle |
| Context Bundle | Copy erzeugt vollständigen technischen Kontext |
| Hard Reload | Funktioniert; Inspector bleibt aktiv; stale-Markierung |
| Performance | Feature off = null Overhead; enabled idle dokumentiert <0.05% CPU, <100KB heap |
| Security | 5 Gates; Production ohne explizites Opt-in blockiert |

---

## Technische Constraints

- **Tauri 2 only** (aktuelle Minor)
- Single/Multi-Window; mehrere WebViews; je WebView eine Runtime-Instanz
- Ein globales Inspector-Fenster + Hub als Source of Truth
- Framework-agnostisch (DOM ist Wahrheit)
- Kein html2canvas
- CSP-strikte Apps: dokumentierte V1-Einschränkung

Siehe [architecture.md](./architecture.md) für Details.

---

## Security (5 Gates, alle UND)

1. Cargo Feature `visual-inspector`
2. Runtime `enabled: true`
3. Runtime `allow: true`
4. Tauri Capability (Permission-Sets)
5. `devModeAllowed` (Debug=true, Release=false; Override: `allowInProduction: true`)

---

## Repository-Struktur

```
tauri-plugin-visual-editor/
├── crates/
│   ├── plugin/          # Tauri plugin, hub, commands
│   └── core/            # Session, selector, bundle export
├── packages/
│   ├── guest/           # @tauri-plugin/visual-editor (injected)
│   ├── sdk/             # Metadata helpers
│   └── inspector-app/   # Inspector window UI
├── examples/
│   ├── react-vite/      # Release-Blocker
│   └── vanilla/         # Release-Blocker
├── bench/
├── docs/
└── .qa/
```

Synchron versioning: `0.1.0` über alle Packages.

---

## Edge Cases (V1)

| Fall | Verhalten |
|------|-----------|
| Closed Shadow DOM | Hinweis im Bundle; kein inner Selector |
| Open Shadow DOM | Traversieren mit boundary hint |
| Cross-origin iframe | Nicht inspizierbar; dokumentiert |
| Canvas/WebGL | Element = canvas; L3/SDK für Semantik |
| WebView zerstört | `webview_closed`; Selection exportierbar |
| Element off-viewport | Kein Auto-Scroll; partial/off-screen Fehler |

---

## Roadmap

### V1 (dieses PRD)

Inspector, Selection, Screenshots, Context Bundle, Clipboard, Hard Reload, Settings, react-vite + vanilla examples, benchmark script

### V2

Element History, Annotations, Screenshot Diff, Export Templates, Multi-Format Clipboard, Language setting, svelte/vue examples

### V3

MCP Integration, Cursor Deep Link, AI Session Export, Layout Diffing, Visual Regression

---

## Open Questions

- Exakte Regex für instabile CSS-Klassen → Implementierungsdetail in `crates/core`
- Shadow-DOM Selector-Syntax → `architecture.md`

---

## Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| v0.1 | — | Initial draft |
| v0.2 | 2026-07-09 | Grill-Session: Context Bundle, 5 Gates, Hub-Architektur, npm scope |
