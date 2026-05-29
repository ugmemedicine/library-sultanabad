export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="panel state-block">
      <div className="spinner" aria-hidden="true" />
      <p className="muted">{label}...</p>
    </div>
  );
}
