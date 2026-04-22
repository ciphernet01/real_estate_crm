import { useState } from 'react';

export function DataTable({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No data available',
  sortable = true,
  onRowClick,
  selectedRows = [],
  onSelectRow
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    if (!sortable) return;

    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  let sortedData = [...data];
  if (sortConfig.key && sortable) {
    sortedData.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  if (data.length === 0) {
    return (
      <div className="table-card">
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-card">
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{ cursor: sortable && col.sortable !== false ? 'pointer' : 'default' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {col.label}
                    {sortable && col.sortable !== false && (
                      <span style={{ fontSize: '0.8em', opacity: 0.6 }}>
                        {sortConfig.key === col.key
                          ? sortConfig.direction === 'asc'
                            ? '▲'
                            : '▼'
                          : '─'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, idx) => (
              <tr
                key={idx}
                className={selectedRows.includes(idx) ? 'selected' : ''}
                onClick={() => onRowClick?.(row, idx)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 0 && <div className="pagination-info">{data.length} items</div>}
      </div>
    </div>
  );
}
