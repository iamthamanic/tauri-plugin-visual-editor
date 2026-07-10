/**
 * Vertical icon toolbar for the embedded visual editor overlay.
 */

import type { ReactNode } from 'react';
import { IconContext, IconDevtools, IconInspectPicker, IconReload, IconScreenshot } from './icons.js';
import { Tooltip } from './Tooltip.js';

type Props = {
  pickerActive: boolean;
  panelOpen: boolean;
  devtoolsActive?: boolean;
  busy: boolean;
  onHardReload: () => void;
  onScreenshot: () => void;
  onTogglePicker: () => void;
  onTogglePanel: () => void;
  onToggleDevtools: () => void;
};

function IconButton({
  label,
  tooltip,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  tooltip: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip text={tooltip}>
      <button
        type="button"
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
        className={active ? 've-btn ve-btn--active' : 've-btn'}
        style={{ transition: 'background 0.15s ease, border-color 0.15s ease, transform 0.1s ease' }}
      >
        {children}
      </button>
    </Tooltip>
  );
}

export function FloatingToolbar({
  pickerActive,
  panelOpen,
  devtoolsActive = false,
  busy,
  onHardReload,
  onScreenshot,
  onTogglePicker,
  onTogglePanel,
  onToggleDevtools,
}: Props) {
  return (
    <nav className="ve-toolbar" aria-label="Visual Inspector">
      <IconButton
        label="Hard Reload"
        tooltip="Hard Reload (Clear Cache)"
        disabled={busy}
        onClick={onHardReload}
      >
        <IconReload />
      </IconButton>
      <IconButton
        label="Screenshot"
        tooltip="Take a Screenshot"
        disabled={busy}
        onClick={onScreenshot}
      >
        <IconScreenshot />
      </IconButton>
      <IconButton
        label="Element-Picker"
        tooltip="Visual Inspector (Inspect Elements in UI)"
        active={pickerActive}
        disabled={busy}
        onClick={onTogglePicker}
      >
        <IconInspectPicker />
      </IconButton>
      <IconButton
        label="Kontext-Panel"
        tooltip="Context Box (Write Text, Edit Screenshots, Analyze inspected UI)"
        active={panelOpen}
        disabled={busy}
        onClick={onTogglePanel}
      >
        <IconContext />
      </IconButton>
      <IconButton
        label="Console"
        tooltip="Devtools (Elements, Console, Network etc..)"
        active={devtoolsActive}
        disabled={busy}
        onClick={onToggleDevtools}
      >
        <IconDevtools />
      </IconButton>
    </nav>
  );
}
