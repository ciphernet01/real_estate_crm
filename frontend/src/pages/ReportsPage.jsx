import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { Spinner } from '../components/ui/Spinner.jsx';

export default function ReportsPage() {
  const [errorText, setErrorText] = useState('');

  const overviewQuery = useQuery({
    queryKey: ['reports-overview'],
    queryFn: async () => {
      const { data } = await api.get('/reports/overview');
      return data.data;
    },
  });

  const timelineQuery = useQuery({
    queryKey: ['timeline'],
    queryFn: async () => {
      const { data } = await api.get('/communications/timeline?limit=20');
      return data.data;
    },
  });

  const exportReport = async (format) => {
    const endpoint = format === 'csv' ? '/reports/export/overview.csv' : '/reports/export/overview.pdf';
    try {
      const response = await api.get(endpoint, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: format === 'csv' ? 'text/csv' : 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `crm-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      setErrorText('Export failed. Please try again later.');
    }
  };

  const overview = overviewQuery.data;
  const timeline = timelineQuery.data || [];

  return (
    <div style={{ display: 'grid', gap: '32px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>Business Intelligence</h2>
          <p style={{ color: '#94a3b8', margin: '4px 0 0' }}>Comprehensive insights into sales performance and agent efficiency</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => exportReport('csv')} className="ghost-btn" style={{ padding: '8px 16px', borderRadius: '10px' }}>Export CSV</button>
          <button onClick={() => exportReport('pdf')} className="nav-link-pill active" style={{ padding: '8px 16px', border: 'none', cursor: 'pointer' }}>Generate PDF</button>
        </div>
      </header>

      {/* Analytics KPI Hub */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
        {[
          { label: 'CONVERSION VELOCITY', val: `${overview?.leadConversionRate || 0}%`, sub: 'Leads to Deals', color: 'indigo', trend: '+2.4%', up: true },
          { label: 'GROSS REVENUE', val: `$${Number(overview?.totalCommission || 0).toLocaleString()}`, sub: 'Commission Earned', color: 'teal', trend: '+14%', up: true },
          { label: 'LEAD VELOCITY', val: '4.2d', sub: 'Avg. Response Time', color: 'purple', trend: '-0.5d', up: true },
          { label: 'TEAM SUCCESS', val: overview?.closedDeals || 0, sub: 'Total Closed Won', color: 'pink', trend: '+5', up: true }
        ].map(s => (
          <div key={s.label} className="premium-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>{s.label}</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: s.up ? '#2dd4bf' : '#f43f5e', background: s.up ? 'rgba(45, 212, 191, 0.1)' : 'rgba(244, 63, 94, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>{s.trend}</span>
            </div>
            <strong style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', display: 'block' }}>{s.val}</strong>
            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginTop: '4px', display: 'block' }}>{s.sub}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Performance Tables */}
        <div style={{ display: 'grid', gap: '24px' }}>
          <article className="premium-card">
            <h3 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 800 }}>Agent Performance Matrix</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    <th style={{ padding: '12px 8px', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8' }}>AGENT</th>
                    <th style={{ padding: '12px 8px', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8' }}>LEADS</th>
                    <th style={{ padding: '12px 8px', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8' }}>CLOSED</th>
                    <th style={{ padding: '12px 8px', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8' }}>CONV%</th>
                    <th style={{ padding: '12px 8px', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textAlign: 'right' }}>REVENUE</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.85rem' }}>
                  {overview?.agentPerformance?.map(agent => (
                    <tr key={agent.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '16px 8px', fontWeight: 600, color: '#f8fafc' }}>{agent.name}</td>
                      <td style={{ padding: '16px 8px', color: '#94a3b8' }}>{agent.assignedLeads}</td>
                      <td style={{ padding: '16px 8px', color: '#94a3b8' }}>{agent.closedLeads}</td>
                      <td style={{ padding: '16px 8px', color: '#f8fafc' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${agent.conversionRate}%`, height: '100%', background: '#6366f1' }}></div>
                          </div>
                          {agent.conversionRate}%
                        </div>
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'right', fontWeight: 700, color: '#2dd4bf' }}>${Number(agent.closedCommission).toLocaleString()}</td>
                    </tr>
                  ))}
                  {overviewQuery.isLoading && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px' }}><Spinner /></td></tr>}
                </tbody>
              </table>
            </div>
          </article>

          <article className="premium-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Revenue Forecaster</h3>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.8rem' }}>Predictive insights vs actual performance</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                   <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }}></div>
                   <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8' }}>Forecated</span>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                   <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e2e8f0' }}></div>
                   <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8' }}>Actual</span>
                 </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '240px', paddingBottom: '20px' }}>
              {overview?.revenueByMonth?.map((item, idx) => (
                <div key={item.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                  <div style={{ width: '100%', height: `${(idx + 5) * 8}%`, background: 'var(--gradient-indigo)', borderRadius: '6px 6px 2px 2px', position: 'relative', boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' }}>
                     <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '60%', background: 'rgba(255,255,255,0.08)', borderRadius: '2px 2px 0 0' }}></div>
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.month.slice(0, 3)}</span>
                </div>
              ))}
            </div>
          </article>
        </div>

        {/* Timeline Sidebar */}
        <aside style={{ display: 'grid', gap: '24px' }}>
          <article className="premium-card" style={{ padding: '0' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-glass)' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>Communication Stream</h3>
            </div>
            <div style={{ padding: '24px', display: 'grid', gap: '24px' }}>
              {timeline.map((item, idx) => (
                <div key={item.id} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                  {idx !== timeline.length - 1 && <div style={{ position: 'absolute', left: '17px', top: '34px', bottom: '-24px', width: '2px', background: 'rgba(255,255,255,0.03)' }}></div>}
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: item.type === 'CALL' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(45, 212, 191, 0.1)', border: '1px solid var(--border-glass)', display: 'grid', placeItems: 'center', flexShrink: 0, color: item.type === 'CALL' ? '#818cf8' : '#2dd4bf' }}>
                    {item.type === 'CALL' ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#f8fafc' }}>{item.lead?.name || 'External'}</strong>
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>{item.content}</p>
                  </div>
                </div>
              ))}
              {timeline.length === 0 && !timelineQuery.isLoading && <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>No activity stream yet</p>}
            </div>
          </article>
        </aside>
      </div>

      {errorText && <div className="error-banner">{errorText}</div>}
    </div>
  );
}

