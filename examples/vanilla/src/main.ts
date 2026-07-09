/**
 * Vanilla host demo — inspector controls and status feedback.
 * Location: examples/vanilla/src/main.ts
 */

import { invoke } from '@tauri-apps/api/core';

const PLUGIN = 'plugin:visual-editor';
const status = document.getElementById('status');

async function run(label: string, fn: () => Promise<unknown>): Promise<void> {
  if (!status) {
    return;
  }
  status.textContent = '';
  try {
    await fn();
    status.textContent = label;
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : 'Aktion fehlgeschlagen';
  }
}

document.getElementById('btn-enable')?.addEventListener('click', () => {
  void run('Inspector aktiviert', () => invoke(`${PLUGIN}|enable`));
});

document.getElementById('btn-open')?.addEventListener('click', () => {
  void run('Inspector-Fenster geöffnet', () =>
    invoke(`${PLUGIN}|open`, { options: { autoEnable: true } }),
  );
});

document.getElementById('btn-toggle')?.addEventListener('click', () => {
  void run('Inspector umgeschaltet', () => invoke(`${PLUGIN}|toggle`));
});
