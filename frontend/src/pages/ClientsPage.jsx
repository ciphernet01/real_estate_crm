import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { useToastStore } from '../store/toastStore.js';
import { Spinner } from '../components/ui/Spinner.jsx';

const emptyClientForm = { name: '', email: '', phone: '', type: 'BUYER', preferences: '' };

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [activeClientId, setActiveClientId] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [clientForm, setClientForm] = useState(emptyClientForm);
  const [interactionContent, setInteractionContent] = useState('');

  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await api.get('/clients');
      return data.data;
    },
  });

  const clientDetailsQuery = useQuery({
    queryKey: ['client-details', activeClientId],
    queryFn: async () => {
      const { data } = await api.get(`/clients/${activeClientId}`);
      return data.data;
    },
    enabled: !!activeClientId,
  });

  const saveClientMutation = useMutation({
    mutationFn: async (payload) => {
      if (clientForm.id) return await api.patch(`/clients/${clientForm.id}`, payload);
      return await api.post('/clients', payload);
    },
    onSuccess: async () => {
      setIsFormOpen(false);
      setClientForm(emptyClientForm);
      addToast({ message: 'Client profile saved successfully' });
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const addInteractionMutation = useMutation({
    mutationFn: async () => await api.post(`/clients/${activeClientId}/interactions`, { type: 'NOTE', content: interactionContent }),
    onSuccess: async () => {
      setInteractionContent('');
      addToast({ message: 'Activity logged' });
      await queryClient.invalidateQueries({ queryKey: ['client-details', activeClientId] });
    },
  });

  const clients = clientsQuery.data || [];
  const details = clientDetailsQuery.data;

  const stats = useMemo(() => ({
    total: clients.length,
    buyers: clients.filter(c => c.type === 'BUYER').length,
    sellers: clients.filter(c => c.type === 'SELLER').length,
  }), [clients]);

  return (
    <div style={{ display: 'grid', gap: '32px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Client Portfolio</h2>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Manage buyer and seller relationships with unified activity logs</p>
        </div>
        <button 
          onClick={() => { setClientForm(emptyClientForm); setIsFormOpen(true); }}
          className="nav-link-pill active"
          style={{ border: 'none', cursor: 'pointer' }}
        >
          Add New Client
        </button>
      </header>

      {/* Mini Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        {[
          { label: 'TOTAL ACCOUNTS', val: stats.total, icon: 'Users' },
          { label: 'ACTIVE BUYERS', val: stats.buyers, icon: 'TrendingUp' },
          { label: 'ACTIVE SELLERS', val: stats.sellers, icon: 'Home' }
        ].map(s => (
          <div key={s.label} className="premium-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'grid', gap: '4px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>{s.label}</span>
              <strong style={{ fontSize: '1.5rem', fontWeight: 800 }}>{s.val}</strong>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f8fafc', display: 'grid', placeItems: 'center', color: '#6366f1' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '32px', alignItems: 'start' }}>
        
        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {clientsQuery.isLoading && <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px' }}><Spinner /></div>}
          {clients.map(client => (
            <article 
              key={client.id} 
              className={`premium-card ${activeClientId === client.id ? 'active-border' : ''}`}
              style={{ cursor: 'pointer', transition: 'all 0.2s', border: activeClientId === client.id ? '2px solid #6366f1' : 'none' }}
              onClick={() => setActiveClientId(client.id)}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--gradient-indigo)', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                  {client.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: '0.95rem' }}>{client.name}</strong>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: client.type === 'BUYER' ? '#6366f1' : '#ec4899' }}>{client.type}</span>
                </div>
              </div>
              
              <div style={{ display: 'grid', gap: '10px', fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> {client.email || '—'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg> {client.phone || '—'}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{client.dealsCount || 0} active deals</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setClientForm(client); setIsFormOpen(true); }}
                  style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Edit profile
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Detail Sidebar */}
        <aside style={{ display: 'grid', gap: '24px', position: 'sticky', top: '24px' }}>
          {!activeClientId ? (
            <div className="premium-card" style={{ textAlign: 'center', padding: '64px 24px', color: '#94a3b8' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '16px' }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Select a client to view full activity logs and linked accounts</p>
            </div>
          ) : (
            <>
              <article className="premium-card" style={{ padding: '0' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 800 }}>Activity Log</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      value={interactionContent} 
                      onChange={e => setInteractionContent(e.target.value)}
                      placeholder="Add a quick note..." 
                      style={{ fontSize: '0.8rem' }}
                    />
                    <button 
                      onClick={() => addInteractionMutation.mutate()}
                      disabled={!interactionContent || addInteractionMutation.isPending}
                      style={{ height: '42px', padding: '0 12px', background: '#6366f1', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                  </div>
                </div>
                <div style={{ padding: '24px', display: 'grid', gap: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                  {clientDetailsQuery.isLoading && <Spinner />}
                  {details?.interactions?.map(item => (
                    <div key={item.id} style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ width: '4px', height: 'auto', background: '#f1f5f9', borderRadius: '2px' }}></div>
                      <div>
                        <p style={{ margin: '0 0 4px', fontSize: '0.85rem', color: '#334155' }}>{item.content}</p>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>{new Date(item.occurredAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    </div>
                  ))}
                  {(!details?.interactions || details.interactions.length === 0) && (
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', margin: 0 }}>No activity logged yet</p>
                  )}
                </div>
              </article>

              <article className="premium-card">
                <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 800 }}>Linked Assets</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {details?.leads?.map(lead => (
                    <div key={lead.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.8rem' }}>{lead.name}</strong>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Status: {lead.status}</span>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </div>
                  ))}
                  {(!details?.leads || details.leads.length === 0) && <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>No linked leads</p>}
                </div>
              </article>
            </>
          )}
        </aside>
      </div>

      {/* Client Modal */}
      {isFormOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
          <div className="premium-card" style={{ width: 'min(500px, 95%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{clientForm.id ? 'Edit Client' : 'New Client'}</h3>
              <button 
                onClick={() => setIsFormOpen(false)} 
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); saveClientMutation.mutate(clientForm); }} style={{ display: 'grid', gap: '20px' }}>
              <label>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>FULL NAME</span>
                <input value={clientForm.name} onChange={e => setClientForm(f => ({ ...f, name: e.target.value }))} required />
              </label>
              <label>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>ACCOUNT TYPE</span>
                <select value={clientForm.type} onChange={e => setClientForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="BUYER">Buyer</option>
                  <option value="SELLER">Seller</option>
                  <option value="BOTH">Both</option>
                </select>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>EMAIL</span>
                  <input type="email" value={clientForm.email} onChange={e => setClientForm(f => ({ ...f, email: e.target.value }))} />
                </label>
                <label>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>PHONE</span>
                  <input value={clientForm.phone} onChange={e => setClientForm(f => ({ ...f, phone: e.target.value }))} />
                </label>
              </div>
              <label>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>PREFERENCES / NOTES</span>
                <textarea 
                  value={clientForm.preferences} 
                  onChange={e => setClientForm(f => ({ ...f, preferences: e.target.value }))}
                  style={{ minHeight: '80px', borderRadius: '12px' }}
                />
              </label>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="submit" disabled={saveClientMutation.isPending} className="nav-link-pill active" style={{ flex: 1, border: 'none', cursor: 'pointer' }}>
                  {saveClientMutation.isPending ? 'Saving...' : 'Save Profile'}
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
