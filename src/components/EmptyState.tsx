export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="panel state-block">
      <strong>{title}</strong>
      <p className="muted">{text}</p>
    </div>
  );
}
