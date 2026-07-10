/**
 * Remove control for inline composer chips.
 * Location: packages/inspector-app/src/components/ChipRemoveButton.tsx
 */

type Props = {
  onRemove: () => void | Promise<void>;
};

export function ChipRemoveButton({ onRemove }: Props) {
  return (
    <button
      type="button"
      aria-label="Chip entfernen"
      data-ve-chip-remove="true"
      data-visual-editor-ui="true"
      className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border-0 bg-transparent p-0 text-[13px] leading-none text-[var(--inspector-muted)] hover:bg-[rgba(248,81,73,0.2)] hover:text-[var(--inspector-danger)]"
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void onRemove();
      }}
    >
      ×
    </button>
  );
}
