export function Banner({ type = 'info', title, message, action, onClose }) {
  const bannerClass = `${type}-banner`;

  return (
    <div className={bannerClass} role={type === 'error' ? 'alert' : 'status'}>
      <div style={{ flex: 1 }}>
        {title && <strong style={{ display: 'block', marginBottom: '4px' }}>{title}</strong>}
        {message}
      </div>
      {action && <div style={{ marginLeft: '12px' }}>{action}</div>}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: '1.2rem',
            padding: '0 8px',
            marginLeft: 'auto'
          }}
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      )}
    </div>
  );
}
