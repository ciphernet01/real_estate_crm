export function Badge({ children, variant = 'neutral', icon }) {
  const variantClass = `badge-${variant}`;
  
  return (
    <span className={`badge ${variantClass}`}>
      {icon && <span style={{ fontSize: '0.8em' }}>{icon}</span>}
      {children}
    </span>
  );
}
