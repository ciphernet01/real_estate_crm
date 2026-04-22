export function StatCard({ label, value, helper, trend, icon, status }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <span className="stat-label">{label}</span>
        {icon && <span className="icon">{icon}</span>}
      </div>
      <strong className="stat-value">{value}</strong>
      <div style={{ display: 'grid', gap: '4px' }}>
        {trend && (
          <span className={`stat-change ${trend.direction}`}>
            <span style={{ fontSize: '0.7em' }}>{trend.direction === 'positive' ? '▲' : '▼'}</span>
            {trend.text}
          </span>
        )}
        {helper && <span className="stat-helper">{helper}</span>}
      </div>
    </div>
  );
}
