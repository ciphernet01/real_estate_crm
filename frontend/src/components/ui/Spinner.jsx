export function Spinner({ size = 32, className = '' }) {
  const sizeClass = size < 25 ? 'small' : '';
  return (
    <div
      className={`spinner ${sizeClass} ${className}`}
      role="status"
      aria-label="Loading"
      style={{ width: size, height: size }}
    >
      <span className="sr-only">Loading…</span>
    </div>
  );
}
