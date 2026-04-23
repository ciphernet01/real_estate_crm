export function Spinner({ size = 32, className = '' }) {
  return (
    <div
      className={`spinner-container ${className}`}
      role="status"
      aria-label="Loading"
      style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ animation: 'spin 0.8s linear infinite' }}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ opacity: 0.2, color: '#6366f1' }}
        />
        <path
          d="M12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.0434 16.4522"
          stroke="#6366f1"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
