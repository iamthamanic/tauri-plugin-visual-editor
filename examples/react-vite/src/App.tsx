/**
 * Main demo page for the react-vite reference host app.
 * Location: examples/react-vite/src/App.tsx
 */

import { InspectorMeta } from '@tauri-plugin/visual-editor-sdk/react';
import { DemoCard } from './components/DemoCard';
import { openModalWebview } from './lib/openModalWebview';

export function App() {
  return (
    <main className="layout">
      <h1>Visual Editor — React + Vite Demo</h1>
      <p className="muted">
        Das Plugin-Overlay erscheint nur in der <strong>Tauri Desktop-App</strong> (nicht im Browser).
        Starte mit <code>npm run tauri:dev</code> — rechts schwebt die Icon-Leiste.
      </p>

      <div style={{ display: 'grid', gap: 16, marginBottom: 20 }}>
        <InspectorMeta component="DemoCard" file="src/components/DemoCard.tsx" id="demo-card-main">
          <DemoCard
            title="Haupt-WebView"
            description="Dieses Element trägt data-inspector-* Attribute über das SDK."
          />
        </InspectorMeta>

        <InspectorMeta component="HeroPanel" file="src/App.tsx" id="hero-panel" entity="landing">
          <section className="card">
            <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>Hero-Bereich</h2>
            <p style={{ margin: 0, fontSize: 14, color: '#656d76' }}>
              Zweites annotiertes Element mit entity=&quot;landing&quot;.
            </p>
          </section>
        </InspectorMeta>
      </div>

      <button type="button" onClick={() => void openModalWebview()}>
        Modal-WebView öffnen
      </button>
    </main>
  );
}
