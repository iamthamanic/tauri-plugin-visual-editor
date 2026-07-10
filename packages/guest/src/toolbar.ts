/**
 * In-webview floating toolbar — no host React required.
 * Location: packages/guest/src/toolbar.ts
 */

import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import {
  ICON_CHEVRON_DOWN,
  ICON_CHEVRON_UP,
  ICON_CONTEXT,
  ICON_DEVTOOLS,
  ICON_GRIP,
  ICON_INSPECT_PICKER,
  ICON_RELOAD,
  ICON_SCREENSHOT,
} from './toolbar-icons.js';
import { renderCaptureChip } from './toolbar-captures.js';
import { markCaptureHideRoot } from './capture-ui.js';
import {
  ensureComposerTail,
  extractComposerText,
  extractComposerBlocks,
  focusComposerAtChip,
  insertChipAtRange,
  isComposerChipNode,
  normalizeComposerInlines,
  restoreComposerCaret,
  saveComposerCaret,
  sanitizeComposerWhileTyping,
  setupComposerChipKeydown,
  setupComposerDropTarget,
} from './composer-flow.js';
import type { HubSnapshot, SelectedElement } from './toolbar-types.js';
import {
  attachTooltip,
  createPanelButton,
  iconButton,
  makeDraggable,
  renderChip,
  runClearWipe,
  showCopySuccess,
} from './toolbar-ui.js';

const PLUGIN = 'plugin:visual-editor';
const COMPOSER_PLACEHOLDER = 'Write some context...';

function syncComposerPlaceholder(composer: HTMLElement): void {
  const hasChips = Boolean(
    composer.querySelector('[data-visual-editor-chip], [data-visual-editor-capture-chip]'),
  );
  const hasText = extractComposerText(composer).trim().length > 0;
  composer.dataset.empty = hasText || hasChips ? 'false' : 'true';
}
const STATE_EVENT = 'visual-editor://state-updated';
const ROOT_ID = 'visual-editor-toolbar-root';

type ToolbarOptions = {
  onPickerChange?: (enabled: boolean) => void;
  onChipFocus?: (element: SelectedElement) => void;
};

export class InspectorToolbar {
  private root: HTMLDivElement | null = null;
  private shell: HTMLDivElement | null = null;
  private body: HTMLDivElement | null = null;
  private panel: HTMLDivElement | null = null;
  private composerBox: HTMLDivElement | null = null;
  private composerFlow: HTMLDivElement | null = null;
  private messageEl: HTMLSpanElement | null = null;
  private copyBtn: HTMLButtonElement | null = null;
  private pickerBtn: HTMLButtonElement | null = null;
  private panelBtn: HTMLButtonElement | null = null;
  private collapseBtn: HTMLButtonElement | null = null;
  private devtoolsBtn: HTMLButtonElement | null = null;
  private headerTitle: HTMLSpanElement | null = null;
  private nav: HTMLElement | null = null;
  private panelOpen = false;
  private collapsed = false;
  private pickerEnabled = false;
  private prevSelectionCount = 0;
  private prevCaptureCount = 0;
  private captureCacheBust = new Map<string, number>();
  private state: HubSnapshot | null = null;
  private unlisten: UnlistenFn | null = null;
  private issueTimer: ReturnType<typeof setTimeout> | null = null;
  private messageTimer: ReturnType<typeof setTimeout> | null = null;
  private pickerAutoDisabledForTyping = false;
  private options: ToolbarOptions;

  constructor(options: ToolbarOptions = {}) {
    this.options = options;
  }

  async open(): Promise<void> {
    if (this.root) {
      this.root.style.display = 'block';
      return;
    }
    await new Promise<void>((resolve) => {
      const mountNow = (): void => {
        this.mount();
        resolve();
      };
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(mountNow, { timeout: 50 });
      } else {
        setTimeout(mountNow, 0);
      }
    });
    await this.refreshState();
    this.unlisten = await listen<HubSnapshot>(STATE_EVENT, (event) => {
      this.state = event.payload;
      this.syncUi();
    });
  }

  close(): void {
    if (this.root) {
      this.root.style.display = 'none';
    }
  }

  destroy(): void {
    this.unlisten?.();
    this.unlisten = null;
    this.root?.remove();
    this.root = null;
    this.shell = null;
    this.panel = null;
  }

  private async refreshState(): Promise<void> {
    try {
      this.state = await invoke<HubSnapshot>(`${PLUGIN}|get_state`);
      this.syncUi();
    } catch {
      // gates may block before host config is ready
    }
  }

  private mount(): void {
    const root = document.createElement('div');
    root.id = ROOT_ID;
    root.setAttribute('data-visual-editor-toolbar', 'true');
    root.setAttribute('data-visual-editor-ui', 'true');
    markCaptureHideRoot(root);
    Object.assign(root.style, {
      position: 'fixed',
      top: '8px',
      right: '8px',
      zIndex: '2147483647',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      pointerEvents: 'none',
    });

    const shell = document.createElement('div');
    shell.setAttribute('data-visual-editor-ui', 'true');
    Object.assign(shell.style, {
      display: 'flex',
      flexDirection: 'column',
      width: 'fit-content',
      borderRadius: '12px',
      border: '1px solid #3d3d3d',
      background: 'rgba(26,26,26,0.96)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      pointerEvents: 'auto',
      overflow: 'hidden',
    });

    const header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '6px',
      padding: '4px 8px',
      borderBottom: '1px solid #3d3d3d',
      background: '#1a1a1a',
      userSelect: 'none',
    });

    const grip = document.createElement('span');
    grip.innerHTML = ICON_GRIP;
    grip.style.display = 'flex';
    grip.style.color = '#8b949e';
    attachTooltip(grip, 'Overlay verschieben');

    const headerTitle = document.createElement('span');
    headerTitle.textContent = 'Visual Inspector';
    this.headerTitle = headerTitle;
    Object.assign(headerTitle.style, {
      flex: '1',
      fontSize: '10px',
      color: '#8b949e',
      textAlign: 'center',
    });

    this.collapseBtn = document.createElement('button');
    this.collapseBtn.type = 'button';
    this.collapseBtn.innerHTML = ICON_CHEVRON_UP;
    Object.assign(this.collapseBtn.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '24px',
      height: '24px',
      border: 'none',
      borderRadius: '6px',
      background: 'transparent',
      color: '#e6edf3',
      cursor: 'pointer',
      transition: 'background 0.15s ease',
    });
    this.collapseBtn.addEventListener('mouseenter', () => {
      this.collapseBtn!.style.background = '#2a2a2a';
    });
    this.collapseBtn.addEventListener('mouseleave', () => {
      this.collapseBtn!.style.background = 'transparent';
    });
    attachTooltip(this.collapseBtn, 'Overlay einklappen');
    this.collapseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.setCollapsed(!this.collapsed);
    });

    header.append(grip, headerTitle, this.collapseBtn);
    makeDraggable(shell, header);

    this.body = document.createElement('div');
    Object.assign(this.body.style, {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      padding: '8px',
      width: 'fit-content',
    });

    this.panel = document.createElement('div');
    this.panel.setAttribute('data-visual-editor-ui', 'true');
    Object.assign(this.panel.style, {
      display: 'none',
      flexDirection: 'column',
      width: '280px',
      minHeight: '300px',
      padding: '10px',
      borderRadius: '10px',
      border: '1px solid #3d3d3d',
      background: '#0d1117',
      color: '#e6edf3',
    });

    this.composerBox = document.createElement('div');
    this.composerBox.setAttribute('data-visual-editor-ui', 'true');
    Object.assign(this.composerBox.style, {
      position: 'relative',
      flex: '1 1 auto',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '180px',
      marginBottom: '8px',
      borderRadius: '6px',
      border: '1px solid #3d3d3d',
      background: '#161b22',
      overflow: 'hidden',
    });

    this.composerFlow = document.createElement('div');
    this.composerFlow.setAttribute('contenteditable', 'true');
    this.composerFlow.setAttribute('data-visual-editor-composer', 'true');
    this.composerFlow.setAttribute('data-placeholder', COMPOSER_PLACEHOLDER);
    Object.assign(this.composerFlow.style, {
      display: 'block',
      flex: '1 1 auto',
      minHeight: '160px',
      padding: '8px',
      outline: 'none',
      color: '#e6edf3',
      fontSize: '12px',
      lineHeight: '1.5',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      cursor: 'text',
      overflowY: 'auto',
    });
    syncComposerPlaceholder(this.composerFlow);
    ensureComposerTail(this.composerFlow);
    this.composerFlow.addEventListener('mousedown', (event) => {
      if (event.button !== 0) return;
      const hit = document.elementFromPoint(event.clientX, event.clientY);
      const chip = hit?.closest('[data-visual-editor-chip], [data-visual-editor-capture-chip]');
      if (!(chip instanceof HTMLElement) || !this.composerFlow!.contains(chip)) return;
      event.preventDefault();
      focusComposerAtChip(this.composerFlow!, event.clientX, event.clientY);
    });
    setupComposerDropTarget(this.composerFlow);
    setupComposerChipKeydown(this.composerFlow, {
      onRemoveElement: (elementId) => invoke(`${PLUGIN}|remove_element`, { elementId }),
      onRemoveCapture: (captureId) => invoke(`${PLUGIN}|remove_capture`, { captureId }),
    });
    this.composerFlow.addEventListener('input', () => {
      sanitizeComposerWhileTyping(this.composerFlow!);
      syncComposerPlaceholder(this.composerFlow!);
      void this.disablePickerIfTyping();
      if (this.issueTimer) clearTimeout(this.issueTimer);
      this.issueTimer = setTimeout(() => {
        void invoke(`${PLUGIN}|set_issue_text`, {
          text: extractComposerText(this.composerFlow!),
        });
      }, 800);
    });
    this.composerFlow.addEventListener('paste', (event) => {
      event.preventDefault();
      const text = event.clipboardData?.getData('text/plain') ?? '';
      document.execCommand('insertText', false, text);
    });

    this.composerBox.append(this.composerFlow);

    const composerStyle = document.createElement('style');
    composerStyle.textContent = `
[data-visual-editor-composer][data-empty="true"]::before{content:attr(data-placeholder);color:#8b949e;pointer-events:none}
[data-visual-editor-composer] [data-visual-editor-chip],
[data-visual-editor-composer] [data-visual-editor-capture-chip]{
  margin:4px 6px 10px 0;
  vertical-align:middle;
}`;
    root.append(composerStyle);

    const actions = document.createElement('div');
    Object.assign(actions.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
      flexShrink: '0',
    });

    const btnRow = document.createElement('div');
    Object.assign(btnRow.style, { display: 'flex', gap: '8px' });

    this.copyBtn = createPanelButton('Copy', (event) => void this.runAction('copy', event.shiftKey));
    attachTooltip(this.copyBtn, 'Issue + Kontext-Refs kopieren (Shift: volles Bundle)');
    const clearBtn = createPanelButton('Clear', () => void this.runClear());

    btnRow.append(this.copyBtn, clearBtn);
    this.messageEl = document.createElement('span');
    Object.assign(this.messageEl.style, { fontSize: '11px', color: '#8b949e' });
    actions.append(btnRow, this.messageEl);

    this.panel.append(this.composerBox, actions);

    const nav = document.createElement('nav');
    nav.setAttribute('data-visual-editor-ui', 'true');
    nav.setAttribute('data-visual-editor-nav', 'true');
    Object.assign(nav.style, { display: 'flex', flexDirection: 'column', gap: '8px' });
    this.nav = nav;

    nav.appendChild(
      iconButton(
        'Hard Reload',
        'Hard Reload (Clear Cache)',
        ICON_RELOAD,
        () => void this.runAction('reload'),
      ),
    );
    nav.appendChild(
      iconButton(
        'Screenshot',
        'Take a Screenshot',
        ICON_SCREENSHOT,
        () => void this.runAction('capture'),
      ),
    );
    this.pickerBtn = iconButton(
      'Element-Picker',
      'Visual Inspector (Inspect Elements in UI)',
      ICON_INSPECT_PICKER,
      () => void this.togglePicker(),
    );
    this.pickerBtn.setAttribute('data-visual-editor-picker-toggle', 'true');
    nav.appendChild(this.pickerBtn);

    this.panelBtn = iconButton(
      'Kontext-Panel',
      'Context Box (Write Text, Edit Screenshots, Analyze inspected UI)',
      ICON_CONTEXT,
      () => this.togglePanel(),
    );
    nav.appendChild(this.panelBtn);

    this.devtoolsBtn = iconButton(
      'Console',
      'Devtools (Elements, Console, Network etc..)',
      ICON_DEVTOOLS,
      () => void this.toggleDevtools(),
    );
    nav.appendChild(this.devtoolsBtn);

    this.body.append(this.panel, nav);
    shell.append(header, this.body);
    root.append(shell);
    document.documentElement.appendChild(root);

    this.root = root;
    this.shell = shell;
    this.syncShellLayout();
  }

  private syncShellLayout(): void {
    const compact = !this.panelOpen;
    if (this.headerTitle) {
      this.headerTitle.style.display = compact ? 'none' : 'block';
    }
    if (this.nav) {
      this.nav.style.flexShrink = '0';
    }
  }

  private showTransientMessage(text: string, ms = 2500): void {
    if (!this.messageEl) return;
    if (this.messageTimer) clearTimeout(this.messageTimer);
    this.messageEl.textContent = text;
    this.messageTimer = setTimeout(() => {
      if (this.messageEl) this.messageEl.textContent = '';
      this.messageTimer = null;
    }, ms);
  }

  private setCollapsed(collapsed: boolean): void {
    this.collapsed = collapsed;
    if (this.body) {
      this.body.style.display = collapsed ? 'none' : 'flex';
    }
    if (this.collapseBtn) {
      this.collapseBtn.innerHTML = collapsed ? ICON_CHEVRON_DOWN : ICON_CHEVRON_UP;
      attachTooltip(this.collapseBtn, collapsed ? 'Overlay ausklappen' : 'Overlay einklappen');
    }
  }

  private renderChips(): void {
    if (!this.composerFlow) return;

    const isFocused = document.activeElement === this.composerFlow;
    const elements = this.state?.session.selected_elements ?? [];
    const captures = this.state?.session.captures ?? [];
    const wantedElementIds = new Set(elements.map((el) => el.id));
    const wantedCaptureIds = new Set(captures.map((c) => c.id));

    const currentElementIds = new Set(
      [...this.composerFlow.querySelectorAll('[data-visual-editor-chip]')]
        .map((node) => node.getAttribute('data-chip-id'))
        .filter((id): id is string => Boolean(id)),
    );
    const currentCaptureIds = new Set(
      [...this.composerFlow.querySelectorAll('[data-visual-editor-capture-chip]')]
        .map((node) => node.getAttribute('data-visual-editor-capture-chip'))
        .filter((id): id is string => Boolean(id)),
    );

    const chipsChanged =
      elements.some((el) => !currentElementIds.has(el.id)) ||
      captures.some((cap) => !currentCaptureIds.has(cap.id)) ||
      [...currentElementIds].some((id) => !wantedElementIds.has(id)) ||
      [...currentCaptureIds].some((id) => !wantedCaptureIds.has(id));

    if (isFocused && !chipsChanged) {
      return;
    }

    const savedCaret = isFocused ? saveComposerCaret(this.composerFlow) : null;

    this.composerFlow
      .querySelectorAll('[data-visual-editor-chip]')
      .forEach((node) => {
        const id = node.getAttribute('data-chip-id');
        if (!id || !wantedElementIds.has(id)) node.remove();
      });
    this.composerFlow
      .querySelectorAll('[data-visual-editor-capture-chip]')
      .forEach((node) => {
        const id = node.getAttribute('data-visual-editor-capture-chip');
        if (!id || !wantedCaptureIds.has(id)) node.remove();
      });

    if (!isFocused) {
      ensureComposerTail(this.composerFlow);
    }

    const insertAtCaret = (chip: HTMLElement): void => {
      if (isFocused) {
        const sel = window.getSelection();
        if (sel?.rangeCount && this.composerFlow!.contains(sel.anchorNode ?? null)) {
          const range = sel.getRangeAt(0);
          insertChipAtRange(this.composerFlow!, chip, range);
          return;
        }
      }
      this.composerFlow!.appendChild(chip);
    };

    for (const el of elements) {
      if (this.composerFlow.querySelector(`[data-chip-id="${el.id}"]`)) continue;
      const chip = renderChip(
        el,
        this.composerFlow!,
        (selected) => this.options.onChipFocus?.(selected),
        (elementId) => void invoke(`${PLUGIN}|remove_element`, { elementId }),
      );
      chip.setAttribute('data-chip-id', el.id);
      insertAtCaret(chip);
    }

    captures.forEach((capture, index) => {
      if (this.composerFlow!.querySelector(`[data-visual-editor-capture-chip="${capture.id}"]`)) {
        return;
      }
      const bust = this.captureCacheBust.get(capture.id) ?? capture.id;
      const chip = renderCaptureChip(
        capture,
        index,
        bust,
        this.composerFlow!,
        () => {
          this.captureCacheBust.set(capture.id, Date.now());
          this.renderChips();
        },
        (captureId) => void invoke(`${PLUGIN}|remove_capture`, { captureId }),
      );
      insertAtCaret(chip);
    });

    if (!isFocused) {
      normalizeComposerInlines(this.composerFlow);
    }
    if (savedCaret) {
      restoreComposerCaret(savedCaret);
    }
    syncComposerPlaceholder(this.composerFlow);
  }

  private setComposerIssueText(text: string): void {
    if (!this.composerFlow) return;
    const chips = [
      ...this.composerFlow.querySelectorAll(
        '[data-visual-editor-chip], [data-visual-editor-capture-chip]',
      ),
    ];
    for (const node of [...this.composerFlow.childNodes]) {
      if (!isComposerChipNode(node)) node.remove();
    }
    if (text) {
      this.composerFlow.insertBefore(document.createTextNode(text), this.composerFlow.firstChild);
    }
    for (const chip of chips) {
      this.composerFlow.appendChild(chip);
    }
    normalizeComposerInlines(this.composerFlow);
    syncComposerPlaceholder(this.composerFlow);
  }

  private syncUi(): void {
    if (!this.state) return;
    this.pickerEnabled = this.state.enabled;
    if (this.state.enabled) {
      this.pickerAutoDisabledForTyping = false;
    }
    const selectionCount = this.state.session.selected_elements.length;
    const captureCount = this.state.session.captures?.length ?? 0;

    if (selectionCount > 0 && selectionCount !== this.prevSelectionCount) {
      this.setPanelOpen(true);
    }
    if (captureCount > 0 && captureCount !== this.prevCaptureCount) {
      this.setPanelOpen(true);
    }
    this.prevSelectionCount = selectionCount;
    this.prevCaptureCount = captureCount;

    this.renderChips();
    if (this.composerFlow && this.state.session.issue_text != null) {
      const next = this.state.session.issue_text;
      const composerFocused = document.activeElement === this.composerFlow;
      if (
        !composerFocused &&
        extractComposerText(this.composerFlow) !== next
      ) {
        this.setComposerIssueText(next);
      }
    }
    this.syncActiveButtons();
  }

  private syncActiveButtons(): void {
    if (this.pickerBtn) {
      const active = this.pickerEnabled;
      this.pickerBtn.dataset.active = active ? 'true' : '';
      this.pickerBtn.style.borderColor = active ? '#58a6ff' : '#3d3d3d';
      this.pickerBtn.style.background = active ? '#58a6ff' : '#2a2a2a';
      this.pickerBtn.style.color = active ? '#fff' : '#e6edf3';
    }
    if (this.panelBtn) {
      const active = this.panelOpen;
      this.panelBtn.dataset.active = active ? 'true' : '';
      this.panelBtn.style.borderColor = active ? '#58a6ff' : '#3d3d3d';
      this.panelBtn.style.background = active ? '#58a6ff' : '#2a2a2a';
      this.panelBtn.style.color = active ? '#fff' : '#e6edf3';
    }
  }

  private togglePanel(): void {
    this.setPanelOpen(!this.panelOpen);
  }

  private setPanelOpen(open: boolean): void {
    this.panelOpen = open;
    if (this.panel) {
      this.panel.style.display = open ? 'flex' : 'none';
    }
    this.syncShellLayout();
    this.syncActiveButtons();
  }

  private async disablePickerIfTyping(): Promise<void> {
    if (
      this.pickerAutoDisabledForTyping ||
      !this.pickerEnabled ||
      !this.composerFlow
    ) {
      return;
    }
    if (extractComposerText(this.composerFlow).length === 0) return;
    this.pickerAutoDisabledForTyping = true;
    try {
      await invoke(`${PLUGIN}|disable`);
      this.pickerEnabled = false;
      this.options.onPickerChange?.(false);
    } catch {
      this.pickerAutoDisabledForTyping = false;
      await this.refreshState();
    }
  }

  private async toggleDevtools(): Promise<void> {
    try {
      const open = await invoke<boolean>(`${PLUGIN}|toggle_devtools`);
      if (this.devtoolsBtn) {
        this.devtoolsBtn.dataset.active = open ? 'true' : '';
        this.devtoolsBtn.style.borderColor = open ? '#58a6ff' : '#3d3d3d';
        this.devtoolsBtn.style.background = open ? '#58a6ff' : '#2a2a2a';
        this.devtoolsBtn.style.color = open ? '#fff' : '#e6edf3';
      }
      this.showTransientMessage(open ? 'DevTools geöffnet' : 'DevTools geschlossen');
    } catch (error) {
      this.showTransientMessage(
        error instanceof Error ? error.message : 'DevTools fehlgeschlagen',
        4000,
      );
      if (!this.panelOpen) {
        this.setPanelOpen(true);
      }
    }
  }

  private async togglePicker(): Promise<void> {
    const nextEnabled = !this.pickerEnabled;
    try {
      if (nextEnabled) {
        await invoke(`${PLUGIN}|enable`);
      } else {
        await invoke(`${PLUGIN}|disable`);
      }
      this.pickerEnabled = nextEnabled;
      this.options.onPickerChange?.(nextEnabled);
      await this.refreshState();
    } catch (error) {
      await this.refreshState();
      if (this.messageEl) {
        this.messageEl.textContent =
          error instanceof Error ? error.message : 'Picker-Aktion fehlgeschlagen';
      }
      if (!this.panelOpen) {
        this.setPanelOpen(true);
      }
    }
  }

  private runClear(): void {
    if (!this.composerBox) return;
    runClearWipe(this.composerBox, () => {
      void this.runAction('clear');
    });
  }

  private async runAction(kind: 'reload' | 'capture' | 'copy' | 'clear', fullBundle = false): Promise<void> {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
      this.messageTimer = null;
    }
    if (this.messageEl) this.messageEl.textContent = '';
    try {
      if (kind === 'reload') await invoke(`${PLUGIN}|hard_reload`);
      if (kind === 'capture') await invoke(`${PLUGIN}|capture`, { options: { mode: 'webview' } });
      if (kind === 'copy') {
        const blocks =
          !fullBundle && this.composerFlow
            ? extractComposerBlocks(this.composerFlow)
            : undefined;
        await invoke(`${PLUGIN}|copy_context_bundle`, { full: fullBundle, blocks });
        if (this.copyBtn && !fullBundle) showCopySuccess(this.copyBtn);
      }
      if (kind === 'clear') {
        await invoke(`${PLUGIN}|clear_session`);
        if (this.composerFlow) {
          this.setComposerIssueText('');
        }
        this.captureCacheBust.clear();
      }
      if (kind !== 'copy') {
        const msg =
          kind === 'reload'
            ? 'Hard Reload ausgeführt'
            : kind === 'capture'
              ? 'Screenshot erstellt'
              : kind === 'clear'
                ? 'Session geleert'
                : '';
        if (msg) this.showTransientMessage(msg);
      } else if (this.messageEl) {
        this.showTransientMessage(
          fullBundle ? 'Context Bundle kopiert' : 'Composer kopiert',
        );
      }
      await this.refreshState();
    } catch (error) {
      if (!this.panelOpen) {
        this.setPanelOpen(true);
      }
      this.showTransientMessage(
        error instanceof Error ? error.message : 'Aktion fehlgeschlagen',
        4000,
      );
    }
  }
}
