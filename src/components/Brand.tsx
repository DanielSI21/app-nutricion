export function Brand() {
  return <div className="brand" aria-label="Mi plan nutricional">
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 44 44" role="img"><path d="M10 29C11 18 19 9 33 8c1 13-6 24-18 25"/><path d="M12 34c4-8 9-13 17-18"/></svg>
    </span>
    <span className="brand-copy"><strong>Mi plan</strong><small>nutricional</small></span>
  </div>;
}
