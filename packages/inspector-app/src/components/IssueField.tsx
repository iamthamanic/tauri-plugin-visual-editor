/**
 * Issue description textarea (German labels).
 * Location: packages/inspector-app/src/components/IssueField.tsx
 */

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function IssueField({ value, onChange }: Props) {
  return (
    <section>
      <label className="mb-1 block text-xs font-semibold uppercase text-[var(--inspector-muted)]" htmlFor="issue-text">
        Problem beschreiben
      </label>
      <textarea
        id="issue-text"
        className="min-h-[72px] w-full rounded border border-[var(--inspector-border)] p-2 text-[13px]"
        placeholder="Optional: Was soll im Context Bundle stehen?"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </section>
  );
}
