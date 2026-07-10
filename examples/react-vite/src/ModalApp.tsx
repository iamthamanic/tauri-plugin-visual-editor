/**
 * Content shown inside the optional modal WebView window.
 * Location: examples/react-vite/src/ModalApp.tsx
 */

import { InspectorMeta } from '@iamthamanic/visual-editor-sdk/react';
import { DemoCard } from './components/DemoCard';

export function ModalApp() {
  return (
    <main className="layout">
      <h1>Modal WebView</h1>
      <p className="muted">Separates Fenster — Ziel-WebView im Inspector umschaltbar.</p>
      <InspectorMeta component="ModalCard" file="src/ModalApp.tsx" id="demo-card-modal">
        <DemoCard
          title="Modal-Inhalt"
          description="Element im zweiten WebView für Multi-Target-Demos."
        />
      </InspectorMeta>
    </main>
  );
}
