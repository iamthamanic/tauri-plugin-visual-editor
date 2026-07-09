/**
 * Sample card with SDK metadata for inspector selection demos.
 * Location: examples/react-vite/src/components/DemoCard.tsx
 */

type Props = {
  title: string;
  description: string;
};

export function DemoCard({ title, description }: Props) {
  return (
    <article className="card">
      <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>{title}</h2>
      <p style={{ margin: 0, fontSize: 14, color: '#656d76' }}>{description}</p>
      <button type="button" style={{ marginTop: 12 }}>
        Beispiel-Aktion
      </button>
    </article>
  );
}
