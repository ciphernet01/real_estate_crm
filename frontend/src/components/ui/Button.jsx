import { Spinner } from './Spinner.jsx';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  isLoading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  ...props
}) {
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;
  const baseClass = 'btn';
  const widthClass = fullWidth ? 'full-width' : '';

  const className = `${baseClass} ${variantClass} ${sizeClass} ${widthClass}`.trim();

  return (
    <button
      type={type}
      className={className}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Spinner size={16} />}
      {icon && !isLoading && <span style={{ fontSize: '1.1em' }}>{icon}</span>}
      {children}
    </button>
  );
}
