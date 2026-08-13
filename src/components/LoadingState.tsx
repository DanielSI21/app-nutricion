export function LoadingState() {
  return <main className="page page--loading" aria-busy="true" aria-label="Cargando tu plan">
    <div className="skeleton skeleton-title" />
    <div className="skeleton skeleton-card" />
    <div className="skeleton skeleton-card" />
  </main>;
}
