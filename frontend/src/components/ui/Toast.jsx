import { useToastStore } from '../../store/toastStore.js';

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}
        >
          <span style={{ flex: 1 }}>
            {getIcon(toast.type)} {toast.message}
          </span>
          <button
            type="button"
            className="toast-close"
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss notification"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

function getIcon(type) {
  const icons = {
    success: '✓',
    error: '⚠',
    warning: '!',
    info: 'ℹ'
  };
  return icons[type] || '•';
}
