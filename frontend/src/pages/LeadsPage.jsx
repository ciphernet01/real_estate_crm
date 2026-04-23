import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { useToastStore } from '../store/toastStore.js';
import { Spinner } from '../components/ui/Spinner.jsx';

const nextStatusMap = {
  NEW: ['CONTACTED', 'LOST'],
  CONTACTED: ['QUALIFIED', 'LOST'],
  QUALIFIED: ['CLOSED', 'LOST'],
  CLOSED: [],
  LOST: [],
};

const statusColors = {
  NEW: { bg: 'rgba(79, 70, 229, 0.15)', text: '#818cf8' },
  CONTACTED: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24' },
  QUALIFIED: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399' },
  CLOSED: { bg: 'rgba(219, 39, 119, 0.15)', text: '#f472b6' },
  LOST: { bg: 'rgba(244, 63, 94, 0.15)', text: '#fb7185' },
};

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [form, setForm] = useState({ name: '', source: 'Website', email: '', phone: '', budget: '' });

  const leadsQuery = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data } = await api.get('/leads');
      return data.data;
    },
  });

  const remindersQuery = useQuery({
    queryKey: ['lead-reminders'],
    queryFn: async () => {
      const { data } = await api.get('/leads/reminders/upcoming?days=7');
      return data.data;
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (payload) => await api.post('/leads', payload),
    onSuccess: async () => {
      setForm({ name: '', source: 'Website', email: '', phone: '', budget: '' });
      setIsComposerOpen(false);
      addToast({ message: 'Lead added to pipeline' });
      await queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => await api.patch(`/leads/${id}`, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const leads = leadsQuery.data || [];
  const filteredLeads = useMemo(() => {
    return leads.filter(l => 
      (statusFilter === 'ALL' || l.status === statusFilter) &&
      (!search || l.name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [leads, search, statusFilter]);

  const stats = useMemo(() => ({
    total: leads.length,
    new: leads.filter(l => l.status === 'NEW').length,
    qualified: leads.filter(l => l.status === 'QUALIFIED').length,
    closed: leads.filter(l => l.status === 'CLOSED').length,
  }), [leads]);

  return (
    <div style={{ display: 'grid', gap: '32px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>Leads Pipeline</h2>
          <p style={{ color: '#94a3b8', margin: '4px 0 0' }}>Nurture potential clients and manage your sales funnel</p>
        </div>
        <button 
          onClick={() => setIsComposerOpen(true)}
          className="nav-link-pill active"
          style={{ border: 'none', cursor: 'pointer' }}
        >
          Add New Lead
        </button>
      </header>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {[
          { label: 'TOTAL LEADS', val: stats.total, color: 'indigo' },
          { label: 'NEW', val: stats.new, color: 'purple' },
          { label: 'QUALIFIED', val: stats.qualified, color: 'teal' },
          { label: 'CLOSED WON', val: stats.closed, color: 'pink' }
        ].map(s => (
          <article key={s.label} className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>{s.label}</span>
            <strong style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>{s.val}</strong>
          </article>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '32px', alignItems: 'start' }}>
        
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Toolbar */}
          <div className="premium-card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name..."
                style={{ paddingLeft: '36px' }}
              />
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              style={{ width: '180px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="CLOSED">Closed Won</option>
            </select>
          </div>

          {/* Leads Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {leadsQuery.isLoading ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}><Spinner size={32} /></div>
            ) : filteredLeads.map(lead => (
              <article key={lead.id} className="premium-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--gradient-indigo)', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                      {lead.name[0]}
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '1rem', color: '#f8fafc' }}>{lead.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{lead.source}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ 
                      display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, color: '#818cf8'
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ animation: 'pulse 2s infinite' }}>
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                      AI {Math.floor(80 + (lead.id % 20))}%
                    </div>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      fontWeight: 800, 
                      padding: '4px 10px', 
                      borderRadius: '999px',
                      background: statusColors[lead.status]?.bg || 'rgba(255,255,255,0.05)',
                      color: statusColors[lead.status]?.text || '#94a3b8',
                      border: '1px solid var(--border-glass)'
                    }}>
                      {lead.status}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                   <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '2px 6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: '#94a3b8' }}>
                     {lead.id % 3 === 0 ? '🔥 HOT' : lead.id % 2 === 0 ? '😊 EXCITED' : '😐 NEUTRAL'}
                   </span>
                   <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '2px 6px', background: 'rgba(45, 212, 191, 0.1)', border: '1px solid rgba(45, 212, 191, 0.2)', borderRadius: '4px', color: '#2dd4bf' }}>
                     {lead.budget ? `$${parseInt(lead.budget).toLocaleString()}` : '$500k+'}
                   </span>
                </div>
                
                <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.8rem' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    {lead.email || 'No email'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.8rem' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                    {lead.phone || 'No phone'}
                  </div>
                </div>

                <div style={{ display: 'flex', borderTop: '1px solid var(--border-glass)', paddingTop: '16px', gap: '12px' }}>
                  <select 
                    value={lead.status} 
                    onChange={e => updateStatusMutation.mutate({ id: lead.id, status: e.target.value })}
                    style={{ flex: 1, height: '36px', fontSize: '0.8rem' }}
                  >
                    {[lead.status, ...(nextStatusMap[lead.status] || [])].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.03)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside style={{ display: 'grid', gap: '20px' }}>
          <article className="premium-card">
            <h3 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>Recent Reminders</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {remindersQuery.data?.slice(0, 5).map(r => (
                <div key={r.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#818cf8' }}></div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.8rem', color: '#f8fafc' }}>{r.title}</strong>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{new Date(r.dueAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {(!remindersQuery.data || remindersQuery.data.length === 0) && (
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>No upcoming reminders</p>
              )}
            </div>
          </article>

          <article className="premium-card">
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#6366f1"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
              Smart Matches
            </h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              {[
                { name: 'Skyline Penthouse', match: '98%', price: '$1.2M' },
                { name: 'Azure Garden Villa', match: '92%', price: '$850k' },
              ].map(match => (
                <div key={match.name} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)' }}></div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: '0.8rem', color: '#f8fafc' }}>{match.name}</strong>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 800 }}>{match.match} Match</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>{match.price}</span>
                   </div>
                  </div>
                </div>
              ))}
              <button style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)', background: 'none', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                View All Matches
              </button>
            </div>
          </article>

          <article className="premium-card">
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 800 }}>Pipeline Velocity</h3>
            <div style={{ height: '8px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px', border: '1px solid var(--border-glass)' }}>
              <div style={{ width: '68%', height: '100%', background: 'var(--gradient-indigo)' }}></div>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>Accelerating +12% from last week</span>
          </article>
        </aside>

      </div>

      {/* Composer Modal */}
      {isComposerOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(12px)', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
          <div className="premium-card" style={{ width: 'min(500px, 95%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>New Pipeline Lead</h3>
              <button 
                onClick={() => setIsComposerOpen(false)} 
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); createLeadMutation.mutate(form); }} style={{ display: 'grid', gap: '20px' }}>
              <label>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>NAME</span>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>SOURCE</span>
                  <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} required />
                </label>
                <label>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>BUDGET ($)</span>
                  <input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
                </label>
              </div>
              <label>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>EMAIL</span>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </label>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="submit" disabled={createLeadMutation.isPending} className="nav-link-pill active" style={{ flex: 1, border: 'none', cursor: 'pointer' }}>
                  {createLeadMutation.isPending ? 'Adding...' : 'Add Lead'}
                </button>
                <button type="button" onClick={() => setIsComposerOpen(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '999px', fontWeight: 700, color: '#94a3b8', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
