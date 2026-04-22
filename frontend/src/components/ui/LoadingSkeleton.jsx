export function LoadingSkeleton({ count = 3, type = 'card' }) {
  if (type === 'card') {
    return (
      <div style={{ display: 'grid', gap: '16px' }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="table-card" style={{ padding: '20px' }}>
            <div className="skeleton skeleton-text heading"></div>
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
            <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th><div className="skeleton skeleton-line"></div></th>
              <th><div className="skeleton skeleton-line"></div></th>
              <th><div className="skeleton skeleton-line"></div></th>
              <th><div className="skeleton skeleton-line"></div></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: count }).map((_, i) => (
              <tr key={i}>
                <td><div className="skeleton skeleton-line"></div></td>
                <td><div className="skeleton skeleton-line"></div></td>
                <td><div className="skeleton skeleton-line"></div></td>
                <td><div className="skeleton skeleton-line"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stat-card">
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-text heading"></div>
          <div className="skeleton skeleton-line"></div>
        </div>
      ))}
    </div>
  );
}
