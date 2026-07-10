/**
 * Remove control for inline composer chips.
 * Location: packages/sdk/src/overlay/ChipRemoveButton.tsx
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
      className="ve-chip-remove"
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
