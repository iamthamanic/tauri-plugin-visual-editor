/**
 * In-app idle heap sampler for bench/idle-overhead.ts workflow.
 * Location: examples/react-vite/src/bench.tsx
 */

import { invoke } from '@tauri-apps/api/core';
import { createRoot } from 'react-dom/client';
import { useRef, useState } from 'react';

const PLUGIN = 'plugin:visual-editor';

type Row = {
  scenario: string;
  heapKb: number;
  at: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sampleHeap(): number {
  const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
  if (!memory) {
    return 0;
  }
  return Math.round(memory.usedJSHeapSize / 1024);
}

function BenchApp() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const running = useRef(false);

  async function runBench(): Promise<void> {
    if (running.current) {
      return;
    }
    running.current = true;
    setBusy(true);
    setRows([]);
    const collected: Row[] = [];

    try {
      await invoke(`${PLUGIN}|disable`);
      await sleep(3000);
      collected.push({
        scenario: 'feature-on-disabled',
        heapKb: sampleHeap(),
        at: new Date().toISOString(),
      });

      await invoke(`${PLUGIN}|enable`);
      await sleep(3000);
      collected.push({
        scenario: 'enabled-idle',
        heapKb: sampleHeap(),
        at: new Date().toISOString(),
      });

      setRows(collected);
      for (const row of collected) {
        console.log(`BENCH_SAMPLE:${JSON.stringify(row)}`);
      }
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 560 }}>
      <h1>Idle Benchmark</h1>
      <p style={{ color: '#656d76' }}>
        Misst JS-Heap nach 3s Idle. CPU manuell via Activity Monitor. Ziele: &lt;100KB heap, &lt;0.05% CPU.
      </p>
      <button type="button" disabled={busy} onClick={() => void runBench()}>
        {busy ? 'Läuft…' : 'Benchmark starten'}
      </button>
      <ul>
        {rows.map((row) => (
          <li key={row.scenario}>
            <code>{row.scenario}</code>: {row.heapKb} KB — {row.at}
          </li>
        ))}
      </ul>
      {rows.length > 0 ? (
        <pre style={{ background: '#f6f8fa', padding: 12, fontSize: 12 }}>
          {rows
            .map((row) => `npm run bench:idle -- record ${row.scenario} ${row.heapKb}`)
            .join('\n')}
        </pre>
      ) : null}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<BenchApp />);
