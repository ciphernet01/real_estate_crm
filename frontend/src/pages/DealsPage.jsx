import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { useToastStore } from '../store/toastStore.js';
import { Spinner } from '../components/ui/Spinner.jsx';

const stageColumns = ['NEGOTIATION', 'AGREEMENT', 'CLOSED'];
const stageColors = {
  NEGOTIATION: { bg: '#eef2ff', text: '#4f46e5', dot: '#4f46e5' },
  AGREEMENT: { bg: '#fff7ed', text: '#f59e0b', dot: '#f59e0b' },
  CLOSED: { bg: '#f0fdf4', text: '#10b981', dot: '#10b981' },
};

export default function DealsPage() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [activeDealId, setActiveDealId] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({ title: '', stage: 'NEGOTIATION', commissionRate: '2' });

  const dealsQuery = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const { data } = await api.get('/deals');
      return data.data;
    },
  });

  const reportQuery = useQuery({
    queryKey: ['deal-report-summary'],
    queryFn: async () => {
      const { data } = await api.get('/deals/reports/summary');
      return data.data;
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, stage }) => await api.patch(`/deals/${id}`, { stage }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['deals'] });
      addToast({ message: 'Pipeline stage updated' });
    },
  });

  const createDealMutation = useMutation({
    mutationFn: async (payload) => await api.post('/deals', payload),
    onSuccess: async () => {
      setIsFormOpen(false);
      setForm({ title: '', stage: 'NEGOTIATION', commissionRate: '2' });
      addToast({ message: 'New deal initiated' });
      await queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  const dealsByStage = useMemo(() => {
    const map = { NEGOTIATION: [], AGREEMENT: [], CLOSED: [] };
    (dealsQuery.data || []).forEach(deal => map[deal.stage]?.push(deal));
    return map;
  }, [dealsQuery.data]);

  return (
    <div style={{ display: 'grid', gap: '32px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Sales Pipeline</h2>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Track transaction progress and commission breakthroughs</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="nav-link-pill active"
          style={{ border: 'none', cursor: 'pointer' }}
        >
          New Engagement
        </button>
      </header>

      {/* Pipeline Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {[
          { label: 'ACTIVE DEALS', val: reportQuery.data?.totalDeals || 0, color: 'indigo' },
          { label: 'CLOSED WON', val: reportQuery.data?.closedDeals || 0, color: 'teal' },
          { label: 'CONVERSION', val: `${reportQuery.data?.conversionRate || 0}%`, color: 'purple' },
          { label: 'EST. REVENUE', val: `$${(reportQuery.data?.totalCommission || 0).toLocaleString()}`, color: 'pink' }
        ].map(s => (
          <div key={s.label} className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8' }}>{s.label}</span>
            <strong style={{ fontSize: '1.25rem', fontWeight: 800 }}>{s.val}</strong>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', alignItems: 'start' }}>
        {stageColumns.map(stage => (
          <section key={stage} style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: stageColors[stage].dot }}></div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155', margin: 0 }}>{stage}</h3>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>
                {dealsByStage[stage].length}
              </span>
            </div>

            <div style={{ display: 'grid', gap: '16px', minHeight: '500px' }}>
              {dealsByStage[stage].map(deal => (
                <article key={deal.id} className="premium-card" style={{ border: '1px solid transparent', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>{deal.title}</strong>
                    <div style={{ position: 'relative' }}>
                      <select 
                        value={deal.stage}
                        onChange={e => updateStageMutation.mutate({ id: deal.id, stage: e.target.value })}
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                      >
                        {stageColumns.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748b' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      {deal.lead?.name || 'Walk-in Client'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748b' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      {deal.property?.title || 'Open Listing'}
                    </div>
                  </div>

                  <div style={{ padding: '12px 0', borderTop: '1px solid var(--border-glass)', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8' }}>DOCUMENT VAULT</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#818cf8' }}>{deal.id % 2 === 0 ? '75% SIGNED' : '100% SIGNED'}</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '2px', overflow: 'hidden', marginBottom: '10px', border: '1px solid var(--border-glass)' }}>
                      <div style={{ width: deal.id % 2 === 0 ? '75%' : '100%', height: '100%', background: deal.id % 2 === 0 ? '#f59e0b' : '#2dd4bf' }}></div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {['Agreement', 'ID Proof', 'Disclosure'].map((name, i) => (
                        <div key={i} style={{ 
                          display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', fontSize: '0.6rem'
                        }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          <span style={{ fontWeight: 700, color: '#f8fafc' }}>{name}</span>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === 0 ? '#2dd4bf' : '#f59e0b' }}></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', fontSize: '0.6rem', display: 'grid', placeItems: 'center', fontWeight: 800, color: '#f8fafc' }}>AS</div>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', marginLeft: '-8px', fontSize: '0.6rem', display: 'grid', placeItems: 'center', fontWeight: 800, color: '#94a3b8' }}>+1</div>
                    </div>
                    <strong style={{ fontSize: '0.9rem', color: '#818cf8', fontWeight: 800 }}>${Number(deal.commission || 0).toLocaleString()}</strong>
                  </div>
                </article>
              ))}
              {dealsByStage[stage].length === 0 && (
                <div style={{ border: '2px dashed #f1f5f9', borderRadius: '16px', height: '100px', display: 'grid', placeItems: 'center', color: '#cbd5e1', fontSize: '0.8rem' }}>
                  No deals
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      {/* Engagement Modal */}
      {isFormOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
          <div className="premium-card" style={{ width: 'min(500px, 95%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Initiate Engagement</h3>
              <button onClick={() => setIsFormOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); createDealMutation.mutate(form); }} style={{ display: 'grid', gap: '20px' }}>
              <label>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>DEAL TITLE</span>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>INITIAL STAGE</span>
                  <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}>
                    <option value="NEGOTIATION">Negotiation</option>
                    <option value="AGREEMENT">Agreement</option>
                  </select>
                </label>
                <label>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>COMMISSION (%)</span>
                  <input type="number" value={form.commissionRate} onChange={e => setForm(f => ({ ...f, commissionRate: e.target.value }))} />
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="submit" disabled={createDealMutation.isPending} className="nav-link-pill active" style={{ flex: 1, border: 'none', cursor: 'pointer' }}>
                  {createDealMutation.isPending ? 'Processing...' : 'Launch Deal'}
                </button>
                <button type="button" onClick={() => setIsFormOpen(false)} style={{ flex: 1, background: '#f1f5f9', border: 'none', borderRadius: '999px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
